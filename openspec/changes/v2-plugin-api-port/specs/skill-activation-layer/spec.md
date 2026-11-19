## ADDED Requirements

### Requirement: VH-3: Skill discovery parity on a V2 host

**Requirement:** On a V2 host, the bundled skill `SHALL` be discoverable
via `ctx.skill.transform` registering the package's bundled `skills/`
directory as a directory source — the same discovery outcome as the V1
`skills.paths` append, with the same guarantees: no copy or sync of
`SKILL.md` into any host skills directory, no command registration by the
plugin, no approval-model change, no manual-body injection into any system
prompt, and no removal or reordering of user-provided skill sources. The
manual fallback documented in the README `SHALL` cover the V2 host case.

#### Scenario: Skill discoverable without a copy on V2

- **WHEN** the plugin loads on a V2 host with `ctx.skill` available and no
  manually copied skill exists in any host skills directory
- **THEN** the `computer-use` skill is discoverable from the registered
  package directory source

#### Scenario: Registration guarantees unchanged on V2

- **WHEN** the V2 skill source registration runs
- **THEN** no file is written outside the package, no command is
  registered by the plugin, and user-provided skill sources are untouched
