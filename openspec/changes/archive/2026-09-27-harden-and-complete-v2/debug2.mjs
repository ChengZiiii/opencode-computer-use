import { execFileSync } from "node:child_process"
import { EventEmitter } from "node:events"
import { resolveDriverCmd } from "../../../src/driver-resolve.ts"
import { checkContract } from "../../../src/contract.ts"
import { ComputerSession } from "../../../src/session.ts"
import { makeComputerTool } from "../../../src/tool.ts"

const resolved = resolveDriverCmd()
const contract = checkContract(resolved)
const session = new ComputerSession(contract.mcpInvocation, `dbg2-${Date.now()}`, { log: (l) => console.error(`[s] ${l}`) })
const tool = makeComputerTool({ session, driverVersion: () => contract.version })
const ctx = { sessionID: "d", messageID: "m", agent: "a", directory: ".", worktree: ".", abort: new EventEmitter(), metadata() {}, ask: async () => {} }
const run = async (args) => {
  const r = await tool.execute(args, ctx)
  return typeof r === "string" ? r : `${r.output}\n[attach:${r.attachments?.length ?? 0}]`
}
await run({ action: "launch_app", app: "Notepad" })
await new Promise((r) => setTimeout(r, 2000))
await run({ action: "capture", mode: "som", app: "Notepad" })
console.log("sticky:", JSON.stringify(session.sticky))

// verify raw driver call to see the real predicate shape it accepts
const raw = await session.call("verify_state", { pid: session.sticky.pid, window_id: session.sticky.windowId, predicates: [{ exists: true }] }, 20000)
console.log("verify_state raw:", JSON.stringify(raw).slice(0, 500))

// zoom raw
const rawZoom = await session.call("zoom", { pid: session.sticky.pid, window_id: session.sticky.windowId, x: 8, y: 60, width: 240, height: 160 }, 30000)
console.log("zoom raw keys:", JSON.stringify({ isError: rawZoom.isError, contentTypes: rawZoom.content.map((c) => c.type), structuredKeys: Object.keys(rawZoom.structured ?? {}), textHead: JSON.stringify(rawZoom.content.find((c) => c.type === "text") ?? {}).slice(0, 300) }))

// launch-app sticky rebinding check on tool layer
const z = await run({ action: "zoom", x: 8, y: 60, w: 240, h: 160 })
console.log("tool zoom:", z.slice(0, 400))

// kill + restart disclosure at session level
const pids = String(execFileSync("powershell", ["-NoProfile", "-Command", `Get-CimInstance Win32_Process -Filter "Name='cua-driver.exe'" | Select-Object -ExpandProperty ProcessId`], { encoding: "utf8", windowsHide: true })).split(/\s+/).filter(Boolean)
console.log("driver pids before kill:", pids.join(","))
for (const p of pids) {
  try {
    execFileSync("taskkill", ["/PID", p, "/F"], { windowsHide: true })
  } catch (e) {
    console.log("kill", p, "err", String(e).slice(0, 60))
  }
}
await new Promise((r) => setTimeout(r, 800))
console.log("session restarted flag:", session.restarted, "crashed client:", session.sticky)
const post = await run({ action: "list_apps" })
console.log("post-restart list_apps head:", post.slice(0, 260))
process.exit(0)
