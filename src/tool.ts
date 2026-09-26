// Agent-facing tools: `computer` (single consolidated tool, action
// discriminator) and `computer_status` (the guide/diagnostic surface — the
// only tool registered when the driver is not ready). Install/upgrade
// commands are for the USER to run; the tool descriptions say so.

import { tool } from "@opencode-ai/plugin"
import type { ToolContext } from "@opencode-ai/plugin"
import { buildCaptureResult, extractText, type Attachment, type CaptureMode } from "./capture.ts"
import type { CallResult } from "./mcp-client.ts"
import { blockedKeyReason, blockedTypeReason, mapVerdict, type DriverVerdictFields } from "./safety.ts"
import { targetRefusal, type ComputerSession } from "./session.ts"

const z = tool.schema

export const ACTIONS = [
  "capture",
  "click",
  "double_click",
  "right_click",
  "drag",
  "scroll",
  "type",
  "key",
  "set_value",
  "wait",
  "list_apps",
  "list_windows",
  "focus_app",
] as const

export type Action = (typeof ACTIONS)[number]

// Closest-spelling suggestions for common unsupported actions.
const ACTION_HINTS: Record<string, string> = {
  middle_click: "middle_click is not in the platform driver surface (0.28.2); use click or right_click",
  screenshot: "use action=capture",
  screenshot_full: "use action=capture mode=vision",
  hover: "use action=move/scroll or capture then click",
  press: "use action=key",
  focus: "use action=focus_app",
}

const TIMEOUTS: Record<string, number> = {
  capture: 30000,
  list: 10000,
  input: 15000,
}

function timeoutFor(tool: string): number {
  if (tool.startsWith("get_")) return TIMEOUTS.capture
  if (tool.startsWith("list_")) return TIMEOUTS.list
  return TIMEOUTS.input
}

export type ToolDeps = {
  session: ComputerSession
  driverVersion: () => string | null
  probeLine?: (text: string) => void
}

function jsonErr(action: string, err: unknown): string {
  return JSON.stringify({ ok: false, action, error: (err as Error).message ?? String(err) })
}

async function driverCall(deps: ToolDeps, ctx: ToolContext, action: Action, args: Record<string, unknown>): Promise<string | { output: string; attachments?: Attachment[] }> {
  const s = deps.session
  const app = typeof args.app === "string" ? args.app : undefined

  // Hard-blocked destructive input runs BEFORE approval: an "always" grant
  // must never let these through.
  if (action === "key") {
    const keys = String(args.keys ?? args.key ?? "")
    const blocked = blockedKeyReason(keys)
    if (blocked) return JSON.stringify({ ok: false, action, error: blocked })
  }
  if (action === "type") {
    const blocked = blockedTypeReason(String(args.text ?? ""))
    if (blocked) return JSON.stringify({ ok: false, action, error: blocked })
  }

  // Sticky target guard: input goes to the target from the last
  // capture/focus_app; a provably different `app` argument is refused.
  if (action !== "capture" && action !== "list_apps" && action !== "list_windows" && action !== "wait") {
    const refusal = targetRefusal(s.sticky, app)
    if (refusal) return JSON.stringify({ ok: false, action, code: "input_target_mismatch", error: refusal })
  }

  // Approval gate: capture/wait are side-effect free; everything else asks.
  // Posture mirrors forge's two-piece: the ask request carries patterns and
  // NO self-granted always scopes (an `always` list here would pre-approve
  // the request ourselves); the config hook's "ask" rule is what turns it
  // into a real dialog / run-mode reject / --auto approve.
  if (action !== "capture" && action !== "wait") {
    try {
      await ctx.ask({
        permission: "computer",
        patterns: ["*"],
        always: [],
        metadata: { title: `computer: ${action}${app ? ` on ${app}` : ""}`, tool: "computer", action },
      })
    } catch (err) {
      return JSON.stringify({ ok: false, action, code: "denied", error: `user denied: ${(err as Error).message ?? "permission rejected"}` })
    }
  }

  try {
    if (action === "wait") {
      const ms = Math.max(0, Math.min(10000, Number(args.waitMs ?? 1000)))
      await new Promise((r) => setTimeout(r, ms))
      return JSON.stringify({ ok: true, action, waitedMs: ms, verdict: { decision: "done", hint: "no side effects" } })
    }
    if (action === "capture") return captureFlow(deps, args)
    if (action === "list_apps" || action === "list_windows") {
      const res = await s.call(action, {}, timeoutFor(action))
      return listResult(action, res)
    }
    return inputFlow(deps, action, args)
  } catch (err) {
    return jsonErr(action, err)
  }
}

