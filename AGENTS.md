# AGENTS.md — opencode-computer-use

Desktop computer use for opencode via the user-installed cua-driver
(trycua/cua, MCP stdio). Zero npm runtime dependencies; dist is
self-contained and committed.

## Architecture

| Module | Role |
|---|---|
| `plugin.ts` | v1/v2 entries (`{ id, server, setup }`); startup probe (process-cached), two-state registration (ready → `computer` + `computer_status`; not ready → `computer_status` only), `permission.computer = "ask"` default injection, dispose |
| `src/driver-resolve.ts` | binary resolution: `OPENCODE_CUA_DRIVER_CMD` override (authoritative) → PATH → per-platform canonical installer locations; user-run install/upgrade hint text |
| `src/contract.ts` | runtime contract gate: `cua-driver manifest` self-description — version floor 0.28.0, `mcp_invocation`, required subcommand flags; `TESTED_AGAINST = 0.28.2`; one-way version policy |
| `src/mcp-client.ts` | minimal JSON-RPC 2.0 over stdio (initialize → tools/list → tools/call); per-call hard timeouts; exit → reject in-flight + `crashed`; transport injectable |
| `src/session.ts` | lazy single child per host process (`--direct`, telemetry env off), single-flight serialization (chain-deferred), sticky target, crash → invalidate + lazy respawn, `REQUIRED_TOOLS` check on first connect |
| `src/capture.ts` | capture result shaping: element list (cap 100 + truncation marker), data-URL attachments, scale metadata + no-pixel-reasoning warnings |
| `src/safety.ts` | hard-blocked key combos (alias/hyphen/space canonicalization) and type patterns — checked BEFORE approval; sticky-target mismatch; verdict mapping (done / verify_fresh_state / escalate) |
| `src/tool.ts` | `computer` tool (action discriminator, 13 actions) and `computer_status` (guide/diagnostic surface); approval two-piece (`ctx.ask` + permission rule); `capture_after` opt-in |
| `tests/unit.test.mjs` | resolve/contract/safety/capture/verdict units (injected runners) |
| `tests/wiring.test.mjs` | MCP client (fake transport), session lifecycle (spawn/dispose/crash/serialize), tool wiring (fake ToolContext: ask/deny/blocked/sticky/no-target), plugin assembly two-state |

## Hard rules

- The plugin NEVER installs, upgrades, or network-polls the driver. Install
  commands are user-run text, printed by `computer_status` and README.
- Hard-blocked input refuses BEFORE the approval gate — an "always" grant
  must never let destructive combos/patterns through.
- Timeouts and crashes fail the tool call, never the host session; dispose
  kills the child.
- Readiness is two-stage: manifest gate at startup (local, fast), MCP
  `tools/list` check on first call — a mismatch fails closed with a named
  list, never partial operation.
- Build script is `bundle` (never the seven git-dep-preparation trigger
  names); dist/ is committed; dual export `.` and `./server`; final
  verification only counts via `opencode plugin <npm spec> --global`.
- Upstream drift: fix by raising the contract floor / adjusting to the
  manifest's self-description — never by weakening the gate.

## Commands

```
npm run bundle      # rebuild dist/index.js (bun build)
npm test            # node --test tests/*.test.mjs
npm run typecheck   # tsc --noEmit
```
