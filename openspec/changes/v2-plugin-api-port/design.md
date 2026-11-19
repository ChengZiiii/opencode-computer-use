## Context

The plugin ships the dual-host export shape (`{ id, server, setup }`):
V1 hosts call `server` (probe two-state registration, config-side
`permission.computer = "ask"` injection, `ctx.ask` approval two-piece,
skills.paths append, dispose); V2 hosts call `setup` — a defensive
forward-compat skeleton written when V2 lacked the needed domains. V2 is
now stable with every required domain documented. The V1 entry is NOT
modified by this change; only `setup` grows. The `src/*` modules are
already host-agnostic (injected transports/runners), so the port is
wiring. Shared conventions: `../opencode-v2-migration-conventions.md`.

## Goals / Non-Goals

**Goals:**
- One code path per concern: the probe, the tool definitions, the safety
  layer, and the session lifecycle stay shared; V2 adds registrations,
  not a second implementation.
- Runtime-verified V2 parity on a sandboxed real V2 host binary.

**Non-Goals:**
- No V2 TUI plugin.
- No `@opencode/plugin` runtime dependency (structural typing stays).
- No driver-lifecycle behavior change of any kind (the probe, contract
  floor, subprocess management are host-agnostic and untouched).
- No new features beyond parity.

## Decisions

1. **Approval becomes functional on V2.** V1 injects
   `permission.computer = "ask"` into the config; V2 exposes no global
   config mutation, so the default gate moves into
   `ctx.permission.hook("evaluate")`: input-action requests evaluate to
   `ask` unless an explicit user rule decides them first. Alternative
   (skip the default on V2, require users to configure ask) was rejected:
   it silently weakens the safety posture. The hard-block layer
   (`src/safety.ts`) stays upstream of approval in both hosts — an
   "always" grant can never wave destructive input through.
2. **Two-state registration replays through `ctx.tool.transform`.** The
   probe runs in `setup`; its verdict selects which `editor.add()`
   definitions register. Transforms are replayable and the probe is
   process-cached, so the registration is deterministic per host process.
3. **JSON Schema conversion.** The `computer` tool's action-discriminator
   arguments convert from the `tool.schema.*` chain to a JSON Schema
   literal; the 17-action enum and per-action fields stay identical. The
   V2 execute return wraps the existing result shaping (already structured)
   in the host's expected content shape (verified in sandbox).
4. **Skill via directory source.** `ctx.skill.transform` +
   `draft.source({ type: "directory", path: <pkg>/skills })` mirrors the
   V1 `skills.paths` append one-for-one; the manual README fallback gains
   a V2 line.
5. **Dispose via setup cleanup.** The teardown ordering (driver session
   cleanup first, bounded grace, then kill) moves into the function
   returned by `setup`; the V1 dispose path keeps its own call site.
6. **Sandbox protocol.** Per the conventions doc: real V2 binary in a
   temp dir, hand-written sandbox config, staged verification, then the
   standard V1 regression battery.

## Risks / Trade-offs

- [V2 permission evaluate event shape unknown in detail] → guarded
  readers; sandbox stage verifies field names before wiring; unit mocks
  updated to observed shapes.
- [Functional ask-gate could differ from config-injected ask in edge
  precedence] → unit tests pin the precedence chain (explicit rule →
  functional ask; hard-block upstream of both); sandbox smoke exercises
  one allow and one default-ask path.
- [Probe-in-setup could delay host startup] → the probe is already
  local-only, hard-timeout-bounded, and process-cached; the V1 entry has
  run it at startup since day one.

## Migration Plan

1. Unit tests for the V2 registrations with mock `ctx` domains (wired +
   drifted shapes) against the current skeleton.
2. Wire the real registrations; sandbox stage on a real V2 binary.
3. `engines.opencode` → `^1.18.0 || ^2.0.0`; README/AGENTS.md notes;
   version bump; bundle; publish per the release recipe; V1 regression
   after publish.

Rollback: the V2 entry is additive — reverting the `setup` growth restores
the skeleton; V1 hosts never load it.

## Open Questions

- Exact V2 permission evaluate event field names and the structured tool
  result shape — resolved empirically in the sandbox stage (specs pin
  behavior, not field names).

### Resolution (sandbox 2026-11-19, opencode v2.3.2 — tasks 2.1–2.3)

- Evaluate event: `PermissionEvaluation` — top-level mutable `effect:
  "allow"|"ask"|"deny"` (NOT `{decision:{status}}`); matched key is `action`
  (fallback `source.id`). Explicit deny never reaches hooks; arriving
  allow/deny passes through; else effect="ask".
- Tool result: `{ content: string | Array<{type:"text",text} |
  {type:"file",uri,mime,name?}> }` — no top-level `attachments`; V1
  data-URL attachments map to `file` entries.
- Host blocks on denial: the custom-tool gate is `ctx.permission.assert`
  inside execute (deny → Tool.Error; ask → prompt). Wired into
  `v2ExecuteAdapter` (computer tool only; guarded).
- Skill: `ctx.skill.transform` + `editor.add(full Skill.Info)` — the
  `draft.source({type:"directory"})` form assumed in task 1.3 does not
  exist; rewired with a frontmatter parser.
- `plugins` config: ARRAY of package specs; local entries are directories.
  Full evidence: `Temp/opencode/v2-sandbox/verify-checklist.md`
  (computer-use section).
