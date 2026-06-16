# SEO & Discovery Audit — Meridian Airways (test-6)

**URL:** https://snowflake-blocks-test-6--claude-design-eds--paolomoz.aem.page/snowflake-blocks/test-6
**Page type:** Marketing landing page (airline brand / booking entry), statically rendered by EDS
**Audit date:** 2026-06-17
**Overall severity:** medium

## Executive summary

Good news first: despite the "JS-rendered booking flow" framing, this page is **not** content-gated behind JavaScript. The server-delivered HTML already contains all the substantive copy — hero, destinations, cabins, and loyalty sections are present in the static `<body>` and in the authored `.plain.html`. A crawler indexes the real content. That removes the biggest risk class for these interactive pages.

The remaining problems are real but mostly mechanical, and almost all trace back to the prototype→EDS conversion:

- **No `<h1>`** anywhere on the page. The hero headline "Chase the light." is plain text inside the `booking` block, and every other section uses `<h2>`. The document has multiple `<h2>` and no top-level heading — a clear hierarchy defect and a relevance signal lost.
- **No images at all.** Destination cards have empty image cells (`<div></div>`), and OG/Twitter fall back to the generic `default-meta-image.png`. Zero `<img>` means zero `alt` text and a weak social share card.
- **No `<html lang>`** attribute — document language is undeclared.
- **No structured data** (Organization / BreadcrumbList / ItemList for destinations) — a missed rich-result opportunity for an airline brand.
- **Placeholder links:** the two CTAs ("All destinations →", "Join Horizon Club") and point to `href="#"`, so there is no internal link equity or working navigation.
- **Empty favicon** (`<link rel="icon" href="data:,">`) — no brand mark in tabs or share contexts.

Dimensions that are **FINE**: title (length and quality), meta description (length and quality), canonical (self-referential and correct), Open Graph + Twitter tags (present and complete apart from the generic image), viewport, indexable content (statically present), semantic section structure, and heading text quality.

## Per-dimension findings

### Title — FINE
`<title>Meridian Airways — Chase the light</title>` — 33 characters. Brand + tagline, readable and unique. Slightly under the ~50–60 ideal, so there's room to add a descriptive keyword (e.g. "Flights from London"), but no defect.

### Meta description — FINE
`Nonstop from London to the places worth the flight time. Search flights, pick a seat, and book in a few taps.` — 109 characters. On brand, compelling, action-oriented. A touch short of the ~150–160 sweet spot but well within acceptable range.

### Canonical — FINE
`<link rel="canonical" href="https://snowflake-blocks-test-6--claude-design-eds--paolomoz.aem.page/snowflake-blocks/test-6">` — self-referential and correct for the preview host.

### Open Graph + Twitter — LOW
All core tags present: `og:title`, `og:description`, `og:url`, `og:image` (+ `secure_url`), `twitter:card=summary_large_image`, `twitter:title/description/image`. Only weakness: image is the generic project fallback `default-meta-image.png`, not a Meridian-branded share image.

### Structured data / JSON-LD — MEDIUM (absent)
No `<script type="application/ld+json">` anywhere. For an airline brand page, `Organization` (with logo/sameAs) and an `ItemList`/`OfferCatalog` for the three destination fares (New York £389, Barbados £449, Delhi £512) are natural fits, plus `BreadcrumbList`. None present.

### Indexable content — FINE (notable)
The page's substance is in the static HTML. The hero, all three destination cards with prices, all three cabin tiers, and the loyalty section are present in both the delivered `<body>` and the authored `.plain.html`. No JS gating. This is the opposite of the worst-case interactive-page scenario.

### Heading hierarchy — HIGH
No `<h1>` on the page. The hero headline "Chase the light." renders as `<div>Chase the<br>light.</div>` (plain text, not a heading). Three sibling `<h2>` elements ("Where the light is good right now", "Three ways up", "Points for every mile of sky") exist with no parent `<h1>`. Hierarchy is broken and the primary on-page relevance signal is missing.

