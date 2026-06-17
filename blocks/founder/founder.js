/*
 * Founder Block
 * Fade-to-page founder portrait beside copy.
 * Lifted from the stardust prototype .ds-founder section.
 */

const PORTRAIT_FALLBACK = '/img/wbb/brewery-founder-portrait.jpg';

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // The page authors this block as ONE row / ONE cell with all elements as
  // flat siblings. Flatten and classify by content, not by row/cell index.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // Classify the flattened nodes.
  const picture = nodes.find((n) => n.matches('picture, img') || n.querySelector('picture, img'));
  const heading = nodes.find((n) => n.matches('h1, h2, h3, h4, h5, h6'));
  const paragraphs = nodes.filter((n) => n.matches('p') && !n.querySelector('picture, img'));

  // Build the portrait media.
  const portrait = document.createElement('div');
  portrait.className = 'founder-portrait';
  if (picture) {
    const media = picture.matches('picture, img') ? picture : picture.querySelector('picture, img');
    portrait.append(media);
  } else {
    // Empty image cell — fall back to the authored portrait URL.
    const img = document.createElement('img');
    img.src = PORTRAIT_FALLBACK;
    img.alt = 'The founder of Wasatch Back Beerworks beside the copper mash tun';
    img.loading = 'lazy';
    img.decoding = 'async';
    portrait.append(img);
  }

  // Build the copy column.
  const copy = document.createElement('div');
  copy.className = 'founder-copy';

  // Eyebrow: first short paragraph that precedes the heading.
  let eyebrow;
  let body = paragraphs;
  if (heading && paragraphs.length) {
    const headingIndex = nodes.indexOf(heading);
    const before = paragraphs.filter((p) => nodes.indexOf(p) < headingIndex);
    if (before.length) {
      [eyebrow] = before;
      body = paragraphs.filter((p) => p !== eyebrow);
    }
  }

  // The final short paragraph is the granite rule-topped signature.
  let sig;
  if (body.length > 1) {
    const last = body[body.length - 1];
    const text = last.textContent.trim();
    if (text.length <= 60) {
      sig = last;
      body = body.slice(0, -1);
    }
  }

  if (eyebrow) {
    eyebrow.classList.add('founder-eyebrow');
    copy.append(eyebrow);
  }
  if (heading) copy.append(heading);
  body.forEach((p) => copy.append(p));
  if (sig) {
    // EDS strips <span> in cells — recreate the .ds-founder-sig styling in JS.
    const sigEl = document.createElement('span');
    sigEl.className = 'founder-sig';
    sigEl.textContent = sig.textContent.trim();
    copy.append(sigEl);
    sig.remove();
  }

  const inner = document.createElement('div');
  inner.className = 'founder-inner';
  inner.append(portrait, copy);

  block.replaceChildren(inner);
}
