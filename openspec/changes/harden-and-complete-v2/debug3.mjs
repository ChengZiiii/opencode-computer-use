import { EventEmitter } from "node:events"
import { resolveDriverCmd } from "../../../src/driver-resolve.ts"
import { checkContract } from "../../../src/contract.ts"
import { ComputerSession } from "../../../src/session.ts"
import { makeComputerTool } from "../../../src/tool.ts"
const resolved = resolveDriverCmd()
const contract = checkContract(resolved)
const session = new ComputerSession(contract.mcpInvocation, `dbg3-${Date.now()}`)
const tool = makeComputerTool({ session, driverVersion: () => contract.version })
const ctx = { sessionID: "d", messageID: "m", agent: "a", directory: ".", worktree: ".", abort: new EventEmitter(), metadata() {}, ask: async () => {} }
const run = async (args) => {
  const r = await tool.execute(args, ctx)
  return typeof r === "string" ? r : `${r.output}\n[attach:${r.attachments?.length ?? 0}]`
}
// focus Taskmgr (visible), then raw verify to see the driver's own fields
const f = JSON.parse(await run({ action: "focus_app", app: "Taskmgr" }))
console.log("focus:", JSON.stringify(f).slice(0, 120))
const raw = await session.call("verify_state", { pid: session.sticky.pid, window_id: session.sticky.windowId, expect: [{ window: { exists: true } }] }, 20000)
console.log("verify raw:", JSON.stringify(raw).slice(0, 500))
// zoom output
const z = await run({ action: "zoom", x: 8, y: 40, w: 240, h: 160 })
console.log("zoom out:", z.slice(0, 320))
// dedup 4x on the same window
for (let i = 1; i <= 4; i++) {
  const r = await run({ action: "capture", mode: "vision" })
  console.log(`cap${i}:`, /\[attach:(\d+)\]/.exec(r)?.[1] ?? (r.match(/unchanged/) ? "omitted-note" : "text-only"), r.includes("unchanged") ? "(unchanged note)" : "")
}
process.exit(0)
