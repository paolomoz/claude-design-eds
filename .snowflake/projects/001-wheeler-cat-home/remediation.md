# Remediation log — test-1

Source: impeccable `/audit` of https://test-1--claude-design-eds--paolomoz.aem.page/test-1
Applied by: `snowflake-autofix` skill dry-run (see .claude/skills/snowflake-autofix/). Batched.

## Batch 2 — AUTO (mobile-menu a11y), 3 files
| Finding | Sev | Lane | File | Change | Validation | Status |
|---|---|---|---|---|---|---|
| Mobile menu lacks dialog semantics | P2 | AUTO | `fragments/test-1/header.html` | `#menuOpen` += `aria-expanded="false" aria-controls="mnav"` | served on :3733 | DONE |
| ″ | P2 | AUTO | `fragments/test-1/footer.html` | `#mnav` += `role="dialog" aria-modal="true" aria-label aria-hidden="true"` | served on :3733 | DONE |
| ″ | P2 | AUTO | `scripts/test-1-animations.js` | `setOpen()` toggles aria-hidden/aria-expanded, Esc-to-close, focus in/out | `node --check` OK; eslint-exempt; served | DONE |

Residual on this finding: full tab focus-trap; convert `#menuClose` `<div>`→`<button>` for keyboard close (currently Esc + link-click close).

## Batch 2 — reclassified / proposed (triage corrections vs SKILL.md v1)
- **Self-host fonts (P2)** — was AUTO; reclassified **ARCH-blocked**: (1) no Barlow woff2 in `fonts/` (only Roboto) → needs assets; (2) route was wrong — `styles/fonts.css` is intentionally empty (substrate convention); `@font-face` must go in `styles/test-1.css`.
- **Un-nest `.fav` (P2)** — was AUTO; reclassified **ASSIST**: card is a whole `<a>`; fixing nested-interactive is a structural refactor ×6 + CSS, not a mechanical attr edit.
- **Eyebrow cadence (P2)** — ASSIST: route `templates/test-1.html` (+ inline `:240`) → `/impeccable typeset`.
- **Empty imagery (P1)** — ARCH: per `decisions.json.imageSlots.followUp`; needs real assets + slot wiring.

## Hook false positives (batch 2)
- `broken-image` L184/L250/L257 in `test-1-animations.js` — vendored `<image-slot>` shadow-DOM internals (hidden until filled); file is `@ds-adherence-ignore` + eslint-exempt.

---

## Batch 1 — AUTO (contrast/a11y), CSS-only

| Finding | Sev | Lane | File | Change | Validation | Status |
|---|---|---|---|---|---|---|
| Yellow-deep accent TEXT ~2:1 on light | P1 | AUTO | `styles/test-1.css` | Added `--yellow-text:#7a5200`; repointed `.sec-head .kicker`, `.promo-ribbon .body .go`, `.card:hover .view` | 6.9:1 white / 6.4:1 paper (AA) | DONE |
| Footer bottom text ~4.2:1 | P3 | AUTO | `styles/test-1.css` | `footer .bottom` `#7e7b74`→`#918e86` | 5.9:1 on `#0E0E0E` (AA) | DONE |
| No reduced-motion / focus-visible | P3 | AUTO | `styles/test-1.css` | Appended `:focus-visible` ring + `@media (prefers-reduced-motion: reduce)` | parses clean; file lint-exempt | DONE |

## Residual (same finding family, needs a template/fragment edit — next batch)
- Service eyebrow has inline `style="color:var(--yellow-deep)"` in `templates/test-1.html` (L240) — overrides the CSS token. Repoint to `--yellow-text` there to fully close the contrast finding.

## Deferred by lane (not in this batch)
- ARCH: empty imagery (P1), LCP/paint-gating (P2), `href="#"` (P3) — architecture/content, surfaced not faked.
- AUTO (template/fragment): self-host fonts, un-nest `.fav` button, mobile-menu aria/focus-trap.
- ASSIST: eyebrow cadence (`/impeccable typeset`), filter-chip honesty.

## Hook false positives (left unchanged, brand-intentional)
- `side-tab:116` — 1px 8%-opacity grid divider on `.quick a`, not a side-stripe accent.
- `border-accent-on-rounded:68` — `.logo .cat::after` is the Caterpillar yellow corner triangle (CSS triangle via borders), not a card border.

Not committed.