### Document language — MEDIUM
`<html>` has no `lang` attribute (delivered as `<html>` with no attributes). Language is undeclared, which hurts accessibility (screen-reader pronunciation) and locale signals.

### Images / alt text — HIGH
Zero `<img>` elements in the delivered HTML. Destination cards carry empty image cells: `<div></div>` precedes "New York", "Barbados", "Delhi". A travel/destination page with no imagery is weak for both engagement and image-search discovery; and with no images there is no alt text to evaluate.

### Semantic HTML / internal links / anchor text — MEDIUM
Section structure is reasonable (`<main>` with sectioned blocks). But both links point nowhere: `<a href="#">All destinations →</a>` and `<a href="#">Join Horizon Club</a>`. No real internal links, no outbound destinations, so no crawl paths and no link equity. Anchor text itself is descriptive enough; the `href` is the problem. `<header>` and `<footer>` are empty in the static delivery (populated lazily), which is expected for EDS.

### Favicon / social readiness — LOW
`<link rel="icon" href="data:,">` is an intentionally empty data-URI placeholder — no favicon is served. Combined with the generic OG image, brand presence in tabs and shares is absent.

## Severity table

| Dimension | Severity | One-line issue |
|---|---|---|
| Heading hierarchy | high | No `<h1>`; hero headline is a plain `<div>`, only `<h2>`s exist |
| Images / alt text | high | Zero images; destination image cells are empty `<div></div>` |
| Structured data | medium | No JSON-LD (Organization / ItemList / BreadcrumbList) |
| Document language | medium | `<html>` has no `lang` attribute |
| Internal links / anchors | medium | CTAs point to `href="#"` — no working internal links |
| Open Graph / Twitter | low | Generic fallback share image, not branded |
| Favicon | low | Empty `data:,` favicon placeholder |
| Title | fine | Brand + tagline, could add a keyword |
| Meta description | fine | Good, slightly short |
| Canonical | fine | Correct, self-referential |
| Indexable content | fine | Fully static, not JS-gated |

## Prioritized fix list

1. **Add a single `<h1>`** — promote the hero "Chase the light." (or a keyword-bearing variant like "Meridian Airways — flights from London") to `<h1>` in the `booking` block source, so the page has one top-level heading above the existing `<h2>`s. (high)
2. **Add destination imagery with alt text** — fill the empty image cells in the `destinations` block with real images (`<img>` with descriptive alt, e.g. "Manhattan skyline at dusk"). EDS will auto-optimize. (high)
3. **Fix the placeholder links** — point "All destinations →" and "Join Horizon Club" at real internal pages instead of `#`. (medium)
4. **Declare language** — ensure `<html lang="en">` is emitted (project/EDS config or metadata). (medium)
5. **Add JSON-LD** — Organization + ItemList for the three fares + BreadcrumbList. (medium)
6. **Ship a branded OG image and a real favicon** — replace `default-meta-image.png` with a Meridian share image and replace the `data:,` favicon. (low)
7. **Lengthen title/description slightly** with a destination/route keyword for relevance. (low)

## Likely root causes (prototype→EDS conversion)

- **Missing `<h1>`:** the source prototype almost certainly styled the hero headline as a visually-large `<div>`/`<span>`; the conversion preserved it as plain default-content text rather than mapping it to an `<h1>`. Section `<h2>`s came through because they were authored as markdown headings.
- **Empty image cells / no images:** the prototype likely used CSS background images (or the converter dropped `<img>` assets), leaving empty leading `<div></div>` cells in the destination block where the picture should be.
- **No `lang`:** project `head.html` / EDS metadata did not set the document language.
- **`href="#"` CTAs:** placeholder anchors carried over verbatim from the static prototype; no real target pages exist yet.
- **Generic OG image + empty favicon:** the per-page `metadata` block didn't specify an `image`, so `head.html` fell back to `default-meta-image.png`, and the boilerplate `data:,` favicon was never replaced.
- **No JSON-LD:** the conversion skill emits title/description/canonical/og from the metadata block but does not generate structured data.
