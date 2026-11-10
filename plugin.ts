// opencode-computer-use — desktop computer use for OpenCode V2 via the
// user-installed cua-driver (trycua/cua, MCP stdio).
//
// Lifecycle: detect — degrade — instruct. At server startup the plugin does a
// purely local probe (binary resolution + `cua-driver manifest` contract
// gate, no network, no MCP spawn). Ready -> full `computer` tool surface +
// `computer_status`. Not ready -> only `computer_status`, which prints the
// exact command the USER runs to install/upgrade the driver. The plugin
// never executes installers and never makes lifecycle network requests.

import { Plugin, Skill } from "@opencode/plugin"
import { randomUUID } from "node:crypto"
import { appendFileSync, existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { tmpdir } from "node:os"
import { DRIVER_CMD_ENV, resolveDriverCmd, userInstallHint } from "./src/driver-resolve.ts"
import { checkContract, type ContractResult } from "./src/contract.ts"
import { ComputerSession } from "./src/session.ts"
import { makeComputerTool, makeStatusTool, type PermissionAsk } from "./src/tool.ts"

const probeEnabled = () => process.env.OPENCODE_CU_PROBE === "1"
const probeLine = (text: string) => {
  if (!probeEnabled()) return
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
function probeOnce(driverPath?: string): ContractResult {
  if (probeOverride) return probeOverride
  if (probeCache) return probeCache
  const env = driverPath ? { ...process.env, [DRIVER_CMD_ENV]: driverPath } : undefined
  const resolved = resolveDriverCmd(env ? { env } : {})
  const contract = checkContract(resolved)
  probeLine(`probe resolved=${resolved.cmd ?? "null"} ready=${contract.ready} reason=${contract.reason}`)
  probeCache = contract
  return contract
}

const sessionId = `opencode-computer-use-${randomUUID().slice(0, 12)}`

// ── Skill wiring ────────────────────────────────────────────────────────────
// The operating manual ships as `skills/computer-use/SKILL.md` inside the
// package. OpenCode V2 registers it through `ctx.skill.transform`, so the
// skill tool and the `/computer-use` entry point see it without copying.
function bundledSkillFile(): string | null {
  // dist/index.js → <pkg>/skills; a root plugin.ts dev run → <repo>/skills.
  let here: string
  try {
    here = dirname(fileURLToPath(import.meta.url))
  } catch {
    return null
  }
  for (const root of [here, dirname(here)]) {
    const candidate = join(root, "skills", "computer-use", "SKILL.md")
    if (existsSync(candidate)) return candidate
  }
  return null
}

type ComputerUseOptions = {
  captureAfter?: unknown
  agentCursor?: unknown
  maxElements?: unknown
  /** "ask" (default) adds per-session ask rules; "config" leaves rules alone. */
  permissionMode?: unknown
  /** "session" (default) grants after the first approval; "each" asks every action. */
  approval?: unknown
  /** Explicit cua-driver binary; otherwise PATH then the installer's locations. */
  driverPath?: unknown
}

export default Plugin.define({
  id: "computer-use",
  async setup(ctx) {
    const pluginOptions = (ctx.options as { computerUse?: ComputerUseOptions } | undefined)?.computerUse ?? {}
    const contract = probeOnce(typeof pluginOptions.driverPath === "string" ? pluginOptions.driverPath : undefined)
    const installHint = userInstallHint()
    const captureAfter: "off" | "som" | "ax" =
      pluginOptions.captureAfter === "som" || pluginOptions.captureAfter === "ax" ? pluginOptions.captureAfter : "off"
    const agentCursor = pluginOptions.agentCursor === true
    const maxElements =
      typeof pluginOptions.maxElements === "number" ? Math.max(50, Math.min(1000, Math.floor(pluginOptions.maxElements))) : 200
    const permissionMode = pluginOptions.permissionMode === "config" ? "config" : "ask"
    const approvalMode = pluginOptions.approval === "each" ? "each" : "session"

    // Lazy session: the MCP child spawns on the first computer tool call, not
    // at host startup (Windows Defender first-scan must never tax boot).
    let session: ComputerSession | null = null
    const ensureSession = () => {
      if (!session && contract.ready && contract.mcpInvocation) {
        session = new ComputerSession(contract.mcpInvocation, sessionId, { log: probeLine }, { agentCursor })
      }
      return session
    }

    // Default both permission domains to ask without replacing a user's
    // configured rule. Session rules are evaluated after agent/global rules
    // and before saved approvals, so "always allow" still works.
    const ruled = new Set<string>()
    const ensureRules = async (targetSession: string) => {
      if (permissionMode === "config" || ruled.has(targetSession)) return
      ruled.add(targetSession)
      try {
        const info = await ctx.session.get({ sessionID: targetSession as never })
        const existing = (info.permissions ?? []) as Array<{ action: string; resource: string; effect: "allow" | "deny" | "ask" }>
        const additions = [
          ...(existing.some((rule) => rule.action === "computer") ? [] : [{ action: "computer", resource: "*", effect: "ask" as const }]),
          ...(existing.some((rule) => rule.action === "computer:foreground")
            ? []
            : [{ action: "computer:foreground", resource: "*", effect: "ask" as const }]),
        ]
        if (additions.length) {
          await ctx.session.update({ sessionID: targetSession as never, permissions: [...existing, ...additions] })
        }
      } catch (error) {
        probeLine(`permission rules unavailable: ${(error as Error).message}`)
      }
    }

    // One approval is for the whole session: after it resolves, add session
    // allow rules for both domains. "Allow once" therefore means "until this
    // session ends", not "for this one click".
    const granted = new Set<string>()
    const grantSession = async (targetSession: string) => {
      if (permissionMode === "config" || approvalMode === "each" || granted.has(targetSession)) return
      granted.add(targetSession)
      try {
        await grantSessionApproval(ctx.session, targetSession)
      } catch (error) {
        probeLine(`session approval could not be stored: ${(error as Error).message}`)
      }
    }

    const assertPermission: PermissionAsk = async (input) => {
      await ensureRules(input.sessionID)
      await ctx.permission.assert({
        sessionID: input.sessionID as never,
        agent: input.agent as never,
        action: input.action,
        resources: ["*"],
        save: ["*"],
        metadata: { title: `Allow computer use for this session: ${input.title}`, tool: "computer", scope: "session" },
        source: { type: "tool", messageID: input.messageID, id: input.callID },
      })
      await grantSession(input.sessionID)
    }

    const status = makeStatusTool({
      ready: contract.ready,
      reason: contract.reason,
      resolved: contract.resolved,
      version: contract.version,
      installHint,
      sessionId,
      // Live health when the driver is up (bounded; degrades to the manifest
      // contract state on any failure).
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

    // Guide mode registers only the diagnostic surface.
    const tools = contract.ready
      ? [
          makeComputerTool({
            session: ensureSession()!,
            driverVersion: () => contract.version,
            probeLine,
            captureAfter,
            maxElements,
            assertPermission,
          }),
          status,
        ]
      : [status]

    await ctx.tool.transform((editor) => {
      for (const definition of tools) editor.add(definition as never)
    })

    const skillFile = bundledSkillFile()
    if (skillFile) {
      try {
        const content = readFileSync(skillFile, "utf8")
        await ctx.skill.transform((editor) =>
          editor.add({
            id: Skill.ID.make("computer-use"),
            name: Skill.Name.make("Computer Use"),
            description:
              "Desktop GUI automation with the `computer` tool (cua-driver). Load before the first computer call; use only for real native-app GUI work, never for files, shell, or web pages.",
            autoinvoke: true,
            path: Skill.Info.fields.path.make(skillFile),
            content,
          }),
        )
      } catch (error) {
        probeLine(`skill registration unavailable: ${(error as Error).message}`)
      }
    }

    return async () => {
      // Ordered: driver end_session (its own cleanup hooks) -> kill. Baked
      // into ComputerSession.dispose with a 10s bound.
      session?.dispose()
      session = null
    }
  },
})

type PermissionRule = { action: string; resource: string; effect: "allow" | "deny" | "ask" }

type SessionRulesApi = {
  get(input: { sessionID: never }): Promise<{ permissions?: readonly PermissionRule[] }>
  update(input: { sessionID: never; permissions: PermissionRule[] }): Promise<void>
}

/** Add session-scoped allow rules for both computer-use domains. */
export async function grantSessionApproval(api: SessionRulesApi, targetSession: string): Promise<void> {
  const info = await api.get({ sessionID: targetSession as never })
  const existing = (info.permissions ?? []) as readonly PermissionRule[]
  const additions = ["computer", "computer:foreground"]
    .filter((action) => !existing.some((rule) => rule.action === action && rule.resource === "*" && rule.effect === "allow"))
    .map((action) => ({ action, resource: "*", effect: "allow" as const }))
  if (additions.length) {
    await api.update({ sessionID: targetSession as never, permissions: [...existing, ...additions] })
  }
}

function extractTextSafe(res: { content: Array<{ type: string; text?: string }> }): string {
  return res.content
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("\n")
    .slice(0, 300)
}
