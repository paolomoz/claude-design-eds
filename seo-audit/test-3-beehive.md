# SEO Audit — Beehive Brewing (test-3)

**URL:** https://snowflake-blocks-test-3--claude-design-eds--paolomoz.aem.page/snowflake-blocks/test-3
**Audited:** 2026-06-17
**Overall severity:** Critical

## Summary

Despite being labeled an "interactive beer selector," this page is **fully server-rendered** — every piece of substance (the five beers, story, taproom hours, address) is present in the static HTML a crawler sees before any JavaScript runs. That is the single bright spot: **indexable-content is fine**.

Everything in the `<head>` and the document semantics, however, is broken. The page has **no usable `<title>`** (it says "Hero"), **no meta description**, **no `<html lang>`**, a **placeholder favicon** (`data:,`), **no real heading elements at all** (zero `<h1>`–`<h6>` — all headings are plain `<div>`s), **no structured data**, and **Open Graph/Twitter tags that inherit the broken "Hero" title plus a default placeholder share image**. Canonical and viewport are correct, and internal anchor links have descriptive text.

The root cause is consistent: the page was converted by the snowflake prototype→EDS skill **without an authored `metadata` block**, so the `<head>` fields fell back to the first text node on the page ("Hero"). And the conversion emitted all typographic headings as styled `<div>`s rather than semantic `<hN>` elements, so the document has no heading outline and no `<h1>`.

### Dimensions that are FINE
- **Canonical** — correct self-referencing canonical.
- **Viewport** — `width=device-width, initial-scale=1` present.
- **Indexable content** — all real content is in the server HTML; nothing is hidden behind JS.
- **Internal links / anchor text** — "Taste the Hive", "Our Story", "Get Directions" are descriptive (though they only point to in-page anchors).

## Per-dimension findings

