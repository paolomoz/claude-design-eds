/**
 * loads and decorates the page-intro block (hero / lead)
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Reuse the authored heading element if present (server-visible, avoid nesting).
  const heading = block.querySelector('h1');

  // Authored order (flat rows): heading, then the short eyebrow line, then the
  // longer lede paragraph. Classify the two text rows by document order — the
  // FIRST non-heading text row is the eyebrow (sits above the heading), the
  // SECOND is the lede (right column). Picking "first paragraph = lede" swaps
  // them, because the eyebrow is also a <p>.
  let eyebrowCell = null;
  let ledeEl = null;

  [...block.children].forEach((row) => {
    const cell = row.firstElementChild;
    if (!cell) return;
    if (cell.querySelector('h1')) return;
    if (!cell.textContent.trim()) return;
    const p = cell.querySelector('p') || cell;
    if (!eyebrowCell) {
      eyebrowCell = cell;
    } else if (!ledeEl) {
      ledeEl = p;
    }
  });

  // Build the centered wrap holding the two-column grid.
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const grid = document.createElement('div');
  grid.className = 'page-intro-grid';

  const left = document.createElement('div');
  left.className = 'page-intro-left';

  if (eyebrowCell) {
    const eyebrow = document.createElement('div');
    eyebrow.className = 'page-intro-eyebrow';
    eyebrow.textContent = eyebrowCell.textContent.trim();
    left.append(eyebrow);
  }

  if (heading) left.append(heading);

  const right = document.createElement('div');
  right.className = 'page-intro-right';
  if (ledeEl) {
    ledeEl.classList.add('page-intro-lede');
    right.append(ledeEl);
  }

  grid.append(left, right);
  wrap.append(grid);

  block.textContent = '';
  block.append(wrap);
}
