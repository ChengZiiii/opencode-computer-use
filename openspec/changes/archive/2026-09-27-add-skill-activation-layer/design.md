# Design: add-skill-activation-layer

## Context

opencode's plugin API (verified against `@opencode-ai/plugin` 1.18.32) has
no skill hook and no command hook — only `config(input)` mutation, the
`tool` getter, and lifecycle hooks. Skills are discovered from fixed
directories plus `skills.paths` config roots; commands resolve from the
typed `command` config key. The plugin already uses the config hook to
inject `permission.computer`/`computer:foreground` defaults (null-checked),
proven live. Benchmark behavior (Hermes `/computer-use` skill expansion,
Zcode plugin-skill progressive disclosure) was reviewed in-session before
this design.

## Goals / Non-Goals

Goals: manual shipped and discoverable with zero user steps on hosts that
read post-hook config; explicit `/computer` activation entry; user
definitions always win; no change to approvals/registration.

Non-Goals: user master switch (decided out), tool deferral (host concern),
schema slimming, auto-detection of whether the host picked up the skills
path.

## Decisions

- **Config hook as the only injection surface.** `command` is a typed,
  documented config key — same reliability class as the existing permission
  injection. `skills.paths` is untyped in the 1.18 SDK types but a working
  host mechanism (the user's own config uses it). Alternative: ship only
  README copy instructions — rejected: zero-config beats documented copy
  when it works, and the README fallback covers when it doesn't.
- **Best-effort skills.path + documented fallback, not detection.** We
  cannot observe whether the host's skill scanner runs before or after
  plugin config hooks, so we append and document. Live probe (`file:` plugin
  spec + `opencode run`) confirmed the append IS picked up on opencode
  1.18.32; the fallback stays for host drift and stripped layouts.
- **Bundled-dir resolution probes two roots.** `dirname(module)/skills` and
  `dirname(dirname(module))/skills`, first existing wins — covers
  `<pkg>/dist/index.js` (npm layout, real package nested under the cache
  workspace's `node_modules/`) and a root `plugin.ts` dev run. Guarded by
  `existsSync(SKILL.md)` so a stripped artifact injects nothing.
- **Command template semantics.** Explicit-activation marker line + "load
  the skill, then carry out $ARGUMENTS" + empty-args and missing-tool
  fallbacks. Alternative: `subtask: true` (isolated context) — rejected:
  desktop ops are interactive (approvals, follow-ups) and belong in the main
  session.
- **Scope constraint lives in the skill description**, not in the tool
  schema: the description is what the host lists at rest in the skill tool;
  the schema already carries vocabulary. Mirrors Hermes ("no prompt block on
  purpose") — no system-prompt injection anywhere.
- **Idempotency via normalized path compare** (backslash→slash, trailing
  slash stripped) before append; `command.computer` null-check mirrors the
  permission null-checks.

## Risks / Trade-offs

- [Host changes skills-scan order or drops `skills.paths`] → README manual
  fallback remains valid; spec scenario documents the fallback requirement.
- [`command` key shape drift across opencode versions] → injection is
  null-checked and additive; worst case the command is ignored, no other
  behavior touched.
- [Name collision `/computer` with a future built-in] → user-defined
  commands override built-ins by host rule; our null-check means a user
  definition wins over ours too.
- [Skill description length drift] → frontmatter description must stay
  within the host's 1–1024 char rule; kept ~600.

## Migration Plan

Ship as a minor version bump (0.3.0). No data, no config migration;
rollback = revert the package (injections vanish with the plugin —
RAM-only config merge, per the existing file-ledger contract).

## Open Questions

- Whether to later add a `computer_status` hint line advertising the skill
  (only honest if skill presence is verifiable) — deferrable.
