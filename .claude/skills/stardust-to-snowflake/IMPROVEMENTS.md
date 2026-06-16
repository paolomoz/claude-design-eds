# Snowflake skill — improvement notes

Running log of friction and gaps found while applying `stardust-to-snowflake`
to the `samples/**` claude-design prototypes in this repo. Each test converts
**one** prototype on a `snowflake-blocks-test-N` subbranch and deploys to DA at
`/snowflake-blocks/test-N`; durable skill fixes are implemented here on
`snowflake-blocks`.

Status legend: 🔴 blocker / bug · 🟠 missing guidance · 🟡 nice-to-have ·
✅ implemented in skill.

---

## Run log

### test-1 — Wheeler CAT (`samples/Wheelercat`)
- Branch: `snowflake-blocks-test-1`
- DA: `https://da.live/#/paolomoz/claude-design-eds/snowflake-blocks/test-1`
- Preview: `https://snowflake-blocks-test-1--claude-design-eds--paolomoz.aem.page/snowflake-blocks/test-1`
- Outcome: ✅ faithful end-to-end render (header, hero, quick, used, stats,
  service, offers, brands, locations, footer). 8 blocks + 2 chrome fragments.
- Prototype type: single-file HTML, inline `<style>` with `:root` tokens,
  semantic `<section class="…">` — the **closest** of the samples to what the
  skill expects.

### test-2 — Festool (`samples/Festool`)
- Branch: `snowflake-blocks-test-2` (off the **improved** `snowflake-blocks`)
- DA: `https://da.live/#/paolomoz/claude-design-eds/snowflake-blocks/test-2`
- Preview: `https://snowflake-blocks-test-2--claude-design-eds--paolomoz.aem.page/snowflake-blocks/test-2`
- Outcome: ✅ faithful end-to-end render (header, hero, new-products, brand-band,
  discover, service-band, footer). 5 blocks + 2 chrome fragments.
- Prototype type: single-file HTML with an **external** `.css`, semantic
  `<section>`, green-accent brand, reuses **Barlow** (body) + Barlow Condensed
  (display), chevron text-links instead of chunky buttons.
