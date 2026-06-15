# Notes — 005 meridian-airways (scripted/slotizer, render-first)

Source: file:///Users/paolo/Downloads/Virgin Atlantic 2/Meridian Airways Prototype.html
JFK-class: 100% React SPA (#root mount, meridian-app/components/pages.jsx + data.js).
CSS is INLINE in the shell <style> (19,690 chars) — no external file.

## New ground
- contentRoot = "#root > .md-app" containing real <header>/<main>/<footer>.
- 3 sections share first class "md-section", two of them IDENTICALLY classed
  (only positional difference) -> added section-selector `index` so the map can
  target the Nth match. Rewrote to md-destinations / md-cabins / md-loyalty.
- Inline-CSS extraction (vs external file in prior runs).
- 39 slots / 4 sections / 3 image-slots. React scripts auto-excluded (outside contentRoot).

## Round-trip
**Local — PASS, 0 console errors.** overlay=test-5, 4 sections [md-hero,
md-destinations, md-cabins, md-loyalty], bodyText 1955 (IDENTICAL to source),
3 image-slots, 3 dest + 3 cabin cards, header/footer present, react=false,
h1 "Chase the / light." (<br> preserved).
- scrollH 3013 vs source 2908 (+105px / +3.6%): minor vertical-spacing delta
  (EDS section/wrapper margins), no content difference (body text identical).
  Cosmetic; flagged for the productionization pass.
