# Handoff: full screen sections and shipped technical fixes

This file is for the design and frontend pass. It records the exact technical state so a design change does not undo a fix.

## Product decision

- **Live Characters is removed.** No sidebar entry, landing page, support perk, or README section. The old images `docs/studio-live.webp` and `studio/{aurelia,seraphine,scarlet}.webp` are unused and safe to delete.
- **Characters, Learn, and Studio (Create) are full screen pages**, like Chat. They are not centered modal cards on desktop, including when opened from Settings or a Learn guide.

## How full screen is enforced

`makePage(title, render, opts)` in `index.html`:

```js
const full = !!(opts && opts.full);
const under = !full && stack.some(l => l.el.classList.contains("modal"));
const modal = !full && docked() && (!!(opts && opts.modal) || under);
```

Call sites that pass `{full:true}`:

| Section | Function | Expected layer label |
| --- | --- | --- |
| Characters | `openCompanions()` | `Characters` |
| Learn home | `openLearn()` | `Learn` |
| Learn guide | `openGuide()` | guide title |
| Studio | `openStudio()` | `Studio` |

CSS that matters:

- `.page` is full screen by default (`position:fixed; inset:0`).
- `body.dock .page:not(.modal)` fills the area beside the docked sidebar; `.on` makes it visible.
- `.page.modal` is the centered desktop card. Full pages must not get this class.
- `.studiopg` keeps Studio's zero padding and its own prompt bar (`.sbar`) pinned to the bottom.

Design checks to run:

1. Desktop docked at 1024 and 1440: Characters, Learn, a guide, and Studio should each fill the content area and show a back chevron, not an X or a floating card.
2. Phone 412 by 915: the same pages slide in edge to edge; header, body scroll, and bottom safe area behave like Chat.
3. Open Characters from a Learn guide and from Settings. The page must stay full screen in both cases.
4. Studio's `.sbar` must stay visible while `.page-body` scrolls; one Create action must add one project tile, not two.
5. No `Live Characters` text, entry, or `Soon` tag anywhere in the app.

## Fixes already applied in `index.html`; do not revert

- Removed the second `seg()` definition. All callers pass objects (`{id,label}`); the old array version at line 2267 broke Add a local model, Response style, and Find your model with `object is not iterable`.
- Modal backdrop click calls `closeTop()` once, not once per modal layer.
- Anchored menus (`menu()`) divide anchor rects and the popup rect by the body zoom factor, so they line up at 75 to 150 percent display scale.
- Studio grid draws are serialized with `drawSeq`; an older `mediaAll()` result can no longer append duplicate tiles.
- Imported chats normalize old bare model IDs with `modelKey()` instead of silently losing model attribution.
- User and assistant messages carry `at: Date.now()`; weekly token usage now filters by message time, with chat time as fallback for old data.

## External dependency note

The Support page calls `https://vesper-chat.netlify.app/api/support`, which currently returns 502 because the Orbyn Netlify team paused production deploys for lack of credits. The bundled function fix is in `netlify/stage.mjs`, but it cannot be published until billing resumes. This is not a frontend bug. Fetch failures in `openSupport()` are silently ignored, so the page shows `$0 raised` while the endpoint is down.
