## Why

opencode hosts (verified by decompiling the 1.18.33 TUI binary) natively
promote every discovered skill to a slash command whose template IS the full
SKILL.md — user arguments are appended by the host when the template carries
no `$ARGUMENTS` placeholder. The plugin-registered `/computer` command is
therefore redundant, and strictly weaker than the host surface: it relies on
the model making an extra `skill` tool call to load the manual
(compliance-dependent, one hop late), while the host's `/computer-use <task>`
injects the entire manual plus the task as a single user message at turn 0.
Removing the plugin command eliminates a duplicate entry that could shadow
or confuse the native one.

## What Changes

- **BREAKING**: the plugin no longer registers a `/computer` command. The
  explicit activation entry is the host's native skill→command promotion
  (`/computer-use <task>`, browsed via the `/skills` menu). Users on hosts
  without that promotion fall back to natural-language activation plus the
  model-side `skill` tool.
- The config hook's only activation wiring is the `skills.paths` append
  (skill must be discovered for the host to generate the command).
- The assembly test gains a regression guard: `cfg.command` must remain
  `undefined` after the config hook runs.
- Documentation (README entry section, AGENTS.md architecture table) and
  version bump 0.3.0 → 0.4.0 (0.3.0 is already published; a removal cannot
  ride a released version).
- Process note: the implementation already exists in the working tree from
  a direct (non-ceremonial) edit session; this change formalizes it
  retroactively. The live spec was restored to HEAD before this change was
  created, so the delta below is the only mutation path.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `skill-activation-layer`: the "/computer explicit activation command"
  requirement is replaced by "activation entry is the host surface" — the
  plugin SHALL NOT register any command; the host's skill→command promotion
  is the explicit entry. The remaining requirements (bundled manual skill,
  skills.paths discovery wiring, gates-not-weakened) are unchanged in
  substance; the on-demand-load scenario's trigger wording now references
  the host skill command instead of `/computer`.

## Impact

- `plugin.ts`: delete `COMPUTER_COMMAND_TEMPLATE` and the `command` config
  injection; comment blocks rewritten to document the host-native entry.
- `tests/wiring.test.mjs`: no-command regression guard replaces the
  command-injection assertions; user-config case simplified to
  skills-only idempotency.
- `README.md`, `AGENTS.md`: entry documentation aligned.
- `package.json` / `dist/index.js`: 0.4.0, rebuilt bundle.
- No tool surface, permission domain, safety, or driver-lifecycle behavior
  changes (those capabilities are untouched).
