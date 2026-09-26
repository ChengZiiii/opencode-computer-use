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
  "zoom",
  "verify",
  "click",
  "double_click",
  "right_click",
  "drag",
  "scroll",
  "type",
  "key",
  "set_value",
  "invoke_menu",
  "launch_app",
  "wait",
  "list_apps",
  "list_windows",
  "focus_app",
] as const

export type Action = (typeof ACTIONS)[number]

// Closest-spelling suggestions for common unsupported actions.
const ACTION_HINTS: Record<string, string> = {
  middle_click: "use click with button=middle (the click action's button parameter covers it)",
  screenshot: "use action=capture",
  screenshot_full: "use action=capture mode=vision",
  hover: "use action=move/scroll or capture then click",
  press: "use action=key",
  focus: "use action=focus_app (selection only) with raise=true when the window must come to the front",
  menu: "use action=invoke_menu with path",
  launch: "use action=launch_app",
}

const TIMEOUTS: Record<string, number> = {
  capture: 30000,
  list: 10000,
  input: 15000,
  menu: 20000,
  launch: 30000,
  verify: 20000,
}

function timeoutFor(tool: string): number {
  if (tool.startsWith("get_") || tool === "zoom") return TIMEOUTS.capture
  if (tool.startsWith("list_")) return TIMEOUTS.list
  if (tool === "invoke_menu") return TIMEOUTS.menu
  if (tool === "launch_app") return TIMEOUTS.launch
  if (tool === "verify_state") return TIMEOUTS.verify
  return TIMEOUTS.input
}

export type ToolDeps = {
  session: ComputerSession
  driverVersion: () => string | null
  probeLine?: (text: string) => void
  /** Policy: automatic post-input capture ("off" | "som" | "ax"). */
  captureAfter?: "off" | "som" | "ax"
  /** Driver-side element walk bound (default 200). */
  maxElements?: number
}

function jsonErr(action: string, err: unknown): string {
  return JSON.stringify({ ok: false, action, error: (err as Error).message ?? String(err) })
}

// Side-effect-free actions: no approval, no sticky target needed.
const FREE_ACTIONS = new Set(["capture", "zoom", "verify", "wait", "list_apps", "list_windows"])

