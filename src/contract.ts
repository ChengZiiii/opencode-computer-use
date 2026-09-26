// Runtime contract gate: `cua-driver manifest` self-describes the binary's
// version, MCP invocation and subcommand flags. The gate asks "can this
// binary host our integration", not "does its version equal one we tested" —
// so upstream renames surfaced through the manifest keep working, and drift
// degrades to guide mode with a named diagnostic instead of partial operation.

import { spawnSync } from "node:child_process"
import type { ResolveResult } from "./driver-resolve.ts"

export const CONTRACT_MIN_VERSION = "0.28.0"
export const TESTED_AGAINST = "0.28.2"

// Subcommand flags our integration requires the driver to advertise.
const REQUIRED_SUBCOMMAND_FLAGS: Record<string, string[]> = {
  mcp: ["--direct"],
}

export type ManifestRunner = (
  cmd: string,
  args: string[],
  timeoutMs: number,
) => { stdout: string; stderr: string; code: number } | null

export type McpInvocation = { command: string; args: string[] }

export type ContractResult = {
  ready: boolean
  resolved: string | null
  version: string | null
  reason: string
  mcpInvocation: McpInvocation | null
}

export function runManifest(cmd: string, _args: string[], timeoutMs = 20000): { stdout: string; stderr: string; code: number } | null {
  try {
    const proc = spawnSync(cmd, ["manifest"], { encoding: "utf8", windowsHide: true, timeout: timeoutMs })
    if (proc.error) return null
    return { stdout: proc.stdout ?? "", stderr: proc.stderr ?? "", code: proc.status ?? -1 }
  } catch {
    return null
  }
}

export function parseSemver(raw: string): [number, number, number] | null {
  const m = raw.trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/)
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

function semverAtLeast(actual: [number, number, number], floor: string): boolean {
  const f = parseSemver(floor)
  if (!f) return false
  for (let i = 0; i < 3; i++) {
    if (actual[i] > f[i]) return true
    if (actual[i] < f[i]) return false
  }
  return true
}

export type ManifestShape = {
  binary_version?: unknown
  mcp_invocation?: unknown
  subcommands?: unknown
}

/** Why a parsed manifest fails the contract; "" when it passes. */
export function manifestContractReason(manifest: ManifestShape | null): string {
  if (manifest === null || typeof manifest !== "object") return "driver manifest is missing or invalid"
  const versionRaw = String((manifest.binary_version as string | undefined) ?? "").trim()
  const version = parseSemver(versionRaw)
  if (!version) return "driver manifest does not report a semantic version"
  if (!semverAtLeast(version, CONTRACT_MIN_VERSION)) {
    return `cua-driver ${CONTRACT_MIN_VERSION}+ is required (installed reports ${versionRaw})`
  }
  const inv = manifest.mcp_invocation
  const args = (inv as { args?: unknown } | null)?.args
  const command = (inv as { command?: unknown } | null)?.command
  if (!Array.isArray(args) || !args.every((a) => typeof a === "string")) {
    return "driver manifest does not provide an MCP launch command (mcp_invocation.args)"
  }
  if (typeof command !== "string" || !command.trim()) {
    return "driver manifest does not provide an MCP launch command (mcp_invocation.command)"
  }
  const advertised = new Map<string, Set<string>>()
  if (Array.isArray(manifest.subcommands)) {
    for (const sc of manifest.subcommands as Array<{ name?: unknown; args?: unknown }>) {
      if (typeof sc?.name !== "string") continue
      const flags = new Set<string>()
      if (Array.isArray(sc.args)) {
        for (const fa of sc.args as Array<{ name?: unknown }>) {
          if (typeof fa?.name === "string") flags.add(fa.name)
        }
      }
      advertised.set(sc.name, flags)
    }
  }
  const missing: string[] = []
  for (const [name, flags] of Object.entries(REQUIRED_SUBCOMMAND_FLAGS)) {
    const have = advertised.get(name)
    if (!have) missing.push(`subcommand ${name}`)
    else for (const flag of flags) if (!have.has(flag)) missing.push(`${name} ${flag}`)
  }
  if (missing.length) return "driver manifest is missing: " + missing.join(", ")
  return ""
}

export function checkContract(resolved: ResolveResult, runner: ManifestRunner = runManifest, platform = process.platform): ContractResult {
  if (resolved.cmd === null) {
    return { ready: false, resolved: null, version: null, reason: resolved.reason, mcpInvocation: null }
  }
  // Windows first spawn of the exe eats seconds in Defender scanning.
  const out = runner(resolved.cmd, ["manifest"], platform === "win32" ? 20000 : 8000)
  if (!out) {
    return { ready: false, resolved: resolved.cmd, version: null, reason: "`cua-driver manifest` did not run (spawn failure or timeout). If this persists, reinstall with the user install command.", mcpInvocation: null }
  }
  if (out.code !== 0) {
    const tail = (out.stderr || out.stdout || "manifest command failed").trim().split(/\r?\n/).pop() ?? ""
    return { ready: false, resolved: resolved.cmd, version: null, reason: `manifest exited ${out.code}: ${tail.slice(0, 200)}`, mcpInvocation: null }
  }
  // The manifest prints a telemetry notice line before the JSON; take the last JSON object on stdout.
  const jsonLine = out.stdout
    .split(/\r?\n/)
    .filter((l) => l.trim().startsWith("{"))
    .pop()
  let manifest: ManifestShape | null = null
  try {
    const parsed = JSON.parse(jsonLine ?? "")
    manifest = typeof parsed === "object" && parsed !== null ? (parsed as ManifestShape) : null
  } catch {
    manifest = null
  }
  const reason = manifestContractReason(manifest)
  const version = manifest ? String((manifest.binary_version as string | undefined) ?? "").trim() || null : null
  const inv = manifest?.mcp_invocation as { command?: unknown; args?: unknown } | undefined
  const mcpInvocation =
    !reason && typeof inv?.command === "string" && Array.isArray(inv.args)
      ? { command: inv.command, args: inv.args as string[] }
      : null
  return { ready: reason === "", resolved: resolved.cmd, version, reason, mcpInvocation }
}
