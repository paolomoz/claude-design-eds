/**
 * loads and decorates the contact-strip block
 *
 * Authored shape: one cell per row (heading, intro paragraph, CTA in any order).
 * We query the content rather than assume row/cell indices so the block is
 * robust to how the author lays out the rows.
 *   - heading (h2/h3) + any non-link copy  -> .contact-copy (left)
 *   - the row containing a link            -> .actions (right CTA)
 *     (the EDS link decorator turns an authored <strong><a> into .btn.btn-primary)
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten every authored cell (each row here carries a single cell).
  const cells = [...block.querySelectorAll(':scope > div > div')];
  if (!cells.length) return;

  const ctaCell = cells.find((c) => c.querySelector('a'));
  const copyCells = cells.filter((c) => c !== ctaCell);

  const inner = document.createElement('div');
  inner.className = 'contact-inner';

  // Left: heading + intro paragraph(s).
  if (copyCells.length) {
    const text = document.createElement('div');
    text.className = 'contact-copy';
    copyCells.forEach((cell) => {
      [...cell.childNodes].forEach((n) => text.append(n.cloneNode(true)));
    });
    inner.append(text);
  }

  // Right: the CTA. The EDS link decorator turns the authored <strong><a>
  // into .btn.btn-primary.
  if (ctaCell) {
    const actions = document.createElement('div');
    actions.className = 'actions';
    [...ctaCell.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
    inner.append(actions);
  }

  block.textContent = '';
  block.append(inner);
}
