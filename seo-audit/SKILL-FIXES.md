# Snowflake skill — SEO/discovery fixes (implementation-ready)

Derived from the per-page SEO audits in `seo-audit/test-*.md` (8 pages across
test-1…test-7) and verified against the **live deployed HTML** of each branch
preview. This document is the staff-engineer review of the proposed systemic
fixes: each item below is either confirmed SYSTEMIC + ACTIONABLE (the skill can
emit a crawler-facing change), or labelled as an inherent limitation the skill
can only document. Findings already covered by IMPROVEMENTS.md #1–33 are
cross-referenced, not re-proposed.

**Ground-truth verification performed for this review:**
- `curl` of the live test-7 page: `<html>` has **no** `lang`, `<title>Quiz</title>`,
  `<link rel="icon" href="data:,">`, and the page loads `/scripts/ak.js` (the
  AuthorKit runtime, not the boilerplate `scripts.js` whose `loadEager` *does*
  set `document.documentElement.lang='en'` — so the AuthorKit page boot is the
  thing that must set lang).
- test-6 (Meridian) **did author a `metadata` block** → it has a correct
  `<title>Meridian Airways — Chase the light</title>`, a real meta description,
  and complete OG/Twitter tags. This is the control case: it proves the metadata
  block fix is correct, actionable, and that **EDS auto-mirrors Title/Description
  into og:/twitter:**. The other 7 pages omitted it and got junk.
- `default-meta-image.png` returns **HTTP 404** on the JFK branch; `favicon.ico`
  returns **HTTP 200** at repo root yet `head.html` still points the icon at
  `data:,` (head.html on the branch carries no icon `<link>` at all — EDS injects
  the `data:,` default).

---

## P0 — 1. Per-page `metadata` block is MANDATORY (Title + Description), never block-name fallback

**Problem.** The skill explicitly tells the agent *not* to author a metadata
block: Step 9 opens "Content pages contain only the body sections — no metadata
block for header/footer," and the per-page Checklist says "No metadata block
needed for header/footer." With no Title/Description authored, EDS derives
`<title>` from the first content cell, producing non-unique, keyword-free titles
(`Hero`, `Quiz`, `Dashboard`, `Site Nav`). Because EDS mirrors Title→og:title→
twitter:title, the junk poisons social/AI share cards too, and the missing
Description leaves Google to synthesize snippets.

**Evidence (7 of 8 pages).** test-1 Wheeler (`Hero`), test-2 Festool (`Hero`),
test-3 Beehive (`Hero`), test-4 JFK (`Hero`), test-5 dashboard (`Dashboard`),
test-5-home (`Site Nav`), test-7 Frescopa (`Quiz`). **Control:** test-6 Meridian
authored a metadata block and is the only page with a correct title + description
+ complete OG — proving the fix works end-to-end.

**Exact SKILL.md change.**
- **Step 9 (Content page scaffold), opening sentence (currently line ~700):**
  replace "Content pages contain only the body sections — no metadata block for
  header/footer…" with a rule that **every content page MUST begin with a
  `metadata` block** carrying at minimum **Title** (~50–60 chars: brand + primary
  keyword/location; NEVER a block/section name) and **Description** (~150–160
  chars). Add the working shape (verbatim from test-6):
  ```html
  <div>
    <div class="metadata">
      <div><div>Title</div><div>Brand — primary keyword / location</div></div>
      <div><div>Description</div><div>150–160 char summary of the page.</div></div>
    </div>
  </div>
  ```
  Add the hard rule: **"NEVER allow `<title>` to fall back to a block name. Derive
  the Title from the page's real `<h1>` text (see P0-2) plus the brand."** Note
  that EDS auto-mirrors Title/Description into og:/twitter:, so this one block
  resolves title, description, og:title, og:description, twitter:title,
  twitter:description at once.
- **Checklist:** change the line "No metadata block needed for header/footer. Only
  add one if suppressing them" to: **"Every page starts with a `metadata` block
  with a real Title (≤60 chars, never a block name) + Description (~155 chars).
  `header: off` / `footer: off` / `Robots` rows go in the same block."**

**Priority:** P0 — highest-impact, lowest-cost; one authored block per page.
**Actionable vs inherent:** **Actionable.** Pure authoring change the conversion
fully controls (test-6 already does it).

---

## P0 — 2. Promote one cell to `<h1>` and section titles to `<h2>`/`<h3>` (heading outline)