- **Skill fixes validated:** #13 held — all 5 parallel-built blocks reproduced
  the `.wrap` max-width container (no full-width bug; the agent briefs now state
  the rule). #4 held — no footer "Error" box (runtime port carried the lazy.js
  fix). Body-fragment (#7), non-variable fonts (#11), image-slot fallbacks (#2),
  headless deploy (#10) all worked from the skill as written.
- **New findings surfaced:** #14, #15, #16 below.

### test-3 — Beehive Brewing (`samples/Beer maker Utah design`)
- Branch: `snowflake-blocks-test-3` (off `snowflake-blocks`)
- DA: `https://da.live/#/paolomoz/claude-design-eds/snowflake-blocks/test-3`
- Preview: `https://snowflake-blocks-test-3--claude-design-eds--paolomoz.aem.page/snowflake-blocks/test-3`
- Outcome: ✅ faithful end-to-end render incl. the **interactive beer selector**
  (click a beer → glass fill + detail + strength bar update) and the **count-up
  stats**. 5 blocks (hero, marquee, lineup, story, taproom) + 2 chrome fragments.
- Prototype type: **`<x-dc>` document-content** — everything inline-styled, with
  template `{{ }}` bindings, a `<sc-for>` loop, `<sc-if>`, and a JS `Component`
  class driving state. The hardest input shape; exercised the new inline-style
  lifting + interactive-block paths.
- **Skill fixes validated:** #1 (`<x-dc>` handling), #2 (no real images — kept
  inline SVG/CSS), #4 (no footer error box), #7/#10/#11/#13/#14/#15 all held —
  body fragment, headless deploy, non-variable Anton, story capped at `--maxw`
  while lineup/taproom are padded-full (matching the prototype), reveal dropped,
  no reserved-class block names. The improved skill carried this hard case.
- **New findings surfaced:** #17, #18, #19, #20 below.

---

## Findings (test-3)

### 17. 🟠 Component-driven prototypes → authorable rows + block JS (block JS *can* run)
Beehive's logic lives in a `<script type="text/x-dc">` `Component` class: state (`active` beer), a `baseBeers()` data array, a `<sc-for>` list loop, `{{ activeBeer.* }}` bindings, count-up via IntersectionObserver. The conversion pattern that worked:
- **Data → authorable rows.** The 5 beers became 5 block rows (`name | style | abv | ibu | notes | blurb | glass-color`); the stats became `number | label` rows.
- **Behavior → block JS.** Unlike static *fragments*, **block JS runs** — so `decorate()` wires the click-to-select interactivity, builds the glass gradient from the authored color, and runs the count-up observer. State that lived in the component becomes local state in the block.
- Template bindings (`{{ }}`), `<sc-for>`, `<sc-if>` are NOT EDS syntax — read them as "loop over these rows" / "show one state"; render the default/active state and drive the rest from JS.
**Proposed:** add a short "Interactive / component-driven sections" subsection to Step 7/8: data→rows, behavior→block JS, and the explicit reminder that **block JS runs** (only fragments can't) so interactivity is fine.

### 18. 🟡 Lifting an all-inline-styled (`<x-dc>`) section is mechanical but heavy
Every element carries `style="…"`; there's no class to scope under. The reliable method: rebuild the section DOM with **new semantic class names**, move each element's inline style into the block CSS under `.<block> .<name>`, and copy the needed `@keyframes` from the prototype's `<helmet><style>`. Parallel agents handled one section each well. No skill change beyond #1's pointer, but worth noting the per-element-style reality so estimates are realistic.

### 19. 🟠 QA screenshots: a 100vh hero breaks the "tall window" capture
The local QA recipe (#8) suggested a tall capture window. A `min-height:100vh` hero then becomes *window-tall* (e.g. 7800px), pushing its centered content far down and off the top crop — looked like the hero text was missing. **Fix:** screenshot at a realistic viewport (e.g. 1440×900) and `scrollIntoView()` each section (Playwright), rather than one giant-window capture. Keep the wide-viewport width check (#13) as a separate 1600px pass.
**Proposed:** amend the "Local QA" recipe — capture at a normal viewport and scroll per section; reserve the tall capture only for short pages.

### 20. 🟠 EDS CSP blocks inline event handlers — forms in fragments can't `onsubmit`
The footer had a newsletter `<form onsubmit="return false">`. EDS's delivered CSP is `script-src 'nonce-…' 'strict-dynamic' 'unsafe-inline'` — with `strict-dynamic`, `'unsafe-inline'` is ignored, so **inline `on*` handlers don't fire** (and `<script>` in fragments never runs). A real `<form>` would then submit and reload. **Fix:** render such controls non-submitting — a `<div>` wrapper with `<button type="button">`, no `<form>`/`onsubmit`. (Generalizes #5: not just `<script>`, but inline handlers too.)
**Proposed:** add to Step 6 (fragments): "no `<form onsubmit>` / inline `on*` — CSP blocks them; render decorative controls as non-submitting (`type="button"`, no `<form>`)."

---

## Findings (test-2)

### 14. 🔴 Scroll-reveal animations rely on JS — never ship the `opacity:0`
Festool sections carry a `.reveal` class (`opacity:0; transform:translateY()`) that an IntersectionObserver flips to `.in` on scroll. That observer lives in the prototype's inline `<script>`, which **does not run** in EDS (block JS rebuilds the DOM; the prototype script is discarded). If a block lifts `.reveal { opacity:0 }` verbatim, the content is **permanently invisible**.
**Fix applied (test-2):** drop the reveal entirely — render content visible; keep only hover transitions. (Optional: a per-block IntersectionObserver could re-add a reveal, but it wasn't worth it.)
**Proposed:** add to Step 7 brief + a checklist line + an anti-pattern: "if the prototype hides content behind a JS-toggled reveal class, render it visible — never ship `opacity:0` without an observer." Generalizes #5 (fragments can't run JS) to **block** content.

### 15. 🟠 Block name must not collide with reserved EDS classes
Festool's two main sections both use `class="section"` (`section` + `section tinted`). `section` is a **reserved EDS class** (the section wrapper becomes `<div class="section">`), and `default-content` / `block-content` are reserved too. Naming a block `section` would break decoration. Had to rename to semantic block names (`new-products`, `discover`) and apply the `tinted` treatment as a block variant.
**Proposed:** add to Step 2 naming rules: "block name = the section's class, EXCEPT when that class is generic/reserved (`section`, `default-content`, `block-content`, `wrap`, `button`) — then derive a semantic name from the section's `data-screen-label`/intent."

### 16. 🟠 Secure `.env` (DA token) on the PARENT branch, not per-test
The DA token lives in repo `.env`. Test subbranches branch from `snowflake-blocks`, so if `.gitignore` doesn't ignore `.env` on the **parent**, every new test branch re-exposes the token (had to re-add the ignore on both test-1 and test-2). Fixed once on `snowflake-blocks` so all subbranches inherit it. Also gitignore `qa/` (the local QA harness) and keep `samples/` out of commits.
**Proposed:** add an early skill step / bootstrap line: "ensure `.gitignore` excludes `.env`, `.env.*`, `qa/` before the first commit; the token must never enter git." Pair with the existing token-expiry caveat (dev tokens ~24h; a 401 with empty body = expired → refresh).

**Implemented (#14–16):** all three applied to SKILL.md — #14 Step 7 brief + anti-pattern 16 + checklist; #15 Step 2 naming rules + checklist; #16 "Running headless" token-hygiene note. Parent `.gitignore` now excludes `.env`/`qa/` so test subbranches inherit it.

---

## Findings (test-1)

### 1. 🟠 Input scope assumes stardust, not claude-design prototypes
The skill keys off `stardust/prototypes/**/*.html`. Our inputs are
`samples/<Name>/*.html` claude-design outputs in three shapes:
- single-file inline-`<style>` + `<section>` (Wheelercat, Festool) — works
- `<x-dc>` document-content, everything inline-styled (Beehive Brewing)
- React/JSX (Fable variants, Virgin, Wells Fargo, JFK) — needs rendering first
**Proposed:** generalize the "When to use" + audit steps to any per-page styled
HTML; add a pre-step for JSX/`<x-dc>` inputs ("render to static HTML first").

### 2. 🟠 `<image-slot>` placeholders, not real images
Claude-design prototypes use `<image-slot>` custom elements as drop targets —
**no real image assets exist**. The skill assumes real images at a prototype
host (Step 9 / anti-pattern #9 say use fully-qualified prototype URLs).
What worked: treat each image as an **optional** leading cell; if empty, fall
back to the prototype's background treatment (dark `--ink`) via block CSS.
**Proposed:** document the `image-slot → optional <picture> cell + CSS
background fallback` convention as the default for image-less prototypes.

### 3. 🟠 Runtime is a prerequisite but not shipped/with the skill
SKILL.md references `scripts/ak.js`, `postlcp.js`, `body.session`,
`decorateSession()`, `fragments/` injection, `tools/da/sanitise.js` — all of
which live in the **author-kit** repo (`ai-ecoverse/snowflake`), not in the
skill. Porting onto a vanilla `aem-boilerplate` project required copying
`scripts/{ak,lazy,postlcp,scripts}.js`, `scripts/utils/*`, `tools/*`, `deps/*`,
`head.html`, `blocks/{fragment,section-metadata}`, and **removing** boilerplate
(`scripts/aem.js`, `scripts/delayed.js`, `blocks/{header,footer,cards,columns,
widget}`, `styles/{fonts,lazy-styles}.css`).
**Proposed:** add a "Runtime bootstrap" step with an explicit file manifest +
removal list for the plain-boilerplate case, or a script that vendors it.

### 4. 🔴 `lazy.js` block-footer collides with `postlcp.js` static footer (BUG)
The author-kit `lazy.js` runs `utils/footer.js` → `loadBlock(footer)` while the
skill's `postlcp.js` injects the footer as a **static fragment**. With no
`blocks/footer`, this surfaces a visible "Error" box between the last section
and the footer (`error.js` renders it).
**Fix applied in test-1:** removed the `utils/footer.js` import from `lazy.js`.
**Proposed:** the runtime port must reconcile the two footer mechanisms —
when using static chrome fragments, drop `utils/footer.js` (and the analogous
header path) from `lazy.js`.

### 5. 🟠 Fragments cannot run JS — interactive chrome needs CSS-only
`postlcp.js` injects fragments via `innerHTML`, so `<script>` in a fragment
never executes. The prototype's mobile-menu toggle + header scroll-shadow JS
had to be reworked: mobile menu → CSS checkbox-hack (`<input type=checkbox> +
<label>`), scroll-shadow → dropped (kept a static border).
**Proposed:** call this out explicitly in Step 6 and provide the checkbox-hack
pattern; list which interactive behaviors degrade (scroll-state, focus-trap).

### 6. 🟠 Lint config mismatch (author-kit helix vs boilerplate airbnb)
The vendored runtime is authored for `@adobe/eslint-config-helix`; the
boilerplate lints with `airbnb-base`. `npm run lint` produced ~6600 errors
(runtime + minified `deps/lit` + `samples/`).
**Fix applied:** `.eslintignore` the vendored runtime
(`deps/`, `scripts/{ak,lazy,postlcp,scripts}.js`, `scripts/utils/`, `tools/`,
`blocks/fragment/`) and `samples/`; our generated blocks + `styles.css` lint
clean under airbnb after expanding single-line rules.
**Proposed:** ship `.eslintignore` additions (or recommend swapping to the
helix eslint config) as part of the runtime bootstrap.

### 7. 🟠 DA content format: body-fragment vs the skill's full document
Skill Step 9 emits `<!DOCTYPE html><html><body>…</body></html>`. The DA
**Source API** (the headless deploy path) requires a **body fragment** — no
doctype/html/head (per `da-content` skill, silent-failure rule #1). The
mount-based deploy may tolerate the full doc, but Source-API deploy needs it
stripped to `<body>…</body>`.
**Fix applied:** content page authored/stored as a body fragment; sanitised
with `tools/da/sanitise.js` (21 non-ASCII → entities). PUT `data=@…;type=text/html`
+ POST preview both succeeded (201 / 200).
**Proposed:** make Step 9 emit a body fragment by default; note the mount path
as the only place a full doc is acceptable.

### 8. 🟠 Local testing recipe is missing / `--html-folder` is misleading
`aem up --html-folder content` serves repo files **statically** and does NOT
render brand-new paths through the full pipeline (it needs remote routing; new
paths 404 on the rendered route). Reliable local-decoration QA = a
self-contained harness = `head.html` scripts + the body fragment, saved as a
**static repo file** (e.g. `qa/page.html`) and opened via the dev server so the
real runtime decorates it. Headless Chrome (`--virtual-time-budget`,
`--screenshot`/`--dump-dom`) verifies the post-JS result.
**Proposed:** add a "Local QA harness" recipe to the skill; stop implying
`aem up` renders unpublished content.

### 9. 🟡 Single-page naming ceremony is heavier than needed
Step 2 says "surface 3–5 naming questions." For a single page with self-evident
section names (`hero`, `quick`, `used`, `stats`…), section-class = block-name
was unambiguous; the questions were overkill.
**Proposed:** scale the naming step to multi-page sites; for single pages, lock
section-class names and proceed.

### 10. 🟠 Sprinkle/cone/scoop flow is inapplicable headlessly
A large share of SKILL.md (sprinkle licks, `scoop_wait`, `mount`, `write_file`,
`sprinkle send`) assumes the cloud sprinkle UI + cone runtime. From local
Claude Code none of that exists — I used `git push` (Code Sync) + DA Source API
PUT + `admin.hlx.page` preview via `curl`.
**Proposed:** split SKILL.md into "methodology" (input → blocks → content →
deploy) and "sprinkle integration", so the methodology is usable headlessly,
and document the curl-based DA deploy as the non-sprinkle path.

### 11. 🟠 Font step assumes variable fonts (`@fontsource-variable`)
Barlow is a **non-variable** Google font (named weights). The skill's Step 4
relies on `@fontsource-variable/<name>` for woff2 + the published "Fallback"
`@font-face` calibration — neither exists for static families.
**Fix applied:** fetched static `@fontsource/<name>` latin woff2 weights and
**computed** `size-adjust` / `ascent-override` / `descent-override` from the
woff2 (fonttools, Barlow vs Arial: 116.22% / 86.04% / 17.21%).
**Proposed:** add the non-variable-font branch — static `@fontsource`, compute
metrics with fonttools when no published fallback exists.

### 12. 🟡 Multi-family brands: only the body font gets full CLS treatment
Wheelercat uses 3 families (Barlow body + Barlow Condensed + Barlow Semi
Condensed). `body.session` gates only the body font; the condensed/semi
families are referenced by class and load with `font-display: swap`, leaving
minor heading CLS.
**Proposed:** note the multi-family case — only the body family is fully
metric-matched; document the display-font CLS trade-off (and that adding
metric-matched fallbacks per display family is optional polish).

### 13. 🔴 Parallel block agents inconsistently reproduce the max-width container
Found post-deploy on the live preview: the prototype wraps most section
content in `<div class="wrap">` (max-width 1320, centered) — the dark/colored
section **background** bleeds full-width but the **content** must not. Of 8
blocks built by 4 parallel agents, 4 reproduced the `.wrap` (hero, service,
offers, locations) and 3 did not (`used`, `stats`, `brands`) — their grids ran
edge-to-edge at wide viewports. (`quick` is correctly full-bleed — the
prototype has no `.wrap` there.)
**Fix applied (test-1):** each block's content appended into a `.wrap` div,
`block.replaceChildren(wrap)` (stats keeps the full-width `.stripe` outside).
**Proposed:** (a) make the per-block agent brief explicit — "if the prototype
section content sits inside a max-width container, reproduce it; only go
full-bleed where the prototype is"; (b) add a post-build QA step that measures
each block's inner content width at a wide viewport (>1440) and flags
unintended full-width content. This bug is invisible at ≤1440px (where 1320
max-width ≈ viewport) — **test wide**.

---

## Implementation checklist (apply to SKILL.md on `snowflake-blocks`)

All implemented on `snowflake-blocks` (SKILL.md + da-deploy-protocol.md).

- [x] #1 Generalize input scope + JSX/`<x-dc>` pre-render note — "When to use" + Step 1
- [x] #2 Document `image-slot → optional picture cell + CSS fallback` — Step 7 brief, Step 9, anti-pattern 14
- [x] #3 Add runtime-bootstrap step (file manifest + removals) for plain boilerplate — "Runtime bootstrap"
- [x] #4 Reconcile `lazy.js` footer with static `postlcp.js` footer — bootstrap + Step 6 + anti-pattern 15
- [x] #5 Fragment interactivity = CSS-only (checkbox-hack pattern) — Step 6
- [x] #6 Ship `.eslintignore` additions for vendored runtime — "Runtime bootstrap"
- [x] #7 Step 9 = body fragment by default (Source-API path) — Step 9 + checklist
- [x] #8 Add the local QA harness recipe — "Local QA before deploy"
- [x] #9 Scale naming ceremony to multi-page only — Step 2
- [x] #10 Split methodology vs sprinkle; document curl DA deploy — "Running headless" + da-deploy-protocol.md
- [x] #11 Non-variable-font branch (compute metrics) — Step 4 + anti-pattern 11
- [x] #12 Multi-family CLS note — Step 4
- [x] #13 Block briefs must reproduce max-width container; add wide-viewport QA — Step 7 brief, Local QA, anti-pattern 13
