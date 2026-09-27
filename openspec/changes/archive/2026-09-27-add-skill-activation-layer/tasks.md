# Tasks: add-skill-activation-layer

## 1. Skill artifact

- [x] 1.1 Author `skills/computer-use/SKILL.md` with scope-constraining
  frontmatter description (ONLY-for-GUI + non-goal substitutions) and manual
  body (loop, verdicts, foreground escalation, targeting, safety, token
  economy, troubleshooting); verify frontmatter `name: computer-use`,
  description â‰?024 chars, and `name` matches the directory name
- [x] 1.2 Add `"skills"` to package.json `files`; verify `npm pack --dry-run`
  (or equivalent) lists `skills/computer-use/SKILL.md` in the artifact

## 2. Config-hook injections (plugin.ts)

- [x] 2.1 Implement `bundledSkillsDir()` (two-root probe, existsSync-guarded)
  and the `/computer` command injection (null-checked, template with
  $ARGUMENTS, empty-args and missing-tool fallbacks); verify typecheck passes
- [x] 2.2 Implement the idempotent `skills.paths` append (normalized-path
  compare, user entries never removed/reordered); verify typecheck passes

## 3. Documentation

- [x] 3.1 Add README section "Skill & the /computer activation entry"
  (behavior + one-line manual fallback path + per-skill permission gating
  note) and AGENTS.md module-table row for `skills/`; verify both files
  render the documented fallback path exactly as implemented

## 4. Tests

- [x] 4.1 Extend the wiring assembly test: `/computer` injected with
  $ARGUMENTS, user `command.computer` not clobbered, skills-path append
  idempotent; verify `npm test` green
- [x] 4.2 Add tool-description pointer sentence (src/tool.ts) and verify the
  existing tool tests still pass (`npm test`)

## 5. Build & live verification

- [x] 5.1 `npm run bundle`; verify dist rebuilt and `skills/` present in the
  repo tree
- [x] 5.2 Live E2E with a temp project (`file:` plugin spec, computer
  permissions denied): (a) fresh `opencode run` confirms the skill is
  discoverable and its description quoted; (b) `opencode run "/computer
  <report-only task>"` confirms template expansion, skill load, and no
  unwanted desktop input
- [x] 5.3 Full gate: `npm run typecheck` + `npm test` green after all edits
