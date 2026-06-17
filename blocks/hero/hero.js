/*
 * Hero block — split-media hero with a skewed full-bleed gradient-mesh ground.
 *
 * Authored rows (one cell each unless noted):
 *   1. Eyebrow   — short label, optional <strong> emphasis (e.g. a live stat)
 *   2. Title     — the page's single <h1> (reuse the authored heading if present)
 *   3. Sub       — supporting sentence
 *   4. CTAs      — anchors: <strong><a> -> primary, <em><a> -> secondary
 *   5. Image     — a <picture>/<img> (may be empty; CSS fallback covers it)
 *
 * The full-bleed wash (.hero__ground) sits behind a centered .wrap so the
 * gradient spans the viewport while the content stays max-width contained (#37).
 */

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const [eyebrowRow, titleRow, subRow, ctaRow, imageRow] = rows;

  // Skewed full-bleed gradient ground (behind the wrap).
  const ground = document.createElement('div');
  ground.className = 'hero__ground';
  ground.setAttribute('aria-hidden', 'true');

  // Centered max-width wrap carrying the split-media grid.
  const inner = document.createElement('div');
  inner.className = 'wrap hero__inner';

  // Text column.
  const textCol = document.createElement('div');
  textCol.className = 'hero__text';

  // 1. Eyebrow — recreate the pill chip (EDS strips spans, so build it in JS).
  const eyebrowCell = eyebrowRow?.firstElementChild;
  if (eyebrowCell && eyebrowCell.textContent.trim()) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'hero__eyebrow';
    [...eyebrowCell.childNodes].forEach((n) => eyebrow.append(n.cloneNode(true)));
    textCol.append(eyebrow);
  }

  // 2. Title — reuse an authored heading element if present; else promote to <h1>.
  const titleCell = titleRow?.firstElementChild;
  if (titleCell) {
    let heading = titleCell.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      if (heading.tagName !== 'H1') {
        const h1 = document.createElement('h1');
        h1.innerHTML = heading.innerHTML;
        heading.replaceWith(h1);
        heading = h1;
      }
      textCol.append(heading);
    } else if (titleCell.textContent.trim()) {
      const h1 = document.createElement('h1');
      h1.textContent = titleCell.textContent.trim();
      textCol.append(h1);
    }
  }

  // 3. Sub.
  const subCell = subRow?.firstElementChild;
  if (subCell && subCell.textContent.trim()) {
    const sub = document.createElement('p');
    sub.className = 'sub';
    [...subCell.childNodes].forEach((n) => sub.append(n.cloneNode(true)));
    textCol.append(sub);
  }

  // 4. CTAs — clone the cell's anchors as-is; the link decorator applies
  //    .btn-primary (<strong><a>) / .btn-secondary (<em><a>) during page boot.
  const ctaCell = ctaRow?.firstElementChild;
  if (ctaCell && ctaCell.querySelector('a')) {
    const ctas = document.createElement('div');
    ctas.className = 'ctas';
    [...ctaCell.childNodes].forEach((n) => ctas.append(n.cloneNode(true)));
    textCol.append(ctas);
  }

  inner.append(textCol);

  // 5. Image — query for the authored <picture>/<img> (#42).
  const figure = document.createElement('figure');
  const picture = imageRow?.querySelector('picture');
  const img = imageRow?.querySelector('img');
  if (picture) {
    figure.append(picture);
  } else if (img) {
    figure.append(img);
  }
  inner.append(figure);

  block.replaceChildren(ground, inner);
}
