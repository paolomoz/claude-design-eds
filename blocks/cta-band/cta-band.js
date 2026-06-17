/**
 * cta-band — closing CTA band on the athens tint.
 * 7fr/5fr grid: left column (heading + copy + two CTAs), right column (mini-tiles).
 *
 * Authored rows (block.children):
 *   row 1: [ heading (h2) + copy (p) ]        → left column text
 *   row 2: [ CTAs: <strong><a> + <em><a> ]    → left column buttons
 *   row 3+: [ mini-tile: h3 + p + chevron <a> ] → right column tiles
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // chevron SVG appended to the prototype's "›" text links
  const chevron = () => {
    const span = document.createElement('span');
    span.className = 'chev';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" '
      + 'xmlns="http://www.w3.org/2000/svg"><path d="M6 3.5 10.5 8 6 12.5" '
      + 'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" '
      + 'stroke-linejoin="round"/></svg>';
    return span;
  };

  // build the 7fr/5fr grid wrap
  const wrap = document.createElement('div');
  wrap.className = 'wrap cta-grid';

  const left = document.createElement('div');
  const tiles = document.createElement('div');
  tiles.className = 'mini-tiles';

  // row 1 — heading + copy. Reuse the authored heading element if present.
  const textCell = rows[0]?.firstElementChild;
  if (textCell) {
    [...textCell.children].forEach((node) => left.append(node));
  }

  // row 2 — CTA cell. Clone as-is so the EDS button decorator can run on the
  // authored <strong><a> / <em><a> emphasis. Just give it the layout class.
  const ctaCell = rows[1]?.firstElementChild;
  if (ctaCell && ctaCell.querySelector('a')) {
    const buttons = document.createElement('div');
    buttons.className = 'cta-buttons';
    [...ctaCell.childNodes].forEach((n) => buttons.append(n.cloneNode(true)));
    left.append(buttons);
  }

  // rows 3+ — mini-tiles. h3 + p + plain chevron text link.
  rows.slice(2).forEach((row) => {
    const cell = row.firstElementChild;
    if (!cell) return;
    const mini = document.createElement('div');
    mini.className = 'mini';
    [...cell.children].forEach((node) => {
      mini.append(node);
      // append the chevron glyph to the trailing text link
      if (node.tagName === 'A') {
        node.classList.add('chevlink');
        node.append(' ');
        node.append(chevron());
      }
    });
    tiles.append(mini);
  });

  wrap.append(left, tiles);
  block.textContent = '';
  block.append(wrap);
}
