// opencode-computer-use — desktop computer use for opencode via the
// user-installed cua-driver (trycua/cua, MCP stdio).
//
// Lifecycle: detect — degrade — instruct. At host startup the plugin does a
// purely local probe (binary resolution + `cua-driver manifest` contract
// gate, no network, no MCP spawn). Ready -> full `computer` tool surface +
// `computer_status`. Not ready -> only `computer_status`, which prints the
// exact command the USER runs to install/upgrade the driver. The plugin
// never executes installers and never makes lifecycle network requests.

import type { Plugin, ToolContext, ToolDefinition } from "@opencode-ai/plugin"
import { randomUUID } from "node:crypto"
import { appendFileSync } from "node:fs"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { tmpdir } from "node:os"
import { resolveDriverCmd, userInstallHint } from "./src/driver-resolve.ts"
import { checkContract, type ContractResult } from "./src/contract.ts"
import { ComputerSession } from "./src/session.ts"
import { makeComputerTool, makeStatusTool, ACTIONS, ACTION_DESC, COMPUTER_TOOL_DESCRIPTION, STATUS_TOOL_DESCRIPTION } from "./src/tool.ts"

const probing = () => process.env.OPENCODE_CU_PROBE === "1"
const probeLine = (text: string) => {
  if (!probing()) return
  try {
    appendFileSync(join(tmpdir(), "opencode-cu-probe.log"), `${new Date().toISOString()} ${text}\n`)
  } catch {}
}

// Process-cached readiness: the probe is local-only and idempotent per run.
// `_testInjectProbe` exists for the wiring tests (deterministic two-state
// registration without touching the real driver); production never calls it.
let probeCache: ContractResult | null = null
let probeOverride: ContractResult | null = null
export function _testInjectProbe(r: ContractResult | null): void {
  probeOverride = r
  probeCache = null
}
function probeOnce(): ContractResult {
  if (probeOverride) return probeOverride
  if (probeCache) return probeCache
  const resolved = resolveDriverCmd()
  const contract = checkContract(resolved)
  probeLine(`probe resolved=${resolved.cmd ?? "null"} ready=${contract.ready} reason=${contract.reason}`)
  probeCache = contract
  return contract
}

const sessionId = `opencode-computer-use-${randomUUID().slice(0, 12)}`

// ── Skill wiring ────────────────────────────────────────────────────────────
// The plugin API has no skill hook, so the operating manual ships as
// `skills/computer-use/SKILL.md` inside the package and is surfaced via the
// config hook appending the package's `skills/` dir to `skills.paths` (same
// mechanism as the permission default injection). Best-effort: if the host
// resolves skills before plugin config hooks, the README's one-line manual
// path is the fallback.
// Activation entry: hosts (1.18.x) auto-promote every discovered skill to a
// slash command whose template IS the full SKILL.md (user args appended), so
// `/computer-use <task>` is the deterministic user-facing entry and the
// `/skills` menu browses it. The plugin registers NO command of its own —
// the host surface makes a hand-rolled `/computer` orchestrator redundant
// (and weaker: model-mediated skill loading vs manual-in-message at turn 0).
function bundledSkillsDir(): string | null {
  // dist/index.js → <pkg>/skills; a root plugin.ts dev run → <repo>/skills.
  let here: string
  try {
    here = dirname(fileURLToPath(import.meta.url))
  } catch {
    return null
  }
  for (const root of [here, dirname(here)]) {
    const candidate = join(root, "skills")
    if (existsSync(join(candidate, "computer-use", "SKILL.md"))) return candidate
  }
  return null
}

// Minimal YAML frontmatter reader for the bundled SKILL.md (name + folded
// multiline description). OBSERVED (task 2.3): the v2 skill editor registers a
// FULL Skill.Info via `editor.add({ id, name, description, path, content })` —
// there is no directory-source form, so the plugin parses its own frontmatter
// (the V1 host did this scan itself via skills.paths).
function parseSkillFrontmatter(text: string): { name: string; description: string } {
  const fm = text.startsWith("---") ? text.slice(3, text.indexOf("\n---", 3)) : ""
  const name = /^name:\s*(.+)$/m.exec(fm)?.[1]?.trim() ?? "computer-use"
  const descMatch = /description:\s*>-\n((?:\s+.+\n)+)/.exec(fm)
  const description = descMatch ? descMatch[1].replace(/\s+/g, " ").trim() : ""
  return { name, description }
}

