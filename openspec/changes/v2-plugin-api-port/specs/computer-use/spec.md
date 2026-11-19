## ADDED Requirements

### Requirement: VH-1: V2 host parity for registration and approval

**Requirement:** On an opencode V2 host, the `setup` entry `SHALL` provide
the same feature set the V1 `server` entry provides, with the `server`
entry untouched: the startup probe `SHALL` run in `setup` (same local-only,
process-cached probe) and the resulting tool surface `SHALL` register via
`ctx.tool.transform` — ready → `computer` and `computer_status`, not ready
→ `computer_status` only — with JSON Schema argument schemas carrying the
same action-discriminator contract; the approval model `SHALL` be carried
by `ctx.permission.hook("evaluate")`, which `SHALL` evaluate input-action
requests to `ask` unless an explicit user rule already decides them (the
V1 config-side default injection has no V2 equivalent, so the default gate
is functional), with the hard-block layer staying upstream of any approval
and `ctx.ask`-style interactive approval remaining unavailable — the V2
evaluate outcome is the approval surface; the bundled skill directory
`SHALL` register via `ctx.skill.transform` as a directory source; and the
dispose behavior `SHALL` be returned as the `setup` cleanup function (same
teardown ordering as the V1 dispose). Every V2 registration `SHALL` keep
the structural guards (`?.` + `typeof`) so a host with a missing or
reshaped domain no-ops that registration instead of throwing.

#### Scenario: Ready state registers the full surface on V2

- **WHEN** the probe reports ready on a V2 host with `ctx.tool.transform`
- **THEN** `computer` and `computer_status` both appear in the tool
  registry with the same action contract as V1

#### Scenario: Not-ready state registers the diagnostic only on V2

- **WHEN** the probe fails on a V2 host
- **THEN** only `computer_status` registers and it returns the same
  readiness verdict and user-run remediation command as V1

#### Scenario: Input actions evaluate to ask on V2

- **WHEN** an input action on `computer` is evaluated on a V2 host with no
  explicit user permission rule
- **THEN** the evaluate outcome is `ask` (the functional default gate),
  while an explicit user `allow`/`deny` rule for the same request wins and
  hard-blocked input never reaches approval

#### Scenario: Skill and dispose parity on V2

- **WHEN** `setup` completes on a V2 host and the host later unloads the
  plugin
- **THEN** the skill is discoverable via the registered directory source
  and the returned cleanup terminated the driver subprocess after its
  session cleanup, matching V1 dispose ordering

#### Scenario: Shape drift degrades to a no-op

- **WHEN** a V2 host lacks `ctx.tool.transform` or `ctx.permission` (or
  their method shapes have drifted)
- **THEN** the corresponding registrations are skipped without throwing
  and the rest of `setup` still runs
