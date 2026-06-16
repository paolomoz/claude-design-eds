/*
 * service-band block
 * Rows (positional). Point rows are detected by having 2 cells (big | small);
 * the single-cell rows are read in order: disc-l1, disc-l2, headline, paragraph,
 * then any number of 2-cell point rows, then the CTA (last single-cell row).
 *   disc-l1   — top line of the green disc (e.g. "Festool")
 *   disc-l2   — bottom line of the green disc (e.g. "SERVICE")
 *   headline  — h2 text
 *   paragraph — intro paragraph
 *   point row — 2 cells: big (e.g. "3 yr") | small (e.g. "Warranty all-inclusive")
 *   cta       — ghost button, authored <em><a> (decorateButton -> a.btn a.btn-secondary)
 */

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const single = [];
  const points = [];
  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      points.push([cells[0], cells[1]]);
    } else if (cells.length === 1) {
      single.push(cells[0]);
    }
  });

  const [discL1Cell, discL2Cell, headlineCell, paragraphCell, ctaCell] = [
    single[0], single[1], single[2], single[3], single[4],
  ];

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // ---- left: green disc ----
  const discCol = document.createElement('div');
  const disc = document.createElement('div');
  disc.className = 'service-disc';
  if (discL1Cell?.textContent.trim()) {
    const l1 = document.createElement('span');
    l1.className = 'l1';
    l1.textContent = discL1Cell.textContent.trim();
    disc.append(l1);
  }
  if (discL2Cell?.textContent.trim()) {
    const l2 = document.createElement('span');
    l2.className = 'l2';
    l2.textContent = discL2Cell.textContent.trim();
    disc.append(l2);
  }
  discCol.append(disc);

  // ---- right: copy ----
  const copy = document.createElement('div');
  copy.className = 'service-copy';

  if (headlineCell) {
    const h2 = document.createElement('h2');
    h2.textContent = headlineCell.textContent.trim();
    copy.append(h2);
  }

  if (paragraphCell?.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = paragraphCell.textContent.trim();
    copy.append(p);
  }

  if (points.length) {
    const ul = document.createElement('ul');
    ul.className = 'service-points';
    points.forEach(([bigCell, smallCell]) => {
      const li = document.createElement('li');
      const big = document.createElement('span');
      big.className = 'big';
      big.textContent = bigCell.textContent.trim();
      const small = document.createElement('span');
      small.className = 'small';
      small.textContent = smallCell.textContent.trim();
      li.append(big, small);
      ul.append(li);
    });
    copy.append(ul);
  }

  if (ctaCell) {
    // CTA already decorated to a.btn a.btn-secondary by decorateButton(); clone its nodes.
    const ctaWrap = document.createElement('div');
    ctaWrap.className = 'service-cta';
    ctaWrap.append(...ctaCell.childNodes);
    copy.append(ctaWrap);
  }

  wrap.append(discCol, copy);
  block.replaceChildren(wrap);
}
