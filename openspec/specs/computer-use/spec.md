# computer-use Specification

## Purpose
TBD - created by archiving change add-computer-use. Update Purpose after archive.

## Requirements

### Requirement: Single consolidated desktop-control tool

The plugin SHALL expose exactly one agent-facing tool (`computer`) whose first parameter is an `action` discriminator with values `capture`, `zoom`, `verify`, `click`, `double_click`, `right_click`, `drag`, `scroll`, `type`, `key`, `set_value`, `wait`, `list_apps`, `list_windows`, `focus_app`, `launch_app`, `invoke_menu`. `capture`, `list_apps`, `list_windows`, and `wait` SHALL be side-effect free; every other action SHALL be subject to the approval gate. `focus_app` SHALL select the sticky target without raising the window; raising the window to the foreground SHALL be a separate explicit parameter (`raise`) governed by the foreground approval scope. Actions absent from the platform's driver surface SHALL be reported as unsupported with the platform limitation named rather than silently mapped to a different gesture, and hint text SHALL match the platform driver's actual surface (e.g. middle-click is available via the click action's button parameter).

#### Scenario: Unknown action fails closed

- **WHEN** the tool is called with an action outside the discriminator
- **THEN** the call returns an error result naming the unsupported action and the closest supported spelling, and no input is dispatched to the desktop

#### Scenario: Capture needs no approval

- **WHEN** `capture` is called and the driver backend is ready
- **THEN** the call executes without an approval prompt and returns screen state

#### Scenario: Focus selects without stealing foreground

- **WHEN** `focus_app` is called without the raise parameter
- **THEN** the sticky target is set to that application/window and no foreground change is made

#### Scenario: Launching an app never steals focus

- **WHEN** `launch_app` starts an application
- **THEN** the application starts without being brought to the foreground and the result reports the new process identity (pid) and any initial windows

### Requirement: Capture modes and image return contract

`capture` SHALL support modes `som` (screenshot plus a numbered element list whose indices are usable for element-addressed actions), `vision` (plain screenshot), and `ax` (element list only). Screenshots SHALL be returned to the model as image attachments with inline data URLs, at a resolution whose longest edge does not exceed ~1568 logical pixels (driver-side resolution control when available; otherwise the native resolution with an explicit scale mapping in the text output), accompanied by the coordinate mapping between the returned image and native screen coordinates. The text output SHALL include the image-to-native scale factor (and display scale factor where available) and SHALL direct the agent to prefer element addressing over pixel coordinates, warning that the image may have been resized upstream. The element walk SHALL be bounded driver-side (default ~200 elements) so dense trees return in bounded time, with the bound reported when it truncates. Repeated captures of the same target with unchanged screenshot bytes SHALL omit the duplicate image attachment for at most a bounded streak (default 2), noting the omission in the text output. Capturing with an `app` name SHALL resolve the application to a concrete process (pid) before capture, so an app-scoped capture succeeds without a pre-existing sticky target. Non-screenshot results SHALL be text-only. A `zoom` capture of a bounded region (≤500 logical pixels on its long edge) SHALL be supported for reading dense UI, and input actions SHALL accept a `from_zoom` flag that remaps coordinates computed against the zoomed image back to native screen coordinates using the stored zoom mapping before dispatch.

#### Scenario: Screenshot is model-visible

- **WHEN** a `som` or `vision` capture completes on a session whose model accepts images
- **THEN** the tool result carries an image attachment (inline data URL) that the host renders into the model context, plus the downscale coordinate mapping in the text output

#### Scenario: Scale metadata warns against pixel reasoning

- **WHEN** a screenshot attachment is returned at native resolution with a scale mapping
- **THEN** the text output states the scale factor and instructs the agent to address elements by index rather than compute pixel coordinates from the image

#### Scenario: Element list is bounded

- **WHEN** the active window publishes more interactable elements than the cap
- **THEN** the element list is truncated at the cap and the result states that truncation happened

#### Scenario: Element list is bounded in time and size

- **WHEN** the target window publishes a very large tree
- **THEN** the driver-side walk bound applies (reported in the output), and the rendered list is additionally capped (default 100 entries) with a truncation marker

#### Scenario: Unchanged screenshots are deduplicated

- **WHEN** consecutive captures of the same window return identical screenshot bytes within the streak bound
- **THEN** the duplicate image attachment is omitted and the text output states that the screenshot is unchanged

#### Scenario: App-scoped capture resolves the application

- **WHEN** `capture` is called with only an `app` name and no sticky target exists
- **THEN** the application is resolved to a pid (via the running-application and window listings) and the capture proceeds against it, or fails with a named resolution error listing running candidates

#### Scenario: Zoomed-image coordinates remap on input

- **WHEN** the agent computed a coordinate from a `zoom` capture's image and dispatches an input action with `from_zoom` set
- **THEN** the coordinate is remapped to native screen coordinates via the stored zoom mapping before dispatch, and the result reports the remap

### Requirement: Semantic verdict on every input action

Every non-capture action result SHALL include a verdict of `done`, `verify_fresh_state`, or `escalate` derived from the backend's semantic evidence (confirmed effect / unverifiable / suspected no-op), in addition to transport success. The verdict text SHALL instruct the agent to re-capture before any retry and SHALL NOT license repeating an input on an escalation recommendation alone. A `verify` action SHALL evaluate deterministic predicates against a window (existence, enabled/selected state, value equality, window bounds) and its result SHALL distinguish success from unknown — unknown SHALL never be reported as success; a passed verification MAY upgrade a prior action's verdict evidence. A configurable `capture_after` policy (default off) SHALL, when enabled, re-capture the precise target window after an input action (`som` or `ax` per policy) and merge the fresh state into the action result, bounded to one re-capture per action.

#### Scenario: Transport success without semantic proof

- **WHEN** an input was delivered but its effect is unconfirmed
- **THEN** the verdict is `verify_fresh_state` with guidance to re-capture and check before continuing

#### Scenario: Deterministic verification distinguishes unknown

- **WHEN** a `verify` action cannot confirm a predicate (element absent from a valid snapshot, value indeterminate)
- **THEN** the result reports the outcome as unknown (not success) with the failing predicate named

#### Scenario: capture_after re-captures once when enabled

- **WHEN** the `capture_after` policy is enabled and an input action completes
- **THEN** the action result embeds one fresh capture of the precise target window per the policy mode, merged after the verdict; when disabled (default) no extra capture occurs

#### Scenario: Suspected no-op escalates one rung

- **WHEN** the backend reports the input likely did not land
- **THEN** the verdict is `escalate` with the backend's recommended next rung, and the result states that the recommendation alone does not justify re-issuing the input

### Requirement: Hard-blocked destructive input

The tool SHALL refuse, before any approval prompt or dispatch, key combinations that lock, log out, or force-quit the session (e.g. Win+L, Cmd+Ctrl+Q, Ctrl+Alt+Del class) and typed text containing destructive shell patterns (e.g. piped remote-script execution, recursive-root deletion). The same text scan SHALL apply to values written via `set_value`. Refusals SHALL return a structured error naming the blocked class.

#### Scenario: Blocked key combo never dispatches

- **WHEN** `key` is called with a blocked combination (in any alias or hyphen/space spelling)
- **THEN** the call returns a blocked-combo error and no keyboard event reaches the OS

#### Scenario: Blocked text never dispatches by any writing action

- **WHEN** `type` text or a `set_value` value matches a destructive shell pattern
- **THEN** the call returns a blocked-pattern error and nothing is written

#### Scenario: Blocked type text never dispatches

- **WHEN** `type` text matches a destructive shell pattern
- **THEN** the call returns a blocked-pattern error and nothing is typed

### Requirement: Sticky target guard for input

Input actions SHALL be delivered to the target established by the most recent `capture` or `focus_app`. When a call names an application that provably differs from that target, the tool SHALL refuse with a mismatch error directing the caller to capture or focus the intended application first, rather than dispatching to the current target. Element-addressed actions SHALL carry the driver's element snapshot identity (snapshot id and element tokens) from the originating capture; an `element_index` supplied without its snapshot identity SHALL be refused as unaddressable. The driver's staleness verdict SHALL surface as an explicit error requiring a fresh capture, never a silent re-resolution to another element. After a backend restart the snapshot bookkeeping SHALL be invalidated and the next result SHALL report the restart and direct a re-capture.

#### Scenario: Mismatched app argument is refused

- **WHEN** an input action passes an `app` argument that conflicts with the current sticky target
- **THEN** the call fails with an input-target-mismatch error and no input is dispatched

#### Scenario: Stale element references fail closed

- **WHEN** an action addresses an element whose snapshot reference is no longer current
- **THEN** the backend reports staleness and the tool surfaces it as an error requiring a fresh capture, never silently re-resolving to another element

#### Scenario: Restart invalidates addressing state

- **WHEN** the backend restarted since the last capture
- **THEN** the next action result reports the restart, element references are treated as invalid, and the caller is directed to capture again

### Requirement: Approval gate on input actions

By default the plugin SHALL register the `computer` tool under an ask-level permission rule and invoke the host's in-tool confirmation for every side-effecting action. Foreground delivery — the `raise` parameter or `delivery_mode: foreground` — SHALL require a separate approval from background input: a session granted for background input SHALL NOT cover a subsequent foreground action. An explicit deny in user config SHALL win over everything.

#### Scenario: Input action asks by default

- **WHEN** a side-effecting action executes under default configuration in an interactive session
- **THEN** the host approval flow runs before any input is dispatched, and a denial aborts the action with no dispatch

#### Scenario: Foreground is a separate approval domain

- **WHEN** a foreground-raising action follows approved background actions in the same session
- **THEN** it triggers its own approval request, and a background approval does not satisfy it

### Requirement: Single in-flight driver call

The plugin SHALL serialize calls to the backend: while one action is in flight, a concurrent call waits (bounded) rather than interleaving, preserving capture-then-act ordering and sticky-target integrity.

#### Scenario: Concurrent calls do not interleave

- **WHEN** two tool calls race while one driver action is in flight
- **THEN** the second waits for the first to settle (up to a bound) and both observe a consistent sticky target

### Requirement: Native menu invocation without pixel fallback

An `invoke_menu` action SHALL resolve an application menu path level by level through the platform's accessibility layer and invoke the final item; ambiguous, missing, or disabled menu entries SHALL fail closed with the failing level named, with no pixel-coordinate fallback.

#### Scenario: Menu path resolves or fails by name

- **WHEN** `invoke_menu` is given a menu path
- **THEN** either the exact item is invoked via accessibility, or the result names the first level that could not be resolved and nothing is clicked
