import { EventEmitter } from "node:events"
import { resolveDriverCmd } from "../../../src/driver-resolve.ts"
import { checkContract } from "../../../src/contract.ts"
import { ComputerSession } from "../../../src/session.ts"
import { makeComputerTool } from "../../../src/tool.ts"
const resolved = resolveDriverCmd()
const contract = checkContract(resolved)
const session = new ComputerSession(contract.mcpInvocation, `dbg4-${Date.now()}`)
const tool = makeComputerTool({ session, driverVersion: () => contract.version })
const ctx = { sessionID: "d", messageID: "m", agent: "a", directory: ".", worktree: ".", abort: new EventEmitter(), metadata() {}, ask: async () => {} }
const run = async (args) => {
  const r = await tool.execute(args, ctx)
  return typeof r === "string" ? r : `${r.output}\n[attach:${r.attachments?.length ?? 0}]`
}
const jrun = async (args) => JSON.parse(await run(args))
console.log("focus Taskmgr:", JSON.stringify((await jrun({ action: "focus_app", app: "Taskmgr" })).selected ?? {}))
const z = await run({ action: "zoom", x: 8, y: 40, w: 240, h: 160 })
console.log("ZOOM OUT >>>", z.slice(0, 400))
// dedup drill on the minimized notepad
await jrun({ action: "focus_app", app: "Notepad" })
for (let i = 1; i <= 5; i++) {
  const r = await run({ action: "capture", mode: "vision" })
  const attach = /\[attach:(\d+)\]/.exec(r)?.[1]
  console.log(`cap${i}: attach=${attach} unchanged=${r.includes("unchanged")}`)
}
process.exit(0)
