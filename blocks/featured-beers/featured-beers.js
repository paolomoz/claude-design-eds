/**
 * Featured Beers — three-up featured beer cards.
 *
 * Authored as ONE row with ONE cell holding all elements as flat siblings.
 * Head: eyebrow (first non-heading text) + <h2> title + lede paragraph.
 * Cards: repeating [picture, style text, <h3> name, notes, ABV] segmented by
 * the <h3> boundary (DA flattens the 3-up grid into one cell).
 *
 * @param {Element} block The block element
 */

function qualify(img) {
  if (!img) return;
  const src = img.getAttribute('src') || '';
  // map authored / prototype paths to the root-relative can image (#44 — never
  // an absolute origin; root-relative resolves correctly in every environment)
  const file = src.split('/').pop();
  if (file) img.setAttribute('src', `/img/surly/${file}`);
  img.loading = 'lazy';
}

export default async function decorate(block) {
  // Flatten: every authored element is a flat sibling in one cell.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // --- Classify the head ---
  // Head = eyebrow text + <h2> title + lede paragraph. Cards begin after.
  const h2 = nodes.find((n) => n.tagName === 'H2');
  const h2Idx = h2 ? nodes.indexOf(h2) : -1;

  // eyebrow: text/paragraph siblings before the h2 that aren't the lede
  const eyebrowEl = h2Idx > 0
    ? nodes.slice(0, h2Idx).find((n) => n.textContent.trim())
    : null;
  // lede: the first paragraph after the h2 and before the first card boundary
  const ledeEl = h2Idx >= 0
    ? nodes.slice(h2Idx + 1).find((n) => n.tagName === 'P' && n.textContent.trim())
    : null;

  const head = document.createElement('header');
  head.className = 'fb-head';
  const lhs = document.createElement('div');
  lhs.className = 'fb-lhs';
  if (eyebrowEl) {
    const eye = document.createElement('span');
    eye.className = 'fb-eyebrow';
    eye.textContent = eyebrowEl.textContent.trim();
    lhs.append(eye);
  }
  if (h2) {
    h2.classList.add('fb-title');
    lhs.append(h2);
  }
  head.append(lhs);
  if (ledeEl) {
    ledeEl.classList.add('fb-lede');
    head.append(ledeEl);
  }

  // --- Segment cards by <h3> boundary ---
  // The card region is everything from the first picture/style up to the end.
  // Re-derive: cards start after the lede (or after h2). Collect the tail.
  const ledeIdx = ledeEl ? nodes.indexOf(ledeEl) : h2Idx;
  const tail = nodes.slice(ledeIdx + 1);

  // group the tail into cards: a new card starts at each <picture> (or, if no
  // picture present, at each <h3>). Use h3 as the stable boundary marker.
  const grid = document.createElement('div');
  grid.className = 'fb-grid';

  const hasImage = (node) => node.tagName === 'PICTURE'
    || node.tagName === 'IMG'
    || !!node.querySelector?.('picture, img');

  // Choose the card boundary: each can-picture leads a card, but image-less
  // content (#2 CSS fallback) has no pictures — then fall back to the <h3>
  // (beer name) as the boundary so all N cards segment, not 1.
  const tailHasImages = tail.some(hasImage);
  const isBoundary = (node) => (tailHasImages
    ? hasImage(node)
    : node.tagName === 'H3');

  const cards = [];
  let cur = null;
  tail.forEach((node) => {
    if (isBoundary(node) || !cur) {
      cur = [];
      cards.push(cur);
    }
    cur.push(node);
  });

  cards.forEach((parts) => {
    const picNode = parts.find(hasImage);
    const h3 = parts.find((n) => n.tagName === 'H3');
    if (!h3 && !picNode) return;

    // text parts that aren't the picture or the h3, in order
    const texts = parts.filter((n) => n !== picNode && n !== h3 && n.textContent.trim());
    const styleText = texts[0] ? texts[0].textContent.trim() : '';
    const notesText = texts[1] ? texts[1].textContent.trim() : '';
    const abvText = texts[2] ? texts[2].textContent.trim() : '';

    const card = document.createElement('a');
    card.className = 'fb-card';
    // carry the card link if any part wrapped one (the image or the name)
    const link = parts.map((n) => (n.tagName === 'A' ? n : n.querySelector?.('a'))).find(Boolean);
    if (link) card.href = link.getAttribute('href');

    const wrap = document.createElement('div');
    wrap.className = 'fb-card-image';
    if (picNode) {
      // prefer a <picture> (EDS pipeline), else the bare <img>
      const media = picNode.tagName === 'PICTURE' ? picNode
        : picNode.querySelector?.('picture') || picNode.querySelector?.('img') || picNode;
      wrap.append(media);
      qualify(wrap.querySelector('img') || (media.tagName === 'IMG' ? media : null));
    }
    card.append(wrap);

    const label = document.createElement('div');
    label.className = 'fb-card-label';

    if (styleText) {
      const style = document.createElement('span');
      style.className = 'fb-card-style';
      style.textContent = styleText;
      label.append(style);
    }

    if (h3) {
      h3.classList.add('fb-card-name');
      label.append(h3);
    }

    if (notesText || abvText) {
      const meta = document.createElement('div');
      meta.className = 'fb-card-meta';
      const notes = document.createElement('span');
      notes.textContent = notesText;
      meta.append(notes);
      const abv = document.createElement('span');
      abv.className = 'fb-card-abv';
      // ABV authored as "6.6% ABV" — bold the leading percentage.
      const m = abvText.match(/^(\S+%?)\s*(.*)$/);
      if (m) {
        const [, value, rest] = m;
        const strong = document.createElement('strong');
        strong.textContent = value;
        abv.append(strong);
        if (rest) abv.append(` ${rest}`);
      } else {
        abv.textContent = abvText;
      }
      meta.append(abv);
      label.append(meta);
    }

    card.append(label);
    grid.append(card);
  });

  block.replaceChildren(head, grid);
}
