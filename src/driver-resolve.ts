// Driver binary resolution: override env (authoritative) -> PATH ->
// platform canonical installer locations. Never silently substitutes a
// different binary for a broken override — readiness fails naming it.

import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { homedir, tmpdir } from "node:os"

export const DRIVER_CMD_ENV = "OPENCODE_CUA_DRIVER_CMD"

export type ResolveInput = {
  env?: Record<string, string | undefined>
  platform?: NodeJS.Platform
  which?: (cmd: string) => string | undefined
  exists?: (path: string) => boolean
}

export type ResolveResult =
  | { cmd: string; source: "override" | "path" | "canonical" }
  | { cmd: null; reason: string; override?: string }

function whichViaShell(cmd: string): string | undefined {
  // `where` on Windows, `which` elsewhere; a miss prints to stdout nothing and exits 1.
  const probe = spawnSync(process.platform === "win32" ? "where" : "which", [cmd], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 5000,
  })
  const out = (probe.stdout ?? "").trim()
  return probe.status === 0 && out ? out.split(/\r?\n/)[0] : undefined
}

/** Candidate absolute paths the cua installers own, per platform. */
export function canonicalCandidates(platform: NodeJS.Platform, home = homedir(), localAppData = process.env.LOCALAPPDATA): string[] {
  if (platform === "win32") {
    const lad = localAppData || join(home, "AppData", "Local")
    return [
      join(lad, "Programs", "Cua", "cua-driver", "bin", "cua-driver.exe"),
      join(home, ".local", "bin", "cua-driver.exe"),
      join(home, ".local", "bin", "cua-driver"),
    ]
  }
  if (platform === "darwin") {
    return [
      join(home, ".local", "bin", "cua-driver"),
      join(home, ".cargo", "bin", "cua-driver"),
      "/opt/homebrew/bin/cua-driver",
      "/usr/local/bin/cua-driver",
    ]
  }
  return [join(home, ".local", "bin", "cua-driver"), join(home, ".cargo", "bin", "cua-driver"), "/usr/local/bin/cua-driver"]
}

export function resolveDriverCmd(input: ResolveInput = {}): ResolveResult {
  const env = input.env ?? process.env
  const platform = input.platform ?? process.platform
  const which = input.which ?? whichViaShell
  const exists = input.exists ?? existsSync

  const override = (env[DRIVER_CMD_ENV] ?? "").trim()
  if (override) {
    // An override is authoritative even when broken: report it missing rather
    // than silently picking another binary (a wrong driver is worse than none).
    if (exists(override) || which(override)) return { cmd: override, source: "override" }
    return { cmd: null, reason: `${DRIVER_CMD_ENV} is set to "${override}" but no executable exists there; fix or unset it.`, override }
  }

  const onPath = which("cua-driver")
  if (onPath) return { cmd: onPath, source: "path" }

  for (const candidate of canonicalCandidates(platform)) {
    if (exists(candidate)) return { cmd: candidate, source: "canonical" }
  }
  return { cmd: null, reason: "cua-driver is not installed (not on PATH, no canonical install location)." }
}

/** The exact user-run install/upgrade commands, per platform, for guide output. */
export function userInstallHint(platform: NodeJS.Platform = process.platform): string {
  const install =
    platform === "win32"
      ? "irm https://cua.ai/driver/install.ps1 | iex"
      : '/bin/bash -c "$(curl -fsSL https://cua.ai/driver/install.sh)"'
  return [
    "cua-driver is a user-installed external binary; this plugin never installs or upgrades it.",
    `Install (also the upgrade command, it always fetches the latest release): ${install}`,
    "After installing, restart opencode so the plugin re-probes. Verify any time with: cua-driver --version",
  ].join("\n")
}
