/**
 * credit-chooser — audience-routing card grid (data-intent="audience-routing").
 *
 * Authored as ONE row with ONE cell holding all elements as flat siblings
 * (the DA-flattened single-cell contract, #62). The cell carries, in order:
 *   - an eyebrow line (short, uppercase) before the section heading
 *   - the section heading (decorated to <h2>)
 *   - then, per card, repeating: an OPTIONAL picture/img (icon pictogram),
 *     a heading (card title), a meta line, and an "Explore" link.
 *
 * We collect every node with a CELL-LEVEL cascade collector (#71) so bare-text
 * cells (eyebrow / meta) survive, then segment the collected nodes into the
 * section head + one card per repeating card heading (#52/#63). Media is matched
 * as `picture, img` (#72); the card title is the repeat-unit boundary.
 */

/** Cell-level cascade collector — recovers bare-text cells as <p> (#71). */
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

const isHeading = (el) => el.matches('h1, h2, h3, h4, h5, h6')
  || !!el.querySelector('h1, h2, h3, h4, h5, h6');
const media = (el) => (el.matches('picture, img') ? el : el.querySelector('picture, img'));
const link = (el) => (el.matches('a') ? el : el.querySelector('a'));

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  // The card boundary is the most frequent heading tag in the flattened list;
  // the lone section title is one level up (rarer). Count heading tags.
  const headingEls = nodes.filter(isHeading);
  const tagCount = {};
  headingEls.forEach((el) => {
    const h = el.matches('h1, h2, h3, h4, h5, h6')
      ? el
      : el.querySelector('h1, h2, h3, h4, h5, h6');
    tagCount[h.tagName] = (tagCount[h.tagName] || 0) + 1;
  });
  const cardTag = Object.keys(tagCount)
    .sort((a, b) => tagCount[b] - tagCount[a])[0];

  const isCardHeading = (el) => {
    if (!isHeading(el)) return false;
    const h = el.matches('h1, h2, h3, h4, h5, h6')
      ? el
      : el.querySelector('h1, h2, h3, h4, h5, h6');
    return h.tagName === cardTag;
  };

  // Each card is authored as [media?] + card-heading + meta + link, so a card's
  // own icon precedes its heading. A new card therefore begins at the FIRST node
  // of its unit — a leading media node, or the heading when no media leads it —
  // i.e. whenever we hit a media OR card-heading node while the open group ALREADY
  // holds a card heading. Everything before the first such boundary is the head.
  const firstCardIdx = nodes.findIndex(isCardHeading);
  if (firstCardIdx === -1) return;
  // Walk back over any media that immediately leads the first heading — it owns it.
  let headEnd = firstCardIdx;
  while (headEnd > 0 && media(nodes[headEnd - 1]) && !isHeading(nodes[headEnd - 1])) {
    headEnd -= 1;
  }
  const headNodes = nodes.slice(0, headEnd);
  const cardNodes = nodes.slice(headEnd);

  // ----- Section head (.s__head): eyebrow + <h2> -----
  const head = document.createElement('div');
  head.className = 'credit-head';
  headNodes.forEach((node) => {
    if (isHeading(node)) {
      const src = node.matches('h2') ? node : (node.querySelector('h2') || node);
      const h2 = document.createElement('h2');
      h2.append(...src.childNodes);
      head.append(h2);
    } else if (node.textContent.trim()) {
      const span = document.createElement('span');
      span.className = 'eyebrow';
      span.textContent = node.textContent.trim();
      head.append(span);
    }
  });

  // ----- Cards: a new card opens on a media/heading boundary once the current
  // group already has a heading (the previous card is complete). -----
  const groups = [];
  let groupHasHeading = false;
  cardNodes.forEach((node) => {
    const opensCard = (media(node) || isCardHeading(node)) && groupHasHeading;
    if (!groups.length || opensCard) {
      groups.push([]);
      groupHasHeading = false;
    }
    groups[groups.length - 1].push(node);
    if (isCardHeading(node)) groupHasHeading = true;
  });

  const grid = document.createElement('div');
  grid.className = 'chooser-grid';

  groups.forEach((group) => {
    // Find the card's own link (the whole card is an anchor); fall back to '#'.
    let href = '#';
    const groupLink = group.map(link).find(Boolean);
    if (groupLink) href = groupLink.getAttribute('href') || '#';

    const card = document.createElement('a');
    card.className = 'credit';
    card.href = href;

    // Icon chip — optional picture/img.
    const icon = document.createElement('span');
    icon.className = 'credit-icon';
    const pic = group.map(media).find(Boolean);
    if (pic) {
      const cloned = pic.cloneNode(true);
      const img = cloned.matches('img') ? cloned : cloned.querySelector('img');
      if (img) img.setAttribute('alt', '');
      icon.append(cloned);
    }
    card.append(icon);

    const body = document.createElement('span');

    // Title — the card heading (may not be group[0] when media leads the card).
    const headEl = group.find(isCardHeading) || group[0];
    const h = headEl.matches(cardTag.toLowerCase())
      ? headEl
      : (headEl.querySelector(cardTag.toLowerCase()) || headEl);
    const title = document.createElement('span');
    title.className = 'credit-title';
    title.append(...h.childNodes);
    body.append(title);

    // Meta — the first non-heading, non-media, non-link text node in the card.
    const metaNode = group.find((n) => !isHeading(n) && !media(n) && !link(n)
      && n.textContent.trim());
    if (metaNode) {
      const meta = document.createElement('span');
      meta.className = 'credit-meta';
      meta.textContent = metaNode.textContent.trim();
      body.append(meta);
    }

    // Explore link label — the per-card link text, or a default.
    const linkLabel = document.createElement('span');
    linkLabel.className = 'credit-link';
    const explore = group.map(link).find(Boolean);
    linkLabel.textContent = explore && explore.textContent.trim()
      ? explore.textContent.trim()
      : 'Explore →';
    body.append(linkLabel);

    card.append(body);
    grid.append(card);
  });

  block.replaceChildren(head, grid);
}
