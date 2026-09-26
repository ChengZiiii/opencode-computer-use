## ADDED Requirements

### Requirement: Single consolidated desktop-control tool

The plugin SHALL expose exactly one agent-facing tool (`computer`) whose first parameter is an `action` discriminator with values `capture`, `click`, `double_click`, `right_click`, `drag`, `scroll`, `type`, `key`, `set_value`, `wait`, `list_apps`, `list_windows`, `focus_app`. `capture` SHALL be side-effect free; every other action SHALL be subject to the approval gate. Actions absent from the platform's driver surface SHALL be reported as unsupported with the platform limitation named rather than silently mapped to a different gesture.

#### Scenario: Unknown action fails closed

- **WHEN** the tool is called with an action outside the discriminator
- **THEN** the call returns an error result naming the unsupported action and the closest supported spelling, and no input is dispatched to the desktop

#### Scenario: Capture needs no approval

- **WHEN** `capture` is called and the driver backend is ready
- **THEN** the call executes without an approval prompt and returns screen state

### Requirement: Capture modes and image return contract

`capture` SHALL support modes `som` (screenshot plus a numbered element list whose indices are usable for element-addressed actions), `vision` (plain screenshot), and `ax` (element list only). Screenshots SHALL be returned to the model as image attachments with inline data URLs, at a resolution whose longest edge does not exceed ~1568 logical pixels (driver-side resolution control when available; otherwise the native resolution with an explicit scale mapping in the text output), accompanied by the coordinate mapping between the returned image and native screen coordinates. The text output SHALL include the image-to-native scale factor (and display scale factor where available) and SHALL direct the agent to prefer element addressing over pixel coordinates, warning that the image may have been resized upstream. The element list SHALL be capped (default 100 entries) with a marker when truncated. Non-screenshot results SHALL be text-only.

#### Scenario: Scale metadata warns against pixel reasoning

- **WHEN** a screenshot attachment is returned at native resolution with a scale mapping
- **THEN** the text output states the scale factor and instructs the agent to address elements by index rather than compute pixel coordinates from the image

#### Scenario: Screenshot is model-visible

- **WHEN** a `som` or `vision` capture completes on a session whose model accepts images
- **THEN** the tool result carries an image attachment (inline data URL) that the host renders into the model context, plus the downscale coordinate mapping in the text output

#### Scenario: Element list is bounded

- **WHEN** the active window publishes more interactable elements than the cap
- **THEN** the element list is truncated at the cap and the result states that truncation happened

### Requirement: Semantic verdict on every input action

Every non-capture action result SHALL include a verdict of `done`, `verify_fresh_state`, or `escalate` derived from the backend's semantic evidence (confirmed effect / unverifiable / suspected no-op), in addition to transport success. The verdict text SHALL instruct the agent to re-capture before any retry and SHALL NOT license repeating an input on an escalation recommendation alone.

#### Scenario: Transport success without semantic proof

- **WHEN** an input was delivered but its effect is unconfirmed
- **THEN** the verdict is `verify_fresh_state` with guidance to re-capture and check before continuing

#### Scenario: Suspected no-op escalates one rung

- **WHEN** the backend reports the input likely did not land
- **THEN** the verdict is `escalate` with the backend's recommended next rung, and the result states that the recommendation alone does not justify re-issuing the input

### Requirement: Hard-blocked destructive input

The tool SHALL refuse, before any approval prompt or dispatch, key combinations that lock, log out, or force-quit the session (e.g. Win+L, Cmd+Ctrl+Q, Ctrl+Alt+Del class) and `type` text containing destructive shell patterns (e.g. piped remote-script execution, recursive-root deletion). Refusals SHALL return a structured error naming the blocked class.

#### Scenario: Blocked key combo never dispatches

- **WHEN** `key` is called with a blocked combination (in any alias or hyphen/space spelling)
- **THEN** the call returns a blocked-combo error and no keyboard event reaches the OS

#### Scenario: Blocked type text never dispatches

- **WHEN** `type` text matches a destructive shell pattern
- **THEN** the call returns a blocked-pattern error and nothing is typed

### Requirement: Sticky target guard for input

Input actions SHALL be delivered to the target established by the most recent `capture` or `focus_app`. When a call names an application that provably differs from that target, the tool SHALL refuse with a mismatch error directing the caller to capture or focus the intended application first, rather than dispatching to the current target.

#### Scenario: Mismatched app argument is refused

- **WHEN** an input action passes an `app` argument that conflicts with the current sticky target
- **THEN** the call fails with an input-target-mismatch error and no input is dispatched

#### Scenario: Stale element references fail closed

- **WHEN** an action addresses an element whose snapshot reference is no longer current
- **THEN** the backend reports staleness and the tool surfaces it as an error requiring a fresh capture, never silently re-resolving to another element

### Requirement: Approval gate on input actions

By default the plugin SHALL register the `computer` tool under an ask-level permission rule and invoke the host's in-tool confirmation for every non-capture action; an explicit deny in user config SHALL win. Approval applies per action class (all input actions), not per keystroke batch.

#### Scenario: Input action asks by default

- **WHEN** a non-capture action executes under default configuration in an interactive session
- **THEN** the host approval flow runs before any input is dispatched, and a denial aborts the action with no dispatch

### Requirement: Single in-flight driver call

The plugin SHALL serialize calls to the backend: while one action is in flight, a concurrent call waits (bounded) rather than interleaving, preserving capture-then-act ordering and sticky-target integrity.

#### Scenario: Concurrent calls do not interleave

- **WHEN** two tool calls race while one driver action is in flight
- **THEN** the second waits for the first to settle (up to a bound) and both observe a consistent sticky target
