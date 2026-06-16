# SEO & Discovery Audit — Festool (test-2)

**URL audited:** https://snowflake-blocks-test-2--claude-design-eds--paolomoz.aem.page/snowflake-blocks/test-2
**Page type:** Festool power-tools marketing home/landing page (server-rendered EDS, content in decorated blocks)
**Audit date:** 2026-06-17
**Overall severity:** CRITICAL

## Executive summary

Good news first: this is **not** a JS-rendered/thin-content page. The server-delivered `<body>` already contains all of the page's real substance — hero copy, "New products" grid, brand band, "Discover Festool" features, and the service band — in static HTML before any JavaScript runs. Indexable content is healthy.

The problem is the **`<head>` and document semantics**, which are essentially unconfigured:

- `<title>` is literally **"Hero"** — the name of the first block, not a descriptive page title.
- **No meta description.**
- Open Graph and Twitter title are also **"Hero"**.
- **No `<html lang>` attribute.**
- **No headings at all** — zero `<h1>`…`<h6>` elements on the page. Every line of copy is rendered as plain `<div>` text.
- **No JSON-LD / structured data** of any kind (no Organization, Product, BreadcrumbList, FAQ).
- **Favicon is a placeholder** (`data:,`).
- The hero image has **empty alt text**, and all internal links point to **`#`**.

Root cause for nearly all of this: the prototype→EDS conversion produced **no `metadata` block** for the page and did **not promote any copy to heading elements**, so the EDS head-building logic fell back to defaults (block name as title, no description, no canonical-derived OG title beyond the fallback). The body blocks were converted as plain `<div>` cells without semantic heading tags.

**Dimensions that are FINE:** indexable content (fully server-rendered), canonical URL (present and correct), viewport meta, og:url, og:image / twitter:image (present, optimized), twitter:card type, image optimization (responsive `<picture>` with webp).

## Per-dimension findings

### title — CRITICAL
Delivered: `<title>Hero</title>`. This is the first block's name, not a page title. No brand, no keywords ("Festool", "cordless power tools"), ~4 chars vs. the ~50–60 target. Catastrophic for SERP relevance and click-through.
**Fix:** Author a `metadata` block (or page metadata in DA) with a Title like `Festool Cordless Power Tools — Tabless Technology, Saws & Dust Extraction` (~58 chars).

### meta description — HIGH
No `<meta name="description">` is delivered at all. Google will synthesize a snippet from arbitrary body text.
**Fix:** Add a Description in the metadata block, ~150–160 chars, e.g. *"Discover Festool cordless power tools with Tabless battery technology — longer runtimes, less heat, faster charging. Explore saws, sanders, dust extraction and the 18V system."*

### canonical — LOW (FINE)
`<link rel="canonical" href="https://snowflake-blocks-test-2--…/snowflake-blocks/test-2">` is present and self-referential. Correct. (Note it points at the `.aem.page` preview host; on the production/live host it will resolve to the live domain, which is expected.)

### open-graph — HIGH
`og:url`, `og:image`, `og:image:secure_url` are present and correct. But `og:title` is **"Hero"**, and there is **no `og:description`** and **no `og:type`**. Social shares will show "Hero" as the headline.
**Fix:** Same metadata block drives og:title/description. Add `og:type=website`. EDS mirrors Title/Description into OG automatically once the metadata block exists.

### twitter — MEDIUM
`twitter:card=summary_large_image`, `twitter:image`, and `twitter:title` are present — but `twitter:title` is again **"Hero"** and there is no `twitter:description`.
**Fix:** Resolved by fixing the metadata-driven title/description.

### structured-data — HIGH
**No JSON-LD present.** For a brand marketing page, at minimum an `Organization` (Festool, logo, sameAs) graph should be emitted; the "New products" grid is a natural fit for `Product`/`ItemList`, and a `BreadcrumbList` would help. Absence means no rich results and weaker entity association.
**Fix:** Inject an Organization JSON-LD via `head.html` or a metadata-driven script, and consider ItemList/Product for the product grid.

