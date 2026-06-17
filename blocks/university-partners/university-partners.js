/**
 * University Partners — centered accreditation logo strip.
 * Authored as ONE row / ONE cell holding all elements as flat siblings
 * (eyebrow, heading, logoset image, CTA). Collect at the CELL level (so bare
 * text cells survive as eyebrows), then classify each collected node by its
 * content — heading / media / link — never by row or cell index.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // 1. Cell-level cascade collector: for each cell, push its child elements if
  //    it has any, ELSE synthesize a <p> from the cell's own text so that
  //    bare-text cells (eyebrow, labels) are not silently dropped by `> *`.
  const collected = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) {
      collected.push(...kids);
    } else {
      const text = cell.textContent.trim();
      if (text) {
        const p = document.createElement('p');
        p.textContent = text;
        collected.push(p);
      }
    }
  });

  // 2. Classify collected nodes by content.
  let heading = null;
  let media = null;
  let cta = null;
  let eyebrow = null;

  collected.forEach((node) => {
    if (!heading && node.matches('h1, h2, h3, h4, h5, h6')) {
      heading = node;
    } else if (!media && (node.matches('picture, img') || node.querySelector('picture, img'))) {
      media = node;
    } else if (!cta && (node.matches('a') || node.querySelector('a'))) {
      cta = node;
    } else if (!eyebrow && node.textContent.trim()) {
      // First remaining text node is the eyebrow.
      eyebrow = node;
    }
  });

  // 3. Build the centered, max-width content wrap.
  block.textContent = '';
  const wrap = document.createElement('div');
  wrap.className = 'university-partners-content';

  if (eyebrow) {
    const span = document.createElement('span');
    span.className = 'eyebrow';
    span.textContent = eyebrow.textContent.trim();
    wrap.append(span);
  }

  if (heading) {
    // Reuse the authored heading element (server-visible, avoid nesting).
    wrap.append(heading);
  }

  if (media) {
    const logos = document.createElement('div');
    logos.className = 'university-partners-logos';
    // Prefer a real <picture>/<img>; otherwise lift the inner media node.
    const pic = media.matches('picture, img') ? media : media.querySelector('picture, img');
    logos.append(pic);
    wrap.append(logos);
  }

  if (cta) {
    const ctaWrap = document.createElement('div');
    ctaWrap.className = 'university-partners-cta';
    // Clone the authored CTA cell as-is; the EDS link decorator turns
    // <em><a> into .btn .btn-secondary at page boot.
    const link = cta.matches('a') ? cta : cta.querySelector('a');
    if (link) ctaWrap.append(link);
    wrap.append(ctaWrap);
  }

  block.append(wrap);
}
