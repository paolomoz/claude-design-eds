/**
 * commerce-stats — "prove scale" section.
 * Lifted from en-it-C-cinematic.html section[data-section="commerce-stats"].
 *
 * Authoring model (block.children = rows, row.children = cells):
 *   Row 1            : title          — one cell with a heading (h2).
 *   Rows 2..N        : stat           — cell 0 = big mono display value,
 *                                       cell 1 = description sentence.
 *   Rows N+1..N+M    : strip image    — one cell holding an <img>/<picture>.
 *
 * EDS strips <span> in cells, so the .stat-display spans are re-created here.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const statsGrid = document.createElement('div');
  statsGrid.className = 'stats-grid';

  const strip = document.createElement('div');
  strip.className = 'commerce-strip';

  let heading = null;

  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 0) return;

    const pic = row.querySelector('picture, img');

    // Image row → strip cell.
    if (pic) {
      const cell = document.createElement('div');
      cell.className = 'img-cell';
      const img = row.querySelector('img');
      if (img) img.loading = 'lazy';
      cell.append(pic.closest('picture') || pic);
      strip.append(cell);
      return;
    }

    // Title row → reuse the authored heading element (server-visible).
    const authoredHeading = row.querySelector('h1, h2, h3, h4, h5, h6');
    if (authoredHeading && cells.length === 1) {
      heading = authoredHeading;
      return;
    }

    // Stat row → value + description.
    const valueCell = cells[0];
    const descCell = cells[1];
    const valueText = valueCell.textContent.trim();
    if (!valueText) return;

    const stat = document.createElement('div');
    stat.className = 'stat';

    const display = document.createElement('span');
    display.className = 'stat-display';
    display.textContent = valueText;
    stat.append(display);

    if (descCell) {
      const p = descCell.querySelector('p') || document.createElement('p');
      if (!p.textContent.trim()) p.textContent = descCell.textContent.trim();
      stat.append(p);
    }

    statsGrid.append(stat);
  });

  if (heading) wrap.append(heading);
  if (statsGrid.children.length) wrap.append(statsGrid);
  if (strip.children.length) wrap.append(strip);

  block.textContent = '';
  block.append(wrap);
}