type WindowRow = { pid?: number; window_id?: number; title?: string }

/** Resolve windows from list_windows output: structured rows first, human-text fallback. */
function windowsFromList(listed: CallResult): WindowRow[] {
  const arr = (listed.structured as { windows?: WindowRow[] } | undefined)?.windows
  if (Array.isArray(arr)) return arr
  const text = extractText(listed.content)
  return [...text.matchAll(/-\s+\S+ \(pid (\d+)\) "(.*?)" \[window_id: (\d+)\]/g)].map((m) => ({ pid: Number(m[1]), title: m[2], window_id: Number(m[3]) }))
}

async function captureFlow(deps: ToolDeps, args: Record<string, unknown>): Promise<string | { output: string; attachments?: Attachment[] }> {
  const mode = (["som", "vision", "ax"].includes(String(args.mode)) ? args.mode : "som") as CaptureMode
  const s = deps.session
  const pid = typeof args.pid === "number" ? args.pid : undefined
  const windowId = typeof args.window_id === "number" ? args.window_id : undefined
  // Desktop scope only when no window target at all.
  if (mode === "vision" && pid === undefined && windowId === undefined && !s.sticky) {
    const res = await s.call("get_desktop_state", {}, timeoutFor("get_desktop_state"))
    return { output: buildCaptureResult({ mode, call: res }).output }
  }
  // Window scope: get_window_state REQUIRES window_id (driver never picks a
  // window implicitly). Resolve the missing half via list_windows.
  let effectiveWindow = windowId ?? (s.sticky?.pid === pid ? s.sticky?.windowId : undefined)
  let effectivePid = pid ?? (windowId !== undefined || s.sticky?.pid === undefined ? undefined : s.sticky.pid)
  if (effectiveWindow === undefined && effectivePid === undefined && s.sticky?.pid !== undefined) {
    return captureFlow(deps, { ...args, pid: s.sticky.pid, window_id: s.sticky.windowId })
  }
  if (effectiveWindow === undefined || effectivePid === undefined) {
    const listed = await s.call("list_windows", {}, timeoutFor("list_windows"))
    const rows = windowsFromList(listed)
    if (effectivePid === undefined && effectiveWindow !== undefined) {
      effectivePid = rows.find((r) => r.window_id === effectiveWindow)?.pid
    }
    if (effectiveWindow === undefined && effectivePid !== undefined) {
      effectiveWindow = rows.find((r) => r.pid === effectivePid && r.window_id !== undefined)?.window_id
    }
    if (effectiveWindow === undefined) {
      return JSON.stringify({
        ok: false,
        action: "capture",
        code: "window_id_required",
        error: `get_window_state needs a window_id belonging to pid ${effectivePid ?? "?"}; none was found. Windows now: ${rows
          .map((r) => `pid ${r.pid} [window_id: ${r.window_id}] ${JSON.stringify(r.title ?? "")}`)
          .slice(0, 12)
          .join("; ")}`,
      })
    }
  }
  const callArgs: Record<string, unknown> = { pid: effectivePid ?? s.sticky?.pid, window_id: effectiveWindow }
  if (args.query) callArgs.query = String(args.query)
  if (mode === "vision") callArgs.include_accessibility_tree = false
  // Driver-side downscale keeps the returned screenshot within the contract.
  callArgs.max_dimension = 1568
  const res = await s.call("get_window_state", callArgs, timeoutFor("get_window_state"))
  if (!res.isError && (args.app || effectivePid !== undefined)) {
    s.sticky = { app: typeof args.app === "string" ? args.app : s.sticky?.app ?? "", pid: effectivePid ?? s.sticky?.pid, windowId: effectiveWindow }
  }
  const built = buildCaptureResult({ mode, call: res })
  return { output: built.output, ...(built.attachments ? { attachments: built.attachments } : {}) }
}

function listResult(action: string, res: CallResult): string {
  const text = extractText(res.content)
  return JSON.stringify({ ok: !res.isError, action, ...(text ? { items: text.slice(0, 6000) } : {}), ...(res.isError ? { error: "driver reported an error" } : {}) })
}

