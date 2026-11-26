# Handoff: full Settings detail

The owner asked for every detail from the OpenCode Preferences screenshot in Vesper Settings, without removing what was already there. This file records how each request was mapped so a design pass can adjust the layout without deleting working behavior. No feature is faked: a row either changes real state or says plainly that it is a note.

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

## Design checks

1. Desktop docked at 1024 and 1440. Open Settings, confirm the menu lists every section in the order above, each section opens alone, and no row has a centered card look. Keep sections and rows flat with a label left, a control right, and thin dividers.
2. Phone 412 by 915. Settings is one scrolling page. Every control is reachable and at least 40 px tall. The Gear icon is still the Settings gear.
3. Toggle Interface layout, Agent and Code spaces, Spellcheck, Wrap long lines, Reduce motion and Update notices. Reload the app and confirm each choice persists.
4. Set Follow up behavior to Queue, send a message while a reply is streaming, and confirm the next message waits and sends to the same chat. Steer must still stop the current reply.
5. Set Submit messages with to Ctrl Enter. Plain Enter must add a new line and Ctrl Enter must send.
6. Open Keyboard shortcuts and Licenses from Help, and check they stay inside the Settings window on desktop.
7. Search for layout, model, queue and cache in the Settings search box. Results must match rows across sections.
8. No Live Characters text or entry anywhere. No dashes in new copy. No monospace for row labels.

## Do not revert

The row helpers are `glabel()`, `gnote()`, `group()`, `row()`, `switchRow()`, `ctlRow()`, `seg()` and `dropdown()`. There is only one `seg()` definition and callers pass objects with `id` and `label`. Modal backdrop clicks call `closeTop()` once. Anchored menus divide rects by display zoom. Studio draws are serialized with `drawSeq`. Imported model ids go through `modelKey()`. Messages carry `at` so weekly token use follows message time. The earlier full screen work is documented in `FULLSCREEN_HANDOFF.md`.
