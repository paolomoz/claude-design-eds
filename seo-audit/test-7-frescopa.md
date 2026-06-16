# SEO & Discovery Audit — Frescopa Fable (Coffee Quiz)

**URL:** https://snowflake-blocks-test-7--claude-design-eds--paolomoz.aem.page/snowflake-blocks/test-7
**Page type:** Interactive coffee personality quiz (single `quiz` block, JS-rendered)
**Audited:** 2026-06-17
**Overall severity:** CRITICAL

---

## Executive summary

This page is effectively invisible to search engines and AI crawlers. Two compounding problems:

1. **The `<head>` carries no real SEO signal.** The title is the literal word `Quiz`, there is no meta description, no `og:description`, no `og:type`, no `<html lang>`, no JSON-LD, and the share image is the project-wide `default-meta-image.png`. A crawler has almost nothing to index or display in a SERP / social card.

2. **The body is a pile of raw block-table cells, not a readable document.** The delivered `<body>` contains only nested, unlabeled `<div>` cells (`intro`, `chapter`, `option`, `roast`, …). There is **not a single `<h1>`–`<h6>`, `<p>`, `<a>`, `<img>`, `<button>`, or `<section>`** in the static HTML. All the actual quiz UI — chapters, questions, options, roast results, CTAs — is generated client-side by the `quiz` block's JavaScript. Before JS runs, the page has no headings, no semantic structure, no links, and no images.

The content itself is genuinely rich (a four-chapter narrative, four roast products with tasting notes and descriptions, brew tips), so the loss is entirely structural — the substance exists in the authored source but is never expressed as crawlable, semantic HTML.

**Dimensions that are FINE:** canonical URL (present, self-referential, correct), `twitter:card` (`summary_large_image` is valid), viewport meta (present). That's the extent of the good news.

---

## Per-dimension findings

### Title — CRITICAL
Delivered: `<title>Quiz</title>`

Four characters, generic, non-unique, zero keyword relevance. None of "Frescopa," "coffee," "quiz," "roast," or "MyBarista" appears. Identical title would collide with any other quiz page. Target is ~50–60 chars describing the page, e.g. `Frescopa Fable — Find Your Perfect Coffee Roast | MyBarista`.

**Root cause:** The per-page `metadata` block (or DA page Title) was left as the bare section/block label "Quiz" rather than authored to a descriptive page title. The conversion skill propagated the block name into `<title>`.

### Meta description — CRITICAL
Delivered HTML contains **no `<meta name="description">` at all**.

There is no description for Google to show, and no `og:description` either (see Open Graph). The intro copy — *"The Fréscopa Fable is a four-chapter tale about you — your mornings, your flavors, your brew. At the end, we'll match you with the roast your story deserves."* — is ideal source material (~150 chars) and should be lifted verbatim into a `description` meta.

**Root cause:** No `Description` field was authored in the page `metadata` block, so `head.html` had nothing to emit.

### Canonical URL — FINE
`<link rel="canonical" href="https://snowflake-blocks-test-7--claude-design-eds--paolomoz.aem.page/snowflake-blocks/test-7">` is present, well-formed, and self-referential. Note it points at the **branch preview host** (`snowflake-blocks-test-7--…aem.page`), which is correct for this preview but must resolve to the production `.aem.live` host once published.

### Open Graph — HIGH
Present: `og:title` (= "Quiz"), `og:url`, `og:image`, `og:image:secure_url`.
Missing: `og:description`, `og:type`.
- `og:title` inherits the useless "Quiz".
- `og:image` is `default-meta-image.png` — the generic project fallback, not a quiz/coffee visual.
- No `og:description` means a bare, copy-less social card.
- No `og:type` (should be `website` or `article`).

**Root cause:** Same empty-metadata origin as title/description; `og:*` are templated from the same fields in `head.html`, and the default image is the boilerplate fallback because no page-level share image was set.

### Twitter Card — MEDIUM
`twitter:card=summary_large_image` (valid), `twitter:title=Quiz`, `twitter:image=default-meta-image.png`. The card type is correct, but it inherits the generic title and default image, and there is no `twitter:description`. Fixing the underlying title/description/image cascades here.

