/**
 * hero — 100vh full-bleed cinematic band.
 *
 * Authored shape (#62): ONE row with ONE cell holding all elements as flat
 * siblings — a picture/img, a heading, a kicker <p>, a copy <p>, and two
 * links. We DEFAULT to flattening and classify by content (picture / heading /
 * link / paragraph position), NOT by row/cell index.
 *
 * @param {Element} block The block element
 */
/**
 * Cascade collector (#68): the authored content places each element in its own
 * row/cell, and text-only cells hold a bare text node with NO child element —
 * so `:scope > div > div > *` silently drops eyebrows/ledes. Collect per cell:
 * use the cell's child elements when present, else synthesize a <p> from the
 * cell's own text so nothing is dropped. Document order is preserved.
 * @param {Element} block
 * @returns {Element[]}
 */
function collectNodes(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const out = [];
  cells.forEach((cell) => {
    const els = [...cell.children];
    if (els.length) {
      out.push(...els);
    } else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      out.push(p);
    }
  });
  return out;
}

export default async function decorate(block) {
  const nodes = collectNodes(block);

  // Classify the flat siblings by content.
  let mediaSource = null; // <picture> or <img>
  let heading = null; // reuse the authored heading element (server-visible)
  const paragraphs = [];
  const links = [];

  nodes.forEach((node) => {
    const pic = node.matches('picture, img') ? node : node.querySelector('picture, img');
    const anchor = node.matches('a') ? node : node.querySelector('a');
    if (!heading && /^H[1-6]$/.test(node.tagName)) {
      heading = node;
    } else if (anchor) {
      links.push(anchor);
    } else if (pic) {
      mediaSource = pic.matches('picture') ? pic : (pic.closest('picture') || pic);
    } else if (node.matches('p') || node.textContent.trim()) {
      paragraphs.push(node);
    }
  });

  // Build the marquee (absolutely-positioned cover image).
  const marquee = document.createElement('div');
  marquee.className = 'hero-marquee';
  if (mediaSource) marquee.append(mediaSource);

  // Bottom-up dark scrim.
  const scrim = document.createElement('div');
  scrim.className = 'hero-scrim';
  scrim.setAttribute('aria-hidden', 'true');

  // Content wrap, bottom-aligned, constrained to .container max-width.
  const inner = document.createElement('div');
  inner.className = 'hero-inner';
  const content = document.createElement('div');
  content.className = 'hero-content';
  inner.append(content);

  // Kicker = first paragraph (before the heading); copy = the rest.
  // EDS strips authored <span>/class in cells, so re-create the kicker styling.
  const [kicker, ...copy] = paragraphs;
  if (kicker) {
    const k = document.createElement('p');
    k.className = 'hero-kicker';
    k.innerHTML = kicker.innerHTML;
    content.append(k);
  }
  if (heading) content.append(heading);
  copy.forEach((p) => {
    p.classList.remove('hero-kicker');
    content.append(p);
  });

  // Actions: first link → primary CTA (wrap in <strong> so decorateButton in
  // ak.js applies .btn.btn-primary); remaining links → plain white text-links.
  if (links.length) {
    const actions = document.createElement('div');
    actions.className = 'hero-actions';
    links.forEach((a, i) => {
      if (i === 0) {
        a.classList.remove('btn', 'cta-primary', 'text-link');
        const strong = document.createElement('strong');
        strong.append(a);
        actions.append(strong);
      } else {
        a.className = 'text-link';
        actions.append(a);
      }
    });
    content.append(actions);
  }

  block.replaceChildren(marquee, scrim, inner);
}
