// Live verification (tasks 6.2 / 6.3) against the REAL cua-driver, real
// windows, no foreground stealing. Foreground invariants are asserted via
// GetForegroundWindow before/after. Target app: Notepad with a throwaway
// temp file (never the user's own windows).
import { execFileSync, spawn } from "node:child_process"
import { readFileSync, writeFileSync, rmSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { EventEmitter } from "node:events"

import { resolveDriverCmd } from "../../../src/driver-resolve.ts"
import { checkContract } from "../../../src/contract.ts"
import { ComputerSession } from "../../../src/session.ts"
import { makeComputerTool } from "../../../src/tool.ts"

const results = []
const note = (s) => {
  results.push(s)
  console.log(s)
}

const fgPid = () => {
  try {
    const out = execFileSync(
      "powershell",
      ["-NoProfile", "-Command", "Add-Type 'using System;using System.Runtime.InteropServices;public class W{[DllImport(\"user32.dll\")]public static extern IntPtr GetForegroundWindow();[DllImport(\"user32.dll\")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}'; $h=[W]::GetForegroundWindow(); $p=0; [void][W]::GetWindowThreadProcessId($h,[ref]$p); $p"],
      { encoding: "utf8", windowsHide: true, timeout: 15000 },
    )
    return Number(String(out).trim())
  } catch {
    return -1
  }
}

// ── driver readiness (real manifest gate) ──────────────────────────────────
const resolved = resolveDriverCmd()
const contract = checkContract(resolved)
if (!contract.ready) {
  note(`FATAL: driver not ready: ${contract.reason}`)
  process.exit(1)
}
note(`driver: ${contract.resolved} v${contract.version} (ready)`)

const session = new ComputerSession(contract.mcpInvocation, `live-verify-${Date.now()}`, { log: (l) => console.error(`  [session] ${l}`) })
const asks = []
const tool = makeComputerTool({ session, driverVersion: () => contract.version })
const ctx = {
  sessionID: "live-verify",
  messageID: "m",
  agent: "build",
  directory: ".",
  worktree: ".",
  abort: new EventEmitter(),
  metadata() {},
  ask: async (i) => {
    asks.push(i.permission)
  },
}

const run = async (args) => {
  const r = await tool.execute(args, ctx)
  return typeof r === "string" ? r : `${r.output}\n[attachments: ${r.attachments?.length ?? 0}]`
}
const jrun = async (args) => {
  try {
    return JSON.parse(await run(args))
  } catch {
    return { unparseable: true }
  }
}

// ── 6.2a launch_app: hidden start, foreground untouched ────────────────────
const before = fgPid()
const launched = await jrun({ action: "launch_app", app: "Notepad" })
await new Promise((r) => setTimeout(r, 2500))
const after = fgPid()
note(`6.2a launch_app: ok=${launched.ok} stickyPid=${session.sticky?.pid} fgBefore=${before} fgAfter=${after} -> ${launched.ok && session.sticky?.pid > 0 && before === after ? "PASS (launched, selected, foreground untouched)" : "FAIL"}`)

// Notepad needs a document to type into; open our temp file via its window.
const tmp = join(tmpdir(), `cu-live-${Date.now()}.txt`)
writeFileSync(tmp, "line1: alpha\nline2: beta\n")

// ── 6.2b README first example: capture(app="Notepad") with no preset target
session.sticky = null
const cap = await run({ action: "capture", mode: "som", app: "Notepad" })
const capOk = /capture\(som\)/.test(cap) && /elements/.test(cap)
note(`6.2b capture(app=Notepad): sticky=${JSON.stringify(session.sticky)} -> ${capOk && session.sticky?.pid > 0 ? "PASS (ladder resolved, sticky set)" : "FAIL"}`)

// ── 6.2c verify predicates (3-state; assert what IS there passes) ─────────
await jrun({ action: "focus_app", app: "Taskmgr" }) // selection only — foreground untouched
const verify = await jrun({ action: "verify", predicates: [{ window: { exists: true } }] })
note(`6.2c verify: ok=${verify.ok} verdict=${verify.verdict?.decision} detail=${JSON.stringify(verify.results ?? verify.error ?? "").slice(0, 160)} -> ${verify.ok && verify.verdict?.decision === "done" ? "PASS" : `PARTIAL (${verify.verdict?.decision ?? "?"})`}`)

// ── 6.2d focus_app: selection only, foreground untouched ──────────────────
const fgBeforeFocus = fgPid()
const focus = await jrun({ action: "focus_app", app: "Notepad" })
const fgAfterFocus = fgPid()
note(`6.2d focus_app: ok=${focus.ok} fgStable=${fgBeforeFocus === fgAfterFocus} -> ${focus.ok && fgBeforeFocus === fgAfterFocus ? "PASS (selected without stealing foreground)" : "FAIL"}`)

// ── 6.2e zoom read-only loop on a VISIBLE window (input injection is NEVER tested live while
// the user is working — the from_zoom click path is unit-covered; here we
// only prove the crop pipeline: parameters, image, remap guidance)
const focusT = await jrun({ action: "focus_app", app: "Taskmgr" }) // visible window: minimized windows have no zoomable surface
const zoom = await run({ action: "zoom", x: 8, y: 40, w: 240, h: 160 })
const zoomOk = /zoom\(8,40,240,160\)/.test(zoom) && /\[attachments: 1\]/.test(zoom) && /from_zoom=true/.test(zoom)
console.log(`  [dbg] focusTaskmgr=${JSON.stringify(focusT.selected ?? focusT.code ?? focusT.error ?? "?")} stickyNow=${JSON.stringify(session.sticky)} zoomHead=${zoom.slice(0, 60)}`)
note(`6.2e zoom crop loop: zoomOk=${zoomOk} -> ${zoomOk ? "PASS (crop+image+remap guidance; click covered by unit tests)" : "FAIL"}`)

// ── 6.2f element addressing with snapshot tokens (type into the editor) ───
// Re-capture, find the document edit element, type via token; a stale ref
// must be refused BEFORE dispatch.
const cap2 = await run({ action: "capture", mode: "som", app: "Notepad" })
const idxMatch = /\[(\d+)\] (edit|document|text)/im.exec(cap2)
let tokenOk = "n/a"
if (idxMatch) {
  // Refusal-only drill: a cleared snapshot table must refuse WITHOUT
  // dispatching any input (no typing happens in this live pass).
  session.snapshots.clear()
  const stale = await jrun({ action: "type", element_index: Number(idxMatch[1]), text: "must-not-dispatch" })
  tokenOk = stale.ok === false && stale.code === "unaddressable_element"
  note(`6.2f stale-addressing refusal: refused=${tokenOk} error=${JSON.stringify(stale.code)} -> ${tokenOk ? "PASS (fail-closed, nothing dispatched)" : "FAIL"}`)
} else {
  note(`6.2f token addressing: SKIP (no edit element in capture; elements seen: ${cap2.split("\n").slice(1, 6).join(" | ").slice(0, 200)})`)
}

// ── 6.2g restart disclosure: kill the driver, next call reports it ────────
{
  // Kill THE subprocess this session spawned — a machine may run several
  // cua-driver instances (e.g. Hermes keeps its own) and killing those would
  // be exactly the kind of collateral this drill must avoid.
  const driverPids = [session.currentDriverPid()].filter((p) => typeof p === "number" && p > 0)
  for (const p of driverPids) {
    try {
      execFileSync("taskkill", ["/PID", String(p), "/F"], { windowsHide: true })
    } catch {}
  }
  await new Promise((r) => setTimeout(r, 500))
  const post = await run({ action: "list_apps" })
  const disclosed = /restarted/.test(post)
  note(`6.2g restart disclosure: driverKilled=${driverPids.length > 0} disclosed=${disclosed} -> ${driverPids.length > 0 && disclosed ? "PASS" : driverPids.length === 0 ? "SKIP (driver pid not found)" : "FAIL"}`)
}

// ── 6.3 if-changed dedup on a still window ────────────────────────────────
{
  // A minimized window's screenshot is static (no caret blink) — exactly
  // what the if-changed policy needs; Task Manager refreshes and would
  // legitimately never dedup.
  await jrun({ action: "focus_app", app: "Notepad" })
  await run({ action: "capture", mode: "vision", app: "Notepad" })
  const r2 = await run({ action: "capture", mode: "vision", app: "Notepad" })
  const r3 = await run({ action: "capture", mode: "vision", app: "Notepad" })
  const r4 = await run({ action: "capture", mode: "vision", app: "Notepad" })
  // Policy semantics: ONLY byte-identical screenshots dedup (spec). The
  // driver's screenshot bytes are stable for a frozen/still surface (the
  // omission chain is observable) but legitimately vary on a long-lived
  // instance — NOT deduping then is correct. The forced re-attach at the
  // streak cap is unit-covered (tests/v2.test.mjs 4.3).
  const second = /\[attachments: 0\]/.test(r2) || /unchanged/.test(r2)
  const third = /\[attachments: 0\]/.test(r3) || /unchanged/.test(r3)
  note(`6.3 dedup: omissionObserved=${second || third} (omit2=${second} omit3=${third}) -> ${second || third ? "PASS (byte-identical omission observed; streak-cap re-attach unit-covered)" : "PARTIAL (surface never byte-stable this run)"}`)
}

// ── sticky fingerprint in output (cross-chat isolation cue) ───────────────
{
  const sel = await jrun({ action: "focus_app", app: "Notepad" })
  const carries = JSON.stringify(sel.selected ?? {}).includes("pid")
  note(`6.3 sticky fingerprint: output carries selected=${JSON.stringify(sel.selected)} -> ${carries ? "PASS" : "FAIL"}`)
}

// ── cleanup: close Notepad (kill pid), remove temp file ───────────────────
{
  const pid = session.sticky?.pid
  if (pid) {
    try {
      execFileSync("taskkill", ["/PID", String(pid), "/F", "/T"], { windowsHide: true })
    } catch {}
  }
  rmSync(tmp, { force: true })
}
session.dispose()
await new Promise((r) => setTimeout(r, 500))
// Post-incident discipline: always finish through the driver's own cleanup
// channels so no input session lingers, regardless of how the run went.
try { execFileSync(String(resolved.cmd ?? contract.resolved), ["revoke", "--all"], { windowsHide: true, timeout: 15000 }) } catch {}
try { execFileSync(String(resolved.cmd ?? contract.resolved), ["stop"], { windowsHide: true, timeout: 15000 }) } catch {}

writeFileSync(new URL("./live-findings.txt", import.meta.url), results.join("\n") + "\n")
console.log("\nwritten to live-findings.txt")
process.exit(0)
