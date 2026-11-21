# Vesper: rules for working on this repo

Vesper is a single file PWA chat app (`index.html`) served by GitHub Pages from `main`. No backend, no build step, no accounts, no analytics. Keys and chats live only in the browser's localStorage under `vesper.v1`.

## Owner's standing rules
- Free only. No paid services or paid dependencies (this is why fonts and scripts are self hosted in `fonts/` and `vendor/`).
- Settings is always shown with the real gear icon: the Lucide `settings` gear, symbol `#i-settings`. Never a sun, dial, sliders or any other icon for Settings.
- Fonts: Inter (standard AI app sans). No serif fonts anywhere, and no monospace for labels (monospace only inside code).
- No dashes in written copy: no hyphens between words and no en or em dashes, in the app, README or images. Short, direct wording.
- Neutral wording. No persona, roleplay or "uncensored" language anywhere.
- Never commit or paste API keys.
- Design: pure black, quiet, premium, Grok like feel but original. Accent blue `#6ea8ff` from the logo. The logo is `mark.webp`.
- Ships as a PWA (the owner cannot sideload APKs).

## How the UI works
- Every panel (drawer, bottom sheet, full screen page, dialog) is a layer opened with `open(id, factory, swap)` and closed with `closeTop()` or `closeAll()`. Layers sit in one stack mirrored in browser history, so Android back closes the top one.
- A layer ignores taps while it slides in (`.settling`) and the moment it starts closing. Opens requested during a close wait in a queue. Keep this, it fixes taps landing on the wrong thing.
- Models are keyed `provider::id` (see `mk()`). Discovered models start hidden; only shown models appear in the picker.
- Local models are OpenAI compatible connections in `S.conns`. Calls to private addresses pass `targetAddressSpace` so Chrome allows them from the https page.

## Releasing
- Bump `CACHE` in `sw.js` on every release, or phones keep the old copy.
- Test in a phone sized Playwright run (412 by 915) before pushing.