### indexable-content — LOW (FINE)
The server-delivered `<body>` contains all substantive copy (hero, new-products, brand-band, discover, service-band) as static HTML. No client-side-only content. A crawler sees the full page. This is the one thing done right.

### headings — CRITICAL
**Zero heading elements on the entire page.** No `<h1>`, no `<h2>`. Evidence: `grep` for `<h[1-6]` returns nothing. Real headlines like `Tabless. Extra power for your cordless tools.`, `New products`, `Discover Festool`, and `Festool SERVICE` are all rendered as plain `<div>` text. Search engines have no heading signal and no document outline; this also harms accessibility (no landmark structure for screen readers).
**Fix:** In the source content / block decoration, promote the primary hero headline to `<h1>` and section titles ("New products", "Discover Festool", "Register for all services now") to `<h2>`. In EDS this is usually done by authoring the copy as Markdown headings so the backend emits `<h1>/<h2>`.

### lang — HIGH
`<html>` has **no `lang` attribute** (delivered as bare `<html>`). The content is English. Missing `lang` hurts accessibility (screen-reader pronunciation) and is a language-targeting signal for search.
**Fix:** Set `lang="en"` — typically via the site config / `scripts.js` `document.documentElement.lang` or page metadata.

### image-alt — HIGH
The single hero image is delivered with **empty alt**: `<img loading="lazy" alt="" …>`. It carries meaningful brand/product content, so empty alt loses an image-SEO and accessibility opportunity. Also note `loading="lazy"` on what is almost certainly the LCP hero image — that can hurt LCP (should be eager). Separately, the product grid and feature cards have **empty image cells** (`<div></div>`), so the page is largely image-light despite being a visual brand.
**Fix:** Provide descriptive alt text in the authored image. Set the hero image to eager loading. Populate product/feature images.

### semantic-html — MEDIUM
Structural landmarks (`<header>`, `<main>`, `<footer>`) exist (good), but `<header>` and `<footer>` are **empty** — no nav, no logo, no footer links. Combined with the total absence of headings, the page has almost no semantic richness; it's a flat stack of `<div>`s.
**Fix:** Ensure header/footer blocks load with real navigation and links; add headings as above.

### internal-links — HIGH
Every link on the page points to **`#`**: `Everything to do with technology`, `All new products`, `The Festool "We" movie`, `More about Festool Service`. There are **no real internal links** to other pages, so there is no crawl path, no link equity flow, and no destination for users. Anchor text itself is descriptive (good), but the targets are dead.
**Fix:** Replace `#` placeholders with real URLs to the corresponding product/category/service pages.

### favicon — MEDIUM
`<link rel="icon" href="data:,">` — an empty data-URI placeholder, i.e. **no real favicon**. Browser tabs and some social/SERP contexts will show a blank/default icon.
**Fix:** Add a real `/favicon.ico` (or icon link) in `head.html`.

### viewport — LOW (FINE)
`<meta name="viewport" content="width=device-width, initial-scale=1">` present. Correct.

## Severity table

| Dimension | Severity |
|---|---|
| title | critical |
| headings | critical |
| meta description | high |
| open-graph | high |
| structured-data | high |
| lang | high |
| image-alt | high |
| internal-links | high |
| twitter | medium |
| semantic-html | medium |
| favicon | medium |
| canonical | low (fine) |
| indexable-content | low (fine) |
| viewport | low (fine) |

## Prioritized fix list

1. **Author a `metadata` block / page metadata** (fixes title, meta description, og:title, og:description, twitter:title/description in one move). Highest leverage.
2. **Add headings** — promote hero headline to `<h1>`, section titles to `<h2>`. Fixes the document outline for SEO + accessibility.
3. **Set `<html lang="en">`.**
4. **Replace all `#` placeholder links** with real internal URLs.
5. **Add descriptive `alt` to the hero image**, switch it to eager loading, and populate the empty product/feature image cells.
6. **Add Organization JSON-LD** (and ItemList/Product for the product grid) via head.html or metadata.
7. **Add a real favicon.**
8. **Populate header/footer** with navigation and footer links.