### Structured data / JSON-LD — HIGH
**No JSON-LD of any kind** in the delivered HTML. This page is a strong candidate for multiple schema types, all of which are absent:
- `Quiz` / `WebApplication` for the interactive experience.
- `Product` (×4) for the roasts — Morning Muse, Velvet Ember, Hearthside, Midnight Fable — each has a name, roast level, and tasting notes ready to map to `Product`/`offers`.
- `FAQPage` or `HowTo` for the brew tips (espresso/pour-over/press/pods).
- `BreadcrumbList` for the `/snowflake-blocks/test-7` path.

Without this, the page forfeits rich-result eligibility and gives AI answer engines no machine-readable entities.

**Root cause:** The conversion skill produced no schema layer; `head.html` emits only the default OG/Twitter tags and the block JS doesn't inject JSON-LD.

### Indexable content — CRITICAL
This is the headline problem. The entire delivered `<body>` is:

```html
<main>
  <div>
    <div class="quiz">
      <div><div>intro</div><div>MyBarista Coffee Quiz</div>...</div>
      <div><div>chapter</div><div>ritual</div><div>Chapter I</div>...</div>
      ...
      <div><div>roast</div><div>Midnight Fable</div><div>Dark Roast</div>...</div>
      <div><div>result</div><div>The moral of your story</div>...</div>
    </div>
  </div>
  <div></div>
</main>
```

Every line is an undifferentiated `<div>` cell. There is **no `<h1>`, no `<h2>`, no `<p>`, no `<a>`, no `<img>`, no `<button>`** anywhere in the static body (verified: `grep -iE "<h1|<h2|<h3"` returns nothing). The quiz's real interface — questions rendered as headings, options as buttons, roast results as product cards, the "Begin the fable" / "Add to MyBarista" / "Retell the tale" CTAs — only materializes after `quiz.js` runs.

