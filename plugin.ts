// opencode-computer-use — desktop computer use for opencode via the
// user-installed cua-driver (trycua/cua, MCP stdio).
//
// Lifecycle: detect — degrade — instruct. At host startup the plugin does a
// purely local probe (binary resolution + `cua-driver manifest` contract
// gate, no network, no MCP spawn). Ready -> full `computer` tool surface +
// `computer_status`. Not ready -> only `computer_status`, which prints the
// exact command the USER runs to install/upgrade the driver. The plugin
// never executes installers and never makes lifecycle network requests.

import type { Plugin, ToolDefinition } from "@opencode-ai/plugin"
import { randomUUID } from "node:crypto"
import { appendFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { resolveDriverCmd, userInstallHint } from "./src/driver-resolve.ts"
import { checkContract, type ContractResult } from "./src/contract.ts"
import { ComputerSession } from "./src/session.ts"
import { makeComputerTool, makeStatusTool } from "./src/tool.ts"

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

export const server: Plugin = async (_input, _options) => {
  const contract = probeOnce()
  const installHint = userInstallHint()

  // Lazy session: the MCP child spawns on the first computer tool call, not
  // at host startup (Windows Defender first-scan must never tax opencode boot).
  let session: ComputerSession | null = null
  const ensureSession = () => {
    if (!session && contract.ready && contract.mcpInvocation) {
      session = new ComputerSession(contract.mcpInvocation, sessionId, { log: probeLine })
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
      })
      if (!contract.ready) {
        // Guide mode: the status surface is the ONLY registered tool.
        return { computer_status: status }
      }
      const s = ensureSession()!
      return {
        computer: makeComputerTool({ session: s, driverVersion: () => contract.version, probeLine }),
        computer_status: status,
      }
    },

    // Approval two-piece (forge-proven): default ask for the computer tool,
    // an explicit user decision always wins.
    config: async (cfg) => {
      const c = cfg as { permission?: Record<string, unknown> }
      const section = c.permission ?? (c.permission = {})
      if (section.computer == null) section.computer = "ask"
    },

    dispose: async () => {
      session?.dispose()
      session = null
    },
  }
}

// v2 setup (forward compatibility only — v1 installs load `server`).
// Structurally typed + guarded so host-shape drift degrades to a no-op.
type V2PluginContext = { agent?: { transform?: (cb: (draft: unknown) => void | Promise<void>) => Promise<unknown> } }
export async function setup(ctx: V2PluginContext): Promise<void> {
  if (typeof ctx.agent?.transform === "function") {
    await ctx.agent.transform(async () => {
      /* no v2 domain at 1.18: tools and permission gates stay v1-only */
    })
  }
}

export default { id: "opencode-computer-use", server, setup }
