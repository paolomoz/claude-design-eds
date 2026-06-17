/**
 * editorial-about — brand-story editorial split (prototype data-intent="brand-story").
 *
 * Full-bleed 50/50 layout: left = cover image, right = dark copy panel
 * (eyebrow / h2 / body paragraphs / primary CTA). Genuinely edge-to-edge in
 * the prototype (no inner max-width wrap), so the block renders full-bleed.
 *
 * Authoring shape is the DA-flattened single-cell contract (#62): ONE row,
 * ONE cell holding the picture, eyebrow, heading, paragraphs and CTA as flat
 * siblings — but one-element-per-row (bare-text eyebrow cells) is supported
 * too via the cell-level cascade collector (#71). Nodes are classified by
 * CONTENT, not by row/cell index.
 */

function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) out.push(...kids);
    else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      out.push(p);
    }
  });
  return out.length ? out : [...block.children];
}

function isMedia(el) {
  return el.matches('picture, img') ? el : el.querySelector('picture, img');
}

function isHeading(el) {
  return el.matches('h1, h2, h3, h4, h5, h6') ? el : el.querySelector('h1, h2, h3, h4, h5, h6');
}

function hasLink(el) {
  return el.matches('a') ? el : el.querySelector('a');
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  let media = null;
  let heading = null;
  const ctas = [];
  const copyNodes = [];

  nodes.forEach((node) => {
    const m = isMedia(node);
    if (m && !media) { media = m; return; }
    const h = isHeading(node);
    if (h && !heading) { heading = h; return; }
    if (hasLink(node)) { ctas.push(node); return; }
    if (node.textContent.trim()) copyNodes.push(node);
  });

  // Left — full-height cover image.
  const mediaCol = document.createElement('div');
  mediaCol.className = 'editorial-about-media';
  if (media) mediaCol.append(media);

  // Right — dark copy panel.
  const copyCol = document.createElement('div');
  copyCol.className = 'editorial-about-copy';

  // The eyebrow is the short text line that precedes the heading (#51).
  // We collected text nodes in document order, so the first one is the eyebrow.
  let eyebrow = null;
  if (copyNodes.length) [eyebrow] = copyNodes;

  if (eyebrow) {
    const span = document.createElement('span');
    span.className = 'eyebrow';
    span.textContent = eyebrow.textContent.trim();
    copyCol.append(span);
  }

  if (heading) {
    const h2 = document.createElement('h2');
    h2.append(...heading.childNodes);
    copyCol.append(h2);
  }

  copyNodes.forEach((node) => {
    if (node === eyebrow) return;
    const p = document.createElement('p');
    p.append(...node.childNodes);
    copyCol.append(p);
  });

  if (ctas.length) {
    const actions = document.createElement('div');
    actions.className = 'editorial-about-actions';
    ctas.forEach((cta) => {
      [...cta.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
    });
    copyCol.append(actions);
  }

  const grid = document.createElement('div');
  grid.className = 'editorial-about-grid';
  grid.append(mediaCol, copyCol);

  block.replaceChildren(grid);
}