### title — CRITICAL
Delivered: `<title>Hero</title>`. The title is the literal word "Hero" (the first content block's text), not the brand or page topic. It is 4 characters (far below the ~50–60 target), non-unique-looking, and contains zero relevant keywords (no "Beehive", "Brewing", "Salt Lake City", "craft beer"). This is the most damaging single issue for search.
**Recommendation:** Author a `metadata` block with a title like `Beehive Brewing Co. — Small-Batch Craft Beer in Salt Lake City, Utah` (~58 chars).
**Root cause:** No `metadata` block authored; EDS derived `<title>` from the first text node ("Hero" — likely a leftover block/section name from the prototype conversion).

### meta-description — HIGH
No `<meta name="description">` is present at all. Search engines will synthesize a snippet from arbitrary page text.
**Recommendation:** Add a description (~150–160 chars), e.g. *"Beehive Brewing Co. brews small-batch craft beer a mile above sea level in Salt Lake City. Five rotating taps, a story born in a garage, and a taproom on Hive Alley."*
**Root cause:** Missing `metadata` block; no `description` row to populate the tag.

### open-graph — HIGH
`og:title` is `"Hero"`, `og:image` is the project default `/default-meta-image.png` placeholder, and there is no `og:description` or `og:type`. Shared links will show a meaningless title and a generic image.
**Recommendation:** Populate `og:title`/`og:description`/`og:image`/`og:type=website` via the `metadata` block (og:* derive from title/description plus an authored share image).
**Root cause:** og:* tags inherit from the (missing) title/description; default share image used because none was authored.

### twitter — HIGH
`twitter:title` is `"Hero"` and `twitter:image` is the default placeholder; no `twitter:description`. Card type is correctly `summary_large_image`.
**Recommendation:** Fixing the `metadata` title/description/image cascades to these tags.
**Root cause:** Same missing `metadata` block.

### headings — CRITICAL
The delivered HTML contains **zero** `<h1>`–`<h6>` elements. Every visual heading is a `<div>`: e.g. `<div>BEEHIVE</div>`, `<div>WHAT'S<br>ON TAP</div>`, `<div>A COLONY OF BREWERS</div>`, `<div>COME BUZZ<br>BY</div>`. There is no `<h1>`, no heading outline, and no document structure for crawlers or screen readers.
**Recommendation:** Emit semantic headings in the block markup/decoration — one `<h1>` (e.g. "Beehive Brewing Co."), with `<h2>` for "What's On Tap", "Our Story", "The Taproom", and `<h3>` for each beer name.
**Root cause:** The prototype→EDS conversion rendered headings as styled `<div>`s; the source plain HTML also has no `#`/`##` markdown headings, so nothing produced `<hN>` tags.

### structured-data — HIGH
No JSON-LD whatsoever. This is a local brewery with a name, address (742 South Hive Alley, Salt Lake City, UT 84101), opening hours, and a product lineup — ideal for `Brewery`/`LocalBusiness`, `Product` (the five beers), and `BreadcrumbList` schema. Its absence forfeits rich results and local/knowledge-panel eligibility.
**Recommendation:** Add `LocalBusiness`/`Brewery` JSON-LD with `address` and `openingHoursSpecification`, plus `Product` entries for the beers (name, ABV, IBU, description).
**Root cause:** Conversion skill emits no structured data; not part of the default block/metadata output.

### lang — HIGH
`<html>` has no `lang` attribute (`<html>`). Document language is undeclared, hurting accessibility and locale targeting.
**Recommendation:** Set `<html lang="en">` (typically via the project root metadata / `head.html` / fstab default).
**Root cause:** Project default language not configured for this page; EDS did not inject a `lang`.

### favicon — MEDIUM
`<link rel="icon" href="data:,">` — an empty data-URI placeholder, i.e. no real favicon. Browser tabs and search results show no brand icon.
**Recommendation:** Add a real `/favicon.ico` (and reference it in `head.html`).
**Root cause:** Boilerplate placeholder favicon never replaced during conversion/setup.

### image-alt / images — MEDIUM
The page contains **no `<img>` elements at all** — no hero image, no beer photos, no taproom map (the map is a text placeholder: `Map placeholder · drop a real map here`). For a visual brand and for image search, this is a missed opportunity, and the default OG share image is a placeholder.
**Recommendation:** Add real imagery (hero, beer cans/glasses, taproom/map) with descriptive `alt` text; replace the OG placeholder with a branded share image.
**Root cause:** Prototype was a pure-CSS/typographic design with no images; conversion preserved that, leaving placeholders.

### semantic-html — MEDIUM
Block content is well-structured into `<main>` sections, but headings are non-semantic `<div>`s (see headings finding) and there is no use of `<article>`, `<address>` (for the taproom address), or `<time>` (for hours). `<header>` and `<footer>` are present but empty.
**Recommendation:** Use semantic elements — `<address>` for the location, proper `<hN>` for headings; consider marking up hours semantically.
**Root cause:** Conversion maps prototype `<div>` soup to generic block `<div>`s without semantic upgrade.

### internal-links — LOW
Anchor text is descriptive ("Taste the Hive", "Our Story", "Get Directions"), which is good. However, all links are in-page fragments (`#lineup`, `#story`, `#top`) — there are **no outbound internal links to other site pages**, so this page is an SEO dead-end with no link equity flow.
**Recommendation:** Add real navigation/footer links to other pages; point "Get Directions" at a real maps URL.
**Root cause:** Standalone prototype page; header/footer nav not wired up, anchors carried over from the single-page prototype.

## Severity table

| Dimension          | Severity |
|--------------------|----------|
| title              | Critical |
| headings           | Critical |
| meta-description   | High     |
| open-graph         | High     |
| twitter            | High     |
| structured-data    | High     |
| lang               | High     |
| favicon            | Medium   |
| image-alt / images | Medium   |
| semantic-html      | Medium   |
| internal-links     | Low      |
| canonical          | Fine     |
| viewport           | Fine     |
| indexable-content  | Fine     |

## Prioritized fix list

1. **Author a `metadata` block** on the page → fixes `title`, `meta description`, and cascades to `og:title/description` and `twitter:title/description`. Add a branded OG/Twitter image. *(Resolves the two highest-impact head issues at once.)*
2. **Emit semantic headings** in block decoration — exactly one `<h1>` plus logical `<h2>`/`<h3>` — replacing the `<div>` headings.
3. **Set `<html lang="en">`** via project/root metadata.
4. **Add LocalBusiness/Brewery + Product JSON-LD** (address, opening hours, beer lineup).
5. **Replace the placeholder favicon** (`data:,`) with a real brand favicon.
6. **Add real images with alt text** (hero, beers, taproom map) and replace the default OG placeholder image.
7. **Upgrade semantic HTML** (`<address>` for location) and **add real internal links** to other site pages; point "Get Directions" at a live map.
