/*
 * Audience-band block — lifted from the adobecom-sr prototype
 * (sr-homepage-proposed-v2.html, section data-section="audience-band").
 *
 * Light surface. Centered eyebrow + headline + lede, then a 5-up grid of
 * whole-card anchors (3/4 aspect, photo bg, gradient, header label + footer
 * copy bottom-left).
 *
 * Authoring contract (#62): the page authors this block as ONE row / ONE cell
 * holding every element as flat siblings. We DEFAULT to flattening and
 * classify by content, never by row/cell index:
 *   - the first heading           -> headline (<h2>)
 *   - a paragraph before any link -> lede (the intro copy)
 *   - the text node / first non-heading before the headline (or a paragraph
 *     with no following link that precedes the headline) -> eyebrow
 *   - each <a> closes a tile; the picture/heading/paragraph that precede it
 *     (since the previous tile) form that tile's media / header / footer.
 */

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten: grab every authored element as a flat list of siblings.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // ---- Segment the intro (eyebrow / headline / lede) from the tiles. ----
  // The first heading is the section headline. Anything before it that is text
  // (a <p> or bare text) is the eyebrow. Tiles begin at the first link.
  const headlineEl = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  const headlineIdx = headlineEl ? nodes.indexOf(headlineEl) : -1;

  // The tile region starts at the first tile-media (a <picture>/<img>) when the
  // cards lead with an image, otherwise at the first link. This keeps a tile's
  // own leading picture/header/footer out of the intro slice (#62).
  const firstMediaIdx = nodes.findIndex(
    (n) => n.tagName === 'PICTURE' || n.querySelector?.('picture, img'),
  );
  const firstLinkIdx = nodes.findIndex((n) => n.tagName === 'A' || n.querySelector?.('a'));

  // Build the centered headline group.
  const headlineGroup = document.createElement('div');
  headlineGroup.className = 'section-headline';

  // Eyebrow: re-created span (#39) — EDS strips authored <span> in cells, so we
  // re-create the styled element here from the text that precedes the headline.
  let eyebrowText = '';
  nodes.slice(0, headlineIdx === -1 ? 0 : headlineIdx).forEach((n) => {
    if (!/^H[1-6]$/.test(n.tagName) && n.tagName !== 'A' && !n.querySelector?.('a')) {
      const t = n.textContent.trim();
      if (t && !eyebrowText) eyebrowText = t;
    }
  });
  if (eyebrowText) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = eyebrowText;
    headlineGroup.append(eyebrow);
  }

  // Reuse the authored heading element if present (server-visible, avoid nesting).
  if (headlineEl) {
    if (headlineEl.tagName !== 'H2') {
      const h2 = document.createElement('h2');
      h2.innerHTML = headlineEl.innerHTML;
      headlineGroup.append(h2);
    } else {
      headlineGroup.append(headlineEl);
    }
  }

  // Tile region boundary. Prefer the first tile-media (a <picture>/<img>). With
  // no media, the first REPEATING heading after the section headline opens the
  // first tile (#62 — segment by the repeating-heading boundary, not by index).
  // Fall back to the first link only when neither media nor a repeat-heading
  // survives.
  const firstRepeatHeadingIdx = nodes.findIndex(
    (n, i) => i > headlineIdx && headlineIdx !== -1 && /^H[1-6]$/.test(n.tagName),
  );
  let tilesStart;
  if (firstMediaIdx !== -1) tilesStart = firstMediaIdx;
  else if (firstRepeatHeadingIdx !== -1) tilesStart = firstRepeatHeadingIdx;
  else if (firstLinkIdx !== -1) tilesStart = firstLinkIdx;
  else tilesStart = nodes.length;

  // Lede: the first paragraph after the headline but before the tile region.
  const lede = nodes
    .slice(headlineIdx + 1, tilesStart)
    .find((n) => n.tagName === 'P' || (n.tagName !== 'A' && n.textContent.trim() && !/^H[1-6]$/.test(n.tagName)));
  if (lede) {
    const p = document.createElement('p');
    p.innerHTML = lede.innerHTML;
    headlineGroup.append(p);
  }

  // ---- Build the tile grid. Each link closes one tile. ----
  const grid = document.createElement('div');
  grid.className = 'audience-band-grid';

  const tileNodes = nodes.slice(tilesStart);
  let pending = [];
  tileNodes.forEach((node) => {
    const anchor = node.tagName === 'A' ? node : node.querySelector?.('a');
    if (anchor) {
      // This link closes the current tile. Collect media/header/footer from
      // the pending siblings since the previous tile.
      const media = pending.find((n) => n.tagName === 'PICTURE' || n.querySelector?.('picture, img'));
      const headerEl = pending.find((n) => /^H[1-6]$/.test(n.tagName));
      const footerEl = pending.find((n) => n.tagName === 'P' || (n !== media && n !== headerEl && n.tagName !== 'PICTURE' && n.textContent.trim() && !/^H[1-6]$/.test(n.tagName)));

      const card = document.createElement('a');
      card.className = 'audience-band-item';
      card.href = anchor.href;
      const label = anchor.textContent.trim();
      if (label) card.setAttribute('aria-label', label);

      const mediaWrap = document.createElement('div');
      mediaWrap.className = 'audience-band-item-media';
      const pic = media?.tagName === 'PICTURE' ? media : media?.querySelector?.('picture');
      const img = pic ? null : media?.querySelector?.('img');
      if (pic) mediaWrap.append(pic);
      else if (img) mediaWrap.append(img);
      card.append(mediaWrap);

      const body = document.createElement('div');
      body.className = 'audience-band-item-container';
      if (headerEl) {
        const header = document.createElement('div');
        header.className = 'audience-band-item-header';
        header.textContent = headerEl.textContent.trim();
        body.append(header);
      }
      if (footerEl) {
        const footer = document.createElement('div');
        footer.className = 'audience-band-item-footer';
        footer.textContent = footerEl.textContent.trim();
        body.append(footer);
      }
      card.append(body);
      grid.append(card);
      pending = [];
    } else {
      pending.push(node);
    }
  });

  // Replace block contents with the decorated structure.
  block.textContent = '';
  if (headlineGroup.childElementCount) block.append(headlineGroup);
  if (grid.childElementCount) block.append(grid);
}
