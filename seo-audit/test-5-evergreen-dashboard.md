# SEO & Discovery Audit — Evergreen Bank Dashboard (test-5)

**URL:** https://snowflake-blocks-test-5--claude-design-eds--paolomoz.aem.page/snowflake-blocks/test-5
**Page type:** Signed-in banking dashboard (interactive prototype), auto-converted prototype → EDS
**Audit date:** 2026-06-17
**Overall severity:** High

---

## Executive Summary

This page is a signed-in **account dashboard** — by nature a non-public, personalized, transactional surface. Its SEO/discovery profile is therefore unusual: the biggest problems are not "thin content" (the body is actually fully server-rendered) but rather **a generic placeholder `<head>`** and the fact that **the page exposes what looks like private account/transaction data as fully crawlable static HTML** while declaring no language, no headings, no robots policy, and no semantic structure.

Two things are genuinely **fine**:

- **Indexable content is NOT a problem here in the usual sense.** Unlike a JS-rendered interactive block, the `dashboard` block's data (accounts, balances, transactions, the savings insight) is delivered as static HTML in the initial server response. A crawler sees all of it before any JavaScript runs. The substance is present — the issue is that it is *structurally meaningless* (nested `<div>` soup with no headings, tables, or labels) and arguably *should not be indexable at all*.
- **Canonical, og:url, and viewport** are present and correctly self-referential.

Everything else in the `<head>` is the EDS default fallback: the title is the bare word "Dashboard", there is no meta description, no real OG/Twitter image, no structured data, no `<html lang>`, and a null favicon (`data:,`). The root cause is consistent across all of these: **the authored page has no `metadata` block and no heading content**, so EDS emitted default values for every metadata field.

---

## Per-Dimension Findings

### 1. Title — HIGH
**Delivered:**
```html
<title>Dashboard</title>
```
The title is the single generic word "Dashboard" (9 chars, far below the ~50–60 target). It is not unique (any number of pages could be titled "Dashboard"), carries no brand ("Evergreen Bank"), and no descriptive/keyword context. **Root cause:** the `.plain.html` source has no `metadata` block; "Dashboard" was derived from the first cell of the block table, used as the page title fallback.

### 2. Meta Description — HIGH
**Delivered:** *no `<meta name="description">` tag exists at all.*
There is no description for SERP snippets or social unfurls. **Root cause:** no `metadata` block in the source → EDS emits nothing rather than a default. (For a private dashboard the correct fix is arguably to keep it out of search entirely — see robots finding — but if it stays indexable it needs a description.)

### 3. Canonical URL — FINE (low)
**Delivered:**
```html
<link rel="canonical" href="https://snowflake-blocks-test-5--claude-design-eds--paolomoz.aem.page/snowflake-blocks/test-5">
```
Present and self-referential. Correct. Note: this points at the `.aem.page` preview host; on production it should resolve to the `.aem.live` (or final custom) domain — verify before launch.

### 4. Open Graph & Twitter Card — MEDIUM
**Delivered:**
```html
<meta property="og:title" content="Dashboard">
<meta property="og:url" content="...snowflake-blocks/test-5">
<meta property="og:image" content="...default-meta-image.png?width=1200&format=pjpg&optimize=medium">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Dashboard">
<meta name="twitter:image" content="...default-meta-image.png...">
```
`og:title`/`twitter:title` inherit the weak "Dashboard" title. **No `og:description`** and **no `twitter:description`** are present. **No `og:type`** is declared (defaults to nothing; should be `website`). The `og:image`/`twitter:image` both point to the project's generic `default-meta-image.png`, not a page-specific image. A `summary_large_image` card with a placeholder graphic and a one-word title will unfurl poorly. **Root cause:** no `metadata` block → OG/Twitter title fell back to the page title and the image fell back to the site default; description tags were omitted entirely.