async function driverCall(deps: ToolDeps, ctx: ToolContext, action: Action, args: Record<string, unknown>): Promise<string | { output: string; attachments?: Attachment[] }> {
  const s = deps.session
  const app = typeof args.app === "string" ? args.app : undefined

  // Hard-blocked destructive input runs BEFORE approval: an "always" grant
  // must never let these through. Writing actions all scan (type AND
  // set_value — a value lands in the same editable fields).
  if (action === "key") {
    const keys = String(args.keys ?? args.key ?? "")
    const blocked = blockedKeyReason(keys)
    if (blocked) return JSON.stringify({ ok: false, action, error: blocked })
  }
  if (action === "type") {
    const blocked = blockedTypeReason(String(args.text ?? ""))
    if (blocked) return JSON.stringify({ ok: false, action, error: blocked })
  }
  if (action === "set_value") {
    const blocked = blockedTypeReason(String(args.value ?? ""))
    if (blocked) return JSON.stringify({ ok: false, action, error: blocked })
  }

  // Sticky target guard: input goes to the target from the last
  // capture/focus_app; a provably different `app` argument is refused.
  if (!FREE_ACTIONS.has(action)) {
    const refusal = targetRefusal(s.sticky, app)
    if (refusal) return JSON.stringify({ ok: false, action, code: "input_target_mismatch", error: refusal })
  }

  // Approval domains, two of them: background input ("computer") and
  // FOREGROUND input ("computer:foreground" — raise/bring_to_front/delivery
  // foreground). A granted background approval never covers a foreground
  // action; both default to ask; an explicit deny always wins.
  const wantsForeground =
    args.raise === true || args.delivery_mode === "foreground" || (action === "focus_app" && args.raise === true)
  if (wantsForeground && action !== "capture" && action !== "wait") {
    try {
      await ctx.ask({
        permission: "computer:foreground",
        patterns: ["*"],
        always: [],
        metadata: { title: `computer (foreground): ${action}${app ? ` on ${app}` : ""}`, tool: "computer", action, foreground: true },
      })
    } catch (err) {
      return JSON.stringify({ ok: false, action, code: "denied", error: `user denied foreground: ${(err as Error).message ?? "permission rejected"}` })
    }
  }
  if (!FREE_ACTIONS.has(action)) {
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

  // Restart disclosure: the first result after a driver restart says so —
  // every element reference minted before it is worthless.
  const restartedNote = s.restarted
  if (restartedNote) s.restarted = false

  try {
    if (action === "wait") {
      const ms = Math.max(0, Math.min(10000, Number(args.waitMs ?? 1000)))
      await new Promise((r) => setTimeout(r, ms))
      return JSON.stringify({ ok: true, action, waitedMs: ms, ...(restartedNote ? restartedFields() : {}), verdict: { decision: "done", hint: "no side effects" } })
    }
    let result: string | { output: string; attachments?: Attachment[] }
    if (action === "capture") result = await captureFlow(deps, args)
    else if (action === "zoom") result = await zoomFlow(deps, args)
    else if (action === "verify") result = await verifyFlow(deps, args)
    else if (action === "list_apps" || action === "list_windows") {
      const res = await s.call(action, {}, timeoutFor(action))
      result = listResult(action, res)
    } else result = await inputFlow(deps, action, args)
    if (restartedNote && typeof result === "string") {
      try {
        const parsed = JSON.parse(result) as Record<string, unknown>
        return JSON.stringify({ ...restartedFields(), ...parsed })
      } catch {
        return result
      }
    }
    if (restartedNote && typeof result === "object") {
      return { ...result, output: `driver restarted since your last call — re-capture required (element references and target were invalidated)\n${result.output}` }
    }
    return result
  } catch (err) {
    return jsonErr(action, err)
  }
}

function restartedFields(): Record<string, unknown> {
  return { restarted: true, restart_note: "the cua-driver restarted; prior element references and the sticky target are invalid — capture again before any input" }
}

type WindowRow = { pid?: number; window_id?: number; title?: string }

/** Resolve windows from list_windows output: structured rows first, human-text fallback. */
function windowsFromList(listed: CallResult): WindowRow[] {
  const arr = (listed.structured as { windows?: WindowRow[] } | undefined)?.windows
  if (Array.isArray(arr)) return arr
  const text = extractText(listed.content)
  return [...text.matchAll(/-\s+\S+ \(pid (\d+)\) "(.*?)" \[window_id: (\d+)\]/g)].map((m) => ({ pid: Number(m[1]), title: m[2], window_id: Number(m[3]) }))
}

type AppRow = { pid?: number; name?: string; bundle_id?: string; app_name?: string }

function appsFromList(listed: CallResult): AppRow[] {
  const arr = (listed.structured as { apps?: AppRow[] } | undefined)?.apps
  if (Array.isArray(arr)) return arr
  const text = extractText(listed.content)
  return [...text.matchAll(/-\s+([^(\s][^ (]*?)\s*\(pid (\d+)\)/g)].map((m) => ({ name: m[1], pid: Number(m[2]) }))
}

/**
 * App-name resolution ladder (spec): list_apps exact name/bundle match, then
 * substring match, then list_windows title match. Multiple hits -> the
 * candidate list; zero hits -> the running apps list for context.
 */
export async function resolveApp(s: ComputerSession, name: string): Promise<{ pid: number; app: string } | { candidates: string[] } | { miss: string; running: string[] }> {
  const listed = await s.call("list_apps", {}, timeoutFor("list_apps"))
  const rows = appsFromList(listed)
  const label = (r: AppRow) => String(r.name ?? r.app_name ?? r.bundle_id ?? "")
  const want = name.trim().toLowerCase()
  const exact = rows.find((r) => label(r).trim().toLowerCase() === want && typeof r.pid === "number")
  if (exact) return { pid: exact.pid!, app: label(exact) }
  const partial = rows.filter((r) => label(r).trim().toLowerCase().includes(want) && typeof r.pid === "number")
  if (partial.length === 1) return { pid: partial[0].pid!, app: label(partial[0]) }
  if (partial.length > 1) return { candidates: partial.map((r) => `${label(r)} (pid ${r.pid})`) }
  // Ladder rung 3: window titles.
  const winListed = await s.call("list_windows", {}, timeoutFor("list_windows"))
  const wins = windowsFromList(winListed)
  const byTitle = wins.find((w) => (w.title ?? "").toLowerCase().includes(want) && typeof w.pid === "number")
  if (byTitle) return { pid: byTitle.pid!, app: name }
  return { miss: name, running: rows.map((r) => label(r)).filter(Boolean).slice(0, 30) }
}

async function captureFlow(deps: ToolDeps, args: Record<string, unknown>): Promise<string | { output: string; attachments?: Attachment[] }> {
  const mode = (["som", "vision", "ax"].includes(String(args.mode)) ? args.mode : "som") as CaptureMode
  const s = deps.session
  const pid = typeof args.pid === "number" ? args.pid : undefined
  const windowId = typeof args.window_id === "number" ? args.window_id : undefined
  // App-name entry: resolve the ladder before anything else, so the README
  // first example (capture app="Notepad") works with no pre-existing target.
  let effectivePid = pid
  if (effectivePid === undefined && windowId === undefined && typeof args.app === "string" && args.app.trim()) {
    const resolved = await resolveApp(s, args.app)
    if ("pid" in resolved) effectivePid = resolved.pid
    else if ("candidates" in resolved) {
      return JSON.stringify({ ok: false, action: "capture", code: "app_ambiguous", error: `multiple running apps match "${args.app}" — pass pid= for one of: ${resolved.candidates.join("; ")}` })
    } else {
      return JSON.stringify({ ok: false, action: "capture", code: "app_not_found", error: `no running app matches "${args.app}". Running apps: ${resolved.running.slice(0, 20).join(", ") || "(none listed)"}` })
    }
  }
  // Desktop scope only when no window target at all.
  if (mode === "vision" && effectivePid === undefined && windowId === undefined && !s.sticky) {
    const res = await s.call("get_desktop_state", {}, timeoutFor("get_desktop_state"))
    return { output: buildCaptureResult({ mode, call: res }).output }
  }
  // Window scope: get_window_state REQUIRES window_id (driver never picks a
  // window implicitly). Resolve the missing half via list_windows.
  let effectiveWindow = windowId ?? (s.sticky?.pid === effectivePid ? s.sticky?.windowId : undefined)
  if (effectivePid === undefined && effectiveWindow === undefined && s.sticky?.pid !== undefined) {
    effectivePid = s.sticky.pid
    effectiveWindow = s.sticky.windowId
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
  // Driver-side downscale keeps the returned screenshot within the contract;
  // the element walk bound keeps dense trees bounded in TIME (spec).
  callArgs.max_dimension = 1568
  callArgs.max_elements = Math.max(50, Math.min(1000, deps.maxElements ?? 200))
  const res = await s.call("get_window_state", callArgs, timeoutFor("get_window_state"))
  if (!res.isError) {
    const structured = (res.structured ?? {}) as { snapshot_id?: unknown; elements?: Array<{ element_index?: number; element_token?: string }> }
    s.recordSnapshot(effectiveWindow, structured.snapshot_id, structured.elements)
    s.sticky = { app: typeof args.app === "string" ? args.app : s.sticky?.app ?? "", pid: effectivePid ?? s.sticky?.pid, windowId: effectiveWindow }
  }
  const built = buildCaptureResult({ mode, call: res })
  return attachWithDedup(s, effectiveWindow, built)
}

/** Zoom: native-resolution crop (≤500 logical px) of the sticky window. */
async function zoomFlow(deps: ToolDeps, args: Record<string, unknown>): Promise<string | { output: string; attachments?: Attachment[] }> {
  const s = deps.session
  const pid = typeof s.sticky?.pid === "number" ? s.sticky.pid : typeof args.pid === "number" ? args.pid : undefined
  const windowId = typeof args.window_id === "number" ? args.window_id : s.sticky?.windowId
  if (pid === undefined || windowId === undefined) {
    return JSON.stringify({ ok: false, action: "zoom", code: "no_target", error: "zoom needs a window target — capture(app=...) first." })
  }
  const region = {
    x: Math.max(0, Number(args.x ?? 0)),
    y: Math.max(0, Number(args.y ?? 0)),
    w: Math.min(500, Math.max(8, Number(args.w ?? args.width ?? 200))),
    h: Math.min(500, Math.max(8, Number(args.h ?? args.height ?? 200))),
  }
  const res = await s.call("zoom", { pid, window_id: windowId, x: region.x, y: region.y, width: region.w, height: region.h }, timeoutFor("zoom"))
  s.recordZoom(windowId, region)
  const built = buildCaptureResult({ mode: "vision", call: res })
  const output = [
    `zoom(${region.x},${region.y},${region.w},${region.h}) — native-resolution crop of window ${windowId}.`,
    "Coordinates you read off THIS image must be passed with from_zoom=true on the next input action (the plugin remaps them to native window coordinates); element [index] addressing needs a fresh capture (zoom crops carry no element tokens).",
    built.output,
  ].join("\n")
  return { output, ...(built.attachments ? { attachments: built.attachments } : {}) }
}

/** Deterministic verification against the CURRENT window state. */
async function verifyFlow(deps: ToolDeps, args: Record<string, unknown>): Promise<string> {
  const s = deps.session
  const pid = typeof s.sticky?.pid === "number" ? s.sticky.pid : typeof args.pid === "number" ? args.pid : undefined
  const windowId = typeof args.window_id === "number" ? args.window_id : s.sticky?.windowId
  if (pid === undefined || windowId === undefined) {
    return JSON.stringify({ ok: false, action: "verify", code: "no_target", error: "verify needs a window target — capture(app=...) first." })
  }
  const predicates = Array.isArray(args.predicates) ? args.predicates : []
  if (!predicates.length) {
    return JSON.stringify({ ok: false, action: "verify", error: "predicates required: [{ element_index?, label?, exists?, enabled?, selected?, value?, title_in_bounds? }] — one entry per check." })
  }
  const res = await s.call("verify_state", { pid, window_id: windowId, predicates }, timeoutFor("verify_state"))
  const structured = (res.structured ?? {}) as { results?: Array<Record<string, unknown>>; overall?: string | boolean; message?: string }
  const textOut = extractText(res.content)
  // Three-state mapping: unknown is NEVER success (spec).
  const overall = structured.overall
  const verdict =
    overall === true || overall === "passed" || overall === "success"
      ? { decision: "done", hint: "Verification passed against the current window state." }
      : overall === false || overall === "failed"
        ? { decision: "escalate", hint: "Verification FAILED — the expected state is not present. Re-capture before any retry; do not re-issue input blind." }
        : { decision: "verify_fresh_state", hint: "Verification was indeterminate (unknown) — the predicate could not be evaluated against a valid snapshot. Treat as NOT verified." }
  return JSON.stringify({
    ok: !res.isError,
    action: "verify",
    ...(structured.results ? { results: structured.results } : {}),
    ...(structured.message ? { message: structured.message } : {}),
    ...(res.isError ? { error: textOut.slice(0, 400) || "driver reported an error" } : {}),
    verdict,
  })
}

function listResult(action: string, res: CallResult): string {
  const text = extractText(res.content)
  return JSON.stringify({ ok: !res.isError, action, ...(text ? { items: text.slice(0, 6000) } : {}), ...(res.isError ? { error: "driver reported an error" } : {}) })
}

async function inputFlow(deps: ToolDeps, action: Action, args: Record<string, unknown>): Promise<string> {
  const s = deps.session
  // focus_app and launch_app ESTABLISH the target (ladder resolution /
  // fresh pid); every other input needs an existing sticky target.
  const establishesTarget = action === "focus_app" || action === "launch_app"
  const pid = typeof s.sticky?.pid === "number" ? s.sticky.pid : typeof args.pid === "number" ? args.pid : undefined
  if (pid === undefined && !establishesTarget) {
    return JSON.stringify({ ok: false, action, code: "no_target", error: "no sticky target: call capture(app=/pid=) or focus_app first — input never goes to an unchosen window." })
  }
  const windowId = typeof args.window_id === "number" ? args.window_id : s.sticky?.windowId
  let toolName: string
  const callArgs: Record<string, unknown> = { pid }
  if (windowId !== undefined) callArgs.window_id = windowId
  if (typeof args.delivery_mode === "string") callArgs.delivery_mode = args.delivery_mode
  // Stale-addressing armor: an element_index only counts when it carries its
  // snapshot token; a bare index against an unknown snapshot is refused.
  const elementIndex = typeof args.element_index === "number" ? args.element_index : undefined
  if (elementIndex !== undefined) {
    if (windowId === undefined) {
      return JSON.stringify({ ok: false, action, code: "unaddressable_element", error: "element_index addressing needs the capturing window's window_id (capture first, then act)." })
    }
    const token = s.tokenFor(windowId, elementIndex)
    if (!token) {
      return JSON.stringify({
        ok: false,
        action,
        code: "unaddressable_element",
        error: `element [${elementIndex}] has no snapshot token for window ${windowId} — the reference predates the last capture or the driver restarted. capture again and use a fresh [index].`,
      })
    }
    callArgs.element_index = elementIndex
    callArgs.element_token = token.elementToken
    callArgs.snapshot_id = token.snapshotId
  }
  if (args.from_zoom === true) {
    callArgs.from_zoom = true
    const zc = windowId !== undefined ? s.zoomContextFor(windowId) : null
    if (zc) callArgs.zoom_region = zc
  }
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
    case "invoke_menu": {
      toolName = "invoke_menu"
      const rawPath = Array.isArray(args.path) ? args.path.map(String) : String(args.path ?? "").split(/\s*>\s*/).filter(Boolean)
      if (!rawPath.length) {
        return JSON.stringify({ ok: false, action, error: "path required: the menu path level by level, e.g. [\"File\", \"Open\"] or \"File > Open\"." })
      }
      callArgs.path = rawPath
      break
    }
    case "launch_app": {
      toolName = "launch_app"
      if (typeof args.launch_path === "string" && args.launch_path) callArgs.launch_path = args.launch_path
      else if (typeof args.app === "string" && args.app) callArgs.name = args.app
      else return JSON.stringify({ ok: false, action, error: "launch_app needs app (name) or launch_path." })
      if (args.start_minimized === true) callArgs.start_minimized = true
      break
    }
    case "focus_app":
      // Selection-only by default (never steals the foreground); raise=true
      // (approved as computer:foreground above) brings the window to front.
      if (args.raise === true) toolName = "bring_to_front"
      else toolName = "__select_only__"
      break
    default:
      return JSON.stringify({ ok: false, action, error: `unsupported action ${String(action)}` })
  }

  if (toolName === "__select_only__") {
    // focus_app selection: resolve the ladder, set the sticky target, no
    // window-manager interaction at all.
    if (typeof args.app === "string" && args.app.trim()) {
      const resolved = await resolveApp(s, args.app)
      if ("pid" in resolved) {
        const listed = await s.call("list_windows", {}, timeoutFor("list_windows"))
        const win = windowsFromList(listed).find((r) => r.pid === resolved.pid && r.window_id !== undefined)
        s.sticky = { app: resolved.app, pid: resolved.pid, ...(win ? { windowId: win.window_id } : {}) }
        return JSON.stringify({ ok: true, action: "focus_app", selected: s.sticky, verdict: { decision: "done", hint: "Target selected (no foreground change). Input actions now go here." } })
      }
      if ("candidates" in resolved) {
        return JSON.stringify({ ok: false, action: "focus_app", code: "app_ambiguous", error: `multiple running apps match "${args.app}" — pass pid= for one of: ${resolved.candidates.join("; ")}` })
      }
      return JSON.stringify({ ok: false, action: "focus_app", code: "app_not_found", error: `no running app matches "${args.app}". Running apps: ${resolved.running.slice(0, 20).join(", ") || "(none listed)"}` })
    }
    if (typeof args.pid === "number") {
      const listed = await s.call("list_windows", {}, timeoutFor("list_windows"))
      const win = windowsFromList(listed).find((r) => r.pid === args.pid && r.window_id !== undefined)
      s.sticky = { app: s.sticky?.app ?? "", pid: args.pid, ...(win ? { windowId: win.window_id } : {}) }
      return JSON.stringify({ ok: true, action: "focus_app", selected: s.sticky, verdict: { decision: "done", hint: "Target selected (no foreground change)." } })
    }
    return JSON.stringify({ ok: false, action: "focus_app", error: "focus_app needs app= or pid=." })
  }

  const res = await s.call(toolName, callArgs, timeoutFor(toolName))
  const structured = (res.structured ?? {}) as DriverVerdictFields & { message?: string; pid?: number }
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
  const staleError = res.isError && /stale|snapshot/i.test(textOut)
  if (action === "launch_app" && !res.isError && typeof structured.pid === "number") {
    // Fresh pid: bind the sticky target to the launched app's first window.
    const listed = await s.call("list_windows", {}, timeoutFor("list_windows"))
    const win = windowsFromList(listed).find((r) => r.pid === structured.pid && r.window_id !== undefined)
    s.sticky = { app: String(args.app ?? args.launch_path ?? ""), pid: structured.pid, ...(win ? { windowId: win.window_id } : {}) }
  }
  if (action === "focus_app" && args.raise === true && !res.isError) {
    s.sticky = { app: typeof args.app === "string" ? args.app : s.sticky?.app ?? "", pid, ...(windowId !== undefined ? { windowId } : {}) }
  }
  const verdict = staleError
    ? { decision: "verify_fresh_state" as const, hint: "stale_snapshot: the driver rejected the element reference. capture again, then re-issue with the fresh [index]." }
    : mapVerdict(merged)
  const payload: Record<string, unknown> = {
    ok: !res.isError,
    action,
    ...(structured.message ? { message: structured.message } : {}),
    ...(res.isError ? { error: textOut.slice(0, 400) || "driver reported an error", ...(staleError ? { code: "stale_snapshot" } : {}) } : {}),
    verdict,
    hint_followup: verdict.decision === "done" ? undefined : verdict.hint,
  }
  // Post-action capture: explicit request OR the captureAfter policy.
  const policy = deps.captureAfter ?? "off"
  const wantsCapture = args.capture_after === true || (policy !== "off" && !res.isError)
  if (wantsCapture && !res.isError && pid !== undefined) {
    try {
      const mode: CaptureMode = policy === "ax" && args.capture_after !== true ? "ax" : "som"
      const cArgs: Record<string, unknown> = { pid, max_dimension: 1568, max_elements: Math.max(50, Math.min(1000, deps.maxElements ?? 200)) }
      if (windowId !== undefined) cArgs.window_id = windowId
      const follow = await s.call("get_window_state", cArgs, timeoutFor("get_window_state"))
      const fstructured = (follow.structured ?? {}) as { snapshot_id?: unknown; elements?: Array<{ element_index?: number; element_token?: string }> }
      if (windowId !== undefined) s.recordSnapshot(windowId, fstructured.snapshot_id, fstructured.elements)
      const built = buildCaptureResult({ mode, call: follow })
      const withDedup = attachWithDedup(deps.session, windowId, built)
      return JSON.stringify(payload) + "\n" + (typeof withDedup === "string" ? withDedup : withDedup.output)
    } catch {
      // The capture is a convenience; its failure must not mask the verdict.
      return JSON.stringify(payload)
    }
  }
  return JSON.stringify(payload)
}

/** Apply the if-changed policy to a built capture result. */
function attachWithDedup(s: ComputerSession, windowId: number | undefined, built: { output: string; attachments?: Attachment[]; elements?: unknown }): string | { output: string; attachments?: Attachment[] } {
  if (!built.attachments?.length || windowId === undefined) return built
  const data = built.attachments[0].url
  const { attach, unchanged } = s.shouldAttachScreenshot(windowId, data)
  if (attach) return built
  return {
    output: `${built.output}\nscreenshot unchanged since the previous capture — image omitted (dedup streak bounded; a third identical capture re-attaches).`,
  }
}

const ACTION_DESC = `Which action to perform. capture (side-effect free) returns screen state: mode=som (screenshot + numbered element list — click by [index]), mode=vision (plain screenshot), mode=ax (element list only, cheapest). zoom returns a native-resolution crop (≤500px) for reading dense UI; coordinates read off it go into the next input with from_zoom=true. verify evaluates deterministic predicates against the current window (three-state: passed/failed/unknown — unknown is never success). Input actions (click/double_click/right_click/drag/scroll/type/key/set_value/invoke_menu/launch_app) act on the sticky target set by the last capture/focus_app and require approval. set_value selects options/sliders directly; invoke_menu drives native menus by path (no pixel fallback); launch_app starts an app (hidden by default, auto-selects its window). wait sleeps locally. list_apps/list_windows are read-only. focus_app SELECTS a target without touching the foreground; raise=true (separate approval domain) brings it to the front.`

export function makeComputerTool(deps: ToolDeps) {
  return tool({
    description:
      "Desktop computer use via the locally installed cua-driver (user-installed; this plugin never installs or upgrades it). Workflow: capture -> act by element index -> capture/verify to check. Verdicts classify every input (done / verify_fresh_state / escalate); never re-issue input on an escalation recommendation alone — re-capture first.",
    args: {
      action: z.enum(ACTIONS).describe(ACTION_DESC),
      mode: z.string().optional().describe("capture mode: som | vision | ax (default som)"),
      app: z.string().optional().describe("app name or bundle id; limits capture to one app and sets the sticky target (resolution: list_apps exact, substring, then window titles)"),
      pid: z.number().optional().describe("exact process target (from list_apps / capture)"),
      window_id: z.number().optional().describe("exact window target (from list_windows / capture) — window actions require it; capture resolves it via list_windows when only pid is given"),
      query: z.string().optional().describe("capture: case-insensitive substring filter on the element tree"),
      element_index: z.number().optional().describe("element to act on, by [index] from the last capture (must come from the current snapshot — stale references are refused)"),
      x: z.number().optional().describe("x in window-local screenshot pixels (pixel fallback; prefer element_index)"),
      y: z.number().optional().describe("y in window-local screenshot pixels"),
      w: z.number().optional().describe("zoom: crop width (≤500)"),
      h: z.number().optional().describe("zoom: crop height (≤500)"),
      button: z.string().optional().describe("click mouse button: left | right | middle (action=click)"),
      delivery_mode: z.string().optional().describe("background (default, never steals focus) | foreground (escalation ONLY after a background_unavailable error — never preemptively; needs the foreground approval)"),
      raise: z.boolean().optional().describe("foreground intents: focus_app raise=true brings the window to the front; input actions with raise=true foreground them (separate approval domain computer:foreground)"),
      from_zoom: z.boolean().optional().describe("coordinates were read off a zoom crop — remap them to native window coordinates before dispatch"),
      from_x: z.number().optional(),
      from_y: z.number().optional(),
      to_x: z.number().optional(),
      to_y: z.number().optional(),
      direction: z.string().optional().describe("scroll direction: up|down|left|right"),
      amount: z.number().optional().describe("scroll amount"),
      text: z.string().optional().describe("text to type (action=type)"),
      keys: z.string().optional().describe("key or combo, e.g. 'enter' or 'ctrl+s' (action=key)"),
      value: z.string().optional().describe("value to set (action=set_value)"),
      path: z.string().optional().describe("invoke_menu: menu path, 'File > Open' or [\"File\",\"Open\"]"),
      launch_path: z.string().optional().describe("launch_app: executable path to start"),
      start_minimized: z.boolean().optional().describe("launch_app: start minimized (default hidden-no-activate; pass false to show normally)"),
      predicates: z.array(z.record(z.string(), z.unknown())).optional().describe("verify: [{ element_index?, label?, exists?, enabled?, selected?, value? }] — deterministic checks against the current window"),
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
  /** Live health probe: returns the driver's health_report (or throws). */
  healthFetch?: () => Promise<Record<string, unknown>>
}) {
  return tool({
    description:
      "cua-driver readiness, version, health, and remediation. When the driver is missing or below the contract floor this is the ONLY computer-use tool: it prints the exact command the USER must run in their own terminal (the plugin never installs or upgrades the driver, and never executes installers on the user's behalf).",
    args: {},
    async execute() {
      let health: Record<string, unknown> | undefined
      if (deps.ready && deps.healthFetch) {
        try {
          health = await deps.healthFetch()
        } catch {
          health = { degraded: "health_report unavailable — manifest contract state shown instead" }
        }
      }
      const payload = {
        ready: deps.ready,
        driver: deps.resolved,
        version: deps.version,
        contract: { min: "0.28.0", testedAgainst: "0.28.2" },
        session: deps.sessionId,
        ...(health ? { health } : {}),
        ...(deps.ready ? {} : { problem: deps.reason, remediation: deps.installHint }),
        ...(deps.ready
          ? {
              macos_tcc_note:
                "macOS: if automation was granted but clicks land nowhere, the TCC grant may be stale — System Settings > Privacy & Security > Accessibility/Automation, remove and re-grant the terminal running opencode.",
            }
          : {}),
        update_check: "to check for a newer driver, run `cua-driver check-update` yourself in a terminal; this plugin never polls or refreshes",
      }
      return JSON.stringify(payload, null, 2)
    },
  })
}
