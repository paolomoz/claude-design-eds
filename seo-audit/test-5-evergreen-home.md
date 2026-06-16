# SEO & Discovery Audit — Evergreen Bank (marketing home)

**URL:** https://snowflake-blocks-test-5--claude-design-eds--paolomoz.aem.page/snowflake-blocks/test-5-home
**Audited:** 2026-06-17
**Overall severity:** Critical

## Executive summary

The page's body content is fully server-rendered (good — every section's copy is present in the raw HTML before JS runs, so indexable content is NOT the problem here). The failure is almost entirely in the `<head>` and in HTML semantics:

- **The `<title>`, `og:title`, and `twitter:title` are all "Site Nav"** — a junk value pulled from the page's first content cell, not a real page title. This is the single most damaging issue.
- **No meta description, no canonical-quality OG description, no `og:type`, no robots tag.**
- **No `<html lang>` attribute.**
- **No JSON-LD / structured data** (no Organization, no FAQ, no Product/Offer markup despite this being a bank with concrete offers like "$300 checking bonus" and "4.40% APY").
- **No real heading hierarchy** — there is not a single `<h1>`/`<h2>`/`<h3>` in the delivered HTML. Every headline ("Good morning", "$300 checking bonus, on us", "Financial guidance and support") is rendered as an undifferentiated `<div>`.
- **No images at all** — image slots are authored as plain text placeholders ("Photo: goals", "Photo: family", "App Store", "Google Play") with no `<img>`/`<picture>` and therefore no alt text.
- **Favicon is a no-op** (`<link rel="icon" href="data:,">`) and the OG image is a generic `default-meta-image.png`.
- **Almost no internal links** — only one anchor on the whole page, and it's a fragment (`#summit-rewards`). Every CTA ("Get started", "Check rates", "Open an account") is plain text, not a link.

Dimensions that are FINE: indexable-content (body copy is in static HTML), canonical URL (present and self-referential), viewport (present), Twitter card type (`summary_large_image`).

The common root cause: this page was produced by the prototype→EDS conversion without a per-page `metadata` block, and the custom snowflake blocks (`home-hero`, `feature-cards`, `guidance`, etc.) carry no JS/CSS in this repo to promote text to headings or convert image placeholders into real images/links.

---

## Per-dimension findings

### title — CRITICAL
Delivered: `<title>Site Nav</title>`. The title is the literal text of the first content cell (the `site-nav` block), not a descriptive page title. It is non-unique-looking, ~8 chars (far below the ~50–60 target), and contains zero brand or keyword relevance ("Evergreen Bank", "checking", "savings", "rewards").
**Recommendation:** Add a `metadata` block (or page metadata in DA) with a Title like `Evergreen Bank — Checking, Savings, Credit Cards & Rewards`.
**Root cause:** No `metadata` block authored; EDS fell back to deriving `<title>` from first H1/first text node, which here is the nav cell text "Site Nav".

### meta-description — HIGH
No `<meta name="description">` in the head at all. Google will synthesize a snippet from arbitrary body text.
**Recommendation:** Author a 150–160 char Description, e.g. "Bank with Evergreen: everyday checking with a $300 bonus, 4.40% APY savings, Summit Rewards credit cards, and mortgage rates in about a minute."
**Root cause:** No `metadata` block → no Description field.

### canonical — FINE (low)
`<link rel="canonical" href="…/test-5-home">` is present and self-referential. Note the canonical points at the `.aem.page` preview host rather than a production domain, which is expected for a preview but should resolve to the live host before launch.

### open-graph — HIGH
`og:title` = "Site Nav" (inherits the broken title). No `og:description`. No `og:type` (should be `website`). `og:url` and `og:image` are present but the image is the generic `default-meta-image.png`. Social shares will render "Site Nav" with a placeholder image.
**Recommendation:** Set a real OG title/description via the metadata block and supply a branded share image.
**Root cause:** OG tags are generated from page metadata; with no metadata block they mirror the derived title and fall back to the project default image.

### twitter — MEDIUM
`twitter:card` = `summary_large_image` (good) but `twitter:title` = "Site Nav" and there is no `twitter:description`. Same inheritance problem as OG.
**Recommendation:** Fixing the title + adding a description in the metadata block resolves this automatically.

### structured-data — HIGH
No JSON-LD anywhere (`application/ld+json` absent). For a bank marketing home, the page is missing high-value schema: `Organization`/`BankOrBranch` (name, logo, sameAs), and `Offer`/`Product` markup for the concrete offers present in copy ("$300 checking bonus", "4.40% APY savings", "50,000 bonus points"). A `FAQPage` is not applicable here.
**Recommendation:** Inject an `Organization` JSON-LD block site-wide (via `head.html` or a metadata-driven script) and consider `Offer` markup for the promotional cards.
**Root cause:** Conversion skill emits no structured data; `head.html` contains only CSP, viewport, scripts, and stylesheet.

### indexable-content — FINE (low)
This is the dimension to worry about for interactive pages, and it passes. All substantive copy (hero, all four feature cards, rewards banner, guidance trio, insights, help row) is present in the raw server-delivered `<body>` before any JS executes. No thin/empty placeholder body. The content is crawlable.