### 5. Structured Data / JSON-LD — MEDIUM
**Delivered:** *no `<script type="application/ld+json">` anywhere.*
No `Organization`, `WebSite`, `BreadcrumbList`, or `FinancialProduct`/`BankAccount` schema. For a banking brand, missing `Organization` schema across the site is a brand-knowledge-panel and trust gap. **Note:** for *this specific* signed-in dashboard, marking up real account/transaction data with schema would be inappropriate — the fix belongs on public pages, not here. **Root cause:** the conversion skill emits no JSON-LD; nothing in `head.html` or `scripts.js` injects Organization data.

### 6. Indexable Content — HIGH (and a privacy concern)
**Delivered (server HTML, pre-JS):** the full dashboard is present statically —
```html
<div class="dashboard">
  <div><div>user</div><div>Alex</div></div>
  <div><div>account</div><div>chk</div><div>Everyday Checking</div><div>…4821</div><div>4862.13</div>...</div>
  ...
  <div><div>txn</div><div>Jun 9</div><div>Payroll — Acme Studio</div><div>Income</div><div>2950.00</div><div>chk</div></div>
  ...
  <div><div>insight</div><div>Savings insight</div><div>You saved $500 more than last month...$15,000 goal by September.</div></div>
</div>
```
Two-sided finding:
- **Content IS crawlable** (good in the narrow "is there text" sense): all balances, masked account numbers, transactions, and the savings insight are server-rendered, so this is *not* the empty-JS-shell failure mode seen on other interactive pages.
- **But the content is meaningless to a crawler and should probably be excluded.** The data is encoded as positional `<div>` soup with control tokens (`chk`, `txn`, `account`, `deposit`, `cc`). There are no headings, no `<table>`, no labels — a search engine sees an unstructured blob of numbers and merchant names. Worse, a personalized signed-in dashboard (account balances, transaction history) is the kind of page that **must not be indexed**; there is no `<meta name="robots">` directive (see next finding). **Root cause:** the prototype's interactive dashboard was converted 1:1 into an authorable block whose cells carry raw data tokens, with no semantic wrapper and no thought given to crawl/index policy for a signed-in surface.

### 7. Robots / Index Policy — HIGH
**Delivered:** *no `<meta name="robots">` tag.*
A signed-in financial dashboard exposing balances and transactions is being served on a publicly reachable, crawlable URL with **no `noindex`** directive. **Root cause:** no `metadata` block (which is where a `Robots: noindex` cell would be authored). This is the highest-priority real-world fix for a page of this type.

### 8. Heading Hierarchy — HIGH
**Delivered:** *zero heading elements.* There is no `<h1>` (or any `<h2>`/`<h3>`) anywhere in the document. The page has no document outline at all. **Root cause:** the prototype's visual headings ("Dashboard", account names, "Savings insight") were placed into block cells as plain `<div>` text rather than authored as default-content headings, so no heading tags were generated.

### 9. Document Language (`<html lang>`) — MEDIUM
**Delivered:**
```html
<html>
```
No `lang` attribute. Screen readers and search engines cannot determine the page language. **Root cause:** EDS does not set `lang` automatically; it is normally added in `scripts.js` (`document.documentElement.lang = 'en'`) or via the boilerplate — that step was not applied/preserved in this conversion.

### 10. Image Alt Text & Image Presence — MEDIUM
**Delivered:** *the page contains no `<img>` elements at all.* The dashboard is entirely text/CSS. So there are no alt-text violations, but there is also **no real social/share image** — only the generic `default-meta-image.png` referenced in OG/Twitter tags. **Root cause:** the dashboard prototype is icon/CSS-driven with no raster images, and no per-page OG image was authored.

### 11. Semantic HTML — HIGH
**Delivered:** the entire dashboard is nested `<div>` elements with no semantic roles. A transaction list is the textbook case for a `<table>`, `<ul>`/`<ol>`, or `<dl>`; accounts and the insight should use `<section>`/`<article>` with headings. As delivered there is no `<table>`, no list, no `<h*>`, no ARIA, no labels. **Root cause:** the block decoration (`dashboard.js`) either does not run server-side or only restyles the divs; the authored structure is flat positional cells, so the static HTML a crawler sees is structureless.