export const server: Plugin = async (_input, options) => {
  const contract = probeOnce()
  const installHint = userInstallHint()
  const opts = (options as { computerUse?: { captureAfter?: unknown; agentCursor?: unknown; maxElements?: unknown } } | undefined)?.computerUse ?? {}
  const captureAfter: "off" | "som" | "ax" = opts.captureAfter === "som" || opts.captureAfter === "ax" ? opts.captureAfter : "off"
  const agentCursor = opts.agentCursor === true
  const maxElements = typeof opts.maxElements === "number" ? Math.max(50, Math.min(1000, Math.floor(opts.maxElements))) : 200

  // Lazy session: the MCP child spawns on the first computer tool call, not
  // at host startup (Windows Defender first-scan must never tax opencode boot).
  let session: ComputerSession | null = null
  const ensureSession = () => {
    if (!session && contract.ready && contract.mcpInvocation) {
      session = new ComputerSession(contract.mcpInvocation, sessionId, { log: probeLine }, { agentCursor })
    }
    return session
  }

  return {
    get tool(): Record<string, ToolDefinition> {
      const status = makeStatusTool({
        ready: contract.ready,
        reason: contract.reason,
        resolved: contract.resolved,
        version: contract.version,
        installHint,
        sessionId,
        // Live health when the driver is up (bounded; degrades to the
        // manifest contract state on any failure).
        ...(contract.ready
          ? {
              healthFetch: async () => {
                const s = ensureSession()
                if (!s) throw new Error("no session")
                const res = await s.call("health_report", {}, 10000)
                return { ...(res.structured ?? {}), ...(res.isError ? { degraded: extractTextSafe(res) } : {}) }
              },
            }
          : {}),
      })
      if (!contract.ready) {
        // Guide mode: the status surface is the ONLY registered tool.
        return { computer_status: status }
      }
      const s = ensureSession()!
      return {
        computer: makeComputerTool({ session: s, driverVersion: () => contract.version, probeLine, captureAfter, maxElements }),
        computer_status: status,
      }
    },

    // Approval two-piece (forge-proven): default ask for BOTH domains —
    // background input ("computer") and foreground ("computer:foreground",
    // raise/foreground delivery). An explicit user decision always wins.
    // Also wires skill discovery (see above); the injection is null-checked
    // so user definitions always win.
    config: async (cfg) => {
      const c = cfg as { permission?: Record<string, unknown>; skills?: { paths?: unknown } }
      const section = c.permission ?? (c.permission = {})
      if (section.computer == null) section.computer = "ask"
      if (section["computer:foreground"] == null) section["computer:foreground"] = "ask"
      // Best-effort skill discovery: append the bundled skills dir.
      // Compare case-insensitively (Windows drive/case variance); a malformed
      // non-array user `skills.paths` is left untouched — never removed.
      const skillsDir = bundledSkillsDir()
      if (skillsDir) {
        const norm = (v: unknown) => (typeof v === "string" ? v.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase() : null)
        const want = norm(skillsDir)
        const rawPaths = c.skills?.paths
        const paths = Array.isArray(rawPaths) ? rawPaths : rawPaths == null ? [] : null
        if (paths && !paths.some((p) => norm(p) === want)) {
          const sk = (c.skills ?? (c.skills = {})) as { paths?: unknown[] }
          if (sk.paths == null) sk.paths = []
          if (Array.isArray(sk.paths)) sk.paths.push(skillsDir)
        }
      }
    },

    dispose: async () => {
      // Ordered: driver end_session (its own cleanup hooks) -> kill. Baked
      // into ComputerSession.dispose with a 10s bound.
      session?.dispose()
      session = null
    },
  }
}

function extractTextSafe(res: { content: Array<{ type: string; text?: string }> }): string {
  return res.content
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("\n")
    .slice(0, 300)
}

// ── v2 entry (change v2-plugin-api-port, tasks 1.1–1.5) ─────────────────────
//
// V2 hosts load `setup(ctx)` from the same default export (the v1 loader only
// reads `server` and ignores `setup` — the v1 path above is untouched). The
// probe, tool cores, safety layer, and session lifecycle stay shared; V2 adds
// registrations, not a second implementation. The two entries keep disjoint
// registration targets and share no mutable state beyond the process-cached
// probe (idempotent by design).
//
// Structurally typed (NO import of @opencode/plugin/v2/*): every domain access
// is `?.` + typeof guarded so a host with a missing or reshaped domain no-ops
// that registration instead of throwing — one domain missing only disables its
// own feature slice (conventions §2).
type V2ToolEditor = {
  add?(definition: {
    name: string
    description: string
    input: Record<string, unknown>
    execute: (args: unknown, ctx: unknown) => Promise<unknown>
  }): unknown
}
type V2SkillEditor = {
  add?(skill: { id: string; name: string; description?: string; path: string; content: string; autoinvoke?: boolean }): unknown
}
type V2PluginContext = {
  tool?: {
    transform?(cb: (editor: V2ToolEditor) => void | Promise<void>): Promise<unknown>
  }
  permission?: {
    hook?(name: "evaluate", cb: (event: unknown) => void | Promise<void>): unknown
    assert?(input: unknown): Promise<unknown>
  }
  skill?: {
    transform?(cb: (editor: V2SkillEditor) => void | Promise<void>): Promise<unknown>
  }
}

