/**
 * Banner block (role: band).
 * Lifted from the prototype's `.ds-banner` garage-door brand-statement band:
 * a full-bleed dark warm-substrate band with a centered content column
 * (eyebrow + big h2 title + body + CTA pair) over a layered warm radial
 * gradient bg and a top/bottom darkening overlay. The scroll-driven
 * garage-door animation is intentionally dropped — the band renders static.
 *
 * Authoring shape — ONE row, ONE cell holding a flat sequence (DA flattens
 * authored content into a single cell, #48/#50). Classified by content, not by
 * row index (#42): the heading is the title; the plain link-free paragraph is
 * the eyebrow (rendered ABOVE the title per the prototype); a second plain
 * paragraph is the body; the link-bearing paragraph is the CTA pair.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Gather the flat leaf elements; fall back to one-cell-per-row.
  const flatCell = block.querySelector(':scope > div > div');
  const nodes = (flatCell && flatCell.children.length > 1)
    ? [...flatCell.children]
    : [...block.children].map((row) => row.firstElementChild).filter(Boolean);

  const HEADINGS = 'h1, h2, h3, h4, h5, h6';
  const find = (el, sel) => (el.matches(sel) ? el : el.querySelector(sel));

  // Decorative layered background + top/bottom darkening overlay.
  const bg = document.createElement('div');
  bg.className = 'banner-bg';
  bg.setAttribute('aria-hidden', 'true');

  const overlay = document.createElement('div');
  overlay.className = 'banner-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  // Centered content column.
  const content = document.createElement('div');
  content.className = 'banner-content';

  const heading = nodes.map((n) => find(n, HEADINGS)).find(Boolean);
  const ctaNode = nodes.find((n) => n.tagName === 'P' && find(n, 'a'));
  const plainParas = nodes.filter((n) => n.tagName === 'P' && !find(n, 'a'));

  // Eyebrow — first plain paragraph, rendered above the title (prototype order).
  const eyebrowText = plainParas[0]?.textContent.trim();
  if (eyebrowText) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow banner-eyebrow';
    eyebrow.textContent = eyebrowText;
    content.append(eyebrow);
  }

  // Title — reuse the authored heading element if present (server-visible,
  // avoids nesting).
  if (heading) {
    heading.classList.add('title-2', 'banner-title');
    content.append(heading);
  }

  // Body — second plain paragraph.
  const bodyText = plainParas[1]?.textContent.trim();
  if (bodyText) {
    const body = document.createElement('p');
    body.className = 'body-lg banner-body';
    body.textContent = bodyText;
    content.append(body);
  }

  // CTAs — clone the cell's anchors as-is; ak.js decorateButton() applies the
  // button classes from the author's <strong>/<em> emphasis after block JS.
  if (ctaNode && find(ctaNode, 'a')) {
    const ctas = document.createElement('div');
    ctas.className = 'banner-ctas';
    [...ctaNode.childNodes].forEach((n) => ctas.append(n.cloneNode(true)));
    content.append(ctas);
  }

  block.textContent = '';
  block.append(bg, overlay, content);
}