### headings — CRITICAL
There is not a single `<h1>`, `<h2>`, or `<h3>` in the delivered HTML — confirmed by grep returning nothing. Every headline is a bare `<div>`: e.g. `<div>$300 checking bonus, on us</div>`, `<div>Financial guidance and support</div>`, `<div>How can we help?</div>`. The page has no H1 and no heading outline, which severely hurts on-page SEO and accessibility.
**Recommendation:** Update the snowflake block JS (`home-hero`, `feature-cards`, `guidance`, `help-row`, `insights`) to promote the appropriate cells to `<h1>`/`<h2>`/`<h3>`. Exactly one H1 (e.g. the hero or a brand statement).
**Root cause:** The custom blocks were converted as raw div tables; no decoration code maps cells to semantic headings (the markers "head", "tinted", "white", "pin" are layout hints left in the content).

### lang — HIGH
The root element is `<html>` with no `lang` attribute. Screen readers and search engines cannot reliably determine document language.
**Recommendation:** Ensure EDS emits `<html lang="en">` (set in `head.html`/scripts or page metadata).
**Root cause:** Conversion did not set a default language; boilerplate normally sets `lang` but it is absent in the delivered markup here.

### image-alt — HIGH
There are zero `<img>`/`<picture>` elements on the page. Image regions are authored as plain text placeholders: `<div>Photo: goals</div>`, `<div>Photo: family</div>`, `<div>Photo: summit</div>`, and store badges as text `<div>App Store</div>` / `<div>Google Play</div>`. No images means no alt text and no image-search visibility; it also means the page visually lacks the hero/lifestyle imagery a bank home page needs.
**Recommendation:** Replace placeholders with real authored images (EDS auto-optimizes) and ensure each has descriptive alt text; render store badges as linked images.
**Root cause:** Prototype image slots were carried over as literal text labels rather than converted to image references during the snowflake conversion.

### semantic-html — HIGH
Body is entirely generic `<div>` nesting. No `<section>` landmarks beyond the EDS section wrappers, no headings, no lists, no `<button>`/`<a>` for CTAs. Layout hint words ("head", "tinted", "white", "pin", "calendar", "chat") leak into the rendered text as visible content.
**Recommendation:** Decorate blocks to emit semantic elements and strip/consume the layout-hint cells instead of rendering them as text.
**Root cause:** Blocks lack decoration JS in this repo; raw authored div tables are served as-is.

### internal-links — HIGH
Only one anchor exists on the entire page: `<a href="#summit-rewards">Learn more</a>` — a same-page fragment, not a navigational link. Every other CTA ("Get started", "Learn more", "Check rates", "Open an account", "Discover how", "Get started", "Find a location", "Make an appointment") is plain text with no `href`. The page passes no link equity and offers crawlers no paths deeper into the site. Header and footer are also empty (`<header></header>`, `<footer></footer>`), so there is no site navigation at all.
**Recommendation:** Make CTAs real links to their destination pages; populate header/footer nav fragments.
**Root cause:** CTA cells authored as text labels (the conversion did not preserve/author destination URLs); header/footer nav not yet wired up in this preview.

### favicon — MEDIUM
`<link rel="icon" href="data:,">` — an empty data URI, i.e. no real favicon. Combined with the generic `default-meta-image.png`, social/share and browser-tab branding are absent.
**Recommendation:** Add a real favicon and a branded default share image to the project.
**Root cause:** Boilerplate default placeholder favicon never replaced for this project.

---

## Severity table

| Dimension | Severity | One-line issue |
|---|---|---|
| title | critical | `<title>Site Nav</title>` — junk, no brand/keywords |
| headings | critical | No H1/H2/H3 anywhere; headlines are bare divs |
| meta-description | high | Missing entirely |
| open-graph | high | og:title "Site Nav", no og:description, no og:type, generic image |
| structured-data | high | No JSON-LD (Organization/Offer missing) |
| lang | high | `<html>` has no lang attribute |
| image-alt | high | Zero images; image slots are text placeholders |
| semantic-html | high | All divs; layout-hint words leak as visible text |
| internal-links | high | Only one fragment anchor; CTAs are plain text; empty header/footer |
| twitter | medium | twitter:title "Site Nav", no description |
| favicon | medium | `rel=icon href="data:,"` empty + generic OG image |
| canonical | low | Present/correct (preview host) |
| indexable-content | low | FINE — body copy is server-rendered |
| viewport / twitter:card type | low | FINE |

---

## Prioritized fix list

1. **Add a per-page `metadata` block** with a real Title and Description. Fixes title (critical), meta-description (high), and the og:/twitter: title+description inheritance in one move.
2. **Add heading semantics** in the block decoration JS — promote the right cells to a single `<h1>` and supporting `<h2>`/`<h3>`. (critical)
3. **Set `<html lang="en">`** site-wide. (high)
4. **Convert image placeholders to real authored images with alt text** and make store badges linked images. (high)
5. **Wire CTAs as real `<a>` links** and populate header/footer navigation. (high)
6. **Add Organization (and Offer) JSON-LD** via `head.html`/metadata. (high)
7. **Strip layout-hint cells** ("head", "tinted", "pin", etc.) from rendered output via block decoration. (high)
8. **Add a real favicon and branded OG/share image.** (medium)
9. Before launch, ensure canonical/OG URLs resolve to the production domain rather than `.aem.page`. (low)
