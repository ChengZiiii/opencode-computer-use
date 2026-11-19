# v2-plugin-api-port

## Why

OpenCode V2 is stable and intentionally does not run V1 plugin
implementations. This plugin's V1 entry carries the full feature set (probe
two-state tool registration, approval gate, skill injection, dispose) while
its `setup` entry is a defensive forward-compat skeleton; on a V2 host the
user loses the `computer` tool entirely. The official V2 plugin API now
provides every domain the port needs (`ctx.tool.transform`,
`ctx.permission`, `ctx.skill`), and the sibling ports (vision-bridge pilot,
forge follow-up) share one conventions playbook
(`../opencode-v2-migration-conventions.md`) — this change applies it to
computer-use.

## What Changes

- Upgrade the `setup` entry to full V2 feature parity, keeping the `server`
  entry untouched (one package, two hosts, disjoint registration targets):
  - run the same startup probe in `setup` and register the same two-state
    surface through `ctx.tool.transform`: ready → `computer` +
    `computer_status`; not ready → `computer_status` only (JSON Schema
    argument schemas; same 17-action discriminator contract);
  - carry the approval model via `ctx.permission.hook("evaluate")`: input
    actions evaluate to `ask` by default (the V1 config-side
    `permission.computer = "ask"` default injection has no V2 config
    equivalent, so the gate becomes functional), with explicit user
    `allow`/`deny` rules still winning and the hard-block layer staying
    upstream of any approval;
  - register the bundled skill directory via `ctx.skill.transform` (same
    discovery outcome as the V1 `skills.paths` append, no copy step);
  - return the dispose cleanup from `setup` (driver subprocess teardown
    after the driver's own session cleanup, same ordering as V1 dispose).
- Keep structural typing for the V2 surface (no runtime import of
  `@opencode/plugin`); every domain access stays `?.` + `typeof` guarded
  with no-op degradation on shape drift.
- Extend the manifest `engines.opencode` range to `^1.18.0 || ^2.0.0`.
- Verify on a sandboxed real V2 host binary (temp dir; installed V1 host
  untouched) per the shared sandbox protocol; V1 regression unchanged.

## Capabilities

### New Capabilities

<!-- none: V2 parity lands as new requirements in the existing capabilities
     and one MODIFIED requirement in driver-lifecycle -->

### Modified Capabilities

- `computer-use`: new requirement VH-1 (V2 registration + approval parity:
  two-state tool surface via `ctx.tool.transform`, input-action ask gate
  via `ctx.permission.hook("evaluate")`, skill via `ctx.skill`, dispose
  cleanup from `setup`).
- `driver-lifecycle`: new requirement VH-2 (the two-state readiness
  contract holds identically under the V2 loader — same probe, same
  surface split, same fail-closed contract-floor behavior).
- `skill-activation-layer`: new requirement VH-3 (the bundled skill is
  discoverable on a V2 host via `ctx.skill` directory source with the same
  no-copy, no-command-registration guarantees).

## Impact

- `plugin.ts`: the `setup` entry grows the probe + registrations; shared
  internals (`src/*`) are host-agnostic already and untouched except for
  schema-shaped exports for the tool definitions.
- `package.json`: `engines.opencode` range only.
- `README.md` / `AGENTS.md`: V2 install + architecture notes.
- `tests/*.test.mjs`: new V2-setup unit tests (mock `ctx` domains, wired +
  drifted shapes); existing tests unchanged and must stay green.
- `dist/index.js`: rebuilt, still self-contained (no new imports).
- No host-side breaking change: V1 hosts keep loading `server` exactly as
  today.
