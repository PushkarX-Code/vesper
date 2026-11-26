# Handoff: Agent and Code workspaces

The Agent and Code tabs are now real workspaces. They share the chat thread and the same composer with Chat. Only the right panel changes. Do not bring back the In development screen.

## Layout

- `body[data-space="agent"]` and `body[data-space="code"]` turn `.app` into a two column grid. Column one holds the header, chat thread and composer. Column two holds `#spaceView`.
- Code uses a 520 px right panel, Agent uses 420 px. `spaceHead()` adds the title, subtitle and collapse button. `toggleSpacePanel()` sets `S.spaceCollapsed`, adds `body.space-collapsed` and narrows the panel to a 44 px rail. The header also has a toggle button.
- `.sp-body` is the only scrolling area in the panel. It uses the same theme variables as the app. No new overlay colors.

## Agent, right panel

- Goal card: `S.agent.goal`, set or edited with `setAgentGoal()`.
- Ask for a plan: `askAgentPlan()` sends a numbered plan prompt to the chat and sets `S.agent.awaiting`. At the end of `generate()` the reply is parsed into numbered or bulleted lines and appended to `S.agent.steps`. Nothing is run. The wording says do not run anything.
- Mind map: `renderAgentPanel()` renders root steps with `agentNode()`. Each node is a `details` element, so it is collapsible. Inside are status dot, label, note, Add note and Add substep. Status cycles todo, doing and done with `agentCycle()`. Edit and delete are real. Substeps use `parent` and render inside their parent node.
- Timeline: every step also appears as a collapsible `details.tl-item` with its time and note, sorted by time. Both the mind map and the timeline live in the right panel.
- Steps stay on this device in `S.agent.steps`.

## Code, right panel

- File tabs from `S.codeFiles`, plus a New file button. `S.codeActive` is the open file.
- Toolbar: New file, Rename, Copy, Download, Ask Vesper and Delete. All are real. Ask Vesper puts the file content into the message box as a fenced code block; it does not send by itself.
- Editor: a textarea with a live line number gutter, scroll sync, two space Tab, and changes saved to `S.codeFiles` on every input.
- Every fenced code block in an assistant reply gets an Open in editor button through `decorate()`. `inner` click handling routes `.code-edit` to `openCodeBlock()`, which creates a `snippet.<ext>` file, switches to Code and expands the panel.
- Files are stored in this browser. Nothing is uploaded.

## Checks

1. Switch Chat, Agent and Code. The composer and chat stay in place; only the right panel changes. No layer opens.
2. Agent: set a goal, add a step, add a substep, change status, add a note, collapse and expand nodes, confirm the timeline shows the same step with its time. Reload and confirm it persists.
3. Ask for a plan with a model connected and confirm numbered lines from the reply become steps. The plan text never claims that tools ran.
4. Code: create, rename and delete a file. Type code and confirm line numbers and saved content survive a reload. Test Copy, Download and Ask Vesper.
5. Collapse both panels from the panel button and from the header button. Confirm the chat column expands and a single click restores the panel.
6. Phone 412 by 915: the right panel must not cover the composer. Collapse it when space is tight.
7. No dashes in new copy, no serif or monospace labels, and no new overlay colors.
