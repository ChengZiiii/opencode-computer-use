## ADDED Requirements

### Requirement: activation entry is the host surface

The plugin SHALL NOT register any command of its own. The explicit
activation entry SHALL be the host's native skill→command promotion: hosts
promote every discovered skill to a slash command whose template is the
full SKILL.md (user arguments appended by the host when no `$ARGUMENTS`
placeholder exists), so `/computer-use <task>` injects the entire manual
plus the task as a single user message. The `/skills` menu SHALL remain the
browsing surface. On hosts without that promotion, natural-language
activation plus the model-side `skill` tool remains the entry.

#### Scenario: skill command injects the manual directly

- **WHEN** a user runs `/computer-use <task>` on a host that promotes
  discovered skills to commands
- **THEN** the expanded user message contains the full manual body followed
  by `<task>`, and the manual is present from the first turn without any
  model-mediated skill load

#### Scenario: no plugin-registered command

- **WHEN** the plugin's config hook runs
- **THEN** no `command.*` key is injected, so the host's skill command and
  any user-defined command of the same name are the only surfaces

## MODIFIED Requirements

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

- **WHEN** the skill is discovered and an agent loads it via the skill tool
  (or a user expands the host's auto-promoted `/computer-use` skill command)
- **THEN** the full manual body enters that conversation only, and no part
  of the manual beyond the frontmatter description is permanently resident
  in sessions that never load it

#### Scenario: scope constraint is the always-visible part

- **WHEN** the host lists available skills to the model
- **THEN** the computer-use skill's visible entry states the ONLY-for-GUI
  scope and names the non-goal substitutions (file tools, bash, browser
  tools)

### Requirement: activation layer never weakens existing gates

The skill injection SHALL NOT alter the approval model (both permission
domains still default to ask), SHALL NOT modify the
`computer`/`computer_status` tool behavior or registration states, and
SHALL NOT inject the manual body into any system prompt. The `computer`
tool description MAY carry a one-sentence pointer to the skill.

#### Scenario: approvals unchanged after install

- **WHEN** the plugin with the activation layer is installed
- **THEN** input actions still prompt per the two approval domains, and
  free actions remain free, exactly as before the layer existed

## REMOVED Requirements

### Requirement: /computer explicit activation command

**Reason**: opencode hosts natively promote discovered skills to slash
commands whose template is the full SKILL.md, making a plugin-registered
orchestrator command redundant and strictly weaker (model-mediated skill
load vs manual-in-message at turn 0).
**Migration**: use the host's `/computer-use <task>` skill command or the
`/skills` menu; on hosts without skill→command promotion, activate via
natural language and let the agent load the skill with the `skill` tool.
