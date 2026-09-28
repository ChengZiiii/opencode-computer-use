## Context

See proposal.md - Why. Current state: `plugin.ts` registers a `/computer`
command via a null-checked `command.computer` config injection next to the
`skills.paths` append; the assembly test asserts the injection; README and
AGENTS.md document `/computer <task>` as the explicit entry. Hosts
(1.18.x, verified on 1.18.33 by binary inspection) auto-promote discovered
skills to commands with the full SKILL.md as template and append user args
when no `$ARGUMENTS` placeholder exists; skill-sourced commands are hidden
from the main autocomplete and browsed via `/skills`.

## Goals / Non-Goals

**Goals:**

- Single activation surface: the host's `/computer-use <task>` skill
  command; zero plugin-registered commands.
- Keep the `skills.paths` append as the only activation wiring (the host
  only generates the command for discovered skills).
- A regression guard that fails if a plugin command is ever re-introduced.

**Non-Goals:**

- No change to tool surface, permission domains, safety gates, or driver
  lifecycle (other capabilities untouched).
- No compat shim for hosts without skill→command promotion (user decision:
  always-upgrade audience; engines floor stays `^1.18.0`).
- No SKILL.md content changes.

## Decisions

- **Delete the command registration outright vs keep as deprecated alias**:
  delete. An alias would shadow-duplicate the host surface (`/computer` in
  the main autocomplete vs `/computer-use` behind `/skills`), and its
  model-mediated skill load is strictly weaker than host injection at
  turn 0. Alternative rejected: keeping both indefinitely costs docs drift
  and re-introduces the name-confusion class discussed in the plugin's
  design history.
- **Guard direction in the assembly test**: assert `cfg.command ===
  undefined` after the config hook (not merely "no computer key"), so ANY
  future command injection fails the test, forcing a conscious spec change
  first.
- **Version**: 0.4.0 (pre-1.0 minor carries the BREAKING removal; 0.3.0 is
  already on the registry, so the removal cannot ride it).

## Risks / Trade-offs

- [Hosts without skill→command promotion lose the deterministic entry] →
  accepted per user decision; fallback is natural-language activation plus
  the model-side `skill` tool; README documents the entry as host-native.
- [Users with muscle memory type `/computer`] → host returns unknown
  command; README Status entry (0.4.0) documents the migration to
  `/computer-use`.
- [`cfg.command` shared config object] → the plugin no longer creates the
  `command` key at all; user-defined commands are untouched by absence.

## Migration Plan

Publish 0.4.0; users upgrading lose `/computer` and gain `/computer-use`
via the host. Rollback = pin 0.3.0. No config migration needed (the plugin
never persisted anything).