async function inputFlow(deps: ToolDeps, action: Action, args: Record<string, unknown>): Promise<string> {
  const s = deps.session
  const pid = typeof s.sticky?.pid === "number" ? s.sticky.pid : typeof args.pid === "number" ? args.pid : undefined
  if (pid === undefined) {
    return JSON.stringify({ ok: false, action, code: "no_target", error: "no sticky target: call capture(app=/pid=) or focus_app first — input never goes to an unchosen window." })
  }
  const windowId = typeof args.window_id === "number" ? args.window_id : s.sticky?.windowId
  let toolName: string
  const callArgs: Record<string, unknown> = { pid }
  if (windowId !== undefined) callArgs.window_id = windowId
  if (typeof args.element_index === "number") callArgs.element_index = args.element_index
  if (typeof args.delivery_mode === "string") callArgs.delivery_mode = args.delivery_mode
  switch (action) {
    case "click":
    case "double_click":
    case "right_click":
      toolName = action
      if (typeof args.x === "number") callArgs.x = args.x
      if (typeof args.y === "number") callArgs.y = args.y
      if (action === "click" && typeof args.button === "string") callArgs.button = args.button
      if (action === "double_click") callArgs.count = 2
      break
    case "drag":
      toolName = "drag"
      callArgs.from_x = args.from_x
      callArgs.from_y = args.from_y
      callArgs.to_x = args.to_x
      callArgs.to_y = args.to_y
      break
    case "scroll":
      toolName = "scroll"
      if (typeof args.direction === "string") callArgs.direction = args.direction
      if (typeof args.amount === "number") callArgs.amount = args.amount
      break
    case "type":
      toolName = "type_text"
      callArgs.text = String(args.text ?? "")
      break
    case "key": {
      const keys = String(args.keys ?? args.key ?? "")
      const combo = keys.split(/\s*[+\-]\s*/).filter(Boolean)
      if (combo.length > 1) {
        toolName = "hotkey"
        callArgs.keys = combo
      } else {
        toolName = "press_key"
        callArgs.key = combo[0] ?? keys
      }
      break
    }
    case "set_value":
      toolName = "set_value"
      callArgs.value = args.value
      break
    case "focus_app":
      toolName = "bring_to_front"
      break
    default:
      return JSON.stringify({ ok: false, action, error: `unsupported action ${String(action)}` })
  }
  const res = await s.call(toolName, callArgs, timeoutFor(toolName))
  const structured = (res.structured ?? {}) as DriverVerdictFields & { message?: string }
  // Some driver builds ride the verdict fields in the text JSON instead of
  // structuredContent — merge them so the ladder never misses evidence.
  const textOut = extractText(res.content)
  let textFields: DriverVerdictFields = {}
  try {
    const parsed = JSON.parse(textOut)
    if (parsed && typeof parsed === "object") textFields = parsed as DriverVerdictFields
  } catch {}
  const merged: DriverVerdictFields = {
    ok: structured.ok ?? textFields.ok ?? !res.isError,
    verified: structured.verified ?? textFields.verified ?? null,
    effect: structured.effect ?? textFields.effect ?? null,
    escalation: ((structured as { escalation?: { recommended?: string } }).escalation ?? textFields.escalation ?? null) as { recommended?: string } | null,
  }
  if (action === "focus_app" && !res.isError) {
    s.sticky = { app: typeof args.app === "string" ? args.app : s.sticky?.app ?? "", pid, ...(windowId !== undefined ? { windowId } : {}) }
  }
  const verdict = mapVerdict(merged)
  const payload: Record<string, unknown> = {
    ok: !res.isError,
    action,
    ...(structured.message ? { message: structured.message } : {}),
    ...(res.isError ? { error: extractText(res.content).slice(0, 400) || "driver reported an error" } : {}),
    verdict,
    hint_followup: verdict.decision === "done" ? undefined : verdict.hint,
  }
  // Optional post-action capture (explicit request only — token economy).
  if (args.capture_after === true && !res.isError) {
    const follow = await s.call("get_window_state", { pid, window_id: windowId, max_dimension: 1568 }, timeoutFor("get_window_state"))
    const built = buildCaptureResult({ mode: "som", call: follow })
    return JSON.stringify(payload) + "\n" + built.output
  }
  return JSON.stringify(payload)
}

