/**
 * loads and decorates the cabins block (full-bleed ink band)
 * @param {Element} block The block element
 *
 * Author shape:
 *   head row: [ h2 | sub ]
 *   then one row per cabin: [ label | strap | desc ]
 *   ("Explore <label> →" link is generated from the label)
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const [headRow, ...cabinRows] = rows;

  // ----- Section head -----
  const head = document.createElement('div');
  head.className = 'md-section-head';
  const headCells = headRow ? [...headRow.children] : [];

  const heading = headCells[0]?.querySelector('h1, h2, h3, h4, h5, h6');
  const h2 = document.createElement('h2');
  h2.textContent = heading ? heading.textContent.trim() : (headCells[0]?.textContent.trim() || '');
  head.append(h2);

  const sub = document.createElement('p');
  sub.className = 'md-section-sub';
  sub.textContent = headCells[1]?.textContent.trim() || '';
  head.append(sub);

  // ----- Cabin grid -----
  const grid = document.createElement('div');
  grid.className = 'md-cabin-grid';

  cabinRows.forEach((row, i) => {
    const cells = [...row.children];
    const [labelCell, strapCell, descCell] = cells;
    const label = labelCell?.textContent.trim() || '';

    const card = document.createElement('article');
    card.className = 'md-cabin-card';

    const index = document.createElement('span');
    index.className = 'md-cabin-index';
    index.textContent = `0${i + 1}`;

    const h3 = document.createElement('h3');
    h3.textContent = label;

    const strap = document.createElement('p');
    strap.className = 'md-cabin-strap';
    strap.textContent = strapCell?.textContent.trim() || '';

    const desc = document.createElement('p');
    desc.className = 'md-cabin-desc';
    desc.textContent = descCell?.textContent.trim() || '';

    const link = document.createElement('a');
    link.className = 'md-text-link';
    link.href = '#';
    link.textContent = `Explore ${label} →`;

    card.append(index, h3, strap, desc, link);
    grid.append(card);
  });

  block.textContent = '';
  block.classList.add('md-section', 'md-section-ink');
  block.append(head, grid);
}
