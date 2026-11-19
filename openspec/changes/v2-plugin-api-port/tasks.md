## 1. V2 registrations (guarded, structural)

- [x] 1.1 Wire the startup probe into `setup` and register the two-state surface via `ctx.tool.transform` (ready → `computer` + `computer_status`; not ready → `computer_status` only) with JSON Schema argument contracts — verify: new unit tests cover both states' editor calls plus the missing-domain no-op
- [x] 1.2 Register `ctx.permission.hook("evaluate")` with the functional ask gate: input actions → `ask` unless an explicit user rule decides; hard-block stays upstream — verify: unit tests for default-ask, explicit-allow passthrough, explicit-deny passthrough, hard-block precedence
- [x] 1.3 Register the bundled skill directory via `ctx.skill.transform` (`draft.source({ type: "directory", path })`) — verify: unit test asserts the source call; missing domain no-ops
- [x] 1.4 Return the dispose cleanup from `setup` (driver session cleanup first, bounded grace, then kill — same ordering as V1 dispose) — verify: unit test drives the returned cleanup against the fake session
- [x] 1.5 V2 tool execute returns the existing structured result in the host's expected content shape — verify: unit test pins the wrapper shape

## 2. Sandbox verification (real V2 binary, isolated)

- [x] 2.1 Download an opencode V2 release binary into a temp dir (installed 1.19.5 untouched) — verify: temp-dir `opencode --version` prints 2.x
- [x] 2.2 Load test with a hand-written sandbox config (V2 `plugins` entry → local dist): plugin id listed, no load errors — verify: recorded output
- [x] 2.3 Registration surface: `computer`/`computer_status` per probe verdict, skill discoverable, evaluate gate observable — verify: recorded host queries; field-name realities fed back into the guarded readers and mocks

## 3. Manifest, docs, release

- [x] 3.1 `engines.opencode` → `^1.18.0 || ^2.0.0`; README V2 install section + manual-fallback V2 line; AGENTS.md architecture note — verify: manifest valid, docs present
- [x] 3.2 Version bump, `bun run bundle`, dist self-containment re-check — verify: `npm pack --dry-run` list shape unchanged
- [x] 3.3 V1 regression: full suite + typecheck + 1.19.5 sandbox load — verify: recorded outputs
- [x] 3.4 `openspec validate --all` green and change status complete — verify: CLI output; archive only on the user's explicit word
