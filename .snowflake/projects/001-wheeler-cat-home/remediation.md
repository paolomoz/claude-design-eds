# Remediation log — test-1

Source: impeccable `/audit` of https://test-1--claude-design-eds--paolomoz.aem.page/test-1
Applied by: `audit-apply` skill dry-run (see /audit-apply-notes.md). AUTO-lane, CSS-only batch.

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