**Problem.** The skill's block JS scaffold (Step 8 JSDoc) lists "`<h2>` headline"
as a comment but the example DOM and the actual generated blocks emit headlines
as plain `<div>` text; no rule forces exactly one `<h1>`. Result: pages have no
heading outline and no primary topic signal.

**Evidence (8 of 8).** test-1/2/3/4/5/5-home/7 contain **zero** `<h*>` elements
(grep-verified in each audit). test-6 has sibling `<h2>`s but **no `<h1>`** — so
even the "good" page has a broken hierarchy. This is the strongest on-page
relevance signal, sitewide-absent.

**Exact SKILL.md change.**
- **Step 8 (Block JS scaffold), the "Authoring rows (positional)" JSDoc:** change
  the `<h2> headline` line to state the headline cell must be rendered as a **real
  heading element**, and add: *"the hero/lead block renders its headline as the
  page's single `<h1>`; every other section title renders as `<h2>` (sub-items
  `<h3>`). Map prototype styled `<div>`/`<span>` headlines to heading tags — never
  preserve a headline as a bare `<div>`."*
- **Step 9 example DOM:** show the hero block's headline cell decorated to `<h1>`
  and a later section's title to `<h2>` (the scaffold currently shows only generic
  `<div>` cells).
- **Add a per-page Checklist entry:** *"Exactly one `<h1>` per page (the hero
  headline); section titles are `<h2>`/`<h3>`; no headline left as a bare `<div>`."*

**Priority:** P0. **Actionable vs inherent:** **Actionable.** `decorate()` builds
the DOM, so promoting cells to `hN` is entirely in the block's control. (Note:
this is what makes P0-1's "derive Title from the real `<h1>`" possible.)

---

## P1 — 3. Favicon and `<html lang>` — narrow the "head.html untouched" rule to fonts only

**Problem.** Two sitewide head defects, both currently *blocked* by skill rules.
(a) Every page ships `<link rel="icon" href="data:,">` (EDS's default when
`head.html` declares no icon). A real `favicon.ico` already sits at repo root and
returns 200 on JFK — proving this is a head.html wiring gap, not a missing asset.
(b) Every page ships `<html>` with no `lang`. The AuthorKit `ak.js` page boot
(which the deployed pages load) does not set it; the boilerplate `scripts.js`
*does*, but it's replaced by `ak.js`. The skill's Anti-pattern #10 and Step 4
("Leave `head.html` untouched. No font lines, period.") are written so broadly an
agent treats *all* of head.html as off-limits.

**Evidence (8 of 8).** `data:,` favicon and bare `<html>` in every audit;
confirmed live on test-7. JFK root `favicon.ico` = HTTP 200 while head still
points at `data:,`.

**Exact SKILL.md change.**
- **Step 4 heading + Anti-pattern #10:** narrow the scope. Reword "Leave
  `head.html` untouched" to **"Keep *font* loads out of `head.html`"** and add an
  explicit carve-out: *"head.html MAY carry a real favicon link and (see P1-4) a
  site-wide JSON-LD block; what it must NOT carry is font `<link>`/`@font-face`/
  font preloads."*
