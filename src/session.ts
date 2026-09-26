// Computer session glue: lazy MCP start (two-stage readiness — manifest gate
// at host startup, MCP tools/list check on first call), sticky-target
// bookkeeping, single-flight serialization, crash recovery (fail the call,
// invalidate everything minted by the dead transport, respawn next call),
// telemetry-off environment, snapshot-token bookkeeping for element
// addressing, per-window screenshot dedup state, and ordered dispose
// (driver end_session first, then kill).

import { McpClient, childTransport, type CallResult, type McpTransport } from "./mcp-client.ts"
import { inputTargetMismatch, type StickyTarget } from "./safety.ts"

export const TELEMETRY_ENV = { CUA_DRIVER_RS_TELEMETRY_ENABLED: "0" }

// The MCP tool names this integration consumes (checked at first connect).
export const REQUIRED_TOOLS = [
  "start_session",
  "end_session",
  "get_window_state",
  "get_desktop_state",
  "get_accessibility_tree",
  "click",
  "double_click",
  "right_click",
  "drag",
  "scroll",
  "type_text",
  "press_key",
  "hotkey",
  "set_value",
  "list_apps",
  "list_windows",
  "bring_to_front",
]

// Snapshot bookkeeping per window: the driver's snapshot identity plus the
// element tokens minted with it. Element-addressed actions attach BOTH, so a
// stale reference fails closed at the driver instead of silently landing on
// whatever now sits at that index (the Hermes #47072 lesson).
export type WindowSnapshot = { snapshotId: string; tokens: Map<number, string> }
const SNAPSHOT_LRU = 5

// If-changed dedup state per window: hash of the last attached screenshot
// and how many consecutive captures omitted it (hard streak cap).
export type ScreenshotDedup = { hash: string; omittedStreak: number }
const DEDUP_STREAK_CAP = 2

export type SessionDeps = {
  spawnTransport?: (command: string, args: string[], env: Record<string, string>) => McpTransport
  now?: () => number
  log?: (line: string) => void
}

export type SessionOptions = {
  /** Agent-cursor visualization (driver-side); default off. */
  agentCursor?: boolean
}

export class ComputerSession {
  private client: McpClient | null = null
  private startPromise: Promise<void> | null = null
  private queue: Promise<unknown> = Promise.resolve()
  private invocation: { command: string; args: string[] }
  private sessionId: string
  private deps: SessionDeps
  private opts: SessionOptions
  sticky: StickyTarget = null
  restarted = false
  private snapshots = new Map<number, WindowSnapshot>()
  private dedup = new Map<number, ScreenshotDedup>()
  private lastZoom: { windowId: number; region: { x: number; y: number; w: number; h: number }; nativeW?: number; nativeH?: number } | null = null

  constructor(invocation: { command: string; args: string[] }, sessionId: string, deps: SessionDeps = {}, opts: SessionOptions = {}) {
    this.invocation = invocation
    this.sessionId = sessionId
    this.deps = deps
    this.opts = opts
  }

  private driverPid: number | undefined

  private spawn(): McpClient {
    const transport = (this.deps.spawnTransport ?? childTransport)(this.invocation.command, this.invocation.args, TELEMETRY_ENV)
    this.driverPid = transport.pid?.()
    const client = new McpClient(transport, { name: "opencode-computer-use", version: "0.2.0" })
    return client
  }

  /** Pid of the MCP subprocess THIS session spawned (crash drills only). */
  currentDriverPid(): number | undefined {
    return this.driverPid
  }

  /** First use: start the MCP child, handshake, and check the tool surface. */
  private async ensureStarted(): Promise<void> {
    if (this.client && !this.client.crashed) return
    if (this.client?.crashed) this.startPromise = null // respawn path: the old start promise belongs to the dead transport
    if (!this.startPromise) {
      const client = this.spawn()
      this.startPromise = (async () => {
        await client.initialize()
        const missing = client.missingTools(REQUIRED_TOOLS)
        if (missing.length) {
          client.dispose()
          throw new Error(
            `cua-driver is connected but lacks required MCP tools: ${missing.join(", ")}. The installed driver does not match this plugin's integration; upgrade cua-driver with the user install command and restart opencode. The plugin will not operate partially.`,
          )
        }
        this.client = client
        this.restarted = true
        // Declare this run's identity; non-fatal when declined.
        try {
          await client.call("start_session", { session: this.sessionId }, 10000)
        } catch {}
        // Agent-cursor visualization: OFF by default (a visible agent pointer
        // confuses users mid-work); best-effort, never fatal.
        try {
          await client.call("set_agent_cursor_enabled", { enabled: this.opts.agentCursor === true }, 10000)
        } catch {}
      })().catch((err) => {
        this.startPromise = null
        throw err
      })
    }
    await this.startPromise
  }

