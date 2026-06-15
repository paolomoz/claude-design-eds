---
name: snowflake-autofix
description: >-
  Apply the fixes from an impeccable design audit to a snowflake-overlay EDS page.
  Routes each audit finding to the right overlay source file (templates/<t>.html,
  fragments/<t>/*.html, styles/<t>.css, scripts/<t>-animations.js), auto-applies the
  safe mechanical fixes, orchestrates impeccable for taste calls, proposes (never fakes)
  architecture/content changes, then validates the EDS way. Use after /impeccable audit
  (or /impeccable critique) on a page converted with the snowflake skill, or when the
  user says "apply the audit", "fix the audit findings", "remediate this page",
  "autofix this". NOT an auditor (impeccable produces the audit), NOT a design-judgment
  engine, NOT general EDS block development. Snowflake-overlay pages only in v1.
---

# snowflake-autofix

The remediation router between **impeccable** (the design brain that produced the audit)
and an **EDS snowflake-overlay project** (where the code actually lives). It does not judge
design and does not develop the platform — it locates each finding's real source file,
applies the safe ones, delegates the rest, and validates.

"Autofix" means: the **AUTO** lane is applied automatically. **ASSIST** is routed to impeccable.
**ARCH** is proposed, never silently changed.

## When this applies (and when it doesn't)

Use it when **all** of these hold:
- there is an **audit/critique** for the page (from `/impeccable audit` / `/impeccable critique`), and
- the page is a **snowflake-overlay** page — i.e. `.snowflake/projects/<run>/state.json` exists with
  `conversionLevel: "page-level"` and a `templateName`, and `main.dataset.overlay` is set at runtime.

Out of scope in v1 (stop and hand off):
- No audit yet → run `/impeccable audit <url>` first.
- No snowflake project / canonical block-based or Universal-Editor page → hand to the
  `aem-edge-delivery-services` skills (`building-blocks`, `content-driven-development`).
- Producing audits, deciding what "good" looks like, building/modifying blocks, content
  modeling, authoring DA copy, pushing/publishing — all someone else's circle.

## Prerequisites

1. The audit report (markdown the audit printed, or a findings list). Each finding should carry
   severity (P0–P3), category, location, recommendation, and ideally a suggested impeccable command.
2. Repo access to the overlay sources. Confirm you can read `.snowflake/projects/<run>/state.json`
   and `decisions.json`.

## Procedure

### 1. Locate — read the snowflake state, never guess
Resolve the template name from the audited URL (`…/<pageSlug>`), `meta[name=template]`, or
`body[data-template]`. Then read:
- `state.json` → `templateName`, `deployedPaths` (the exact files that compose the page),
  `localUrl`, `productionUrl`, `daEditorUrl`, `conversionLevel`.
- `decisions.json` → `headLinks` (external `<link>`s / fonts), `imageSlots` (`ids`, `authorable`,
  `followUp`), `inlineStyleLines` / `inlineScriptLines`, the section list.

This is the authoritative address book. If it's missing or `conversionLevel` isn't page-level → stop
(out of scope).

### 2. Triage — sort every finding into a lane
For each finding, **scan all layers** — a single finding can span files (e.g. a color rule in
`styles/<t>.css` *and* an inline `style="..."` override in `templates/<t>.html`). Then assign:

| Lane | What it is | Action |
|---|---|---|
| **AUTO** | mechanical, taste-free: contrast/token swaps, aria/role/tabindex/alt, `:focus-visible`, `prefers-reduced-motion`, touch-target sizing, template copy | apply directly |
| **ASSIST** | needs a design decision: eyebrow cadence, bolder/quieter, layout rhythm, type restructure | resolve the file, then **invoke the matching `/impeccable <cmd>` scoped to it** |
| **ARCH** | architecture/content: imagery wiring, real `href`s, LCP/overlay-engine strategy, DA content | **propose** a precise EDS task; never fake |
| **SKIP** | false positive or user-deprioritized | record the reason |

**AUTO disqualifier test** — classify a finding AUTO only if **all** hold; otherwise route it to
ASSIST (a design/UX decision) or ARCH (assets/architecture):
- single element, single concern — **not** a multi-instance structural refactor;
- localized edits only (adding attributes across a few files is fine; restructuring DOM is not);
- **no new binary assets** required;
- no taste decision required.

Demotions this catches (both looked AUTO at first glance):
- *self-host fonts* when `fonts/` lacks the family → **ARCH** (needs woff2 assets to obtain first);
- *un-nest nested-interactive* when the element is a whole-card `<a>` → **ASSIST** (structural/UX).

When in doubt, demote: a wrongly-applied AUTO is worse than a correctly-proposed ASSIST/ARCH.

### 3. Plan — show before touching anything
Print the routed fix-plan as a table: `# | finding | sev | lane | file(s) | concrete change`.
Lead with AUTO (cheap wins), severity order within a lane. This is the contract the user sees.

### 4. Apply
- **AUTO** → apply minimal diffs to the routed file(s). One finding → one change → one re-check.
- **ASSIST** → run the matching impeccable sub-command, scoped to the routed file; let impeccable
  own the craft; you own the routing, EDS-safety, validation, and recording.
- **ARCH** → do not edit. Emit the task (with the exact `decisions.json` pointer where relevant,
  e.g. `imageSlots.followUp`) and stop there.

### 5. Validate (EDS discipline)
- **Lint (CSS):** per-template CSS is vendor-exempt via `.stylelintignore` — `npm run lint` won't cover
  it by design. To syntax-check just the template file: `npx stylelint styles/<t>.css --ignore-path /dev/null`
  and confirm **no new parse errors** (the standing single-line/hex/`currentColor` violations are
  pre-existing vendor style — not yours to fix).
- **Lint (JS):** per-template behavior JS (`scripts/<t>-animations.js`) is likewise vendor-exempt via
  `.eslintignore` (`scripts/*-animations.js`). Use `node --check scripts/<t>-animations.js` as the
  syntax gate. impeccable hook hits inside the vendored `<image-slot>` block (`broken-image` on its
  shadow-DOM `<img>`s) are false positives — component internals, hidden until filled.
- **Serve:** `npx -y @adobe/aem-cli up --no-open` in the working tree. In a git worktree the CLI
  auto-assigns a per-branch port (e.g. 3733) — read it from the server output, don't assume 3000.
- **Re-check the specific finding** against the *served* file, not just disk:
  `curl -s localhost:<port>/styles/<t>.css | grep …`; recompute contrast ratios; grep for the added
  aria attribute; confirm no CDN font request remains.

### 6. Record
Append to `.snowflake/projects/<run>/remediation.md`:
`finding | sev | lane | file | change | validation | status`, plus **Residual** (same finding,
other layer, not yet closed) and **Deferred by lane**. Do **not** commit unless asked.

## Routing table (overlay pages)

| Finding touches | File to edit |
|---|---|
| color / contrast / spacing / type / motion in the page body | `styles/<t>.css` |
| header / utility / primary-nav markup or copy | `fragments/<t>/header.html` (CSS still in `styles/<t>.css`) |
| footer / mobile-menu markup, aria, focus trap | `fragments/<t>/footer.html` (+ wiring in `scripts/<t>-animations.js`) |
| section structure, slot copy, element semantics (role/aria/tabindex), font `<link>` | `templates/<t>.html` |
| behavior: menu/scroll/chips, reduced-motion JS, `<image-slot>` | `scripts/<t>-animations.js` |
| **font self-hosting** | **First check `fonts/` for the actual family** — if absent (e.g. only Roboto), this is **ARCH** (needs woff2 assets), not AUTO. To apply: remove the CDN `<link>` from `templates/<t>.html` (`decisions.json.headLinks`) → add `@font-face` to **`styles/<t>.css`**, NOT `styles/fonts.css` (the snowflake substrate keeps `fonts.css` deliberately empty; per-template webfonts live in the template's own CSS) |
| **LCP / paint-gating / critical CSS** | overlay engine `scripts/scripts.js` + `styles/styles.css` (`body{display:none}`) — propose, confirm before touching the shared engine |
| **imagery population** | per `decisions.json.imageSlots.followUp`: convert `<image-slot>`→background-image slot, or add committed `src=` |

Hard rules: edit **code source** in the repo, never the live/served HTML. `scripts/aem.js` is
**off-limits**. If `drafts/<t>.html` is a standalone preview copy, check whether it needs the mirror edit.

## Guardrails

- **Never fake an ARCH finding.** Empty imagery, missing copy, real links — surface them; do not paper
  over with colored blocks or placeholder text (that's the brand-ban trap impeccable warns about).
- **A finding can span layers.** Always grep the template/fragments for inline-style or attribute
  overrides of whatever you changed in CSS, or you'll report "fixed" while one instance still fails.
- **impeccable design-hook findings are not automatically defects.** Classify domain-appropriate ones
  (brand marks built from borders, 1px structural dividers) as false positives in your report; only
  persist a hook ignore after the user confirms. Never add `impeccable: ignore` comments.
- **Idempotent.** Re-running after a partial apply picks up only unresolved findings.
- **Lightweight.** Inline impeccable *principles* for AUTO; escalate to a full `/impeccable <cmd>`
  sub-run only for ASSIST.

## Not built yet (pluggable)

The routing table is the only platform-specific layer. Canonical block-based EDS (route to
`blocks/<name>/*`) and Universal-Editor pages (component models) can be added as alternate routing
tables behind the same triage/apply/validate loop. v1 implements snowflake-overlay only.
