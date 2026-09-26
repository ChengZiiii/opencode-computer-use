// Computer session glue: lazy MCP start (two-stage readiness — manifest gate
// at host startup, MCP tools/list check on first call), sticky-target
// bookkeeping, single-flight serialization, crash recovery (fail the call,
// invalidate everything minted by the dead transport, respawn next call),
// telemetry-off environment, and dispose.

import { McpClient, childTransport, type CallResult, type McpTransport } from "./mcp-client.ts"
import { inputTargetMismatch, type StickyTarget } from "./safety.ts"

export const TELEMETRY_ENV = { CUA_DRIVER_RS_TELEMETRY_ENABLED: "0" }

// The MCP tool names this integration consumes (checked at first connect).
export const REQUIRED_TOOLS = [
  "start_session",
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

export type SessionDeps = {
  spawnTransport?: (command: string, args: string[], env: Record<string, string>) => McpTransport
  now?: () => number
  log?: (line: string) => void
}

export class ComputerSession {
  private client: McpClient | null = null
  private startPromise: Promise<void> | null = null
  private queue: Promise<unknown> = Promise.resolve()
  private invocation: { command: string; args: string[] }
  private sessionId: string
  private deps: SessionDeps
  sticky: StickyTarget = null
  restarted = false

  constructor(invocation: { command: string; args: string[] }, sessionId: string, deps: SessionDeps = {}) {
    this.invocation = invocation
    this.sessionId = sessionId
    this.deps = deps
  }

  private spawn(): McpClient {
    const transport = (this.deps.spawnTransport ?? childTransport)(this.invocation.command, this.invocation.args, TELEMETRY_ENV)
    const client = new McpClient(transport, { name: "opencode-computer-use", version: "0.1.0" })
    return client
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
  }

  dispose() {
    this.startPromise = null
    this.client?.dispose()
    this.client = null
    this.invalidateTarget()
  }
}

/** Sticky-target mismatch refusal text, or null when the call may proceed. */
export function targetRefusal(sticky: StickyTarget, requestedApp: string | undefined): string | null {
  const mismatch = inputTargetMismatch(sticky, requestedApp)
  if (mismatch === null) return null
  return `input_target_mismatch: this action would go to the current target ${JSON.stringify(mismatch)}, not ${JSON.stringify(requestedApp)} — input always hits the sticky target from the last capture/focus_app. Call capture(app=...) or focus_app first, then retry.`
}