  /**
   * Serialized driver call. Timeouts and crashes fail THIS call; a crash
   * invalidates the sticky target (element refs minted by the dead transport
   * are worthless) and the next call lazily respawns.
   */
  async call(tool: string, args: Record<string, unknown>, timeoutMs?: number): Promise<CallResult> {
    // Single-flight: capture-then-act ordering and sticky-target integrity.
    // The work is created INSIDE the chain, so it starts only when the
    // previous call has settled.
    const run = this.queue.then(
      () => this.doCall(tool, args, timeoutMs),
      () => this.doCall(tool, args, timeoutMs),
    )
    this.queue = run.catch(() => {})
    return run
  }

  private async doCall(tool: string, args: Record<string, unknown>, timeoutMs?: number): Promise<CallResult> {
    await this.ensureStarted()
    try {
      return await this.client!.call(tool, args, timeoutMs)
    } catch (err) {
      if (this.client?.crashed) {
        this.invalidateTarget()
        this.deps.log?.(`driver crashed mid-call: ${(err as Error).message}`)
      }
      throw err
    }
  }

  invalidateTarget() {
    this.sticky = null
    this.snapshots.clear()
    this.dedup.clear()
    this.lastZoom = null
  }

  // ── Snapshot tokens ──────────────────────────────────────────────────────

  /** Record a capture's snapshot identity + element tokens for a window. */
  recordSnapshot(windowId: number, snapshotId: unknown, elements: Array<{ element_index?: number; element_token?: string }> | undefined): void {
    if (!Number.isFinite(windowId) || typeof snapshotId !== "string" || !snapshotId) return
    const tokens = new Map<number, string>()
    for (const el of elements ?? []) {
      if (typeof el?.element_index === "number" && typeof el?.element_token === "string" && el.element_token) {
        tokens.set(el.element_index, el.element_token)
      }
    }
    this.snapshots.delete(windowId)
    this.snapshots.set(windowId, { snapshotId, tokens })
    while (this.snapshots.size > SNAPSHOT_LRU) {
      const oldest = this.snapshots.keys().next().value
      if (oldest === undefined) break
      this.snapshots.delete(oldest)
    }
  }

  /** Snapshot identity + token for an element, or null when unaddressable. */
  tokenFor(windowId: number, elementIndex: number): { snapshotId: string; elementToken: string } | null {
    const snap = this.snapshots.get(windowId)
    if (!snap) return null
    const token = snap.tokens.get(elementIndex)
    if (!token) return null
    return { snapshotId: snap.snapshotId, elementToken: token }
  }

  // ── Screenshot dedup ─────────────────────────────────────────────────────

  /**
   * If-changed policy for one window's screenshot bytes: identical to the
   * last attached image -> omit (bounded streak); the cap forces a re-attach
   * so a hung screen cannot hide behind "unchanged" forever.
   */
  shouldAttachScreenshot(windowId: number, imageData: string): { attach: boolean; unchanged: boolean } {
    const hash = `${imageData.length}:${imageData.slice(0, 48)}:${imageData.slice(-48)}`
    const prev = this.dedup.get(windowId)
    if (prev && prev.hash === hash && prev.omittedStreak < DEDUP_STREAK_CAP) {
      this.dedup.set(windowId, { hash, omittedStreak: prev.omittedStreak + 1 })
      return { attach: false, unchanged: true }
    }
    this.dedup.set(windowId, { hash, omittedStreak: 0 })
    return { attach: true, unchanged: false }
  }

  noteScreenshotOmitted(windowId?: number): void {
    // Called when the capture produced no image at all (ax mode): keep state.
    if (windowId === undefined) return
  }

  // ── Zoom context ─────────────────────────────────────────────────────────

  recordZoom(windowId: number, region: { x: number; y: number; w: number; h: number }): void {
    this.lastZoom = { windowId, region }
  }

  zoomContextFor(windowId: number): { x: number; y: number; w: number; h: number } | null {
    return this.lastZoom && this.lastZoom.windowId === windowId ? this.lastZoom.region : null
  }

  /** Ordered shutdown: driver end_session (bounded) FIRST, then kill. */
  dispose(): void {
    const client = this.client
    this.startPromise = null
    this.client = null
    this.invalidateTarget()
    if (client && !client.crashed && !client.disposed) {
      // end_session lets the driver run its own cleanup hooks (cursor,
      // recording, config); a hung call still dies at the timeout.
      client
        .call("end_session", {}, 10_000)
        .catch(() => {})
        .finally(() => client.dispose())
      return
    }
    client?.dispose()
  }
}

/** Sticky-target mismatch refusal text, or null when the call may proceed. */
export function targetRefusal(sticky: StickyTarget, requestedApp: string | undefined): string | null {
  const mismatch = inputTargetMismatch(sticky, requestedApp)
  if (mismatch === null) return null
  return `input_target_mismatch: this action would go to the current target ${JSON.stringify(mismatch)}, not ${JSON.stringify(requestedApp)} — input always hits the sticky target from the last capture/focus_app. Call capture(app=...) or focus_app first, then retry.`
}
