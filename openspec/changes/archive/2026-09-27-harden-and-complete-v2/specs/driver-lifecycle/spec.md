## MODIFIED Requirements

### Requirement: Host and backend stability (process hygiene)

The plugin SHALL maintain at most one driver subprocess per host process, spawned directly (no grandchild chains) and reused across calls; every call to the backend SHALL carry a hard timeout whose expiry fails that tool call without hanging the session; plugin disposal SHALL terminate the subprocess AFTER requesting the driver's own session cleanup (cursor, recording, and config hooks), best-effort with a bounded grace before kill; a mid-session backend crash SHALL fail the in-flight call with a structured error, invalidate the sticky target and snapshot bookkeeping, re-spawn lazily on the next call, and the first post-restart result SHALL state that a restart occurred; the driver's telemetry SHALL be disabled by default via environment unless the user opts in; the driver's agent-cursor visualization SHALL be off by default, configurable via plugin option. The spawned subprocess environment SHALL be a minimal whitelist (system essentials required to locate and run the driver, plus the telemetry flag) — credentials and provider keys present in the host environment SHALL NOT be passed to the driver subprocess.

#### Scenario: Slow backend cannot hang the session

- **WHEN** a backend call exceeds its hard timeout
- **THEN** the tool call returns a timeout error, the host session remains responsive, and the next call may proceed (with the sticky target invalidated if the backend was restarted)

#### Scenario: Disposal runs driver cleanup then leaves nothing behind

- **WHEN** the host shuts down and disposes the plugin
- **THEN** the driver's session cleanup is requested first (bounded grace), the subprocess is terminated, and no plugin-owned process outlives the host

#### Scenario: Host credentials never reach the driver

- **WHEN** the driver subprocess is spawned from a host process whose environment contains provider API keys
- **THEN** the subprocess environment contains only whitelisted essentials and the telemetry flag, and none of the host's credentials

#### Scenario: Disposal leaves nothing behind

- **WHEN** the host shuts down and disposes the plugin
- **THEN** the driver subprocess is terminated and no plugin-owned process outlives the host

#### Scenario: Crash recovery requires a fresh capture

- **WHEN** the backend crashes between actions
- **THEN** the next call reports the restart, prior element references and sticky target are invalid, and the tool directs the caller to capture again before input

### Requirement: Guide surface instead of broken tools

When the backend is not ready, the plugin SHALL register exactly one diagnostic tool (`computer_status`) that returns the readiness verdict, the failing check, and the precise remediation command the **user** must run in their own terminal (install, upgrade, or permission steps per platform). When the backend is ready, the full `computer` tool surface SHALL be registered and `computer_status` SHALL remain available for on-demand health and version reporting, folding in the driver's own single-call health report and platform permission status when the driver provides them (including, on macOS, guidance for grants that appear enabled but are stale after a driver update).

#### Scenario: Status names the user action

- **WHEN** the driver is installed but below the contract floor
- **THEN** `computer_status` reports the installed version, the required floor, and the user-run upgrade command, and does not attempt any repair itself

#### Scenario: Ready-mode status includes driver health

- **WHEN** `computer_status` runs while the driver is ready and the driver supports a health report
- **THEN** the status output includes the driver's own end-to-end health summary (version, platform, capture/accessibility capability) as reported by the driver, without plugin-side reimplementation

#### Scenario: Update information is on-demand only

- **WHEN** `computer_status` is asked for version information and the driver supports a self-update check
- **THEN** the reported update availability comes from the driver's own check only when that check reads its local cache without network activity; otherwise `computer_status` reports the manifest-declared version alone, and there is no plugin-side polling loop or plugin-initiated refresh in either case
