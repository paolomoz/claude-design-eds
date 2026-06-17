/**
 * solutions — bento product grid
 *
 * Authoring model (block.children = rows, row.children = cells):
 *   Row 1 (section head): [ heading (h2) ] [ intro paragraph ]
 *   Row 2 (feature tile) : [ h3 + p + chevron <a> ] [ image ]   ← span 2x2, inset image
 *   Rows 3..N (text cell): [ h3 + p + chevron <a> ]              ← single cell each
 *
 * The first body row becomes the span-2x2 feature tile; the image cell is optional.
 * Chevron links are plain styled text links (per-block CSS), not buttons.
 */

const CHEVRON = '<svg class="chev" viewBox="0 0 8 14" width="8" height="14" aria-hidden="true" focusable="false"><path d="M1 1l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/**
 * Decorate the trailing <a> of a copy cell as a chevron text-link.
 * @param {Element} scope element containing the link
 */
function decorateChevlink(scope) {
  const link = scope.querySelector('a');
  if (!link) return;
  link.classList.add('chevlink');
  // append the chevron glyph after the existing link text
  link.insertAdjacentHTML('beforeend', ` ${CHEVRON}`);
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // 1. Section head — reuse the authored heading (server-visible), avoid nesting.
  const headRow = rows.shift();
  if (headRow) {
    const head = document.createElement('div');
    head.className = 'section-head';
    [...headRow.children].forEach((cell) => {
      [...cell.childNodes].forEach((node) => head.append(node));
    });
    wrap.append(head);
  }

  // 2. Bento grid.
  const bento = document.createElement('div');
  bento.className = 'bento';

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const cell = document.createElement('div');
    cell.className = 'cell';

    const [copyCell, imageCell] = cells;

    if (i === 0) {
      // First body row = span-2x2 feature tile with inset image.
      cell.classList.add('feature');

      const copy = document.createElement('div');
      copy.className = 'feature-copy';
      [...copyCell.childNodes].forEach((node) => copy.append(node));
      decorateChevlink(copy);
      cell.append(copy);

      const img = imageCell && imageCell.querySelector('img, picture');
      if (img) {
        cell.append(img.closest('picture') || img);
      } else {
        // empty image cell → CSS fallback paints the inset area
        const fallback = document.createElement('div');
        fallback.className = 'feature-fallback';
        fallback.setAttribute('aria-hidden', 'true');
        cell.append(fallback);
      }
    } else {
      [...copyCell.childNodes].forEach((node) => cell.append(node));
      decorateChevlink(cell);
    }

    bento.append(cell);
  });

  wrap.append(bento);

  block.textContent = '';
  block.append(wrap);
}
