# opencode-computer-use

Desktop computer use for [opencode](https://opencode.ai), backed by the
user-installed [cua-driver](https://github.com/trycua/cua/tree/main/libs/cua-driver) (trycua/cua, MIT).
One consolidated `computer` tool drives real applications through the OS
accessibility layer — capture with numbered elements, act by element index,
verify with a fresh capture — the loop Hermes popularized, in opencode plugin
form.

## What it adds over a raw MCP config

`cua-driver mcp-config --client opencode` already prints a raw MCP snippet,
and the cua docs note you need a real MCP server "so screenshots are
preserved in image blocks". This plugin is that layer and more:

- **Screenshot contract** — captures return as model-visible image
  attachments (inline data URLs) with scale metadata; a raw CLI/skill path
  loses the pixels.
- **Semantic verdicts** — every input action returns
  `done / verify_fresh_state / escalate` ("a correct answer alone does not
  prove the agent operated the app" — this automates that check), with an
  explicit ban on re-issuing input on an escalation recommendation alone.
- **Safety gates** — destructive key combos (lock/log-out class) and
  dangerous typed shell patterns are hard-blocked *before* approval; a
  sticky-target guard refuses input that would land on a different app than
  the last capture; per-action approval via the permission system.
- **Lifecycle guidance** — local probe, honest degradation, exact user-run
  remediation. **The plugin never installs, upgrades, or network-polls the
  driver.**

## Install

Requires opencode ≥ 1.18 and, for actual desktop control, the cua-driver
binary (a user operation — like installing opencode itself):

```bash
# 1. plugin (npm spec)
opencode plugin @sorenllm/opencode-computer-use --global

# 2. driver — run this yourself in a terminal; the plugin never will
# Windows (PowerShell):
irm https://cua.ai/driver/install.ps1 | iex
# macOS / Linux:
/bin/bash -c "$(curl -fsSL https://cua.ai/driver/install.sh)"
```

After installing the driver, restart opencode (the probe runs at startup).
macOS additionally needs the Accessibility + Screen Recording grants when
the driver asks for them (they attach to the driver's own app identity).
Verify any time: `cua-driver --version` — this plugin requires ≥ 0.28.0
(tested against 0.28.2).

If the driver is missing or too old, the only registered tool is
`computer_status`, which prints the exact problem and the command above.
Installation and upgrades are **user operations**: the plugin never executes
the installer, never fetches lifecycle data over the network, and its tool
descriptions tell the agent not to run installers on your behalf.

## Usage (the agent loop)

```
computer(action=capture, mode=som, app="Code")   # screenshot + numbered elements
computer(action=click, element_index=3)          # element-addressed input
computer(action=type, text="hello")
computer(action=set_value, element_index=7, value="opt2")  # selects without opening menus
computer(action=key, keys="ctrl+s")
computer(action=scroll, direction="down", amount=3)
computer(action=capture, mode="ax")              # element list only — cheapest
```

- `capture` is free (no approval); every input action asks.
- Actions: `capture click double_click right_click drag scroll type key
  set_value wait list_apps list_windows focus_app`. `middle_click` is not in
  the 0.28.x Windows driver surface and is reported unsupported rather than
  silently remapped.
- Prefer element `[index]` addressing over pixel coordinates; never derive
  coordinates from the attached screenshot (it may have been resized
  upstream). For small targets use the zoom path (native-resolution crop),
  not a zoomed full screenshot.

### On screenshot resolution (a deliberate deviation)

Anthropic's guidance recommends downscaling before sending, naming
coordinate-space mismatch as the top accuracy killer — but its main failure
mode is *pixel math on a resized image*, which element addressing avoids.
We return captures at native resolution (the 0.28.x driver offers no
downscale) with explicit scale metadata and an element-first contract, and
we point detail work at the driver's ≤500px zoom crops. Token economy comes
from the `ax` mode (text-only), bounded element lists (100), and
`capture_after` being opt-in. If a plugin-side resampler ever lands, it will
arrive as an optional dependency, not silently.

## Configuration

```jsonc
// opencode.json
{
  "plugin": [["@sorenllm/opencode-computer-use", {}]],
  "permission": { "computer": "ask" } // default; "deny" wins; "always" via the approval dialog
}
```

- `OPENCODE_CUA_DRIVER_CMD` — point at a specific driver binary. Authoritative:
  if it is wrong, readiness fails naming it; the plugin never silently picks
  another binary.
- Telemetry: the plugin spawns the driver with
  `CUA_DRIVER_RS_TELEMETRY_ENABLED=0` (the driver phones home by default —
  this turns it off for plugin-spawned sessions).
- Non-vision models cannot read the screenshot attachments; the tool text
  still carries the element tree, which is often enough (ax-first workflows
  work fully text-only).
- For tighter scoping, the driver itself supports bounded permission mode
  with a capability manifest (`cua-driver serve --permission-mode bounded`) —
  an advanced, user-side option; this plugin runs the standard mode.
- Browser work: pair with `@playwright/mcp` (accessibility-snapshot-first)
  rather than driving a browser through desktop pixels.

## Uninstall

1. Remove the plugin entry from `~/.config/opencode/opencode.json`.
2. Delete the package store dir
   `~/.cache/opencode/packages/@sorenllm/opencode-computer-use/`.
3. The driver is yours (Hermes and other agents may share it): remove with
   its own uninstaller if you want it gone.
4. Done — the plugin writes nothing outside its process (no temp files, no
   ledgers; a `OPENCODE_CU_PROBE=1` env opt-in appends probe diagnostics to
   the OS temp dir for debugging).

## File ledger

| Location | What | Cleanup |
|---|---|---|
| `~/.config/opencode/opencode.json` | `plugin` array entry | installer-written |
| `~/.cache/opencode/packages/...` | installed package copy | installer-written |
| cua-driver install (`%LOCALAPPDATA%/Programs/Cua/`, `~/.local/bin/`, …) | the driver binary | user-owned, shared |
| merged config object (RAM only) | `permission.computer` default | vanishes with the plugin |
| one child process per opencode run | `cua-driver mcp --direct` | killed on plugin dispose |

## Status

0.1.0 — initial release. Contract floor 0.28.0, tested against 0.28.2.
The one-way version policy: when a newer driver is verified, the floor and
tested-against range rise together; a drifted driver degrades to
`computer_status` diagnostics rather than partial operation.
