/*
 * testimonials block — quote grid on an #EAE7DE band.
 *
 * Authoring contract: the content page authors this block as ONE row with ONE
 * cell holding all elements as flat siblings (eyebrow text, the section title,
 * then per-testimonial a quote paragraph + a "Verified evaluation" byline, and
 * finally a trailing "Read all reviews" link).
 *
 * Because EDS strips authored <span>/class styling inside cells, the decorate
 * step collects nodes at the CELL level (synthesising a <p> from a cell's own
 * text when the cell has no child elements), classifies them by CONTENT (not by
 * row/cell index), and re-creates the 5-star run in JS.
 */

const STAR = '★';
const BYLINE_RE = /^verified evaluation/i;

/**
 * Cell-level cascade collector: iterate `:scope > div > div` cells; for each
 * cell push its child elements if any, ELSE synthesise a <p> from the cell's
 * own text (bare-text cells — eyebrows, bylines — that `> *` would silently
 * drop).
 * @param {Element} block
 * @returns {Element[]}
 */
function collectNodes(block) {
  const nodes = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const children = [...cell.children];
    if (children.length) {
      children.forEach((child) => nodes.push(child));
    } else {
      const text = cell.textContent.trim();
      if (text) {
        const p = document.createElement('p');
        p.textContent = text;
        nodes.push(p);
      }
    }
  });
  return nodes;
}

/** Build a 5-star run as its own element (re-created in JS, not authored). */
function buildStars() {
  const stars = document.createElement('div');
  stars.className = 'stars';
  stars.setAttribute('aria-label', '5 out of 5 stars');
  stars.textContent = STAR.repeat(5);
  return stars;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const nodes = collectNodes(block);

  // Classify by content.
  const heading = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  const link = nodes.find((n) => n.tagName === 'A' || n.querySelector?.('a'));
  const isText = (n) => n !== heading && n !== link
    && !(n.tagName === 'A') && !n.querySelector?.('a')
    && n.textContent.trim().length > 0;

  const textNodes = nodes.filter(isText);
  // Eyebrow = the first short text node BEFORE the heading.
  let eyebrowNode;
  if (heading) {
    const headIdx = nodes.indexOf(heading);
    eyebrowNode = textNodes.find((n) => nodes.indexOf(n) < headIdx);
  }

  // The remaining text nodes are quote/byline pairs. A byline matches
  // "Verified evaluation"; everything else is a quote body. Each quote body
  // opens a new card; a following byline attaches to the open card.
  const cardSources = textNodes.filter((n) => n !== eyebrowNode);
  const cards = [];
  let current = null;
  cardSources.forEach((n) => {
    const text = n.textContent.trim();
    if (BYLINE_RE.test(text)) {
      if (current) current.by = text;
      else cards.push({ quote: '', by: text });
    } else {
      current = { quote: text, by: '' };
      cards.push(current);
    }
  });

  // Rebuild the block DOM.
  block.textContent = '';
  const inner = document.createElement('div');
  inner.className = 'testimonials-inner';

  // Head (eyebrow + title). Reuse the authored heading element (server-visible).
  const head = document.createElement('div');
  head.className = 'head-wrap';
  if (eyebrowNode) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = eyebrowNode.textContent.trim();
    head.append(eyebrow);
  }
  if (heading) head.append(heading);
  if (head.children.length) inner.append(head);

  // Card grid — one card per authored quote.
  const grid = document.createElement('div');
  grid.className = 'quote-grid';
  cards.forEach((card) => {
    const fig = document.createElement('figure');
    fig.className = 'quote';
    fig.append(buildStars());

    const text = document.createElement('p');
    text.className = 'quote-text';
    text.textContent = card.quote;
    fig.append(text);

    const by = document.createElement('figcaption');
    by.className = 'quote-by';
    by.textContent = card.by || 'Verified evaluation';
    fig.append(by);

    grid.append(fig);
  });
  if (cards.length) inner.append(grid);

  // Trailing ghost text link (plain <a>, styled .btn-ghost — NOT a button).
  if (link) {
    const anchor = link.tagName === 'A' ? link : link.querySelector('a');
    if (anchor) {
      const foot = document.createElement('div');
      foot.className = 'grid-foot';
      anchor.className = 'btn-ghost';
      foot.append(anchor);
      inner.append(foot);
    }
  }

  block.append(inner);
}
