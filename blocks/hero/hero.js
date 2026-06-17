/*
 * Hero block — full-bleed photo hero (home-C-cinematic).
 * Authored as ONE row with ONE cell holding all elements as flat siblings
 * (picture/img background, eyebrow, headline, lede, CTAs). We collect at the
 * cell level (recovering bare-text cells), classify by content (not index),
 * and rebuild the prototype's scrim + inner layout. The prototype's arrival
 * reveal (opacity:0 -> .ready) is dropped: there is no driving script, so the
 * content renders visible immediately.
 */

/**
 * Collect content nodes from the block, cell by cell.
 * For each cell, push its child elements if any; otherwise synthesize a <p>
 * from the cell's own text so bare-text cells (eyebrow, lede) are not dropped.
 * @param {Element} block
 * @returns {Element[]}
 */
function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) {
      out.push(...kids);
    } else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      out.push(p);
    }
  });
  return out.length ? out : [...block.children];
}

const matches = (el, sel) => el.matches(sel) || el.querySelector(sel);

/**
 * loads and decorates the hero block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const nodes = collectNodes(block);

  let media = null;
  let heading = null;
  let eyebrow = null;
  let sub = null;
  const ctas = [];

  nodes.forEach((node) => {
    if (!media && matches(node, 'picture, img')) {
      media = node.matches('picture, img') ? node : node.querySelector('picture, img');
      return;
    }
    if (!heading && matches(node, 'h1, h2, h3, h4, h5, h6')) {
      heading = node.matches('h1, h2, h3, h4, h5, h6')
        ? node : node.querySelector('h1, h2, h3, h4, h5, h6');
      return;
    }
    if (matches(node, 'a')) {
      ctas.push(node);
      return;
    }
    const text = node.textContent.trim();
    if (!text) return;
    // First link-free text line is the eyebrow (short label); the next is the lede.
    if (!eyebrow) eyebrow = node;
    else if (!sub) sub = node;
  });

  // Background layer.
  const bg = document.createElement('div');
  bg.className = 'hero-bg';
  if (media) bg.append(media);

  const scrim = document.createElement('div');
  scrim.className = 'hero-scrim';

  // Inner content layer.
  const inner = document.createElement('div');
  inner.className = 'hero-inner';

  if (eyebrow) {
    const span = document.createElement('span');
    span.className = 'eyebrow';
    span.textContent = eyebrow.textContent.trim();
    inner.append(span);
  }

  if (heading) {
    // Promote the authored headline to the page's single <h1>.
    if (heading.tagName !== 'H1') {
      const h1 = document.createElement('h1');
      h1.textContent = heading.textContent.trim();
      heading = h1;
    }
    inner.append(heading);
  }

  if (sub) {
    const p = document.createElement('p');
    p.className = 'hero-sub';
    p.textContent = sub.textContent.trim();
    inner.append(p);
  }

  if (ctas.length) {
    const cta = document.createElement('div');
    cta.className = 'hero-cta';
    ctas.forEach((a) => cta.append(a.cloneNode(true)));
    inner.append(cta);
  }

  const scroll = document.createElement('span');
  scroll.className = 'scrolldot';
  scroll.textContent = 'Scroll';

  block.textContent = '';
  block.append(bg, scrim, inner, scroll);
}
