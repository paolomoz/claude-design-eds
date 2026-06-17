/**
 * guide-grid — "Your guide to JFK." section: a display head with an "All guides"
 * link, over a 6-tile image grid (first tile is the large hero tile spanning 2 rows).
 *
 * Authoring shape (the DA-flattened single-cell contract, #62): ONE row with ONE
 * cell holding every element as flat siblings — a section head (heading + link),
 * then, per tile, a repeating boundary heading (the tile title) with its eyebrow
 * line, optional image cell and CTA label as siblings. Because eyebrows / counts /
 * CTA labels are authored as bare-text single-cell rows, we DEFAULT to a cell-level
 * cascade collector (#71): iterate `:scope > div > div` cells and push each cell's
 * child elements, ELSE synthesize a <p> from the cell's own text. Then we segment
 * and classify the collected nodes by CONTENT (not row/cell index, #48/#52):
 *
 *   - section head  = everything before the FIRST tile-boundary heading
 *   - tiles         = one tile per repeating boundary heading (the most frequent
 *                     heading tag in the collected nodes, #52)
 *   - within a tile = eyebrow (first non-link text run), media (picture|img, #72),
 *                     title (the boundary heading), CTA label (a link, or trailing
 *                     text run)
 */

function isHeading(el) {
  return /^H[1-6]$/.test(el.tagName);
}

function mediaIn(el) {
  if (!el) return null;
  return el.matches('picture, img') ? el : el.querySelector('picture, img');
}

function linkIn(el) {
  if (!el) return null;
  return el.matches('a') ? el : el.querySelector('a');
}

/* Cell-level cascade collector (#71): recover bare-text cells the `> *`
   selector would silently drop. */
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

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  // The tile-boundary heading tag is the MOST FREQUENT heading tag among the
  // collected nodes (#52). The lone section title is one level up (rarer).
  const headingCounts = {};
  nodes.forEach((el) => {
    if (isHeading(el)) headingCounts[el.tagName] = (headingCounts[el.tagName] || 0) + 1;
  });
  const tileTag = Object.keys(headingCounts)
    .sort((a, b) => headingCounts[b] - headingCounts[a])[0];

  // Each tile begins with its eyebrow (a number-prefixed "NN · category / mode"
  // line) which, like the prototype DOM, precedes the tile heading. So the tile
  // BOUNDARY is that number-prefixed text line; the boundary heading is folded
  // into the open tile regardless of order (#63/#69). Fall back to the heading
  // boundary when no number-prefixed eyebrow is authored.
  const isEyebrow = (el) => !isHeading(el) && !mediaIn(el) && !linkIn(el)
    && /^\d/.test(el.textContent.trim());
  const hasEyebrowBoundary = nodes.some(isEyebrow);

  const headNodes = [];
  const tiles = [];
  let current = null;
  const startsTile = (el) => (hasEyebrowBoundary
    ? isEyebrow(el)
    : (tileTag && isHeading(el) && el.tagName === tileTag));
  nodes.forEach((el) => {
    if (startsTile(el)) {
      current = { title: null, nodes: [] };
      tiles.push(current);
      current.nodes.push(el);
    } else if (current) {
      if (!current.title && isHeading(el) && (!tileTag || el.tagName === tileTag)) {
        current.title = el;
      } else {
        current.nodes.push(el);
      }
    } else {
      headNodes.push(el);
    }
  });
  // Drop any tile that never acquired a heading (defensive — keeps phantom
  // boundaries from rendering as empty cards).
  const validTiles = tiles.filter((t) => t.title);

  // ---- Build section head -------------------------------------------------
  const head = document.createElement('div');
  head.className = 'guide-grid__head';

  // Reuse an authored heading element if present (#: server-visible, avoid nesting).
  const headTitle = headNodes.find((el) => isHeading(el));
  if (headTitle) {
    headTitle.classList.add('guide-grid__title');
    head.append(headTitle);
  }
  // The "All guides" link, if authored in the head.
  const headLink = headNodes.map((el) => linkIn(el)).find(Boolean);
  if (headLink) {
    headLink.classList.add('guide-grid__all');
    head.append(headLink);
  }

  // ---- Build the tile grid ------------------------------------------------
  const grid = document.createElement('div');
  grid.className = 'guide-grid__grid';

  validTiles.forEach((tile, i) => {
    const card = document.createElement('a');
    card.className = 'guide-grid__card';
    if (i === 0) card.classList.add('guide-grid__card--hero');

    // Whole-tile anchor click target (#: NOT a .btn). Take the tile's CTA href
    // if one was authored, otherwise leave the card a non-navigating anchor.
    const cardLink = tile.nodes.map((el) => linkIn(el)).find(Boolean);
    if (cardLink && cardLink.getAttribute('href')) card.href = cardLink.getAttribute('href');

    // Media: picture/img (#72). Empty cell → CSS background fallback paints it.
    const media = tile.nodes.map((el) => mediaIn(el)).find(Boolean) || mediaIn(tile.title);
    if (media) {
      const mediaWrap = document.createElement('div');
      mediaWrap.className = 'guide-grid__media';
      mediaWrap.append(media.closest('picture') || media);
      card.append(mediaWrap);
    }

    const body = document.createElement('div');
    body.className = 'guide-grid__body';

    // Eyebrow = the first non-heading, non-link, non-media text run.
    const eyebrowEl = tile.nodes.find((el) => !isHeading(el)
      && !linkIn(el) && !mediaIn(el) && el.textContent.trim());
    if (eyebrowEl) {
      const top = document.createElement('div');
      top.className = 'guide-grid__top';
      // Re-create the eyebrow split ("NN · category / mode") into two spans (#: EDS strips spans).
      const parts = eyebrowEl.textContent.split('/');
      const left = document.createElement('span');
      left.textContent = parts[0].trim();
      top.append(left);
      if (parts.length > 1) {
        const right = document.createElement('span');
        right.textContent = parts.slice(1).join('/').trim();
        top.append(right);
      }
      body.append(top);
    }

    // Group title + CTA so they sit at the bottom (matches prototype flex layout).
    const foot = document.createElement('div');
    foot.className = 'guide-grid__foot';

    tile.title.classList.add('guide-grid__card-title');
    foot.append(tile.title);

    // CTA label: the authored link's text, or a trailing non-eyebrow text run.
    let ctaText = '';
    if (cardLink) ctaText = cardLink.textContent.trim();
    else {
      const ctaEl = tile.nodes
        .filter((el) => el !== eyebrowEl && !isHeading(el) && !mediaIn(el)).pop();
      if (ctaEl) ctaText = ctaEl.textContent.trim();
    }
    if (ctaText) {
      const cta = document.createElement('span');
      cta.className = 'guide-grid__cta';
      cta.textContent = ctaText;
      foot.append(cta);
    }

    body.append(foot);
    card.append(body);
    grid.append(card);
  });

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  if (head.children.length) wrap.append(head);
  wrap.append(grid);

  block.replaceChildren(wrap);
}
