# Learnings — 001 wheeler-cat-home

## Generic (promote to skill knowledge/learnings.md)

### Custom image web-components → vendor the component, mark slots `data-slot-skip`
A source page may use a custom element for images (here `<image-slot>` from
`image-slot.js`, a drag-drop placeholder backed by a `.image-slots.state.json`
sidecar via `window.omelette`). Outside its host runtime the component is
read-only and just paints placeholders; its sidecar `fetch` 404s and is caught.
Best page-level handling: vendor the component JS into
`/scripts/<tpl>-animations.js` so placeholders render 1:1, and mark each element
`data-slot-skip="placeholder"`. The overlay engine has no attribute-slot writer
for custom elements, so the element's `src` is NOT directly authorable. When the
source ships zero real images (all placeholders), this is fully faithful. Note
the residual harmless console 404 for the sidecar in the round-trip report so it
isn't mistaken for a regression.

### Derive the DA doc FROM the finished template (single source of truth)
Instead of hand-writing slot values twice (template defaults + DA rows), generate
the DA body fragment by parsing the template: for each `data-slot` (excluding
`data-slot-skip`), capture its section's first class + the element's innerHTML.
Guarantees exact slot-name parity and identical default/authored values. Keep
each slot-host's innerHTML to plain text or a single preserved inline tag
(`<em>`) so a simple "first `</tag>` after open" extractor is reliable.

### Wrap editable text in a slot-host; keep decorative markup in the template
For elements mixing text with SVG icons, `<small>` labels, or styled spans, do
NOT slot the whole element (the writer overwrites innerHTML, losing the chrome,
and DA strips `<span class>`). Instead wrap just the text run in a plain
`<span data-slot>` (or `<b>`/`<div>`) inside the template — the host's classes/
siblings stay in the code-bus template, only the text becomes a DA cell. Lets
SVG-laden CTAs, icon+text spec rows, and `$price<small>…</small>` stay
pixel-perfect while their text is authorable.

### Styled `<span>` INSIDE a slot value → rewrite to `<em>` + CSS
A `<span style="color:…">word</span>` that lives inside a slotted heading/text
value gets stripped on DA normalization (loses the color). Rewrite to `<em>` and
move the styling to CSS (`.sel em{color:…;font-style:normal}`). `<em>` is in the
DA preserve-list; a styled/classed span is not. (A styled span used as the slot
HOST element is fine — only spans inside cell VALUES are at risk.)

### delayed.js loads CDN motion deps for ANY animations engine
The substrate's delayed.js HEAD-probes `/scripts/<tpl>-animations.js` and, if
present, loads GSAP+ScrollTrigger+Lenis from CDN before it. A template that ships
an animations file purely for non-GSAP behavior (here: image-slot + menu + scroll
shadow) still pulls those deps in the delayed phase. Harmless (they no-op unless
called; Lenis may be ORB-blocked cross-origin and `Promise.allSettled` tolerates
it) but worth noting as wasted bytes. Possible future substrate option: a way to
opt out of CDN deps per template.
