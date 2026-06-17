/**
 * Hero block — split-media hero with a full-bleed gradient ribbon wash.
 *
 * Authored shape (one cell per row, order-independent — queried, not indexed):
 *   - a row whose cell holds the gdp eyebrow ticker (a <p> with the live %)
 *   - a row whose cell holds the page <h1>
 *   - a row whose cell holds the lede (first link-free <p>)
 *   - a row whose cell holds the CTAs (a link-bearing <p> / cell with <a>s;
 *     <strong><a> = primary, <em><a> = secondary — decorateButton applies .btn)
 *   - a row whose cell holds the LCP <picture>/<img>
 *
 * The block rebuilds the prototype's `.wrap.hero-grid` so the ribbon spans the
 * viewport while content stays at --max-width.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cells = rows.map((row) => row.firstElementChild).filter(Boolean);

  // Full-bleed gradient ribbon (CSS paints it; this is the canvas).
  const ribbon = document.createElement('div');
  ribbon.className = 'hero-ribbon';
  ribbon.setAttribute('aria-hidden', 'true');

  // Content wrapper: keeps content at --max-width while the ribbon goes full-bleed.
  const wrap = document.createElement('div');
  wrap.className = 'wrap hero-grid';

  const copy = document.createElement('div');
  copy.className = 'hero-copy';

  const visual = document.createElement('div');
  visual.className = 'hero-visual';

  // ---- query the cells, don't hard-index rows --------------------------------

  // Reuse an authored heading element if present (server-visible; avoid nesting).
  const heading = cells.map((c) => c.querySelector('h1, h2, h3, h4, h5, h6'))
    .find(Boolean);

  // Picture / image from anywhere.
  const picture = cells.map((c) => c.querySelector('picture')).find(Boolean);
  const img = cells.map((c) => c.querySelector('img')).find(Boolean);

  // Eyebrow ticker: first link-free, heading-free <p> that carries inline <b>
  // (the "Global GDP running on Stripe: …" line). Falls back to the first such
  // short paragraph.
  const paragraphs = cells
    .flatMap((c) => [...c.querySelectorAll('p')])
    .filter((p) => !p.querySelector('a') && !p.closest('h1, h2, h3, h4, h5, h6'));

  const eyebrow = paragraphs.find((p) => p.querySelector('b, strong'));
  // Lede = first link-free <p> that is not the eyebrow.
  const lede = paragraphs.find((p) => p !== eyebrow);

  // CTA cell: the cell (or paragraph) that bears links — cloned verbatim so
  // decorateButton can apply .btn / .btn-primary / .btn-secondary on page boot.
  const ctaCell = cells.find((c) => c.querySelector('a'));

  // ---- assemble the copy column ----------------------------------------------

  if (eyebrow) {
    eyebrow.classList.add('gdp-ticker');
    copy.append(eyebrow);
  }

  if (heading) {
    copy.append(heading);
  }

  if (lede) {
    lede.classList.add('sub');
    copy.append(lede);
  }

  if (ctaCell && ctaCell.querySelector('a')) {
    const actions = document.createElement('div');
    actions.className = 'hero-ctas';
    [...ctaCell.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
    copy.append(actions);
  }

  // ---- assemble the visual column --------------------------------------------

  if (picture) {
    visual.append(picture);
    const visualImg = picture.querySelector('img');
    if (visualImg) {
      visualImg.setAttribute('loading', 'eager');
      visualImg.setAttribute('fetchpriority', 'high');
    }
  } else if (img) {
    img.setAttribute('loading', 'eager');
    img.setAttribute('fetchpriority', 'high');
    visual.append(img);
  }
  // No image authored → CSS provides a gradient-plate fallback on .hero-visual.

  wrap.append(copy, visual);

  block.textContent = '';
  block.append(ribbon, wrap);
}
