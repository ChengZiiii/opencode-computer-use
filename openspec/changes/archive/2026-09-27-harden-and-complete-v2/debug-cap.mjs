import { execFileSync } from "node:child_process"
import { EventEmitter } from "node:events"
import { resolveDriverCmd } from "../../../src/driver-resolve.ts"
import { checkContract } from "../../../src/contract.ts"
import { ComputerSession } from "../../../src/session.ts"
import { makeComputerTool } from "../../../src/tool.ts"

const resolved = resolveDriverCmd()
const contract = checkContract(resolved)
const session = new ComputerSession(contract.mcpInvocation, `dbg-${Date.now()}`, { log: (l) => console.error(`[s] ${l}`) })
const tool = makeComputerTool({ session, driverVersion: () => contract.version })
const ctx = { sessionID: "d", messageID: "m", agent: "a", directory: ".", worktree: ".", abort: new EventEmitter(), metadata() {}, ask: async () => {} }
const run = async (args) => {
  const r = await tool.execute(args, ctx)
  return typeof r === "string" ? r : `${r.output}\n[attach:${r.attachments?.length ?? 0}]`
}
// notepad may or may not be running — list what apps the driver sees
console.log("=== list_apps:", (await run({ action: "list_apps" })).slice(0, 600))
console.log("=== list_windows:", (await run({ action: "list_windows" })).slice(0, 600))
console.log("=== capture app=Notepad:", (await run({ action: "capture", mode: "som", app: "Notepad" })).slice(0, 900))
console.log("sticky:", JSON.stringify(session.sticky))
console.log("=== verify:", (await run({ action: "verify", predicates: [{ exists: true }] })).slice(0, 400))
process.exit(0)
