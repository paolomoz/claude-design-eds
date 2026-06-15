# Notes — `audit-apply` skill (working draft)

A lightweight skill that ingests an **audit report** for an EDS page and **applies the fixable
findings to the correct source files**, then validates. It bridges the gap between impeccable's
generic recommendations and the real file layout of a snowflake-converted (overlay) page.

> Status: design notes. Not yet a SKILL.md. Validated by a dry-run against `test-1`.

---

## 1. Problem it solves

`/impeccable audit` produces findings tagged with a *suggested command* (`colorize`, `optimize`,
`harden`…). Those commands operate on "the design" abstractly. But on a **snowflake page-level
overlay**:

- there are **no blocks** carrying the design — EDS block decoration is skipped for overlay `main`;
- the design is assembled client-side from `styles/<t>.css` + `templates/<t>.html` +
  `fragments/<t>/*.html` + `scripts/<t>-animations.js`;
- content is DA block-table text; styling/structure is the code files above.

Nothing in impeccable or the default EDS skills knows this mapping. The fixer owns it.

## 2. The routing bridge — read snowflake state, don't guess

For an overlay page, `.snowflake/projects/<run>/state.json` + `decisions.json` are the authoritative
address book:

- `state.json.deployedPaths` → the exact files that compose the page.
- `decisions.json.headLinks` → external `<link>`s (fonts/CDNs) lifted into `<head>` by the template.
- `decisions.json.imageSlots` → `{ids, authorable, followUp}` for imagery findings.
- `decisions.json.inlineStyleLines` / `inlineScriptLines` → provenance of the CSS/JS.
- `state.json.{localUrl, productionUrl, daEditorUrl}` → where to validate / where content lives.
- `state.json.templateName` / `conversionLevel` → overlay vs block-level vs none.

If **no** snowflake project exists (canonical EDS / Universal-Editor page), fall back to the standard
layout: `blocks/<name>/*`, `styles/*`, `scripts/*`, and route via the block names instead.

## 3. Triage — sort every finding into a lane

| Lane | What it is | Action |
|---|---|---|
| **AUTO** | Mechanical, taste-free: contrast/token swaps, aria/role/tabindex, `prefers-reduced-motion`, `:focus-visible`, touch-target sizing, font self-hosting, copy edits | Apply directly with a minimal diff |
| **ASSIST** | Needs a craft decision: eyebrow-cadence rework, bolder/quieter, layout rhythm, typographic restructure | Invoke the matching `/impeccable <cmd>` **scoped to the routed file** |
| **ARCH** | Architecture/content, not a CSS edit: imagery wiring, real `href`s, DA content, LCP/paint strategy | Do **not** fake-fix. Emit a precise task; offer the structural change only with the data/assets/decision it needs |
| **SKIP** | False positive or user-deprioritized | Record reason, move on |

Guardrail: never invent imagery/assets/copy to "satisfy" a finding — that's the brand-ban trap. ARCH
items get surfaced, not faked.

## 4. Layer routing table (overlay pages)

| Finding touches | File to edit |
|---|---|
| color / contrast / spacing / type / motion in the page body | `styles/<t>.css` |
| header / utility / primary-nav markup or its copy | `fragments/<t>/header.html` (CSS still in `styles/<t>.css`) |
| footer / **mobile-menu** markup, aria, focus trap | `fragments/<t>/footer.html` (+ wiring in `<t>-animations.js`) |
| section structure, slot copy, element semantics (role/aria/tabindex), font `<link>` | `templates/<t>.html` |
| behavior: menu/scroll/chips, reduced-motion JS, `<image-slot>` | `scripts/<t>-animations.js` |
| **font self-hosting** | remove CDN `<link>` from `templates/<t>.html` → add `@font-face` to `styles/fonts.css` → ensure files in `fonts/` |
| **LCP / paint-gating / critical CSS** | overlay engine `scripts/scripts.js` + `styles/styles.css` (`body{display:none}`) |
| **imagery population** | per `decisions.json.imageSlots.followUp`: convert `<image-slot>`→background-image slot, or add committed `src=` |

Rules: edit **code source** in the repo, never the live/served HTML. `scripts/aem.js` is off-limits.
If `drafts/<t>.html` is a standalone preview copy, check whether it needs the mirror edit.

## 5. Validate (borrow EDS skills' discipline)

1. `npm run lint` (eslint + stylelint) — must pass.
2. Local: `aem up` (background) → re-fetch the page → confirm the *specific* finding is resolved
   (recompute contrast ratio, grep for the added aria attr, confirm no CDN font request, etc.).
3. Perf/visual items: PageSpeed Insights on the preview URL; browser screenshots at 360/768/1280 if a
   headless browser is available.
4. One finding → one minimal diff → one re-check. No batching unrelated edits.

## 6. Record & report

- Append a remediation log to `.snowflake/projects/<run>/learnings.md` (or `remediation.md`):
  `finding → lane → file → change → validation → status`.
- Optionally stamp `state.json` with a `remediated` note.
- Print a table: finding | lane | file | status | residual.
- **Do not commit** unless asked.

## 7. Stance

- **Lightweight = inline impeccable *principles* + targeted edits.** Escalate to a full
  `/impeccable <cmd>` sub-run only for ASSIST-lane findings that genuinely need a craft loop.
- Idempotent: re-running after a partial apply picks up only unresolved findings.
- Input-agnostic: accept the audit markdown, a findings list, or a path to a saved report.
- Severity order: P0 → P1 → P2 → P3, but AUTO before ASSIST within a severity (cheap wins first).

## 8. Open questions

- Where should the skill live / be named? (`audit-apply`, `remediate`, `impeccable:apply`?)
- Should it parse the audit markdown, or define a small findings JSON the audit can also emit?
- For ASSIST findings, sub-invoke impeccable, or just apply principles inline and flag for review?
