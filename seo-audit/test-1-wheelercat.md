# SEO & Discovery Audit — Wheeler CAT (test-1)

**URL:** https://snowflake-blocks-test-1--claude-design-eds--paolomoz.aem.page/snowflake-blocks/test-1
**Audited:** 2026-06-17
**Platform:** Adobe Edge Delivery Services (AEM)
**Overall severity:** High

---

## Executive summary

The good news first: this is a **fully server-side-rendered page**. Every piece of substantive content — the hero, the certified-used inventory grid (with machine names, hours, locations, prices), the stats, service copy, offers, brands, and 18 branch locations — is present in the raw HTML delivered to a crawler *before any JavaScript runs*. Indexable content is excellent and is NOT the problem here, despite this being a converted prototype.

The problem is the **`<head>`**. Because no `metadata` block was authored into the page, every head field fell back to a system default:

- `<title>` is literally **`Hero`** (the name of the first block) — not a Wheeler CAT title.
- There is **no meta description** at all.
- Open Graph and Twitter titles are also **`Hero`**, and the social image is a generic `default-meta-image.png`.
- There is **no `<html lang>` attribute**.
- There is **no structured data / JSON-LD** (no Organization, Product, BreadcrumbList, etc.).
- **No `<h1>`** — and in fact **no semantic headings at all**; everything renders as `<div>` text.
- **No real `<img>` elements** — every image slot in the markup is an empty `<div>`.

Note also this is an `*.aem.page` preview host, which serves `User-agent: * / Disallow: /` by design, so the audit assumes the findings are evaluated against the eventual production host.

---

## Per-dimension findings

### Title — CRITICAL
Delivered: `<title>Hero</title>`. Generic, non-descriptive, contains zero brand/keyword/location signal, and would be identical on every converted page (non-unique). Root cause: no `metadata` block, so the title defaulted to the first block's name ("Hero").

### Meta description — HIGH
No `<meta name="description">` is present in the delivered head. Google will scrape arbitrary body text for the snippet. Root cause: no `metadata` block / Description field authored.

### Canonical — LOW (fine)
`<link rel="canonical" href="https://…/snowflake-blocks/test-1">` is present and self-referential. Correct. (Only caveat: it points at the preview host; production canonical must resolve to the production domain.)

### Open Graph / Twitter — HIGH
`og:title` and `twitter:title` are both `Hero`. `og:image`/`twitter:image` point to `/default-meta-image.png` (generic placeholder). `og:type`, `og:description`, and `twitter:description` are missing entirely. Shared links will look broken/untrustworthy. Root cause: defaults inherited from `head.html` + missing metadata.

### Structured data / JSON-LD — HIGH
No JSON-LD anywhere. A heavy-equipment dealer page is a strong candidate for `Organization`/`LocalBusiness` (75 years, 18 branches, 3 states), `Product`/`Offer` (the 6 certified-used machines with explicit prices), and `BreadcrumbList`. Absence forfeits rich-result eligibility. Root cause: conversion skill emits no schema.

### Indexable content — LOW (fine, notable strength)
All content is in the static server-rendered `<body>`. Example evidence: `<div>2021 Cat® 320 Hydraulic Excavator</div> … <div>$189,500</div>` and the full 18-branch list are present pre-JS. No client-side hydration gap.

### Heading hierarchy — HIGH
There is **no `<h1>`** and no `<h2>`/`<h3>` at all. The page title "We Keep Utah Working." is a plain `<div>`, as are all section headers ("Shop Used Equipment", "A Branch Near Every Jobsite", etc.). Crawlers get no heading structure. Root cause: the prototype used styled divs and the block conversion preserved them as divs instead of mapping to heading elements.

### `<html lang>` — MEDIUM
`<html>` has no `lang` attribute. Hurts accessibility and language targeting. Root cause: not set in `head.html` / template.

### Image alt text & image presence — HIGH
There are **no `<img>` elements**. Every image slot — the hero background, each of the 6 inventory cards, the service photos, the 3 offer cards — is an empty `<div></div>`. So there is no imagery for image search, no `og:image` derived from page content, and (trivially) no alt text. Root cause: prototype backgrounds/images were not carried into the EDS content as authored picture assets.

### Semantic HTML & internal linking — MEDIUM
Proper `<main>`, `<header>`, `<footer>` landmarks exist (good). But `<header>` and `<footer>` are empty in the delivered HTML (nav/footer load lazily via JS — acceptable for EDS but means no static nav links for crawlers). Body is otherwise a flat div soup with no headings/lists/article semantics. Internal links exist and mostly use descriptive anchors ("Shop Used Equipment", "Find Your Nearest Branch", "View all 3,100 machines") — that part is good — though several point to in-page anchors (`#used`, `#quote`, `#parts`) that have no matching target IDs on this page.

### Favicon / social readiness — MEDIUM
`<link rel="icon" href="data:,">` — an empty data-URI placeholder, i.e. no real favicon. Combined with the placeholder OG image and "Hero" titles, social/SERP brand readiness is poor. Root cause: default `head.html`.

---

## Severity table

| Dimension | Severity |
|---|---|
| Title | Critical |
| Meta description | High |
| Open Graph / Twitter | High |
| Structured data / JSON-LD | High |
| Heading hierarchy | High |
| Image alt / image presence | High |
| `<html lang>` | Medium |
| Semantic HTML / internal links | Medium |
| Favicon | Medium |
| Canonical | Low (fine) |
| Indexable content | Low (fine — strength) |

---

## Prioritized fix list

1. **Author a `metadata` block** on the page (or set page metadata in DA) supplying: Title (e.g. "Wheeler CAT — New & Used Cat® Equipment, Parts & Service in Utah, Wyoming & Nevada", ~60 chars), Description (~155 chars summarizing equipment sales, rentals, parts, 24-hr service, 18 branches), and an OG Image. This single fix resolves Title, Meta description, and OG/Twitter title at once.
2. **Add an `<h1>`** for the hero headline ("We Keep Utah Working.") and convert section titles to `<h2>`/`<h3>` in the authored content so headings map to real heading elements.
3. **Add JSON-LD**: `Organization`/`LocalBusiness` for Wheeler, `Product`+`Offer` for the certified-used machines, and `BreadcrumbList`.
4. **Bring real images into the content** (hero, inventory cards, offers) as authored picture assets with descriptive alt text — fixes both image presence and alt-text gaps.
5. **Set `<html lang="en">`** in the template/`head.html`.
6. **Provide a real favicon** (replace `rel="icon" href="data:,"`).
7. Fix in-page anchor links (`#used`, `#quote`, `#parts`, `#details`, `#rent`, `#service`) so they resolve to real section IDs, or repoint them to real pages.
8. Confirm production host serves an indexable `robots.txt` (preview host correctly disallows all).
