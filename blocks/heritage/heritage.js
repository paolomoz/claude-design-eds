/**
 * Heritage — editorial 2-col brand-anchor spread.
 * Authored rows (one cell each):
 *   1. archival photo (picture/img)
 *   2. eyebrow (short <p>)
 *   3. year (authored <h2> — reused as the section heading)
 *   4. prose (one or more <p>)
 *   5. ghost CTA (<em><a> -> btn-secondary)
 * Cells may be omitted; decoration degrades gracefully.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cellOf = (row) => row && row.firstElementChild;

  // Inner wrap: the section background stays full-bleed; the content is wrapped.
  const wrap = document.createElement('div');
  wrap.className = 'heritage-inner';

  // --- Media (left) ---
  const media = document.createElement('figure');
  media.className = 'ds-archival-photo';
  const picture = block.querySelector('picture');
  if (picture) {
    media.append(picture);
  } else {
    const img = block.querySelector('img');
    if (img) media.append(img);
  }

  // --- Text (right) ---
  const text = document.createElement('div');
  text.className = 'ds-heritage-text';

  // Identify cells. The heading cell is whichever row carries a heading.
  let headingCell;
  let eyebrowCell;
  const proseParas = [];
  let ctaCell;

  rows.forEach((row) => {
    const cell = cellOf(row);
    if (!cell) return;
    if (cell.closest('.ds-archival-photo')) return; // already moved
    if (cell.querySelector('picture, img')) return; // media row
    const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
    const anchor = cell.querySelector('a');
    if (heading && !headingCell) {
      headingCell = cell;
    } else if (anchor) {
      ctaCell = cell;
    } else if (!eyebrowCell) {
      eyebrowCell = cell;
    } else {
      proseParas.push(cell);
    }
  });

  // Eyebrow — re-create the span/class styling EDS strips.
  if (eyebrowCell) {
    const p = eyebrowCell.querySelector('p') || eyebrowCell;
    const eyebrow = document.createElement('p');
    eyebrow.className = 'ds-heritage-eyebrow';
    eyebrow.textContent = p.textContent.trim();
    text.append(eyebrow);
  }

  // Year — reuse the authored heading element (server-visible, avoid nesting).
  if (headingCell) {
    const heading = headingCell.querySelector('h1, h2, h3, h4, h5, h6');
    heading.classList.add('ds-heritage-year');
    if (!heading.id) heading.id = 'heritage-year';
    heading.setAttribute('aria-label', `Founded ${heading.textContent.trim()}`);
    text.append(heading);
  }

  // Prose — collect remaining paragraphs into a single prose container.
  if (proseParas.length) {
    const prose = document.createElement('div');
    prose.className = 'ds-heritage-prose';
    proseParas.forEach((cell) => {
      [...cell.children].forEach((child) => prose.append(child));
      if (!cell.children.length && cell.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = cell.textContent.trim();
        prose.append(p);
      }
    });
    text.append(prose);
  }

  // Ghost CTA — clone the cell anchors; ak.js applies btn classes from <em><a>.
  if (ctaCell && ctaCell.querySelector('a')) {
    const actions = document.createElement('div');
    actions.className = 'ds-heritage-actions';
    [...ctaCell.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
    text.append(actions);
  }

  wrap.append(media, text);
  block.textContent = '';
  block.append(wrap);
}
