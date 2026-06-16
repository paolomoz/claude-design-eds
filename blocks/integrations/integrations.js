/**
 * loads and decorates the integrations block
 * @param {Element} block The integrations block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cellsOf = (row) => [...(row?.children || [])];

  // row 0: heading + sub paragraph
  const headCells = cellsOf(rows[0]);
  const center = document.createElement('div');
  center.className = 'center';

  const headingCell = headCells[0];
  if (headingCell) {
    const authored = headingCell.querySelector('h1,h2,h3,h4,h5,h6');
    const heading = document.createElement(authored ? authored.tagName.toLowerCase() : 'h2');
    heading.innerHTML = (authored || headingCell).innerHTML;
    center.append(heading);
  }

  const subCell = headCells[1];
  if (subCell && subCell.textContent.trim()) {
    const sub = document.createElement('p');
    sub.innerHTML = subCell.innerHTML;
    center.append(sub);
  }

  // row 1: letter tiles (whitespace-separated tokens)
  const logos = document.createElement('div');
  logos.className = 'integ-logos';
  const tilesCell = cellsOf(rows[1])[0];
  if (tilesCell) {
    tilesCell.textContent.trim().split(/\s+/).filter(Boolean).forEach((token) => {
      const tile = document.createElement('div');
      tile.textContent = token;
      logos.append(tile);
    });
  }

  // row 2: CTA
  const ctaWrap = document.createElement('div');
  ctaWrap.className = 'integ-cta';
  const ctaCell = cellsOf(rows[2])[0];
  if (ctaCell) ctaWrap.append(...ctaCell.childNodes);

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  wrap.append(center, logos, ctaWrap);

  block.textContent = '';
  block.append(wrap);
}
