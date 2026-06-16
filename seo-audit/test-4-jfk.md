# SEO & Discovery Audit — JFK International (test-4)

**URL:** https://snowflake-blocks-test-4--claude-design-eds--paolomoz.aem.page/snowflake-blocks/test-4
**Audited:** 2026-06-17
**Overall severity:** critical

## Executive summary

The page renders all of its substance server-side (good — content is crawlable without JS), but the `<head>` and semantic markup are effectively unconfigured. The crawler sees a page **titled "Hero"** (the first block's name, not the page subject), with **no meta description, no `<html lang>`, no robots directive, a broken Open Graph image (404), an empty `data:,` favicon, zero `<h1>`–`<h6>` headings, no images/alt, and no JSON-LD.** Despite having rich, keyword-relevant copy about JFK airport, this page would present terribly in search results and on social shares, and gives search engines almost no structural or semantic signal.

The single biggest structural problem: the authored content uses **no headings whatsoever** — every heading-like line ("JFK", "Your guide to JFK", "What's happening at JFK") is delivered as a plain `<div>`, so there is no H1 and no heading outline at all.

### Dimensions that are FINE
- **Indexable content:** the full body is server-rendered static HTML — all copy (terminal wait times, guide links, essentials, news) is present in the initial response. Not a JS-rendered/thin-body problem.
- **Canonical:** present and correct (self-referential, absolute).
- **Viewport:** present (`width=device-width, initial-scale=1`).
- **Internal linking exists** (though anchors are weak — see below).

---

## Per-dimension findings

### 1. Title — CRITICAL
**Evidence:** `<title>Hero</title>`; also `og:title` = "Hero", `twitter:title` = "Hero".
The title is the literal name of the page's first block, not a description of the page. It is 4 characters (target ~50–60), non-unique, and carries zero keyword relevance for "JFK airport," terminals, wait times, parking, etc.
**Recommendation:** Set a real title via the page `metadata` block, e.g. `JFK International Airport — Terminals, Wait Times & Travel Guide` (~58 chars).
**Likely root cause:** No `Title` row in the per-page `metadata` block, so EDS fell back to deriving `<title>` from the first heading-ish element — which the converter emitted as the "Hero" block rather than an actual `<h1>` titled "JFK."

### 2. Meta description — HIGH
**Evidence:** No `<meta name="description">` in the delivered `<head>`.
No description means Google synthesizes a snippet from arbitrary on-page text, and there's no controlled SERP/social summary.
**Recommendation:** Add a `Description` field to the `metadata` block, ~150–160 chars, e.g. "Real-time security and customs wait times for every JFK terminal, plus guides to parking, dining, shopping, accessibility and getting to and from the airport."
**Likely root cause:** `metadata` block omits the Description row; `head.html` provides no fallback.

### 3. Canonical — FINE (no issue)
**Evidence:** `<link rel="canonical" href="https://snowflake-blocks-test-4--claude-design-eds--paolomoz.aem.page/snowflake-blocks/test-4">` — present, absolute, self-referential.

### 4. Open Graph & Twitter Card — HIGH
**Evidence:** `og:title`/`twitter:title` = "Hero" (same bad title). `og:type` is **absent**. `og:description`/`twitter:description` are **absent**. `og:image` points to `/default-meta-image.png` which **returns HTTP 404**.
A share of this page shows the title "Hero," no description, and a broken/blank image card.
**Recommendation:** Fix title/description (cascades from #1/#2). Add `og:type` = `website`. Commit a real `default-meta-image.png` (1200×630) at site root, or set a per-page `og:image` via metadata.
**Likely root cause:** OG tags are auto-generated from the (wrong) title and from a default meta image path that was never committed to the repo; `og:type`/description not emitted because metadata is empty.

### 5. Structured data / JSON-LD — MEDIUM
**Evidence:** Zero `application/ld+json` blocks in the response.
This is an airport-info page ideal for `Airport`/`LocalBusiness` schema, a `BreadcrumbList`, and an `FAQPage` (the hero literally lists FAQ-style questions: "What restaurants are open in my terminal?", "Where can I find parking at JFK?", "How do I get a taxi from JFK?").
**Recommendation:** Add JSON-LD: `Airport` (name, IATA "JFK", address), `BreadcrumbList`, and `FAQPage` built from the hero questions to capture rich results.
**Likely root cause:** Conversion skill doesn't generate structured data; no schema block authored.

### 6. Indexable content — FINE (no issue)
**Evidence:** The full `<body>` is present in the raw `curl` (pre-JS) response — terminal table values ("Terminal 4 / 16 min / bad"), guide links, essentials copy, news items all render server-side. This is NOT a JS-only/thin-body page.
**Note:** This is the most important positive result — the interactive-block content is crawlable.

### 7. Heading hierarchy — CRITICAL
**Evidence:** `grep` for `<h1>`–`<h6>` returns **nothing** — there are zero heading elements. Heading-like content is delivered as plain divs: `<div class="hero"><div><div>JFK</div></div>`, `<div>Your guide to JFK</div>`, `<div>What's happening at JFK</div>`, `<div>Get your essentials and more</div>`.
No `<h1>`, no outline. This is a major on-page SEO and accessibility defect — crawlers and screen readers get no document structure.
**Recommendation:** Author "JFK" (or "JFK International Airport") as an `<h1>`, and section titles ("Your guide to JFK," "Get your essentials and more," "What's happening at JFK," "Live right now") as `<h2>`/`<h3>`. In DA, type them as Heading styles so EDS emits real heading tags.
**Likely root cause:** The prototype→EDS converter mapped every text node into block cells (`<div>`) and did not promote any line to a markdown/DA heading, so no `<hN>` is produced.

### 8. `<html lang>` / document language — HIGH
**Evidence:** `<html>` — no `lang` attribute.
Missing language declaration hurts accessibility and international/search signals.
**Recommendation:** Set `<html lang="en">` (configure default language in the project / `scripts.js` `setLanguage`, or via metadata).
**Likely root cause:** Boilerplate default not configured during conversion; no lang set in metadata or scripts.

### 9. Images & alt text — HIGH
**Evidence:** Zero `<img>` elements in the page. Several block cells that clearly expect an icon/image are **empty** (`<div></div>` in hero, guide rows, essentials rows, news rows, redev, accessibility).
A visually rich airport page with no images is poor for engagement, image search, and social previews; the empty leading cells suggest intended icons were dropped in conversion.
**Recommendation:** Add the intended icons/imagery with descriptive `alt` text; ensure at least one share-worthy image. If cells are decorative-only, document that, but most appear to be missing real assets.
**Likely root cause:** Converter preserved the cell structure but dropped the source `<img>`/icon assets, leaving empty `<div>` placeholders.

### 10. Semantic HTML & internal linking — MEDIUM
**Evidence:** Page uses `<main>`, `<header>`, `<footer>` (good), but `<header>` and `<footer>` are **empty** (`<header></header><footer></footer>`) in the delivered HTML — no nav, no breadcrumb, no site chrome for the crawler. All internal links are **on-page anchors** to fragments that have no matching targets in this page: `href="#guide"`, `#map`, `#departures`, `#dine`, `#alerts`, etc. None point to real URLs, and none of those `id`s exist in the document, so they are dead in-page jumps with no outbound link equity.
Anchor text is partly descriptive ("Departures guide," "JFK restaurants →") which is good, but trailing "→" glyphs and the fact that links resolve nowhere undermines them.
**Recommendation:** Point guide/essentials/news links to real destination pages (or ensure the target `id`s exist on this page). Populate header/footer with navigation so crawlers find the rest of the site. Strip decorative "→" from anchor text or keep it outside the link.
**Likely root cause:** Prototype was a single self-contained page using `#anchor` jumps to sections that weren't carried over as blocks; header/footer nav not yet authored in the EDS site.

### 11. Favicon / social share readiness — MEDIUM
**Evidence:** `<link rel="icon" href="data:,">` — an empty data-URI (blank favicon), even though a real `favicon.ico` exists at site root and returns HTTP 200. Combined with the 404 OG image and "Hero" title, social/browser-tab presentation is broken.
**Recommendation:** Replace the `data:,` icon link with `<link rel="icon" href="/favicon.ico">` (and ideally a PNG/SVG) in `head.html`; fix the OG image (see #4).
**Likely root cause:** Boilerplate placeholder `data:,` favicon was never replaced in `head.html` during setup, despite a `favicon.ico` being committed.

### 12. Robots / indexability directives — LOW
**Evidence:** No `<meta name="robots">` present. (Default is indexable, so not blocking — but worth setting explicitly once the page is production-ready, and confirming this preview URL shouldn't be `noindex`.)
**Recommendation:** Decide indexing policy; preview/staging hosts (`*.aem.page`) ideally shouldn't be indexed — consider `noindex` on preview and proper indexing on the live `.aem.live` domain.

---

## Severity table

| Dimension | Severity |
|---|---|
| Title | critical |
| Heading hierarchy | critical |
| Meta description | high |
| Open Graph / Twitter | high |
| `<html lang>` | high |
| Images / alt | high |
| Structured data (JSON-LD) | medium |
| Semantic HTML / internal links | medium |
| Favicon / social readiness | medium |
| Robots directive | low |
| Canonical | FINE |
| Indexable content | FINE |
| Viewport | FINE |

---

## Prioritized fix list

1. **Add a `metadata` block with a real Title + Description** (fixes title, og:title, twitter:title, meta description in one move). — critical
2. **Author real headings** — promote "JFK" to `<h1>` and section titles to `<h2>`/`<h3>`. — critical
3. **Set `<html lang="en">`.** — high
4. **Fix Open Graph:** commit a valid 1200×630 `default-meta-image.png` (currently 404), add `og:type=website` and `og:description`. — high
5. **Restore missing icons/images with descriptive alt text** (empty placeholder cells). — high
6. **Replace `data:,` favicon** in `head.html` with `/favicon.ico`. — medium
7. **Add JSON-LD** — `Airport`, `BreadcrumbList`, and `FAQPage` (from hero questions). — medium
8. **Repair internal links** — point `#anchor` links to real pages or ensure matching `id`s; populate header/footer nav. — medium
9. **Set robots policy** — `noindex` on preview, index on live. — low
