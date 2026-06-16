/**
 * Brands block — centered heading + subtext + a responsive grid of text-only brand tiles.
 *
 * Authoring rows (in order):
 *   1. heading — section h2 text
 *   2. subtext — supporting paragraph
 *   3+. brand  — one row per brand tile; single text cell (tile label, e.g. "Cat®")
 *
 * @param {Element} block
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cell = (row) => row?.firstElementChild;

  const [headingRow, subtextRow, ...brandRows] = rows;

  const frag = document.createDocumentFragment();

  const headingText = cell(headingRow)?.textContent.trim();
  if (headingText) {
    const h2 = document.createElement('h2');
    h2.className = 'cond';
    h2.textContent = headingText;
    frag.append(h2);
  }

  const subtextText = cell(subtextRow)?.textContent.trim();
  if (subtextText) {
    const p = document.createElement('p');
    p.textContent = subtextText;
    frag.append(p);
  }

  const brandRow = document.createElement('div');
  brandRow.className = 'brand-row';
  brandRows.forEach((row) => {
    const label = cell(row)?.textContent.trim();
    if (!label) return;
    const tile = document.createElement('div');
    tile.className = 'brand-tile';
    tile.textContent = label;
    brandRow.append(tile);
  });
  frag.append(brandRow);

  block.replaceChildren(frag);
}
