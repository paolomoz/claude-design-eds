/**
 * stats — "prove scale" band.
 * Lifted from stardust home-C-cinematic section.stats: an <h2> over an
 * auto-fit grid of stat cells (big light-weight value over a slate caption,
 * optional progress bar). Bars render at their final width (no JS-driven
 * width:0 reveal — see anti-pattern 16); reduced-motion is honored in CSS.
 *
 * Authoring contract (block.children = rows, row.children = cells):
 *   Row 1            : title          | (single cell, reuse its <h2> if present)
 *   Row 2..N (a stat): value | caption | bar-width (optional, e.g. "80%")
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // --- Title row -----------------------------------------------------------
  const titleCell = rows.shift()?.firstElementChild;
  if (titleCell) {
    // Reuse an authored heading if present (server-visible, avoid nesting);
    // otherwise promote the cell's text to an <h2>.
    const heading = titleCell.querySelector('h1,h2,h3,h4,h5,h6');
    if (heading) {
      wrap.append(heading);
    } else if (titleCell.textContent.trim()) {
      const h2 = document.createElement('h2');
      h2.textContent = titleCell.textContent.trim();
      wrap.append(h2);
    }
  }

  // --- Stats grid ----------------------------------------------------------
  const grid = document.createElement('div');
  grid.className = 'stats-grid';

  rows.forEach((row) => {
    const cells = [...row.children];
    const value = cells[0]?.textContent.trim();
    if (!value) return;

    const stat = document.createElement('div');
    stat.className = 'stat';

    // Recreate the <b> value + <span> caption structure in JS (EDS strips
    // inline <span> from cells, so we rebuild it here — anti-pattern 39).
    const b = document.createElement('b');
    b.textContent = value;
    stat.append(b);

    const captionText = cells[1]?.textContent.trim();
    if (captionText) {
      const span = document.createElement('span');
      span.textContent = captionText;
      stat.append(span);
    }

    // Optional progress bar — final width from the cell (e.g. "80%" / "80").
    const widthRaw = cells[2]?.textContent.trim();
    if (widthRaw) {
      const pct = widthRaw.endsWith('%') ? widthRaw : `${widthRaw}%`;
      const bar = document.createElement('div');
      bar.className = 'bar';
      const i = document.createElement('i');
      i.style.setProperty('--w', pct);
      bar.append(i);
      stat.append(bar);
    }

    grid.append(stat);
  });

  wrap.append(grid);

  block.textContent = '';
  block.append(wrap);
}
