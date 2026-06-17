/**
 * loads and decorates the photo-band-bleed block
 *
 * Authoring contract: one row, one cell, holding all elements as flat siblings
 * in source order — a picture (background), an eyebrow paragraph (kicker), an
 * <h2> heading, a body paragraph, and a CTA link (authored as <strong><a>).
 * We flatten and classify by content rather than by row/cell index.
 *
 * @param {Element} block The block element
 */
/**
 * Cascade collector (#68): each authored element may sit in its own row/cell,
 * and text-only cells hold a bare text node with NO child element — so
 * `:scope > div > div > *` silently drops the eyebrow/body copy. Collect per
 * cell, synthesizing a <p> for bare-text cells; document order preserved.
 * @param {Element} block
 * @returns {Element[]}
 */
function collectNodes(block) {
  const out = [];
  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
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

  let picture = null;
  let heading = null;
  let cta = null;
  const paragraphs = [];

  nodes.forEach((node) => {
    if (!picture && (node.matches('picture, img') || node.querySelector('picture, img'))) {
      picture = node.matches('picture, img') ? node : node.querySelector('picture, img');
      return;
    }
    if (!heading && /^h[1-6]$/i.test(node.tagName)) {
      heading = node;
      return;
    }
    const link = node.matches('a') ? node : node.querySelector('a');
    if (link) {
      cta = node.matches('a') ? node : link.closest('strong, em, p, *') || link;
      return;
    }
    if (node.textContent.trim()) paragraphs.push(node);
  });

  // Background: absolutely-positioned cover image, bleeds full-width.
  const bg = document.createElement('div');
  bg.className = 'photo-band-bleed-bg';
  bg.setAttribute('aria-hidden', 'true');
  if (picture) bg.append(picture);

  // Constrained copy column, bottom-aligned inside the container.
  const container = document.createElement('div');
  container.className = 'photo-band-bleed-content';

  const inner = document.createElement('div');
  inner.className = 'photo-band-bleed-inner';

  // First paragraph is the eyebrow/kicker; the rest are body copy.
  paragraphs.forEach((p, i) => {
    if (i === 0) p.classList.add('kicker');
    inner.append(p);
  });

  if (heading) inner.append(heading);

  // Re-order so kicker precedes the heading, heading precedes body, body
  // precedes the CTA, matching the prototype's visual stack.
  const ordered = [];
  const kicker = inner.querySelector('.kicker');
  if (kicker) ordered.push(kicker);
  if (heading) ordered.push(heading);
  paragraphs.filter((p) => !p.classList.contains('kicker')).forEach((p) => ordered.push(p));
  if (cta) ordered.push(cta);

  inner.replaceChildren(...ordered);
  container.append(inner);

  block.replaceChildren(bg, container);
}
