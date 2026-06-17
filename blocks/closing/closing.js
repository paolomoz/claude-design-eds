/**
 * Closing band — reusable closing CTA shared across pages.
 *
 * Authored rows (block.children):
 *   row 0  — heading cell (h2 "Ready to get started?")
 *   row 1  — subtitle cell (lead paragraph)
 *   row 2  — CTA cell  (Start now <strong><a> primary, Contact sales <em><a> secondary)
 *   row 3+ — one mono note card per row (right column)
 *
 * Produces a full-bleed rule over a max-width 7fr/5fr grid: left text + actions,
 * right notes column. CTAs are cloned as authored — the global decorateButton()
 * in ak.js applies .btn/.btn-primary/.btn-secondary from the emphasis wrappers.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // full-bleed rule across the band
  const rule = document.createElement('hr');
  rule.className = 'closing-rule';
  rule.setAttribute('aria-hidden', 'true');

  // max-width content wrap
  const wrap = document.createElement('div');
  wrap.className = 'wrap closing-grid';

  const left = document.createElement('div');
  left.className = 'closing-text';

  const notes = document.createElement('div');
  notes.className = 'closing-notes';

  // row 0 — heading: reuse the authored heading element if present
  const headingCell = rows[0]?.firstElementChild;
  if (headingCell) {
    const authored = headingCell.querySelector('h1, h2, h3, h4, h5, h6');
    if (authored) {
      left.append(authored);
    } else if (headingCell.textContent.trim()) {
      const h2 = document.createElement('h2');
      h2.textContent = headingCell.textContent.trim();
      left.append(h2);
    }
  }

  // row 1 — subtitle
  const subCell = rows[1]?.firstElementChild;
  if (subCell && subCell.textContent.trim()) {
    const sub = subCell.querySelector('p') || document.createElement('p');
    sub.classList.add('closing-sub');
    if (!sub.parentElement || sub.parentElement === subCell) {
      sub.textContent = sub.textContent || subCell.textContent.trim();
    }
    left.append(sub);
  }

  // row 2 — CTAs: clone the cell content; do NOT manufacture anchors
  const ctaCell = rows[2]?.firstElementChild;
  if (ctaCell && ctaCell.querySelector('a')) {
    const actions = document.createElement('div');
    actions.className = 'actions';
    [...ctaCell.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
    left.append(actions);
  }

  // row 3+ — mono note cards (right column)
  rows.slice(3).forEach((row) => {
    const cell = row.firstElementChild;
    if (!cell || !cell.textContent.trim()) return;
    const note = cell.querySelector('p') || document.createElement('p');
    note.className = 'note';
    if (!cell.contains(note)) note.textContent = cell.textContent.trim();
    notes.append(note);
  });

  wrap.append(left, notes);

  block.textContent = '';
  block.append(rule, wrap);
}
