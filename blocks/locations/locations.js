/*
 * Locations block — 2×2 grid of region tiles.
 * Prototype: home-C-cinematic.html section.locations (lines 626-665).
 *
 * Authored shape (one row, one cell, flat siblings):
 *   kicker text · <h2> heading · intro <p>
 *   then 4 tiles, each authored as: image · name · count · href
 *
 * EDS strips <span>s in cells, so the .region-cap / .region-name /
 * .region-count spans are rebuilt here. Tiles are whole-card anchors.
 */

/**
 * Pull a fully-qualified src out of a node that may be a <picture>,
 * an <img>, or a wrapper containing one.
 * @param {Element} node
 * @returns {{src:string, alt:string}|null}
 */
function extractImage(node) {
  const img = node.matches?.('img') ? node : node.querySelector?.('img');
  if (!img) return null;
  return { src: img.getAttribute('src') || '', alt: img.getAttribute('alt') || '' };
}

/**
 * Cascade collector (#68): each authored element may sit in its own row/cell,
 * and text-only cells (the kicker, the per-tile name/count) hold a bare text
 * node with NO child element — so `:scope > div > div > *` silently drops them.
 * Collect per cell, synthesizing a <p> for bare-text cells; order preserved.
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

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten: collect every leaf-ish element authored inside the block,
  // regardless of how rows/cells were split.
  const nodes = collectNodes(block);

  // ── Classify the flattened content ──────────────────────────
  const heading = nodes.find((n) => /^H[1-6]$/.test(n.tagName)) || null;
  const headingIdx = heading ? nodes.indexOf(heading) : -1;

  // Head copy: the kicker is the text node(s) before the heading;
  // the intro is the paragraph(s) after the heading but before the
  // first image (which begins the tile grid).
  const firstImageIdx = nodes.findIndex((n) => extractImage(n));

  const headText = (n) => (n.textContent || '').trim();

  // Kicker = first non-empty text element before the heading.
  let kickerText = '';
  for (let i = 0; i < headingIdx; i += 1) {
    const t = headText(nodes[i]);
    if (t) { kickerText = t; break; }
  }

  // Intro = first non-empty text element after heading, before tiles.
  let introText = '';
  const introStart = headingIdx >= 0 ? headingIdx + 1 : 0;
  const introEnd = firstImageIdx >= 0 ? firstImageIdx : nodes.length;
  for (let i = introStart; i < introEnd; i += 1) {
    const t = headText(nodes[i]);
    if (t) { introText = t; break; }
  }

  // ── Tiles: walk from the first image onward, segmenting on each
  // image boundary. Each tile = one image + the text/links until the
  // next image. ───────────────────────────────────────────────
  const tiles = [];
  let current = null;
  for (let i = firstImageIdx; i >= 0 && i < nodes.length; i += 1) {
    const node = nodes[i];
    const image = extractImage(node);
    if (image) {
      current = { image, texts: [], href: '' };
      tiles.push(current);
    } else if (current) {
      const link = node.matches?.('a') ? node : node.querySelector?.('a');
      if (link && link.getAttribute('href')) {
        current.href = link.getAttribute('href');
        // Link text may carry the name/count (whole-card anchor authoring),
        // but ignore it when it's just the bare URL (autolinked href cell).
        const t = headText(link);
        if (t && t !== link.getAttribute('href') && !/^https?:\/\//i.test(t)) {
          current.texts.push(t);
        }
      } else {
        const t = headText(node);
        if (t) current.texts.push(t);
      }
    }
  }

  // ── Rebuild ─────────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.className = 'locations-wrap';

  const head = document.createElement('div');
  head.className = 'locations-head';

  if (kickerText) {
    const kicker = document.createElement('p');
    kicker.className = 'kicker';
    kicker.textContent = kickerText;
    head.append(kicker);
  }

  if (heading) {
    // Reuse the authored heading element (server-visible).
    head.append(heading);
  }

  if (introText) {
    const intro = document.createElement('p');
    intro.textContent = introText;
    head.append(intro);
  }

  const grid = document.createElement('div');
  grid.className = 'locations-grid';

  tiles.forEach((tile) => {
    const [nameText, countText] = tile.texts;

    const a = document.createElement('a');
    a.className = 'region';
    if (tile.href) a.href = tile.href;

    if (tile.image && tile.image.src) {
      const img = document.createElement('img');
      img.className = 'region-img';
      img.src = tile.image.src;
      img.alt = tile.image.alt || nameText || '';
      img.loading = 'lazy';
      a.append(img);
    }

    // Rebuild the caption spans EDS would have stripped.
    const cap = document.createElement('span');
    cap.className = 'region-cap';

    const name = document.createElement('span');
    name.className = 'region-name';
    name.textContent = nameText || '';
    cap.append(name);

    if (countText) {
      const count = document.createElement('span');
      count.className = 'region-count';
      count.textContent = countText;
      cap.append(count);
    }

    a.append(cap);
    grid.append(a);
  });

  wrap.append(head, grid);
  block.replaceChildren(wrap);
}
