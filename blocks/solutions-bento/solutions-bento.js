/*
 * Solutions Bento Block
 * A bento grid of solution tiles. The first tile spans 2x2 (payments hero).
 *
 * Authoring contract (block.children = rows, row.children = cells):
 *   Row 0: [ heading (h2) | kicker paragraph ]   — the section title row
 *   Row 1..N: [ image | caption + link | fit ]   — one tile per row
 *     - image cell: a server-rendered <img>/<picture> OR plain text URL
 *       (fully-qualified /img/stripe/<file>) used as the tile background-image.
 *       Empty image cell falls back to the CSS ghost background.
 *     - caption cell: the h3 caption text. If it wraps an <a>, the whole tile
 *       becomes that link; otherwise the tile renders as a non-linked card.
 *     - fit cell (optional): "contain" → logo-style art (.art-contain);
 *       anything else / empty → cover. The first tile is always the
 *       2x2 payments hero regardless of fit.
 */

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

/* Resolve the background-image URL for a tile from its image cell. */
function imageUrl(cell) {
  if (!cell) return '';
  const img = cell.querySelector('img');
  if (img && img.src) return img.src;
  const text = cellText(cell);
  return text || '';
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // 1. Title row — reuse an authored heading if present, avoid nesting.
  const titleRow = rows.shift();
  const titleCells = [...titleRow.children];
  const heading = titleCells[0]?.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    block.append(heading);
  } else {
    const fallback = cellText(titleCells[0]);
    if (fallback) {
      const h2 = document.createElement('h2');
      h2.textContent = fallback;
      block.append(h2);
    }
  }

  const kickerText = cellText(titleCells[1]);
  if (kickerText) {
    const kicker = document.createElement('p');
    kicker.className = 'section-kicker';
    kicker.textContent = kickerText;
    block.append(kicker);
  }

  // 2. Grid of tiles — one card per remaining row.
  const grid = document.createElement('div');
  grid.className = 'bento-grid';

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const href = cells[1]?.querySelector('a')?.getAttribute('href') || '';
    const caption = cellText(cells[1]);
    const fit = cellText(cells[2]).toLowerCase();
    const bg = imageUrl(cells[0]);

    const card = document.createElement(href ? 'a' : 'div');
    card.className = 'bento-card';
    if (i === 0) card.classList.add('bento-payments');
    if (href) {
      card.href = href;
      const target = cells[1]?.querySelector('a')?.getAttribute('target');
      if (target) card.target = target;
    }

    // absolutely-positioned art layer set via background-image
    const art = document.createElement('span');
    art.className = 'bento-art';
    if (fit === 'contain') art.classList.add('art-contain');
    if (bg) art.style.backgroundImage = `url('${bg}')`;
    if (caption) art.setAttribute('role', 'img');
    if (caption) art.setAttribute('aria-label', caption);

    // scrim gradient
    const scrim = document.createElement('span');
    scrim.className = 'bento-scrim';
    scrim.setAttribute('aria-hidden', 'true');

    // h3 caption pinned bottom
    const h3 = document.createElement('h3');
    h3.textContent = caption;

    card.append(art, scrim, h3);
    grid.append(card);
  });

  block.append(grid);

  // Drop the now-consumed authoring rows.
  [titleRow, ...rows].forEach((row) => row.remove());
}
