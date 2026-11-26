# Handoff: Settings, current state and history

## Current state

All Settings sections are back in the left menu: General, Account, Usage, Appearance, Your Vesper, Chat, Capabilities, Providers, Models, Timeline, Create, Extensions, Server, Pairing, Browser, Notifications, Sounds, Shortcuts, Privacy, Data, Experimental, Help and About. The left menu stays fixed and only the right pane changes. Provider and model rows render inline instead of opening a layer over Settings.

Implementation contract:

- `openSettings()` creates `makePage("Settings", renderSettingsRoot, {modal:true})` and calls `settingsNav(L)`.
- `settingsNav(L)` builds the full menu from the `.glabel` headings in the rendered body, with search and the section dividers. It also creates a hidden `viewBox` for inline views.
- Clicking a menu button shows only that section. Search looks across all sections.
- `settingsGo(view)` calls the active settings layer's `settingsNavApi.view(view)`. Provider and model rows use it: provider keys, the model picker, Manage models, Local models, Add a local model and the advisor all render in `viewBox` through `renderSettingsView()`.
- `inlineLayer(render, into, after)` clears the pane and calls the same render function the standalone page uses. Existing page functions accept `{into, nav}` so their logic stays in one place.
- Each inline view has a Back row inside the right pane that returns to its section. The left menu buttons remain available while an inline view is open.
- `L.refresh` rebuilds the sections, reattaches `viewBox` and restores the current inline view. On a phone the menu sits in a horizontal bar above the right pane; on desktop it is the fixed left rail.
- Theme consistency: `.page.modal .group` is transparent, `.dialog` uses `var(--sheet)` instead of a hard coded dark color, and tinted details panels use `var(--sheet)`. Do not add new overlay background colors. Modals, dialogs, sheets and panes must read as one surface.

Checks after any change: open Settings, confirm every section above appears in the menu; click a provider key row and a model row and confirm the layer stack stays at `["Settings"]`; add a local model from the Models section and confirm the form appears in the right pane; use Back and confirm the section returns; reload and confirm no theme surface has a different color.

## History

The rest of this file records the earlier detailed Settings work. Those sections are no longer in the product, but the behaviors listed under chat, notifications, timeline, wake lock and code font remain in the code and should not be deleted.

## Sections in order

`General`, `Account`, `Usage`, `Appearance`, `Your Vesper`, `Chat`, `Capabilities`, `Models`, `Create`, `Extensions`, `Server`, `Browser`, `Notifications`, `Privacy`, `Data`, `Desktop app` on Windows, `Help`, `About`.

Menu icons come from `settingsNav()` `ICON`. The Settings gear stays the Lucide `#i-settings` gear. On wide screens Settings is a floating window with the section menu at left and one section visible at a time; search looks across all sections. On a phone all sections are listed in one scrolling page.

## Mapping from the reference screenshot

| Screenshot row | Vesper setting | State and code |
| --- | --- | --- |
| Interface layout, Top tabs / Side tabs / Inbox | Interface layout, Docked / Rail / Focus | `S.layout`, `setLayout()`; changes `S.sideOff` and, for Focus, turns the details panel off |
| Keep side panel open across sessions | Keep details panel open | `S.insp`, `setInsp()` |
| Language | Language note, English | Informational row. Vesper has no translation layer yet |
| Default environment | Space at start, Chat or Last used | `S.startSpace`, `S.lastSpace`, applied at boot and saved by `setSpace()` |
| Auto accept permissions | Permissions note | Informational row. Vesper only asks for the microphone on voice input |
| Show agent | Show Agent and Code spaces | `S.spacesOn`, `setSpaces()`, `body.no-spaces`, switches back to Chat if one of those spaces was open |
| Follow up behavior, Steer | Follow up behavior, Steer or Queue | `S.follow`, `queued`; Steer stops the current reply, Queue holds the message and sends it from `generate()` when the reply ends, same chat only |
| Submit question answers with | Submit messages with, Enter or Ctrl Enter | `S.sendKey`, input keydown handler. Shift Enter always inserts a new line |
| Pinch to zoom | Pinch to zoom note | Informational row pointing at browser zoom and Display scale |
| Spellcheck | Spellcheck | `S.spell`, `applyWriting()` sets `input.spellcheck` |
| Wrap lines | Wrap long lines | `S.wrap`, `applyWriting()` sets the textarea wrap attribute and white space |
| Help and feedback | Help and feedback | Mail to support@nodefolds.com with a Vesper feedback subject |
| Appearance, Notifications, Providers, Models, Projects, About | Same names in the menu | Existing sections, kept unchanged and extended with detail rows |
| Extensions | Skills and requested apps | `openSkills()`, `openApps()` and a count of `S.waitlist` app requests |
| Server | Local connections and Cloud providers | `openLocal()`, `openProviders()` with connection counts |
| Browser | Install Vesper, Offline files, Open the website | Install note, `clearOffline()`, link to vesper.nodefolds.com |
| Worktrees, Pairing, Experimental | Not copied literally | These are development tool ideas and do not exist in Vesper. Agent and Code appear only as spaces marked In development |

## Added utility rows