const ACTION_DESC = `Which action to perform. capture (side-effect free) returns screen state: mode=som (screenshot + numbered element list — click by [index]), mode=vision (plain screenshot), mode=ax (element list only, cheapest). Input actions (click/double_click/right_click/drag/scroll/type/key/set_value) act on the sticky target set by the last capture/focus_app and require approval. set_value selects options/sliders directly without opening native menus. wait sleeps locally. list_apps/list_windows are read-only. focus_app brings the target's window to the front (maps to the driver's bring_to_front). Actions missing from the platform driver surface are reported unsupported, never silently mapped to a different gesture.`

export function makeComputerTool(deps: ToolDeps) {
  return tool({
    description:
      "Desktop computer use via the locally installed cua-driver (user-installed; this plugin never installs or upgrades it). Workflow: capture -> act by element index -> capture to verify. Verdicts classify every input (done / verify_fresh_state / escalate); never re-issue input on an escalation recommendation alone — re-capture first.",
    args: {
      action: z.enum(ACTIONS).describe(ACTION_DESC),
      mode: z.string().optional().describe("capture mode: som | vision | ax (default som)"),
      app: z.string().optional().describe("app name or bundle id; limits capture to one app and sets the sticky target"),
      pid: z.number().optional().describe("exact process target (from list_apps / capture)"),
      window_id: z.number().optional().describe("exact window target (from list_windows / capture) — window actions require it; capture resolves it via list_windows when only pid is given"),
      query: z.string().optional().describe("capture: case-insensitive substring filter on the element tree"),
      element_index: z.number().optional().describe("element to act on, by [index] from the last capture"),
      x: z.number().optional().describe("x in window-local screenshot pixels (pixel fallback; prefer element_index)"),
      y: z.number().optional().describe("y in window-local screenshot pixels"),
      button: z.string().optional().describe("click mouse button: left | right | middle (action=click)"),
      delivery_mode: z.string().optional().describe("background (default, never steals focus) | foreground (escalation ONLY after a background_unavailable error — never preemptively)"),
      from_x: z.number().optional(),
      from_y: z.number().optional(),
      to_x: z.number().optional(),
      to_y: z.number().optional(),
      direction: z.string().optional().describe("scroll direction: up|down|left|right"),
      amount: z.number().optional().describe("scroll amount"),
      text: z.string().optional().describe("text to type (action=type)"),
      keys: z.string().optional().describe("key or combo, e.g. 'enter' or 'ctrl+s' (action=key)"),
      value: z.string().optional().describe("value to set (action=set_value)"),
      waitMs: z.number().optional().describe("wait duration ms, max 10000 (action=wait)"),
      capture_after: z.boolean().optional().describe("attach a fresh som capture after a successful input action"),
    },
    async execute(args, ctx) {
      const action = args.action as Action
      if (!ACTIONS.includes(action)) {
        const hint = ACTION_HINTS[String(action)]
        return JSON.stringify({ ok: false, action, error: `unknown action${hint ? ` — ${hint}` : `; supported: ${ACTIONS.join(", ")}`}` })
      }
      deps.probeLine?.(`computer action=${action}`)
      return await driverCall(deps, ctx, action, args as Record<string, unknown>)
    },
  })
}

export function makeStatusTool(deps: {
  ready: boolean
  reason: string
  resolved: string | null
  version: string | null
  installHint: string
  sessionId: string
}) {
  return tool({
    description:
      "cua-driver readiness, version, and remediation. When the driver is missing or below the contract floor this is the ONLY computer-use tool: it prints the exact command the USER must run in their own terminal (the plugin never installs or upgrades the driver, and never executes installers on the user's behalf).",
    args: {},
    async execute() {
      const payload = {
        ready: deps.ready,
        driver: deps.resolved,
        version: deps.version,
        contract: { min: "0.28.0", testedAgainst: "0.28.2" },
        session: deps.sessionId,
        ...(deps.ready ? {} : { problem: deps.reason, remediation: deps.installHint }),
        update_check: "to check for a newer driver, run `cua-driver check-update` yourself in a terminal; this plugin never polls or refreshes",
      }
      return JSON.stringify(payload, null, 2)
    },
  })
}
