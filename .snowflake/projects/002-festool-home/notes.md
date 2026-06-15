# Notes — 002 festool-home

## Capture
Source: file:///Users/paolo/Downloads/Festool/Festool Homepage.html (Stardust-style).
Copied index.html + festool-redesign.css (EXTERNAL stylesheet) + image-slot.js.
Baseline render: 5 sections, 11 image-slots, bodyText 2202, scrollH 4153,
h1 "Tabless. Extra power for your cordless tools.".

## Analyze
- No <main> → synthesize. Real <header>/<footer> tags.
- **First-class collision**: two <section class="section"> (New products, Discover Festool).
  Disambiguated via data-screen-label → first classes rewritten to `new-products`
  and `discover`; original `section`/`tinted` kept in the class list so CSS matches.
- **STRIP the React tweaks panel**: React + ReactDOM + Babel-standalone (unpkg CDN),
  tweaks-panel.jsx, both <script type="text/babel">, and <div id="tweaks-root">.
  It is a dev-only design tool (accent/hero/density). Safe to strip — the CSS
  defaults (:root --accent:#5FB12E, dark hero, comfortable density) match what the
  panel would set; [data-hero="light"]/[data-density="compact"] are the only
  attribute-keyed rules and are overrides, so absence renders the intended default.
  (Also drops the redundant data-hero/data-density on <html>, which the overlay
  can't set anyway since the template is injected into <main>.)
- External CSS festool-redesign.css → styles/test-2.css verbatim (no url() assets).
- image-slot.js + behavior (header shadow + .reveal IntersectionObserver, 500ms
  fallback) → scripts/test-2-animations.js. image-slots → data-slot-skip (same
  rationale as run 001 — no real images; not DA-authorable).
- 42 text slots across 5 sections.

## Round-trip
(filled after verification)

**Local — PASS.** overlay=test-2, 5 sections [hero, new-products, brand-band,
discover, service-band], bodyText 2202 + scrollH 4153 (identical to source),
React tweaks panel gone (reactPresent=false), header/footer present, fonts in
head. Only console error: harmless image-slots.state.json 404.
