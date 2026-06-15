# Notes — 004 fable-airways (scripted/slotizer, raw source)

Source: file:///Users/paolo/Downloads/Visrgin Atlantic Fable/Fable Airways Homepage.html
Festool-class: STATIC content (6 sections in source) + React tweaks panel to strip
+ external fable-styles.css + a tiny vanilla rewardToggle inline script. No render-first.

## Method (scripted)
maps/virgin.json (only hand artifact) -> slotize.mjs -> template+fragments+DA.
CSS = fable-styles.css verbatim. Animations = image-slot.js + rewardToggle behavior.
Strip: react/react-dom/babel + tweaks-panel.jsx + fable-tweaks.jsx + #tweaks-root.

## New ground
- First use of `repeats: []` (multiple repeat groups in one section): the `flying`
  section has .cabin-card x3 AND .wide-card x2.
- 54 slots / 6 sections / 11 image-slots.

## Round-trip
**Local — PASS, 0 console errors.** overlay=test-4, 6 sections, bodyText 2709 +
scrollH 4069 (IDENTICAL to source baseline), 11 image-slots, header/footer present,
react=false (tweaks stripped). h1 "Every journey is a story." (<em> accent preserved).