### 12. Internal Linking & Anchor Text — MEDIUM
**Delivered:** *the document body contains zero `<a>` elements.* `<header>` and `<footer>` are empty in the server response (populated lazily by JS), and the dashboard block has no links. There is no navigation, no breadcrumb, no contextual links, and nothing for a crawler to follow onward. **Root cause:** header/footer are loaded in the EDS lazy phase (so absent from the crawl-time HTML), and the prototype dashboard contained no anchor links.

### 13. Favicon / Social Share Readiness — MEDIUM
**Delivered:**
```html
<link rel="icon" href="data:,">
```
The favicon is an **empty data URI** (`data:,`) — i.e. no favicon. Combined with the placeholder OG image, the one-word title, and the missing descriptions, the page is not share-ready: a link unfurl would show "Dashboard", no description, a generic image, and no brand icon. **Root cause:** `head.html` / the boilerplate ships `data:,` as a deliberate empty placeholder; no real `/favicon.ico` or `<link rel="icon">` was wired up during conversion.

---

## Severity Table

| Dimension | Severity | One-line issue |
|---|---|---|
| Robots / index policy | HIGH | Signed-in financial dashboard is crawlable with no `noindex` |
| Indexable content | HIGH | Account/transaction data crawlable but structureless; shouldn't be indexed |
| Title | HIGH | Bare "Dashboard", no brand, no keywords, too short |
| Meta description | HIGH | Missing entirely |
| Heading hierarchy | HIGH | No `<h1>` / no headings at all |
| Semantic HTML | HIGH | Pure `<div>` soup; transactions not a list/table |
| Open Graph & Twitter | MEDIUM | Weak title, no description, placeholder image, no `og:type` |
| Structured data | MEDIUM | No JSON-LD (Organization missing site-wide) |
| `<html lang>` | MEDIUM | No language declared |
| Image alt / image presence | MEDIUM | No images; no real OG share image |
| Internal linking | MEDIUM | No `<a>` links, no nav/breadcrumb in crawl HTML |
| Favicon / share readiness | MEDIUM | Empty `data:,` favicon |
| Canonical | LOW (fine) | Present & self-referential; verify prod host |

---

## Prioritized Fix List

1. **Add `Robots: noindex, nofollow`** (HIGH). For a signed-in dashboard, author a `metadata` block with a `Robots` row → `<meta name="robots" content="noindex, nofollow">`. This is the single most important fix; personalized financial data should never be in a search index. Most findings below only matter if the page is intentionally kept indexable (e.g. as a public marketing demo).
2. **Set `<html lang="en">`** (MEDIUM, trivial). Add `document.documentElement.lang = 'en'` in `scripts.js` (or `lang` to the boilerplate template) — fixes language for every page site-wide.
3. **Author a proper title + meta description** (HIGH). Add a `metadata` block: Title → e.g. "Account Dashboard | Evergreen Bank" (~50–60 chars); Description → a 150–160 char summary. Even for a demo page this kills the one-word title and missing description.
4. **Give the page a real `<h1>` and heading structure** (HIGH). Author "Dashboard" (or "Your Accounts") as an `<h1>` in default content above the block, and section sub-headings ("Accounts", "Recent transactions", "Savings insight") as `<h2>`s.
5. **Make the dashboard semantic** (HIGH). Have `dashboard.js` decorate the positional cells into a `<table>`/`<ul>` for transactions and labeled `<section>`s for accounts, instead of leaving raw `<div>` token soup.
6. **Complete OG/Twitter** (MEDIUM). Add `og:description`, `twitter:description`, `og:type=website`, and a page-specific `og:image` instead of `default-meta-image.png`.
7. **Add a real favicon** (MEDIUM). Replace `data:,` with a real brand `/favicon.ico` / `<link rel="icon">`.
8. **Add site-wide `Organization` JSON-LD** (MEDIUM). Inject Organization schema (name, logo, URL) via `head.html`/`scripts.js` for brand knowledge-panel eligibility — on public pages, not this dashboard.
9. **Verify canonical host on production** (LOW). Ensure canonical/og:url resolve to the production `.aem.live`/custom domain, not the `.aem.page` preview host.
