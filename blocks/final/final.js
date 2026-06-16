/**
 * loads and decorates the final block
 * @param {Element} block The final block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cellsOf = (row) => [...(row?.children || [])];

  // row 0: heading + sub paragraph
  const headCells = cellsOf(rows[0]);
  const inner = document.createElement('div');
  inner.className = 'wrap';

  const headingCell = headCells[0];
  if (headingCell) {
    const authored = headingCell.querySelector('h1,h2,h3,h4,h5,h6');
    const heading = document.createElement(authored ? authored.tagName.toLowerCase() : 'h2');
    heading.innerHTML = (authored || headingCell).innerHTML;
    inner.append(heading);
  }

  const subCell = headCells[1];
  if (subCell && subCell.textContent.trim()) {
    const sub = document.createElement('p');
    sub.innerHTML = subCell.innerHTML;
    inner.append(sub);
  }

  // row 1: CTA
  const ctaCell = cellsOf(rows[1])[0];
  if (ctaCell) inner.append(...ctaCell.childNodes);

  block.textContent = '';
  block.append(inner);
}