A crawler that does not execute JS (and many AI/discovery crawlers don't, or do so unreliably) sees raw control cells like `option / ritual / slow / sunrise / Slow & quiet` with no semantic meaning. The headings that *should* anchor the page (`How does your morning begin?`, `Choose your flavor adventure.`) exist as plain `<div>` text, not `<h*>` elements.

The good news: the words are all there in the static HTML, so this is recoverable — the block decoration just needs to emit semantic, heading-bearing markup rather than relying purely on JS to construct the visible DOM.

**Root cause:** Block-level snowflake conversion produced a `quiz` block whose authored content is flat label/value cells, and whose `decorate()` builds the interactive UI client-side. The static fallback is the un-decorated cell soup; no progressively-enhanced semantic skeleton (headings/paragraphs) is rendered server-side or at decoration time before interaction.

### Heading hierarchy — CRITICAL
Zero heading elements in the delivered HTML. There is no `<h1>` (so no primary topic signal), and none of the chapter titles or questions are marked up as headings. Proper structure would be one `<h1>` ("Frescopa Fable" / "MyBarista Coffee Quiz") with the four chapter questions as `<h2>`.

**Root cause:** Same as indexable-content — content lives in `<div>` cells; the block never promotes any cell to a heading.

### `<html lang>` / document language — HIGH
Delivered: `<html>` with **no `lang` attribute**. The content is English (and uses accented "Fréscopa"); a missing `lang` hurts accessibility (screen-reader pronunciation), and is a weak quality signal for search/translation. Should be `<html lang="en">`.

**Root cause:** The page metadata didn't set a language and the boilerplate `<html>` tag wasn't given a default `lang`; AEM normally injects this from a `Language` metadata value or a project default that isn't configured here.

### Image alt text / images — HIGH
There are **no `<img>` elements at all** in the delivered HTML. The design references icon keys (`sunrise`, `rush`, `espresso`, `flame`, etc.) and roast swatch colors, but these are rendered client-side (likely inline SVG/CSS). For crawlers there is no image to index, no `og:image` that represents the page, and therefore no image-search surface. At minimum a representative static hero/share image with descriptive `alt` should exist, and any JS-rendered icons that convey meaning need accessible text equivalents.

**Root cause:** Icons/visuals are generated by the block JS from data cells; no static `<img>` or social image was authored.

### Semantic HTML — HIGH
The body uses only generic `<div>` nesting. No `<section>`, `<article>`, `<h*>`, `<p>`, `<ul>/<li>`, `<button>`, or `<nav>`. The `<header>` and `<footer>` are empty (`<meta name="footer" content="off">` intentionally suppresses the footer). This deprives both crawlers and assistive tech of structure.

**Root cause:** Un-decorated block cells; the meaningful semantics only appear post-JS.

### Internal links / anchor text — HIGH
**No `<a>` elements** anywhere in the static HTML. The page is a dead end for crawl flow: nothing links out to product pages, the homepage, or related content, and nothing links *in* via descriptive anchors. The CTAs ("Begin the fable," "Add to MyBarista," "Retell the tale") are JS-generated controls, not crawlable links. Even the four roast results — which clearly map to real products — expose no anchors to product/PDP URLs.

**Root cause:** Quiz interactions are wired as JS event handlers on generated elements, not as real `<a href>` links; no contextual navigation was authored around the block.

### Favicon — MEDIUM
Delivered: `<link rel="icon" href="data:,">` — an **empty data-URI placeholder**, i.e. effectively no favicon. Browsers and SERP favicon slots get nothing meaningful.

**Root cause:** The boilerplate emits a `data:,` stub when no real favicon/icon is configured in `head.html`; the project never replaced it.

### Social share readiness — HIGH (composite)
Putting OG + Twitter + favicon together: a share of this URL renders a card titled "Quiz" with the generic project image, no description, and no site favicon. Functionally unshareable in any compelling way. Fixing title/description/image at the metadata level resolves all three card surfaces at once.

---

## Severity table

| Dimension | Severity | One-line issue |
|---|---|---|
| Title | CRITICAL | Literal "Quiz" — generic, 4 chars, no keywords |
| Meta description | CRITICAL | Absent entirely |
| Indexable content | CRITICAL | Body is raw `<div>` cells; all UX is JS-rendered |
| Heading hierarchy | CRITICAL | Zero `<h1>`–`<h6>` in delivered HTML |
| Open Graph | HIGH | "Quiz" title, default image, no `og:description`/`og:type` |
| Structured data / JSON-LD | HIGH | None (Product ×4, FAQ, Quiz, Breadcrumb all missing) |
| `<html lang>` | HIGH | No `lang` attribute |
| Images / alt | HIGH | No `<img>` at all; no representative image |
| Semantic HTML | HIGH | Only generic `<div>`s; no sectioning/heading/list elements |
| Internal links / anchors | HIGH | No `<a>` elements; page is a crawl dead-end |
| Social share readiness | HIGH | Card is title-only "Quiz" + default image |
| Twitter Card | MEDIUM | Valid type but inherits generic title/image |
| Favicon | MEDIUM | `data:,` empty placeholder |
| Canonical | FINE | Present, self-referential, correct |
| Viewport | FINE | Present |

---

## Prioritized fix list

**P0 — metadata (cheap, high impact; pure authoring in the page `metadata` block):**
1. Set a real **Title**: `Frescopa Fable — Find Your Coffee Roast Match | MyBarista` (~55 chars).
2. Add a **Description** (~150 chars), e.g. the intro line: *"The Fréscopa Fable is a four-chapter tale about your mornings, flavors, and brew. Take the one-minute quiz to find the roast your story deserves."*
3. Set a page-specific **share image** (a Frescopa/coffee visual) so `og:image`/`twitter:image` stop using `default-meta-image.png`.
4. Add `og:description`, `og:type=website`, and `twitter:description` (templated from Description in `head.html`).
5. Set `<html lang="en">` (project default or page Language metadata).
6. Replace the `data:,` favicon with a real icon in `head.html`.

**P1 — make the content crawlable (the core fix):**
7. Render a **semantic, server-visible skeleton** in the `quiz` block's decoration: promote "MyBarista Coffee Quiz" to the single `<h1>`, each chapter question to `<h2>`, options to a `<ul>`/`<button>` list, and roast results to `<article>` cards with `<h3>` names + `<p>` tasting notes/descriptions — so the substance exists as real HTML even with JS disabled.
8. Output the roast names, tasting notes, and brew tips as readable text/headings (not just data cells) so AI/answer engines can extract them.

**P2 — structured data & linking:**
9. Inject **JSON-LD**: `Product` for each of the four roasts (name, description, tasting-note `additionalProperty`), `FAQPage`/`HowTo` for the brew tips, and `BreadcrumbList` for the path.
10. Add real `<a href>` links — from each roast result to its product/PDP page, plus contextual links to the homepage / coffee category — to give the page inbound/outbound crawl flow and descriptive anchor text.
11. Confirm the canonical resolves to the production `.aem.live` host once published.
