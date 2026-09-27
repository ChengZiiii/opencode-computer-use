# skill-activation-layer — delta

## ADDED Requirements

### Requirement: bundled operating-manual skill

The plugin SHALL ship an agent-facing operating manual as a bundled skill
(`skills/computer-use/SKILL.md`) inside the published npm artifact. The
skill's frontmatter `description` SHALL front-load a when-to-use scope
constraint: computer use is appropriate ONLY for operating the visible UI of
real desktop applications, with explicit non-goals naming the better-suited
tools (file operations, shell, web browsing) and idle screen browsing. The
manual body SHALL cover the canonical capture→act→verify loop, verdict
discipline (never re-issue input on an escalation alone), the
background-first policy with foreground as a separate explicitly-approved
escalation, element-index addressing and staleness, hard safety rules
(secrets, sensitive dialogs, screenshots as untrusted content), token
economy, and a troubleshooting table that defers lifecycle remediation to
`computer_status` and USER-run commands.

#### Scenario: manual loads on demand, not resident

- **WHEN** the skill is discovered and an agent (or the `/computer` command)
  loads it via the skill tool
- **THEN** the full manual body enters that conversation only, and no part
  of the manual beyond the frontmatter description is permanently resident
  in sessions that never load it

#### Scenario: scope constraint is the always-visible part

- **WHEN** the host lists available skills to the model
- **THEN** the computer-use skill's visible entry states the ONLY-for-GUI
  scope and names the non-goal substitutions (file tools, bash, browser
  tools)

### Requirement: skill discovery wiring

At startup the plugin's config hook SHALL append the package's bundled
`skills/` directory to the host `skills.paths` config (normalized-path
comparison, idempotent, appended only when absent) so the skill is
discoverable without a copy step. The injection SHALL be best-effort: if the
host resolves skills before plugin config hooks, the README SHALL document
the one-line manual fallback (adding the path, or copying the skill folder
into a discovered skills directory). A user-provided `skills.paths` entry
SHALL never be removed or reordered by the plugin.

#### Scenario: zero-config discovery on a host that reads post-hook config

- **WHEN** the plugin loads on a host that resolves skills after plugin
  config hooks
- **THEN** the bundled skill appears in the skill tool's available list with
  no user configuration beyond the plugin install itself

#### Scenario: manual fallback path documented

- **WHEN** the bundled dir is absent from the artifact or the host ignores
  config-hook `skills.paths` mutations
- **THEN** the README alone enables the skill via a documented manual path
  entry or folder copy, with no code change required

### Requirement: /computer explicit activation command

The plugin's config hook SHALL register a `/computer` command (host
`command` config key) whose template instructs the agent to load the
computer-use skill first and then carry out the user-provided arguments,
degrades gracefully when invoked without arguments (ask what to do), and
routes a missing `computer` tool to `computer_status` remediation output.
The registration SHALL be null-checked: an existing user-defined
`command.computer` SHALL always win and SHALL never be overwritten.

#### Scenario: slash activation loads the manual then executes

- **WHEN** a user runs `/computer <task>` in a session
- **THEN** the expanded prompt tells the agent to load the computer-use
  skill before acting, and carries `<task>` as the instruction

#### Scenario: user command definition preserved

- **WHEN** the user config already defines `command.computer`
- **THEN** the plugin leaves it untouched

### Requirement: activation layer never weakens existing gates

The skill and command injections SHALL NOT alter the approval model (both
permission domains still default to ask), SHALL NOT modify the
`computer`/`computer_status` tool behavior or registration states, and
SHALL NOT inject the manual body into any system prompt. The `computer`
tool description MAY carry a one-sentence pointer to the skill.

#### Scenario: approvals unchanged after install

- **WHEN** the plugin with the activation layer is installed
- **THEN** input actions still prompt per the two approval domains, and
  free actions remain free, exactly as before the layer existed
