# Remediation — 003 jfk-gateway (test-3)

Source findings: `.audit/test-3/findings.json` (validator: impeccable) · adapter: snowflake-overlay
Date: 2026-06-16

## Applied / proposed

| finding | sev | lane | file | change | validation | status |
|---|---|---|---|---|---|---|
| mobile-horizontal-scroll | P1 | AUTO | styles/test-3.css | `.gtw-footer-grid`→`1fr 1fr` & `.gtw-footer-base`→column under @960; clamped event type | Re-measured @375px: scrollWidth 376 ≈ 375, no document h-scroll | ✅ closed |
| fixed-event-display-type | P3 | AUTO | styles/test-3.css | `.gtw-event-line` `clamp(22px,6vw,30px)`; `.is-big` `clamp(40px,11vw,58px)` | Served CSS confirmed; no overflow | ✅ closed |
| no-custom-focus-state | P3 | AUTO | styles/test-3.css | Added `:focus-visible` ring (2px signal, offset 2px) for a/button/input | Focused `.gtw-nav-icon` → outline `2px solid oklch(0.72 0.17 50)` | ✅ closed |
| small-touch-targets | P2 | AUTO | styles/test-3.css | `.gtw-nav-icon` 34→44px; `min-height:44px` on `.tk-pill`/`.tk-tab`/`.gtw-waits-tabs button` | Re-measured @375px: 0 toolkit/nav controls <44px | ✅ closed |
| mobile-nav-disappears | P1 | ASSIST | fragments/test-3/header.html + styles/test-3.css + scripts/test-3-animations.js (+ scripts/scripts.js engine wiring) | Added hamburger → native `<dialog>` drawer (top-layer, native Esc/focus-trap), slide-in w/ reduced-motion fallback, document-level event delegation. Required wiring per-template JS loading into the overlay engine (see engine row) | @375px: opens on click, closes on Esc/link/backdrop, aria-expanded syncs, focus returns to toggle; toggle hidden ≥961px | ✅ closed |
| eyebrow-every-section | P2 | ASSIST | templates/test-3.html + styles/test-3.css | Dropped 2 generic eyebrows (Welcome, Stay up to date); kept FIFA World Cup as the single deliberate kicker; promoted News eyebrow → `<h2>` (also fixed an h3-without-h2 hierarchy gap) | Rendered eyebrows now = [FIFA World Cup 2026™]; News h2 present; hierarchy clean | ✅ closed |
| overlay-engine-no-per-template-js | — | ARCH→applied | scripts/scripts.js | Engine loaded per-template CSS but never the per-template behavior JS, so `scripts/<t>-animations.js` never ran (mobile-nav handler dormant, all `<image-slot>`s inert). Added fire-and-forget `import()` of `/scripts/<t>-animations.js` in `applyTemplateOverlay`, mirroring the CSS load. **User-confirmed** shared-engine change | eslint clean; image-slot now defined; drawer handler runs | ✅ closed |
| empty-image-slots | P1 | ARCH | (image assets) | 13 `<image-slot>` placeholders render blank; needs real authored/committed images — never faked | proposed | ⏭ ARCH |
| image-slot-bypasses-eds | P2 | ARCH | scripts/test-3-animations.js + engine | Replace vendored image-slot component with EDS `<picture>`/`<img>` so the pipeline optimizes imagery | proposed | ⏭ ARCH |

## Residual
- `mobile-horizontal-scroll`: the guides carousel (`.gtw-guides-rail`, `overflow-x:auto`) and clipped toolkit (`.tk`, `overflow:hidden`) extend past the viewport by design — they do **not** create document horizontal scroll (verified). No action.

## Deferred by lane
- **ASSIST (0):** both applied this pass (mobile-nav-disappears, eyebrow-every-section).
- **ARCH (2, still open):** empty-image-slots, image-slot-bypasses-eds — require real image assets; proposed, not applied. NOTE: image-slots are now *functional* (engine loads the component), so they will accept dropped/`src=` images — but they still render empty until real assets are supplied.

## Notes
- `styles/test-3.css` is vendor-exempt (in `.stylelintignore`); only a syntax/parse gate was run — passed clean.
- Pre-existing hook finding `layout-transition` on `.tk-lot-bar span { transition: width .4s }` (parking capacity-bar fill) is a vendored micro-animation, not introduced here — left as-is.
- Not committed (per autofix: never commit unless asked).
