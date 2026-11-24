## 1. Implementation

- [x] 1.1 `src/session.ts`: export `sessionEndedRefusal(res)` — structured `refusal.code` → JSON in text → plain token; code `session_ended` only — verify: unit tests pin all three placements, a non-matching code, and a message-only mention
      —— measured 2026-11-24: `tests/wiring.test.mjs` "session_ended is detected by its code in every placement …" pins the structured, the JSON-in-text and the plain-token placements, another code (`authorization_revoked`), a prose mention and a message-only mention; mutants cu-1…cu-5 (one per placement, one per false match) all KILLED
- [x] 1.2 `src/session.ts`: `doCall` heals `session_ended` once (invalidate → `start_session` → disclosure → the same call once) and throws an error naming the code on a second refusal — verify: fake-transport test asserts the exact wire order `tools/call → start_session → tools/call`, the cleared sticky target, and no third attempt
      —— measured: "session_ended: re-attach and retry the SAME call once …" asserts the wire order, the same arguments on the retry, the cleared sticky target and tokens; "session_ended twice …" asserts the error naming the code, no third attempt, no second re-attach; mutants cu-6 (no re-attach), cu-7 (target kept), cu-8 (second refusal returned) KILLED
- [x] 1.3 `src/session.ts` + `src/tool.ts`: `restartReason` drives the disclosure wording — verify: tool-layer tests assert `restarted: true` with the re-attach note on a healed result, and the unchanged crash wording on the crash path
      —— measured: "a healed call states the re-attach on its result (once); the crash wording is unchanged" (string results) and "a healed capture (object result) names the cause at the head of its output" (object results, both causes — added 2026-11-24: the object path had no case); mutants cu-9…cu-12 KILLED
- [x] 1.4 Other refusal codes pass through with zero `start_session` calls and zero retries — verify: fake-transport test with `authorization_revoked`
      —— measured: "another refusal code (authorization_revoked) passes through: no re-attach, no retry, target kept"; mutant cu-1 (any code matches) KILLED by it

## 2. Verification (repo)

- [x] 2.1 `npm run typecheck` + `npm test` green — verify: recorded output; test count up by exactly the new cases, none skipped
      —— measured: `npm run typecheck` exit 0; `npm test` 80 pass / 0 fail / 0 cancelled / 0 skipped (548 ms); `tests/wiring.test.mjs` 22 → 29 cases (+7: the six of this change and the object-result case), the other three test files untouched; output at `%LOCALAPPDATA%\Temp\opencode\view-e2e\logs\cu-0341\`
- [x] 2.2 Mutation check: each new assertion fails when its guard is reverted — verify: recorded run; source restored byte-identical (hash before/after)
      —— measured: `mut-cu.mjs`, 12 mutants, 12/12 KILLED, every restore byte-identical (sha256 before/after; verdict at `…\view-e2e\logs\cu-mutation\verdict.json`). The first run of the harness counted no tests (Node 24's default reporter is not TAP) and was discarded as a harness fault; the harness now pins `--test-reporter=tap` and refuses a baseline with zero passing tests
- [x] 2.3 `npm run bundle`; `dist/index.js` carries the new markers and stays self-contained — verify: marker grep + `npm pack --dry-run` list shape unchanged
      —— measured: 80 modules bundled; `dist/index.js` 477665 bytes, sha256 `c8478e74…77009`; markers `session_ended` (4 lines), `re-attaching and retrying once`, `refused again with session_ended after a re-attach`, `driver session re-attached since your last call`, `the driver-side session had ended and was re-attached`, `restartReason` (5) all present; the only imports are `node:` built-ins; `npm pack --dry-run` lists 4 entries (README.md, dist/index.js, package.json, skills/computer-use/SKILL.md). One probe string of mine was mistyped (`crash mid-call`); the real string `driver crashed mid-call` is in the bundle

## 3. Live leg

- [ ] 3.1 BOOKED (workspace D6): reproduce a driver-side `session_ended` on the real driver and observe the heal. The sandbox cannot reach it — the refusal is produced by the installed driver for a real lifecycle session, and spawning a second driver MCP client next to the live host's lease risks the user's running session. Re-run when the refusal next appears on the real host: the call must succeed and carry `restarted: true` with the re-attach note — verify: that tool result

## 4. Docs

- [x] 4.1 README troubleshooting: a `session_ended` refusal now self-heals once; a repeated one is an upstream driver fault to report — verify: section present
      —— measured: README "## Troubleshooting" present with the `session_ended` bullet (self-heals once; a repeated one is an upstream driver fault to report)
