# Proposal: add-skill-activation-layer

## Why

The plugin's tool surface is permanently resident in every session with no
usage guidance and no explicit activation entry, so agents can invoke
desktop control casually (scope creep into file/shell/web work) and never
receive the operating manual. Benchmark: Hermes and Z.ai's Zcode both ship
computer use as skill-gated activation — manual loaded on demand, slash
command as the explicit user entry, description as the when-to-use scope
constraint.

## What Changes

- Ship an agent-facing operating manual as a bundled skill:
  `skills/computer-use/SKILL.md` (canonical loop, verdict discipline,
  background-first/foreground escalation, targeting rules, hard safety
  rules, token economy, troubleshooting). Its frontmatter `description` is
  the scope constraint: computer use ONLY for real desktop-GUI work, with
  explicit non-goals (file tools, bash, browser tools, idle screen
  wandering).
- Config-hook injection (both null-checked; user definitions always win):
  - append the package's bundled `skills/` dir to `skills.paths` so the
    skill is discovered with zero copy steps (best-effort; README documents
    the one-line manual fallback if a host resolves skills before plugin
    config hooks);
  - register a `/computer <task>` command (typed `command` config key) that
    loads the skill then carries out the task — the explicit activation
    entry, Hermes-style.
- `computer` tool description gains one pointer sentence to the skill.
- `package.json` `files` includes `skills/`.
- README: new "Skill & the /computer activation entry" section; AGENTS.md
  module table row.
- Explicitly NOT in scope (user decision): no user master on/off switch, no
  tool deferral (host concern), no schema slimming.

## Capabilities

### New Capabilities

- `skill-activation-layer`: the skill-as-manual surface (scope-constraining
  description + operating manual body), its packaging in the npm artifact,
  and the config-hook injections that make it discoverable (`skills.paths`
  append) and explicitly activatable (`/computer` command).

### Modified Capabilities

(none — the `computer-use` and `driver-lifecycle` requirement sets are
unchanged; the tool-description sentence is guidance text, not a requirement
change.)

## Impact

- `plugin.ts` (config hook, ~60 lines), `src/tool.ts` (description +1
  sentence), `package.json` (files), `README.md`, `AGENTS.md`,
  `tests/wiring.test.mjs` (assembly test extended: command injection,
  skills-path append idempotency, user-override precedence).
- New files: `skills/computer-use/SKILL.md`, this change's artifacts.
- No runtime dependency, no driver interaction, no approval-model change.
- Process note: implementation landed in the working tree BEFORE this
  proposal (workflow violation, acknowledged); artifacts describe the
  implemented behavior; nothing is committed or published.