// Test seam only: lets the wiring tests drive the setup-returned cleanup
// against a fake-session factory (spawnTransport-injected ComputerSession)
// without touching the real driver. Production hosts call setup(ctx) with one
// argument and get the real lazy session.
export type V2SetupDeps = {
  makeSession?: (invocation: { command: string; args: string[] }, sessionId: string, log: (line: string) => void) => ComputerSession
}

// JSON Schema argument contract for the v2 `computer` registration (task 1.1):
// the literal equivalent of the v1 tool.schema.* chain in src/tool.ts — the
// 17-action discriminator enum (ACTION_DESC verbatim) plus every per-action
// field, descriptions mirrored one-for-one. Any drift between the two shapes
// is caught by the unit tests pinning the enum and required fields.
const COMPUTER_INPUT_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    action: { type: "string", enum: [...ACTIONS], description: ACTION_DESC },
    mode: { type: "string", description: "capture mode: som | vision | ax (default som)" },
    app: { type: "string", description: "app name or bundle id; limits capture to one app and sets the sticky target (resolution: list_apps exact, substring, then window titles)" },
    pid: { type: "number", description: "exact process target (from list_apps / capture)" },
    window_id: { type: "number", description: "exact window target (from list_windows / capture) — window actions require it; capture resolves it via list_windows when only pid is given" },
    query: { type: "string", description: "capture: case-insensitive substring filter on the element tree" },
    element_index: { type: "number", description: "element to act on, by [index] from the last capture (must come from the current snapshot — stale references are refused)" },
    x: { type: "number", description: "x in window-local screenshot pixels (pixel fallback; prefer element_index)" },
    y: { type: "number", description: "y in window-local screenshot pixels" },
    w: { type: "number", description: "zoom: crop width (≤500)" },
    h: { type: "number", description: "zoom: crop height (≤500)" },
    button: { type: "string", description: "click mouse button: left | right | middle (action=click)" },
    delivery_mode: { type: "string", description: "background (default, never steals focus) | foreground (escalation ONLY after a background_unavailable error — never preemptively; needs the foreground approval)" },
    raise: { type: "boolean", description: "foreground intents: focus_app raise=true brings the window to the front; input actions with raise=true foreground them (separate approval domain computer:foreground)" },
    from_zoom: { type: "boolean", description: "coordinates were read off a zoom crop — remap them to native window coordinates before dispatch" },
    from_x: { type: "number" },
    from_y: { type: "number" },
    to_x: { type: "number" },
    to_y: { type: "number" },
    direction: { type: "string", description: "scroll direction: up|down|left|right" },
    amount: { type: "number", description: "scroll amount" },
    text: { type: "string", description: "text to type (action=type)" },
    keys: { type: "string", description: "key or combo, e.g. 'enter' or 'ctrl+s' (action=key)" },
    value: { description: "value to set (action=set_value)" },
    path: { type: "string", description: "invoke_menu: menu path, 'File > Open' or [\"File\",\"Open\"]" },
    launch_path: { type: "string", description: "launch_app: executable path to start" },
    start_minimized: { type: "boolean", description: "launch_app: default true (minimized, never steals the foreground — a plain driver launch can activate the window); pass false for a normal start" },
    predicates: {
      type: "array",
      items: { type: "object", additionalProperties: true },
      description: "verify: [{ element_index?, label?, exists?, enabled?, selected?, value? }] — deterministic checks against the current window",
    },
    waitMs: { type: "number", description: "wait duration ms, max 10000 (action=wait)" },
    capture_after: { type: "boolean", description: "attach a fresh som capture after a successful input action" },
  },
  required: ["action"],
}

const STATUS_INPUT_SCHEMA: Record<string, unknown> = { type: "object", properties: {} }

