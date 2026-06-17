/**
 * loads and decorates the page-intro block (hero)
 *
 * Authoring contract (block.children = rows, row.children = cells):
 *   row 1 — eyebrow text (e.g. "— TWO LOCATIONS · WALK-IN ONLY")
 *   row 2 — page heading (an authored <h1>/<h2>… reused as the page's single <h1>)
 *   row 3 — intro paragraph
 *
 * The heading is located by element rather than row index; the eyebrow is the
 * remaining text cell before it and the paragraph the text cell after it.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Locate the row whose cell holds the heading (server-visible), wherever it sits.
  let headingIndex = -1;
  let heading = null;
  rows.forEach((row, i) => {
    if (heading) return;
    const cell = row.firstElementChild;
    const h = cell && cell.querySelector('h1, h2, h3, h4, h5, h6');
    if (h) {
      headingIndex = i;
      heading = h;
    }
  });

  // Eyebrow = the text cell before the heading; paragraph = the cell after.
  const eyebrowCell = headingIndex > 0 ? rows[headingIndex - 1].firstElementChild : null;
  const paragraphCell = headingIndex >= 0 && rows[headingIndex + 1]
    ? rows[headingIndex + 1].firstElementChild
    : null;

  // Build the centered max-width wrapper.
  const inner = document.createElement('div');
  inner.className = 'page-intro-inner';

  // Left column: eyebrow + heading.
  const left = document.createElement('div');

  if (eyebrowCell) {
    const eyebrowText = eyebrowCell.textContent.trim();
    if (eyebrowText) {
      const eyebrow = document.createElement('div');
      eyebrow.className = 'page-intro-eyebrow';
      eyebrow.textContent = eyebrowText;
      left.append(eyebrow);
    }
  }

  if (heading) {
    // Reuse the authored heading, but render as the page's single <h1>.
    if (heading.tagName !== 'H1') {
      const h1 = document.createElement('h1');
      h1.id = heading.id;
      h1.innerHTML = heading.innerHTML;
      heading = h1;
    }
    left.append(heading);
  }

  inner.append(left);

  // Right column: intro paragraph.
  if (paragraphCell) {
    const para = paragraphCell.querySelector('p') || document.createElement('p');
    if (!para.parentElement) para.textContent = paragraphCell.textContent.trim();
    inner.append(para);
  }

  block.replaceChildren(inner);
}
