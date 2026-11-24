## MODIFIED Requirements

### Requirement: Host and backend stability (process hygiene)

The plugin SHALL maintain at most one driver subprocess per host process, spawned directly (no grandchild chains) and reused across calls; every call to the backend SHALL carry a hard timeout whose expiry fails that tool call without hanging the session; plugin disposal SHALL terminate the subprocess AFTER requesting the driver's own session cleanup (cursor, recording, and config hooks), best-effort with a bounded grace before kill; a mid-session backend crash SHALL fail the in-flight call with a structured error, invalidate the sticky target and snapshot bookkeeping, re-spawn lazily on the next call, and the first post-restart result SHALL state that a restart occurred; a driver refusal whose code is `session_ended` (the driver-side lifecycle session ended while the subprocess lives) SHALL self-heal within the same call — invalidate the sticky target and snapshot bookkeeping, declare the session again, and retry the same call exactly once — and the healed result SHALL state that the driver session was re-attached; a second such refusal on that retry SHALL fail the call with an error naming the code, with no further retry; any other refusal code (including authorization revocation or suspension) SHALL pass through with no re-attach and no retry; the driver's telemetry SHALL be disabled by default via environment unless the user opts in; the driver's agent-cursor visualization SHALL be off by default, configurable via plugin option. The spawned subprocess environment SHALL be a minimal whitelist (system essentials required to locate and run the driver, plus the telemetry flag) — credentials and provider keys present in the host environment SHALL NOT be passed to the driver subprocess.

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

#### Scenario: Driver-side session ended self-heals once

- **WHEN** the driver subprocess is alive but refuses a call with code `session_ended`
- **THEN** the plugin invalidates the sticky target and snapshot bookkeeping, declares the session again, retries the same call with the same arguments exactly once, and the returned result states that the driver session was re-attached

#### Scenario: A repeated session-ended refusal fails the call

- **WHEN** the retried call is refused with code `session_ended` again
- **THEN** the call fails with an error naming the code and the driver's message, no third attempt is made, and the host session remains responsive

#### Scenario: Revocation is never healed past

- **WHEN** the driver refuses a call with any code other than `session_ended` (for example `authorization_revoked`)
- **THEN** the plugin makes no session re-attach and no retry, and the refusal reaches the caller unchanged
