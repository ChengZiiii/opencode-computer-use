## 1. Command removal (plugin.ts)

- [x] 1.1 Delete `COMPUTER_COMMAND_TEMPLATE` and the `command.computer` config injection; rewrite the two wiring comment blocks to document the host-native `/computer-use` entry. Verify: `rg "COMPUTER_COMMAND|commands\.computer" plugin.ts` returns no matches.
- [x] 1.2 Rebuild the bundle. Verify: `npm run bundle` succeeds and `rg "commands\.computer|COMPUTER_COMMAND" dist/index.js` returns no matches.

## 2. Test realignment

- [x] 2.1 Replace the command-injection assertions in `tests/wiring.test.mjs` with the no-command regression guard (`cfg.command === undefined` after the config hook) and reduce the user-config case to skills-only idempotency. Verify: assembly test passes under `npm test`.

## 3. Documentation & version

- [x] 3.1 Rewrite the README activation section around `/computer-use <task>` + `/skills`, and add the 0.4.0 Status entry; update the AGENTS.md architecture-table row for SKILL.md. Verify: no live-doc reference to `/computer` as a working entry (historical/migration mentions only).
- [x] 3.2 Bump `package.json` version to 0.4.0. Verify: `npm pkg get version` returns 0.4.0.

## 4. Verification

- [x] 4.1 Full gate: `npm test` (all tests pass, including the new no-command guard) and `npm run typecheck` exits clean.
