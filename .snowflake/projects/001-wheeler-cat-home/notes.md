# Notes — 001 wheeler-cat-home

## Phase: Capture

Copied `Wheeler CAT Homepage.html` → `input/index.html` (clean source, 42 KB)
and `image-slot.js` → `input/image-slot.js`. The "(offline).html" bundle was
rejected as a source: its DOM is escaped inside a 418 KB JS string behind a
JS-required loader — both files render pixel-identical (verified via Playwright),
so the clean source is the right input.

## Phase: Analyze

### Structural map (source line numbers)

```
Line     Element                                  Role
───────  ───────────────────────────────────────  ─────────────────
7–9      <link> Google Fonts (Barlow families)     head-links to lift
10       <script src="image-slot.js">              vendor into animations JS
11–24    <template id="__bundler_thumbnail">        strip (bundler artifact)
25–314   <style> (inline)                           → styles/test-1.css
318–332  .utility bar                               header fragment
334–371  header.site + nav.primary                  header fragment
373–391  <section class="hero">                     main / overlay section
393–417  <section class="quick">                    main / overlay section
419–449  <section class="used" id="used">           main / overlay section
451–490  <section class="stats">                    main / overlay section
492–516  <section class="service" id="service">     main / overlay section
518–559  <section class="offers">                   main / overlay section
561–575  <section class="brands">                   main / overlay section
577–602  <section class="locations">                main / overlay section
604–659  <footer>                                   footer fragment
661–683  <div id="mnav"> mobile menu                footer fragment
685–735  <script> (inline behavior + card builder)  → animations JS (card
                                                       builder dropped; cards
                                                       pre-rendered in template)
```

No `<main>` in source → **synthesize `<main>`** around the 8 sections.
All 8 section first-classes are already unique (hero, quick, used, stats,
service, offers, brands, locations) → no disambiguation needed.

### The `<image-slot>` custom element (decisive analysis)

12 `<image-slot>` elements (7 static + 5 that the inline script generated for
the used-equipment cards). Defined in `image-slot.js`: a web component that
renders a drop-zone placeholder (dashed ring + caption) and stores dropped
images in a `.image-slots.state.json` sidecar via `window.omelette`. Key facts
from reading the source:

- **No real images exist** — every slot is an empty placeholder. The "design"
  in its current state IS the set of placeholders.
- Outside the `window.omelette` runtime the component is **read-only** and just
  paints placeholders. The sidecar `fetch` 404s and is swallowed (`.catch`).
- It reads an author-controlled `src` attribute, but the overlay engine has no
  attribute-slot writer for custom elements (`architecture.md`: attribute slots
  are not exposed).

**Decision:** vendor `image-slot.js` into the animations JS so the placeholders
render 1:1, and mark every `<image-slot>` with `data-slot-skip="placeholder"`
(kept, never authorable). Images are NOT DA-authorable in this conversion —
acceptable because the source ships zero images. Noted as a follow-up option:
convert hero/offer backdrops to background-image slots if image authoring is
wanted later.

### Slot plan (text authorable; decorative markup stays in template)

Pattern: wrap only editable text in a slot-host element; keep all SVGs, the
`<small>` finance label, etc. in the template. Slot names are scoped per
section (engine matches by section first-class).

- **hero**: promo-tag, promo-date, promo-blurb, headline-1, headline-accent,
  headline-2 (h1 split into spans; `.hl`/`<br>` stay in template), lede, cta-1, cta-2
- **quick**: q-1-title…q-5-title, q-1-sub…q-5-sub (10)
- **used**: eyebrow, title, intro, viewall, browse + per card (×6):
  card-N-badge, card-N-title, card-N-hours, card-N-loc, card-N-price (35)
- **stats**: title (styled `<span>`→`<em>`), intro + 7×(stat-N-num, stat-N-lab) (16)
- **service**: eyebrow, title, body, cta-1, cta-2, badge-num, badge-label (7)
- **offers**: eyebrow, title, viewall + 3×(offer-N-tag, offer-N-title) (9)
- **brands**: title, intro + brand-1…brand-6 (8)
- **locations**: eyebrow, title, intro, cta + city-1…city-12 (16)

Header, footer, nav, utility bar, mobile menu, filter chips, and quick-action
icons/links are static (fragments + chrome are not part of the DA slot model).

### Decisions surfaced by analysis

1. `conversionLevel = page-level` (user-specified `level=page`).
2. Synthesize `<main>`; no first-class collisions.
3. `assetStrategy = vendor` — but there are **no binary assets** to vendor
   (no images; SVGs inline; fonts via Google CDN). So effectively nothing is
   copied to `/assets/`. Google Fonts links are lifted to the template head.
4. Strip the `<template id="__bundler_thumbnail">` bundler artifact.
5. Pre-render the 6 used-equipment cards as static HTML (drop the JS card
   builder) so each field is authorable.
6. Convert the one styling `<span style>` inside a slot VALUE (stats h2 "Iron")
   to `<em>` + CSS, since DA strips span styling inside cells.

### Block-level feasibility (assessment only — level forced to page)

| Section   | structure | cssScope | contentModel | jsIndep | visualIndep | verdict |
|-----------|-----------|----------|--------------|---------|-------------|---------|
| hero      | pass | partial (shared `.btn`,`.wrap`) | pass | fail (shared scroll/menu script) | pass | page |
| quick     | pass | partial | pass | pass | pass | page |
| used      | pass | partial | pass | fail (card builder + filter JS) | pass | page |
| stats     | pass | pass | pass | pass | pass | page |
| service   | pass | partial | pass | pass | pass | page |
| offers    | pass | partial | pass | pass | pass | page |
| brands    | pass | pass | pass | pass | pass | page |
| locations | pass | pass | pass | pass | pass | page |

Most sections share global utility classes (`.btn`, `.wrap`, `.sec-head`,
`.eyebrow`, `.cond`) and the page relies on one shared inline script — CSS and
JS are not section-independent. Recommendation would be **page-level** anyway,
which matches the requested level.
