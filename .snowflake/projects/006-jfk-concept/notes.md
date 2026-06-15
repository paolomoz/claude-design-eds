# Notes — 006 jfk-concept (scripted/slotizer, render-first) — 100% fidelity

Source: file:///Users/paolo/Downloads/JFKAirport/JFK Concept.html — React SPA.
contentRoot=#root>div (no <main>; blocks are direct children).

## New ground
- `rewriteToSection`: the hero is a <div class="hero"> -> rewritten to <section>
  so the engine matches it as a block (tag swap only; attrs/inner untouched).
- 5 sections collide on first class "block"; disambiguated via section-selector
  index + :not(.tint): waits/guide/essentials/redev/access/news.
- Inter-section <div class="wc-strip"> (World Cup band) preserved by contiguous main.
- Nested decorative span fix: .guide-label contains <span class="arr">→</span>;
  used wrapText so only the label text is authorable and the arrow stays in the
  template (keeps DA cells free of classed spans — caught by self-check).
- 41 slots / 7 sections / 15 image-slots.

## Round-trip — EXACT (100% fidelity)
Local: overlay=test-6, 7 sections, bodyText **2950 = 2950**, scrollH **4071 = 4071**
(zero delta — no <main> wrapper, unlike test-5), 15 image-slots, wc-strip present,
header/footer present, react=false. Only console error: harmless sidecar 404.

## Process note (speed)
One self-inflicted detour: forgot to copy styles/scripts to repo paths in the wire
step -> CSS 404 -> body hidden (scrollH 0). Caught by the exact-baseline compare.
Fix for the productionization driver: wire ALL of {template,fragments,styles,
scripts,drafts} in one atomic step.
