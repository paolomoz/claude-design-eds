/**
 * Hero block — full-bleed photo with a dark scrim and a bottom-left overlay.
 *
 * Authored content (one cell per row, content-queried — not row-index based):
 *   - a <picture>/<img>            -> full-bleed background photo (LCP)
 *   - first short link-free <p>    -> eyebrow (yellow, uppercase)
 *   - an <h1> (or first heading)   -> headline
 *   - a sentence <p>               -> subhead (yellow, uppercase)
 *   - a <strong><a>                -> primary CTA (decorated globally by ak.js)
 *
 * Authors may omit any field; the block degrades gracefully.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Collect all cells across rows so we can query by content, not position.
  const cells = [...block.querySelectorAll(':scope > div > div')];

  const photoWrap = document.createElement('div');
  photoWrap.className = 'hero-photo-wrap';

  const scrim = document.createElement('div');
  scrim.className = 'hero-scrim';
  scrim.setAttribute('aria-hidden', 'true');

  const overlay = document.createElement('div');
  overlay.className = 'hero-overlay';

  // 1. Background photo — reuse the authored <picture>, else <img>.
  const picture = block.querySelector('picture');
  const img = block.querySelector('img');
  if (picture) {
    picture.classList.add('hero-photo');
    photoWrap.append(picture);
    if (img) {
      img.loading = 'eager';
      img.setAttribute('fetchpriority', 'high');
    }
  } else if (img) {
    img.classList.add('hero-photo');
    img.loading = 'eager';
    img.setAttribute('fetchpriority', 'high');
    photoWrap.append(img);
  }

  // 2. Eyebrow — first short, link-free <p> (re-create the <span>-style class in JS).
  const paragraphs = cells
    .map((c) => c.querySelector('p'))
    .filter(Boolean);
  const eyebrowP = paragraphs.find((p) => !p.querySelector('a') && p.textContent.trim().length <= 80);
  if (eyebrowP) {
    eyebrowP.classList.add('hero-eyebrow');
    overlay.append(eyebrowP);
  }

  // 3. Headline — reuse an authored heading (server-visible; avoid nesting).
  const heading = block.querySelector('h1, h2, h3');
  if (heading) {
    heading.classList.add('hero-h1');
    overlay.append(heading);
  }

  // 4. Subhead — a longer, link-free <p> that is not the eyebrow.
  const subheadP = paragraphs.find((p) => p !== eyebrowP && !p.querySelector('a'));
  if (subheadP) {
    subheadP.classList.add('hero-subhead');
    overlay.append(subheadP);
  }

  // 5. CTA — clone the authored CTA cell; ak.js decorates <strong><a> as .btn-primary.
  const ctaP = paragraphs.find((p) => p.querySelector('a'));
  if (ctaP) {
    const ctaRow = document.createElement('div');
    ctaRow.className = 'hero-cta-row';
    ctaRow.append(ctaP);
    overlay.append(ctaRow);
  }

  block.replaceChildren(photoWrap, scrim, overlay);
}
