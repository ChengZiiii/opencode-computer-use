# fix-session-ended-self-heal

## Why

On a live V2 host (opencode 2.4.0) the plugin's driver child can stay alive
while the driver-side lifecycle session has already ended. From that moment
every call is refused by the driver with `refusal.code = "session_ended"`
("this session has ended; call start_session explicitly to reuse its
label"), and the plugin passes the refusal through unchanged — forever.
`ComputerSession` re-attaches only when the child PROCESS crashes; a live
child with an ended session has no recovery path at all.

Observed 2026-11-23 on the real host during the headed-TUI gate: consecutive
`computer` calls failed with that refusal; the only way out was ending the
host's driver child by hand so the existing crash path ran. The driver names
its own remedy in the refusal; the plugin never takes it.

## What Changes

- `src/session.ts`: a driver refusal carrying code `session_ended` now
  self-heals inside the same call — invalidate the sticky target and
  snapshot bookkeeping, `start_session` again, set the restart disclosure,
  retry the SAME call exactly once. A second `session_ended` fails the call
  with a structured error naming the code (no loop, no silent strand).
- Any OTHER refusal code (`authorization_revoked`, `authorization_suspended`,
  …) is passed through untouched: no re-attach, no retry. A revocation is
  the user's decision and is never healed past.
- `src/tool.ts`: the restart disclosure names what happened — "driver
  process restarted" vs "driver session re-attached".
- `tests/wiring.test.mjs`: fake-transport cases for heal-once, refuse-again,
  other-code passthrough, text-only refusal, and the tool-layer disclosure.
- No approval change: the retry re-issues the exact call the user already
  approved (the gate runs upstream of the session layer).

## Capabilities

### New Capabilities

<!-- none: the self-heal lands as scenarios on an existing requirement -->

### Modified Capabilities

- `driver-lifecycle`: MODIFIED requirement "Host and backend stability
  (process hygiene)" — a driver-side session end is a second recovery case
  next to crash, with the same invalidation and disclosure guarantees and a
  strict one-retry bound.

## Impact

- `src/session.ts`, `src/tool.ts`, `tests/wiring.test.mjs`, `dist/index.js`
  (rebundled), README troubleshooting note.
- Driver contract unchanged (tested-against 0.28.2, floor 0.28.0): the
  refusal code and its remedy text are read from the installed driver
  (`crates/cua-driver-core/src/tool.rs`), not invented by the plugin.
