/*
 * photo-band — split-media editorial band.
 *
 * Authored as ONE row with ONE cell holding all elements as flat
 * siblings: an eyebrow line, a heading, an image, a paragraph and a
 * CTA link. We flatten the cell and classify each node by its content
 * (heading / picture / link / text), never by row or cell index.
 *
 * Variants are read from marker text among the flat siblings (or from
 * authored block classes): "reverse" / "image right" → image on the
 * right; "surface" / "tinted" → tinted background.
 */

const REVERSE_RE = /^(reverse|image[\s-]?right|media[\s-]?right|photo[\s-]?right)$/i;
const SURFACE_RE = /^(surface|tint|tinted|surface[\s-]?tint)$/i;

/**
 * Cascade collector (#68): each authored element may sit in its own row/cell,
 * and text-only cells hold a bare text node with NO child element — so
 * `:scope > div > div > *` silently drops the eyebrow and body copy. Collect
 * per cell, synthesizing a <p> for bare-text cells; document order preserved.
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
  // Flatten: collect every authored node, regardless of how many
  // rows/cells the author used.
  const nodes = collectNodes(block);

  // Variant detection from authored block classes (server-visible).
  let reverse = block.classList.contains('reverse');
  let surface = block.classList.contains('surface');

  let picture = null;
  let heading = null;
  let kicker = null;
  const paragraphs = [];
  const ctas = [];

  nodes.forEach((node) => {
    const text = (node.textContent || '').trim();

    // A node that is purely a variant marker — consume, don't render.
    if (node.tagName === 'P' && REVERSE_RE.test(text)) { reverse = true; return; }
    if (node.tagName === 'P' && SURFACE_RE.test(text)) { surface = true; return; }

    const pic = node.querySelector ? node.querySelector('picture, img') : null;
    if (node.tagName === 'PICTURE' || node.tagName === 'IMG' || pic) {
      if (node.tagName === 'PICTURE' || node.tagName === 'IMG') picture = node;
      else picture = pic;
      return;
    }

    const link = node.querySelector ? node.querySelector('a[href]') : null;
    if (node.tagName === 'A' || link) {
      ctas.push(node);
      return;
    }

    if (/^H[1-6]$/.test(node.tagName)) { heading = node; return; }

    if (node.tagName === 'P' && text) {
      // First text line with no heading yet → eyebrow/kicker.
      if (!kicker && !heading) { kicker = node; return; }
      paragraphs.push(node);
    }
  });

  // Build the media cell.
  const media = document.createElement('div');
  media.className = 'photo-band-media';
  if (picture) media.append(picture);

  // Build the copy cell.
  const copy = document.createElement('div');
  copy.className = 'photo-band-copy';

  if (kicker) {
    // EDS strips <span>; re-create the eyebrow styling via class in JS.
    kicker.classList.add('kicker');
    copy.append(kicker);
  }
  if (heading) copy.append(heading);
  paragraphs.forEach((p) => copy.append(p));
  // Clone CTA cells as-is — ak.js decorateButton turns <strong><a>
  // into .btn.btn-primary. Do not manufacture buttons.
  ctas.forEach((cta) => copy.append(cta));

  // Two-column grid.
  const grid = document.createElement('div');
  grid.className = 'photo-band-grid';
  if (reverse) grid.classList.add('photo-band-grid-reverse');
  grid.append(media, copy);

  // Max-width wrap (the section background, if any, stays full-bleed).
  const inner = document.createElement('div');
  inner.className = 'photo-band-inner';
  inner.append(grid);

  if (surface) block.classList.add('photo-band-surface');

  block.replaceChildren(inner);
}