// Wrap the shared tool cores' structured result in the host's expected content
// shape (task 1.5). OBSERVED (task 2.3, opencode v2.3.2 — host OpenAPI
// `Tool.Content` + docs example `return { content: "..." }`): execute returns
// `{ content }` where content is either a plain string or an array of
// `{ type: "text", text } | { type: "file", uri, mime, name? }` items. There
// is NO top-level `attachments` key — the V1 data-URL attachments (screenshots
// the model must see) ride as `file` content entries (`url` → `uri`).
function wrapV2ToolResult(
  result: string | { output: string; attachments?: Array<{ type: "file"; mime: string; url: string; filename?: string }> },
): { content: string | Array<Record<string, unknown>> } {
  if (typeof result === "string") return { content: result }
  const content: Array<Record<string, unknown>> = [{ type: "text", text: result.output }]
  for (const a of result.attachments ?? []) {
    content.push({ type: "file", uri: a.url, mime: a.mime, ...(a.filename ? { name: a.filename } : {}) })
  }
  return { content }
}

// The v2 execute adapter (task 1.1/1.2): the tool cores (src/tool.ts) call
// `ctx.ask` for the approval two-piece — on V2, the host-side gate for custom
// tools is `ctx.permission.assert(...)` INSIDE execute (observed task 2.3:
// assert evaluates the session's rules, prompts on `ask`, and a deny rejects
// with a Tool.Error the host surfaces to the model — i.e. the host DOES block
// execute on a denial). The adapter asserts the `computer` action before the
// core runs (explicit user rules decide; no rule → ask → prompt), then
// satisfies the core's `ctx.ask` so the shared refusal/approval ordering
// (hard-block in src/safety.ts runs BEFORE the ask inside the core) is
// preserved verbatim: an "always"-equivalent allow can never wave a
// hard-blocked combo through, because the block refuses before this point.
function v2ExecuteAdapter(
  def: ToolDefinition,
  toolName: string,
  v2ctx?: V2PluginContext,
): (args: unknown, ctx: unknown) => Promise<{ content: string | Array<Record<string, unknown>> }> {
  return async (args: unknown, toolCtx: unknown) => {
    const hostCtx = (toolCtx ?? {}) as { sessionID?: unknown; agent?: unknown; messageID?: unknown; id?: unknown }
    const assertFn = v2ctx?.permission?.assert
    // Only the input-action tool gates (computer_status is read-only
    // diagnostics — unguarded in V1 too); only when the host context carries
    // the fields assert needs (shape drift → skip, never throw).
    if (toolName === "computer" && typeof assertFn === "function" && typeof hostCtx.sessionID === "string") {
      await assertFn({
        sessionID: hostCtx.sessionID,
        ...(typeof hostCtx.agent === "string" ? { agent: hostCtx.agent } : {}),
        ...(typeof hostCtx.messageID === "string" && typeof hostCtx.id === "string"
          ? { source: { type: "tool", messageID: hostCtx.messageID, id: hostCtx.id } }
          : {}),
        action: "computer",
        resources: ["computer"],
      })
    }
    const ctx = { ...hostCtx, ask: async () => {} } as unknown as ToolContext
    const result = await def.execute(args as never, ctx)
    return wrapV2ToolResult(result)
  }
}

// Functional ask gate (task 1.2): the V1 entry injects
// `permission.computer = "ask"` into the config; V2 has no global config
// mutation, so the default gate moves into the evaluate hook (plus the
// adapter's `ctx.permission.assert` above, which routes custom-tool calls
// through the rules). OBSERVED event shape (task 2.3, opencode v2.3.2 —
// `PermissionEvaluation`): the decision field is a TOP-LEVEL mutable
// `effect: "allow" | "ask" | "deny"` (NOT `{ decision: { status } }`); the
// matched key is `action: string` (fallback `source.id`, the tool id). The
// host runs hooks for `allow` and `ask` decisions only — an explicit
// configured `deny` is final and never reaches the hook — so an arriving
// `allow`/`deny` is rule-decided and passes through untouched; anything else
// (ask / undecided) escalates to `ask`. Input-action requests in both approval
// domains ("computer" background and "computer:foreground") are gated. The
// hard-block layer stays UPSTREAM of this gate: it lives in src/tool.ts's
// execute, which refuses destructive input before any approval can be granted.
function v2PermissionEvaluate(event: unknown): void {
  try {
    const e = (event ?? {}) as {
      action?: unknown
      source?: { id?: unknown }
      effect?: unknown
    }
    const name =
      (typeof e.action === "string" ? e.action : undefined) ??
      (typeof e.source?.id === "string" ? e.source.id : undefined)
    if (name !== "computer" && name !== "computer:foreground") return
    if (e.effect === "allow" || e.effect === "deny") return // explicit rule decided — pass through
    e.effect = "ask"
  } catch {
    // Host-shape drift degrades to a no-op, never throws.
  }
}