- **Step 3 (Foundation), add two boot tasks:**
  1. **Favicon:** add to `head.html`
     `<link rel="icon" href="/favicon.ico">` (+ optional
     `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`), and commit a
     brand `favicon.ico` at repo root during Phase-1 site setup.
  2. **Lang:** set `document.documentElement.lang = 'en'` (or the site locale) in
     the **AuthorKit page boot (`scripts/ak.js`)** — NOT `head.html` (head.html
     can't set an attribute on `<html>`), and NOT the boilerplate `scripts.js`
     `loadEager` (it's replaced by `ak.js` on deployed pages). Add a Runtime-
     bootstrap note that `ak.js` must set `lang` since it supersedes the
     boilerplate that normally does.

**Priority:** P1. **Actionable vs inherent:** **Actionable** for both — favicon
via head.html, lang via the `ak.js` page boot.

---

## P1 — 4. Emit structured data (JSON-LD) — site-wide Organization + page-level types

**Problem.** No `<script type="application/ld+json">` on any page. No
Organization/entity markup sitewide (acute for the bank and the dealer), and
page-level types are forfeited where content strongly warrants them.

**Evidence (7 of 8; not the signed-in dashboard).** Wheeler (Product/Offer ×6 +
LocalBusiness), Festool (Organization/ItemList), Beehive (LocalBusiness/Brewery +
hours/address + Product), JFK (Airport + FAQPage from the hero questions),
test-5-home (Organization/Offer), Meridian (Organization/ItemList ×3 fares),
Frescopa (Product ×4 + FAQ/HowTo). The dashboard correctly should NOT carry
entity schema over private data.

**Exact SKILL.md change.**
- **Step 3 (Foundation):** add a task to inject a single site-wide **Organization**
  JSON-LD (name, url, logo, sameAs) from the `ak.js` page boot so every *public*
  page carries it. Explicitly exclude signed-in/personalized surfaces (gate on the
  same Robots/noindex signal as P2-5).
- **Step 9 (Content page scaffold):** add page-level schema guidance — when a page
  has priced items → `Product`/`Offer`; a local business with address/hours →
  `LocalBusiness`; an FAQ-style hero → `FAQPage`; plus `BreadcrumbList`. Drive it
  from the new metadata block (a `JSON-LD` / `Schema` row) or from the owning
  block's JS.

**Priority:** P1. **Actionable vs inherent:** **Actionable.** Organization is a
boot-time injection; page types are derivable from already-authored block data.

---

## P2 — 5. Crawl/index policy — `noindex` for signed-in/personalized views

**Problem.** The skill never considers index policy. A signed-in banking dashboard
rendering balances, masked account numbers, and transaction history is served as
fully crawlable static HTML with no `noindex` — a privacy/compliance and index-
pollution hazard.

**Evidence.** test-5 dashboard (balances/txns crawlable, no robots tag — the
highest real-world risk). Lower-stakes index-policy gaps noted on test-4 / test-1
/ test-5-home; the `*.aem.page` preview hosts already `Disallow: /` by design, so
preview leakage is partially mitigated and is *not* a skill defect — drop that
sub-claim.

**Exact SKILL.md change.**
- **Step 9 metadata block (the one made mandatory in P0-1):** add an optional
  **`Robots`** row and a rule: *"for any signed-in / personalized / private view
  (dashboards, account pages, signed-in SPA views) author `Robots: noindex,
  nofollow`."*
- **Cross-reference** from the interactive-block guidance (Step 8 #28) and the
  multi-view-SPA guidance (Step 9 #29): a converted signed-in view defaults to
  `noindex` and carries no entity JSON-LD.

**Priority:** P2 (P0-grade for the dashboard specifically, but it affects 1 page
type, not the batch). **Actionable vs inherent:** **Actionable** via a metadata
`Robots` row.

---

## P2 — 6. Interactive blocks must emit a server-visible SEMANTIC skeleton (not pre-JS cell-soup)

**Problem.** Step 8's interactive-block rule (#28/#17/#33) says to "render the
default/active state in markup" but does not require that markup to be **semantic
and heading-bearing**. So an agent can ship a block whose entire pre-JS body is
unlabeled `<div>` cells, invisible to non-JS crawlers/AI.

**Evidence.** test-7 Frescopa is the clearest case: the whole pre-JS body is
`intro`/`chapter`/`option`/`roast`/`result` cells — no `<h*>`, `<p>`, `<a>`,
`<img>`, or `<button>`; all UX is built by `quiz.js`. test-5 dashboard server-
renders text but only as structureless positional tokens (`chk`/`txn`/`account`).
(Note: most interactive pages — test-3, test-4, test-6 — render their content
fine; this is a "decorate properly" requirement, not an inherent EDS limit.)

**Exact SKILL.md change.**
- **Step 8 "Interactive blocks (#28)" / #17 / #33:** strengthen to: *"`decorate()`
  MUST emit a server-visible, semantic skeleton of the default/active state BEFORE
  wiring interactivity — promote the flow/quiz title to the page `<h1>`,
  questions/section titles to `<h2>`/`<h3>`, options to a `<ul>`/`<li>` or
  `<button>` list, results/products to `<article>` with `<h3>`+`<p>`. Authoring
  data into keyed rows is NOT sufficient; un-decorated cell-soup must never be the
  crawler's view."*
- **Local QA before deploy (interactive-block QA note):** add an assertion —
  *"with JS disabled, the page still shows an `<h1>` and the core copy as real
  text."*

**Priority:** P2. **Actionable vs inherent:** **Actionable** — `decorate()` runs
and can build semantic DOM; the cell-soup is a decoration omission, not an EDS
constraint. (Ties into P0-2.)

---

## P3 — 7. Commit a valid default share image; allow a per-page Image override

**Problem.** `og:image`/`twitter:image` resolve to a generic
`default-meta-image.png`, and on JFK that URL **404s** — so share cards are
unbranded or visibly broken.

**Evidence (7 of 8).** All pages reference `default-meta-image.png`; verified
**HTTP 404** on the JFK branch. Unbranded fallback on the rest.

**Exact SKILL.md change.**
- **Step 3 / Phase-1 site setup:** commit a real **1200×630** branded
  `default-meta-image.png` at repo root so the fallback never 404s.
- **Step 9 metadata block:** allow an optional **`Image`** row for pages that
  warrant a page-specific share image.

**Priority:** P3. **Actionable vs inherent:** **Actionable** (commit asset +
optional metadata row).

---

## P3 — 8. Never carry over placeholder `#` / dead-anchor hrefs from prototypes

**Problem.** CTAs and nav links are carried over as `#` or in-page `#anchor`s with
no matching `id`, becoming dead destinations: no crawl paths, no internal link
equity, poor UX.

**Evidence (7 of 8).** test-2 Festool and test-6 Meridian have **every** link as
`#`; test-1/test-3/test-4 use `#anchor`s that resolve to nothing on the page;
test-5-home exposes one fragment anchor and otherwise plain-text CTAs; test-7
exposes no `<a>` at all. (Some of this overlaps the "CTAs authored as plain text
not links" issue — fold both into one rule.)

**Exact SKILL.md change.**
- **Step 7 (parallel-agent brief, Buttons paragraph) + Step 9:** add: *"placeholder
  hrefs (`#`, dangling `#anchor`s) must NOT be carried over verbatim. Repoint each
  CTA to a real internal destination (another converted page in the batch); if no
  target exists, flag it in the conversion log for the author — never ship `#`.
  Where the prototype used in-page `#anchor` jumps, ensure the target section's
  block emits a matching `id`. Author CTAs as real `<a href>`, not plain text."*
- **Anti-patterns:** add an entry alongside #9 ("Generic placeholder image paths"):
  *"Carrying over `#`/dead-anchor hrefs (or plain-text CTAs with no `href`)."*

**Priority:** P3. **Actionable vs inherent:** **Partly actionable** — real cross-
page links between converted pages in the same batch are fully actionable; links
to pages that don't exist yet can only be flagged for the author (document, not
fabricate).

---

## Items reviewed and adjusted/dropped

- **Images / alt text** appears in every audit (empty `<div>` image cells, no
  `<img>`). It is **NOT re-proposed as a new systemic skill fix**: IMPROVEMENTS.md
  #2 / anti-pattern #14 already establish the `<image-slot>` → optional picture
  cell + CSS-background-fallback convention. The prototypes genuinely have no real
  image assets, so "add images with alt" is a per-page **authoring** task (drop real
  assets in DA), not something the conversion can fabricate. Documented as inherent;
  the only skill-side nudge is "when an image cell is authored, require descriptive
  alt" — minor, fold into the Step 7 image guidance, not a standalone fix.
- **Preview-host index leakage** (part of the original P2 item): dropped — the
  `*.aem.page` preview already serves `Disallow: /`; not a skill defect.
- **Canonical points at preview host:** every audit flags it but every audit also
  says it's *correct* for preview and resolves to prod on launch. No skill change.

---

## Highest-priority recommendation

Make the **per-page `metadata` block mandatory** (P0-1) and **promote one cell to
`<h1>` plus section titles to `<h2>`/`<h3>`** (P0-2) — these two fixes, both in
Step 8/9 and both pure decoration/authoring changes the conversion fully controls,
resolve the large majority of findings across all 8 pages: a unique keyword-rich
`<title>`, a real meta description, correct og:/twitter: titles+descriptions (EDS
mirrors them automatically), the primary on-page relevance signal, and the document
outline for crawlers, AI answer engines, and screen readers. test-6 (Meridian)
already proves the metadata block works end-to-end; the gap is simply that the
skill currently *forbids* it. The remaining items — favicon + `<html lang>` (P1,
narrow the "head.html untouched" rule and set lang in the `ak.js` boot),
Organization/page JSON-LD (P1), `noindex` on signed-in views (P2), a server-visible
semantic skeleton for interactive blocks (P2), a non-404 branded share image (P3),
and killing `#` placeholder links (P3) — are all real and mostly actionable, but
each is narrower in blast radius than the two P0s.
