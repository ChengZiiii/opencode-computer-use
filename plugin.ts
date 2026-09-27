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
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
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

// ── Skill + slash-command wiring ────────────────────────────────────────────
// The plugin API has no skill hook, so the operating manual ships as
// `skills/computer-use/SKILL.md` inside the package and is surfaced two ways:
// 1. The config hook appends the package's `skills/` dir to `skills.paths`
//    (same mechanism as the permission default injection). Best-effort: if
//    the host resolves skills before plugin config hooks, the README's
//    one-line manual path is the fallback.
// 2. The config hook registers a `/computer` command (a typed config key)
//    that loads the skill then carries out the user's arguments — the
//    Hermes-style explicit activation entry. Both injections are
//    null-checked: a user's own definition always wins.
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

const COMPUTER_COMMAND_TEMPLATE = [
  "[The user explicitly activated desktop computer use via /computer.]",
  "First load the `computer-use` skill with the skill tool (it is the operating manual), then carry out the following on the desktop: $ARGUMENTS",
  "If $ARGUMENTS is empty, ask the user what they want done. If the `computer` tool is not available, run `computer_status` and surface its remediation verbatim.",
].join("\n")

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
    // Also wires the skill + /computer activation entry (see above); every
    // injection is null-checked so user definitions always win.
    config: async (cfg) => {
      const c = cfg as { permission?: Record<string, unknown>; command?: Record<string, unknown>; skills?: { paths?: unknown } }
      const section = c.permission ?? (c.permission = {})
      if (section.computer == null) section.computer = "ask"
      if (section["computer:foreground"] == null) section["computer:foreground"] = "ask"
      // /computer slash activation (typed config key — reliable surface).
      const commands = c.command ?? (c.command = {})
      if (commands.computer == null) {
        commands.computer = {
          template: COMPUTER_COMMAND_TEMPLATE,
          description: "Explicit desktop computer use: load the computer-use skill, then execute the given desktop task",
        }
      }
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
