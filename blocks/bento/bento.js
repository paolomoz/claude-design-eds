/*
 * Bento Block
 * Lead heading + lede intro, then a 3-col bento grid of product tiles.
 * Row contract:
 *   Row 1 (header): [ heading cell ] [ lede cell ]
 *   Row 2..n (tile): [ image cell ] [ title cell ] [ link href cell ]
 */

/**
 * Resolve the anchor text for a tile link cell.
 * The cell may hold a plain URL or an authored <a>.
 * @param {Element} cell The link cell
 * @returns {{ href: string, label: string }}
 */
function readLink(cell) {
  if (!cell) return { href: '', label: 'Learn more' };
  const anchor = cell.querySelector('a');
  if (anchor) {
    return { href: anchor.getAttribute('href') || '', label: anchor.textContent.trim() || 'Learn more' };
  }
  const text = cell.textContent.trim();
  return { href: text, label: 'Learn more' };
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Wrap holds all content and re-creates the prototype's max-width constraint.
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // --- Header row: heading + lede ---
  const headerRow = rows.shift();
  if (headerRow) {
    const cells = [...headerRow.children];

    // Reuse an authored heading element if present, else promote to <h2>.
    const headingCell = cells[0];
    let heading = headingCell?.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      heading.remove();
    } else if (headingCell) {
      heading = document.createElement('h2');
      heading.textContent = headingCell.textContent.trim();
    }
    if (heading) wrap.append(heading);

    const ledeCell = cells[1];
    if (ledeCell && ledeCell.textContent.trim()) {
      const lede = document.createElement('p');
      lede.className = 'lede';
      lede.textContent = ledeCell.textContent.trim();
      wrap.append(lede);
    }
  }

  // --- Tiles ---
  const grid = document.createElement('div');
  grid.className = 'bento-grid';

  rows.forEach((row) => {
    const cells = [...row.children];
    const tile = document.createElement('article');
    tile.className = 'tile';

    // Image cell: reuse the authored <img>/<picture> if present.
    const imageCell = cells[0];
    const picture = imageCell?.querySelector('picture');
    const img = imageCell?.querySelector('img');
    if (picture) {
      tile.append(picture);
    } else if (img) {
      tile.append(img);
    }

    const pad = document.createElement('div');
    pad.className = 'pad';

    // Title cell: reuse authored heading or promote to <h3>.
    const titleCell = cells[1];
    let title = titleCell?.querySelector('h1, h2, h3, h4, h5, h6');
    if (title) {
      title.remove();
    } else if (titleCell) {
      title = document.createElement('h3');
      title.textContent = titleCell.textContent.trim();
    }
    if (title) pad.append(title);

    // Link cell: plain styled anchor (NOT a button) with ::after arrow.
    const { href, label } = readLink(cells[2]);
    if (href) {
      const link = document.createElement('a');
      link.className = 'arrow-link';
      link.href = href;
      link.textContent = label;
      pad.append(link);
    }

    tile.append(pad);
    grid.append(tile);
  });

  wrap.append(grid);

  block.textContent = '';
  block.append(wrap);
}