Account has Account type and Plan. Usage has Storage used (`storageUsed()` via `navigator.storage.estimate()`) and Reset usage counts. Appearance has Reduce motion (`S.calm`, `applyCalm()`). Your Vesper links to Characters. Chat has the details panel, collapsed sidebar and message actions. Capabilities has Model in use, Voice input and Attachments. Models has shown and hidden model counts, Find your model and Discover models. Create has Studio, Library and Projects. Notifications has Update notices (`S.updOff`, checked in `checkUpdate()`). Privacy has private chats and API key notes. Data has chats and characters counts, Clear the library (`clearLibrary()`), Clear offline cache and Reset profile. About has privacy policy, terms, source code and Licenses (`openLicenses()`).

## Second pass: the remaining screenshots

The owner sent seven more Preferences screens. They were mapped as follows, again with no fake controls.

| Screenshot | Vesper setting | State and code |
| --- | --- | --- |
| Pinch to zoom switch | Pinch to zoom | `S.pinch`, `applyPinch()` changes the viewport meta tag. Zoom in Appearance remains available |
| Timeline detail slider and Advanced grid | Timeline section | `S.tlLevel` from Quiet to Custom, `applyTimeline()` sets `tl-` body classes. Custom shows seven switches in Shell, Edits, Thinking, Memory notes, Errors, Model name and Attachments. OpenCode only ideas such as subagents and notices are not invented |
| Timeline width | Timeline width | `S.tlWidth`, Comfortable, Wide or Full, controls `.thread-inner` width |
| Background activity | Background activity | `S.bgActivity`, Details panel or Hidden, uses `setInsp()` |
| Color scheme | Color scheme note | Vesper follows the chosen theme. Dark is the default. No extra theme options added |
| Theme, UI font, Code font, Terminal font, Zoom, Reduce motion | Theme, UI font note, Code font, Terminal font note, Zoom, Reduce motion | `S.mono` changes `--mono` for code blocks. `S.calm` is System, Off or On and follows `prefers-reduced-motion` on System. No terminal exists, so that row says so |
| Desktop notifications for Agent, Permissions, Questions and Errors | Reply finished, Reply failed, Needs attention | `S.notify`, `notifyEvent()`. System notices only show when the app is in the background and permission is granted |
| Sound effects for each event | Sounds section | `S.sound`, `playSound()` makes short tones with Web Audio. Nothing is downloaded. Options are None, Chime, Tap and Low |
| Shortcuts search and Reset to defaults | Shortcuts section and a searchable shortcuts page | `openShortcuts()` filters the list and resets `S.sendKey` and `S.enter` |
| Providers with connected list, popular list and Show more | Providers section | `PROVIDERS`, `S.showProviders`, `openProvider()`. Three providers show first, five after Show more. Each row shows API key or Add key |
| Pair a device, Remote access, Keep screen active | Pairing section | `openLocal()` for local servers, a note that no public server is opened, and `S.wake` with the Wake Lock API during local model replies |
| Tab groups, Organize vertical sidebar, New timeline, New question UI | Experimental section | `S.groupChats`, `S.sideOrder`, `S.tlLevel` compact switch and `S.ideas`. All four are real chat and sidebar behaviors. The OpenCode names for tabs and question docks are not copied |

Menu groups now add dividers before Appearance, Providers, Sounds, Experimental, Desktop app and Help. The menu order ends with Experimental, Help and About.

## Design checks

1. Desktop docked at 1024 and 1440. Open Settings, confirm the menu lists every section in the order above, each section opens alone, and no row has a centered card look. Keep sections and rows flat with a label left, a control right, and thin dividers.
2. Phone 412 by 915. Settings is one scrolling page. Every control is reachable and at least 40 px tall. The Gear icon is still the Settings gear.
3. Toggle Interface layout, Agent and Code spaces, Spellcheck, Wrap long lines, Reduce motion and Update notices. Reload the app and confirm each choice persists.
4. Set Follow up behavior to Queue, send a message while a reply is streaming, and confirm the next message waits and sends to the same chat. Steer must still stop the current reply.
5. Set Submit messages with to Ctrl Enter. Plain Enter must add a new line and Ctrl Enter must send.
6. Open Keyboard shortcuts and Licenses from Help, and check they stay inside the Settings window on desktop.
7. Search for layout, model, queue and cache in the Settings search box. Results must match rows across sections.
8. No Live Characters text or entry anywhere. No dashes in new copy. No monospace for row labels.
9. Move the Timeline detail slider through all five stops. Quiet hides actions and notes, Normal looks like today's chat, Custom reveals the seven switches. Confirm the advanced switches hide only their own part of a reply and reload to confirm persistence.
10. Switch Timeline width and Background activity. Narrow, wide and full widths must not crop code blocks. Hidden must close the details panel.
11. Turn on the three notification switches. The browser asks for notice permission once. A failed reply and a finished reply should each give one notice only when Vesper is in the background. Preview a sound and confirm each sound choice plays that tone.
12. Open Keyboard shortcuts, search for sidebar and confirm only the matching row remains. Reset to defaults restores Enter to send.
13. In Providers, Show more must reveal Google Gemini and Mistral and Save must persist the choice. In Pairing, Keep screen active must only hold a wake lock while a PC model replies.

## Do not revert

The row helpers are `glabel()`, `gnote()`, `group()`, `row()`, `switchRow()`, `ctlRow()`, `seg()` and `dropdown()`. There is only one `seg()` definition and callers pass objects with `id` and `label`. Modal backdrop clicks call `closeTop()` once. Anchored menus divide rects by display zoom. Studio draws are serialized with `drawSeq`. Imported model ids go through `modelKey()`. Messages carry `at` so weekly token use follows message time. The earlier full screen work is documented in `FULLSCREEN_HANDOFF.md`.
