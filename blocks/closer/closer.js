/**
 * loads and decorates the closer band
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Authors place all elements as flat siblings inside one row > one cell.
  // Flatten and classify by content, not by row/cell index.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // The section title is the (first) heading element.
  const heading = nodes.find((n) => /^H[1-6]$/.test(n.tagName));

  // Remaining text nodes, in document order, are the eyebrow then the signature.
  const texts = nodes.filter((n) => n !== heading && (n.textContent || '').trim());

  const eyebrowSrc = texts[0];
  const sigSrc = texts[texts.length > 1 ? texts.length - 1 : -1];

  // Decorative full-bleed background (CSS owns the image + filters).
  const bg = document.createElement('div');
  bg.className = 'closer-bg';
  bg.setAttribute('aria-hidden', 'true');

  // Content wrap.
  const wrap = document.createElement('div');
  wrap.className = 'closer-wrap';

  // Eyebrow — rule-bracketed goldspike (re-create span styling via class).
  if (eyebrowSrc) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'closer-eyebrow';
    eyebrow.textContent = (eyebrowSrc.textContent || '').trim();
    wrap.append(eyebrow);
  }

  // Massive heading — reuse the authored heading element (server-visible).
  if (heading) {
    wrap.append(heading);
  }

  // Trailing signature line.
  if (sigSrc && sigSrc !== eyebrowSrc) {
    const sig = document.createElement('span');
    sig.className = 'closer-sig';
    sig.textContent = (sigSrc.textContent || '').trim();
    wrap.append(sig);
  }

  block.replaceChildren(bg, wrap);
}
