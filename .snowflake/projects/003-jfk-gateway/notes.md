# Notes — 003 jfk-gateway (FIRST scripted/slotizer run)

Source: file:///Users/paolo/Downloads/JFKAirport Fable/Gateway Homepage Prototype.html
A 100% React/JSX runtime-rendered page (static HTML is just <div id="root">).

## Method — scripted path (validates the slotizer end-to-end)
1. Served folder over HTTP (Babel fetches app/*.jsx; file:// CORS-fails).
2. Rendered with Playwright, captured document DOM → input/index-rendered.html
   (RENDER-FIRST: raw source has 0 sections; all content is React-built).
3. Authored maps/jfk.json (the only hand-written artifact: contentRoot, 8 sections,
   slots, 4 repeats, 3 firstClass rewrites). ~110 lines.
4. node slotize.mjs --src index-rendered.html --map jfk.json → template + fragments + DA doc.
5. CSS = app/tokens.css + app/styles.css concatenated → styles/test-3.css.
   Animations = image-slot.js (React interactivity is NOT ported — design frozen
   to a static, authorable overlay; search tabs / carousel arrows become inert).
6. Wired, lint clean, round-trip.

## New ground this case exercised
- contentRoot = "#root > div" (React mount wrapper, not <body>).
- main = contiguous span between first/last section → preserved the inter-section
  <div class="gtw-toolkit-band"> search bar (not a <section>).
- First-class collision on "wrap" across 3 sections → rewritten to gtw-essentials
  / gtw-access / gtw-news (move-to-front dedup).
- 53 slots, 13 image-slots, 8 sections.

## Round-trip
**Local — PASS.** overlay=test-3, 8 sections [gtw-hero..gtw-news], bodyText 2847 +
scrollH 3667 (IDENTICAL to source baseline), 13 image-slots, toolkit-band present,
header/footer present, react=false. Single harmless image-slots.state.json 404.
