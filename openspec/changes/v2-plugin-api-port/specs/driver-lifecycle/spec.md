## ADDED Requirements

### Requirement: VH-2: Two-state readiness parity under the V2 loader

**Requirement:** Under the V2 loader, the readiness contract of this
capability `SHALL` hold identically: the startup probe stays local-only,
network-free, hard-timeout-bounded, and process-cached; the tool surface
split (ready → `computer` + `computer_status`, not ready →
`computer_status` only) `SHALL` be reproduced through the V2 tool domain;
a runtime contract failure (version floor, required tool surface) `SHALL`
degrade to guide mode with a diagnostic report exactly as on V1; and the
never-install/never-upgrade/never-network guarantees `SHALL` apply
unchanged to the V2 path, including the minimal-environment subprocess
whitelist.

#### Scenario: Contract-floor failure degrades to guide mode on V2

- **WHEN** the driver manifest fails the contract floor on a V2 host
- **THEN** only `computer_status` registers through the V2 tool domain and
  its report matches the V1 guide-mode diagnostic (failing check + user-run
  command), with no partial operation

#### Scenario: Probe guarantees unchanged on V2

- **WHEN** `setup` runs the startup probe on a V2 host
- **THEN** no network request is made, the result is cached for the
  process, and the probe completes within the same hard timeout as V1