export async function setup(ctx: V2PluginContext, deps?: V2SetupDeps): Promise<() => void> {
  // Same startup probe as the V1 entry (task 1.1): local-only, network-free,
  // hard-timeout-bounded, process-cached — probeOnce() shares the cache with
  // the V1 path so the guarantees are unchanged (VH-2).
  const contract = probeOnce()
  const installHint = userInstallHint()

  // Lazy session, disjoint instance from any V1 host process (a host loads one
  // entry or the other; the two entries never share mutable state). The child
  // spawns on the first computer tool call, not at setup.
  let session: ComputerSession | null = null
  const ensureSession = () => {
    if (!session && contract.ready && contract.mcpInvocation) {
      session = deps?.makeSession
        ? deps.makeSession(contract.mcpInvocation, sessionId, probeLine)
        : new ComputerSession(contract.mcpInvocation, sessionId, { log: probeLine })
    }
    return session
  }

  // Two-state tool surface via ctx.tool.transform (task 1.1): ready ->
  // computer + computer_status; not ready -> computer_status only (guide
  // mode). JSON Schema argument contracts converted from the tool.schema
  // chains; execute reuses the V1 tool cores unchanged.
  if (typeof ctx.tool?.transform === "function") {
    await ctx.tool.transform(async (editor) => {
      if (typeof editor?.add !== "function") return
      const status = makeStatusTool({
        ready: contract.ready,
        reason: contract.reason,
        resolved: contract.resolved,
        version: contract.version,
        installHint,
        sessionId,
        ...(contract.ready
          ? {
              healthFetch: async () => {
                const s = ensureSession()
                if (!s) throw new Error("no session")
                const res = await s.call("health_report", {}, 10000)
                return { ...(res.structured ?? {}), ...(res.isError ? { degraded: extractTextSafe(res) } : {}) }
              },
            }
          : {}),
      })
      editor.add({ name: "computer_status", description: STATUS_TOOL_DESCRIPTION, input: STATUS_INPUT_SCHEMA, execute: v2ExecuteAdapter(status, "computer_status", ctx) })
      if (!contract.ready) return // guide mode: the status surface is the ONLY registered tool
      const s = ensureSession()
      if (!s) return
      const computer = makeComputerTool({ session: s, driverVersion: () => contract.version, probeLine })
      editor.add({ name: "computer", description: COMPUTER_TOOL_DESCRIPTION, input: COMPUTER_INPUT_SCHEMA, execute: v2ExecuteAdapter(computer, "computer", ctx) })
    })
  }

  // Functional ask gate (task 1.2) — see v2PermissionEvaluate above.
  if (typeof ctx.permission?.hook === "function") {
    ctx.permission.hook("evaluate", (event: unknown) => v2PermissionEvaluate(event))
  }

  // Bundled skill as a full v2 Skill.Info (task 1.3; shape observed in task
  // 2.3): `editor.add({ id, name, description, path, content })` — no
  // directory-source form exists. Same guarantee set as the V1 skills.paths
  // append — no copy, no sync, no user entry mutation. External data (the
  // SKILL.md read) is loaded BEFORE the synchronous transform callback, per
  // the host's transform contract.
  if (typeof ctx.skill?.transform === "function") {
    const skillMdPath = (() => {
      const dir = bundledSkillsDir()
      return dir ? join(dir, "computer-use", "SKILL.md") : null
    })()
    let skillDoc: { name: string; description: string; content: string } | null = null
    if (skillMdPath) {
      try {
        const raw = readFileSync(skillMdPath, "utf8")
        const { name, description } = parseSkillFrontmatter(raw)
        // Body after the frontmatter block is the content.
        const body = raw.replace(/^---\n.*?\n---\n?/s, "")
        skillDoc = { name, description, content: body }
      } catch {
        skillDoc = null
      }
    }
    await ctx.skill.transform(async (editor) => {
      if (!skillDoc || typeof editor?.add !== "function") return
      editor.add({ id: "computer-use", name: skillDoc.name, description: skillDoc.description, path: skillMdPath!, content: skillDoc.content })
    })
  }

  // Dispose as the setup-returned cleanup (task 1.4): same teardown ordering
  // as the V1 dispose — driver end_session (its own cleanup hooks) first,
  // bounded grace, then kill; all baked into ComputerSession.dispose.
  return () => {
    session?.dispose()
    session = null
  }
}

export default { id: "opencode-computer-use", server, setup }
