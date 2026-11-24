## Context

`ComputerSession` owns one driver child per host process. On first use it
handshakes and declares the run's identity with `start_session { session }`.
Recovery today has exactly one trigger: `client.crashed` (the child exited).
The driver can also end the LIFECYCLE session while the child stays alive;
it then refuses tools with `refusal.code = "session_ended"` and the message
"this session has ended; call start_session explicitly to reuse its label"
(installed driver 0.28.2 — literal and remedy read from the binary,
`crates/cua-driver-core/src/tool.rs`, serialized path `refusal/code`). The
plugin's sticky target, element tokens and snapshot ids minted under the
ended session are still in memory, and every later call fails until the
host restarts.

## Goals / Non-Goals

- Goals: the next call after a driver-side session end succeeds without a
  host restart; the caller is told a re-attach happened and must re-capture
  before further input; a user revocation stays a hard failure.
- Non-Goals: diagnosing WHY the driver ended the session (upstream); ending
  or restarting sessions proactively; any change to the approval model.

## Decisions

### D1 Detect by code, in every place the driver may put it

`sessionEndedRefusal(res)` returns the driver's message when the code is
`session_ended`, reading `res.structured.refusal.code` first, then a JSON
document inside the text content, then a plain `session_ended` token in the
text. Any other code returns null. The helper never matches on the message
wording alone (that text is the driver's to change).

### D2 Re-attach, invalidate, retry ONCE — same call, same arguments

In `doCall`: on `session_ended` → `invalidateTarget()` (sticky target,
snapshot tokens, screenshot dedup, zoom context), `start_session
{ session }` (bounded 10 s — the same call first connect makes), the
restart disclosure, then the SAME `client.call(tool, args, timeoutMs)` once
more. The retry is not a new action: the approval gate in `driverCall`
already ran for exactly these arguments, and a refusal is by definition not
performed, so nothing is delivered twice.

### D3 A second refusal is a real failure

If the retry is refused with `session_ended` again, the call throws an
error naming the code and the driver's message. One retry per call, no
backoff loop: a driver that keeps ending the session is an upstream fault
the user must see, not something to paper over.

### D4 Revocation is never healed past

Only the literal code `session_ended` triggers the path.
`authorization_revoked` / `authorization_suspended` (the user or the runtime
withdrew consent) and unknown codes pass through exactly as today.

### D5 Disclosure reuses the existing restart mechanism

`s.restarted` already makes the first post-restart result state that a
restart occurred. The heal sets the same flag; a new `restartReason`
("crash" | "session-ended") lets the note say "driver session re-attached"
instead of "driver restarted". The flag is cleared by the same
read-after-call in `driverCall`.

### D6 Invalidated addresses fail closed

After the heal the sticky target is null and the snapshot table is empty.
The retried call itself carries the explicit pid/window it was built with,
so it proceeds; the NEXT element-addressed call has no token to attach and
hits the plugin's own re-capture / no-target rules. Coordinate and key
actions never depended on tokens.

## Risks / Trade-offs

- The retried input is delivered without a fresh capture. Accepted: it is
  the same approved action on the same explicit target, and the result
  carries the re-attach disclosure. Failing the first input and demanding a
  re-capture instead would cost a model round-trip on every occurrence and
  is exactly what the stranded state looked like to the caller.
- `start_session` may itself fail during the heal. It is awaited
  un-swallowed there, so the failure surfaces as this call's error instead
  of a retry against a dead session. (First connect keeps its best-effort
  swallow — unchanged.)
- Wrong detection (a normal result that merely mentions the code) would
  cause one harmless re-attach + retry. Bounded by D1 (code field first)
  and D3 (one retry).

## Migration Plan

Pure plugin change: no config, no driver change. Rebundle `dist/index.js`;
the user restarts the host to load it.

## Open Questions

- Why the driver ended the session on the real host (2026-11-23) is not
  visible from the plugin side. Booked as an upstream question (tasks 3.1);
  not a blocker for the self-heal.
