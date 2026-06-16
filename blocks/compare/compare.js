/**
 * loads and decorates the compare block
 * @param {Element} block The compare block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cellsOf = (row) => [...(row?.children || [])];

  // row 0: eyebrow + heading
  const headRow = rows[0];
  const headCells = cellsOf(headRow);
  const center = document.createElement('div');
  center.className = 'center';

  const eyebrowCell = headCells[0];
  if (eyebrowCell && eyebrowCell.textContent.trim()) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = eyebrowCell.textContent.trim();
    center.append(eyebrow);
  }

  const headingCell = headCells[1];
  if (headingCell) {
    const authored = headingCell.querySelector('h1,h2,h3,h4,h5,h6');
    const heading = document.createElement(authored ? authored.tagName.toLowerCase() : 'h2');
    heading.innerHTML = (authored || headingCell).innerHTML;
    center.append(heading);
  }

  // remaining rows: one comparison card each
  const grid = document.createElement('div');
  grid.className = 'cmp-grid';

  rows.slice(1).forEach((row) => {
    const cells = cellsOf(row);
    const variant = (cells[0]?.textContent || '').trim().toLowerCase();
    const vsLabel = (cells[1]?.textContent || '').trim();
    const titleCell = cells[2];
    const listCell = cells[3];

    const card = document.createElement('div');
    card.className = 'cmp';
    if (variant === 'knack') card.classList.add('knack');

    if (vsLabel) {
      const vs = document.createElement('div');
      vs.className = 'vs';
      vs.textContent = vsLabel;
      card.append(vs);
    }

    if (titleCell) {
      const authored = titleCell.querySelector('h1,h2,h3,h4,h5,h6');
      const h3 = document.createElement('h3');
      h3.innerHTML = (authored || titleCell).innerHTML;
      card.append(h3);
    }

    const ul = listCell?.querySelector('ul');
    if (ul) card.append(ul);

    grid.append(card);
  });

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  wrap.append(center, grid);

  block.textContent = '';
  block.append(wrap);
}
