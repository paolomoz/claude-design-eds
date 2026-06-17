/**
 * loads and decorates the intro band
 * @param {Element} block The block element
 *
 * Authored rows (each row = one cell):
 *   1. (optional) icon — ignored; the chain-link SVG is inlined here
 *   2. eyebrow text          → styled <span class="intro-eyebrow">
 *   3. title (heading)       → reused authored <h2>/<hN>, <strong> preserved
 *   4. body copy             → <p class="intro-body">
 *   5. CTAs                  → cloned anchors into <div class="actions">
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Build the constrained, centered wrap.
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // 1. Inline chain-link SVG icon (DNA purple line-icon vocabulary).
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', 'intro-icon');
  icon.setAttribute('viewBox', '0 0 48 48');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = '<path d="M19 24a6 6 0 0 1 6-6h5a6 6 0 0 1 0 12h-5"/>'
    + '<path d="M29 24a6 6 0 0 1-6 6h-5a6 6 0 0 1 0-12h5"/>';
  wrap.append(icon);

  // Identify cells by role. Rows may be omitted by the author, so resolve
  // them positionally but defensively.
  const cells = rows
    .map((row) => row.firstElementChild)
    .filter((cell) => cell);

  // Find the heading cell (contains a server-rendered heading) and the CTA
  // cell (contains anchors); everything else in between is eyebrow / body.
  const headingCell = cells.find((c) => c.querySelector('h1,h2,h3,h4,h5,h6'));
  const ctaCell = cells.find((c) => c.querySelector('a'));

  const textCells = cells.filter(
    (c) => c !== headingCell && c !== ctaCell && c.textContent.trim(),
  );

  // 2. Eyebrow — first remaining text cell, re-created as a styled span
  //    (EDS strips <span> from cells, so rebuild it here).
  const [eyebrowCell, bodyCell] = textCells;
  if (eyebrowCell) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'intro-eyebrow';
    eyebrow.textContent = eyebrowCell.textContent.trim();
    wrap.append(eyebrow);
  }

  // 3. Title — reuse the authored heading element (server-visible; avoid
  //    nesting a new heading). <strong> emphasis is preserved as authored.
  if (headingCell) {
    const heading = headingCell.querySelector('h1,h2,h3,h4,h5,h6');
    heading.classList.add('intro-headline');
    wrap.append(heading);
  }

  // 4. Body copy.
  if (bodyCell) {
    const body = document.createElement('p');
    body.className = 'intro-body';
    body.innerHTML = bodyCell.innerHTML;
    wrap.append(body);
  }

  // 5. CTAs — clone the cell's anchors as-is. The link decorator turns
  //    <strong><a> into .btn-primary and <em><a> into .btn-secondary.
  if (ctaCell && ctaCell.querySelector('a')) {
    const actions = document.createElement('div');
    actions.className = 'actions';
    [...ctaCell.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
    wrap.append(actions);
  }

  block.textContent = '';
  block.append(wrap);
}
