/**
 * News block — "In the news" section head over a 3-up card grid.
 * Authored shape:
 *   row 0: head — cell with a heading (h2 "In the news") + a "See all news" link
 *   row 1: cards — one flat cell holding repeated [meta, h3 title, body] runs,
 *          segmented into one card per <h3>. The meta line is a delimited single
 *          cell (e.g. "ACROBAT u00b7 TAX SEASON"), rendered here via JS.
 * @param {Element} block The block element
 */
function isHeading(node) {
  if (!node) return false;
  return node.matches('h1, h2, h3, h4, h5, h6')
    || !!node.querySelector('h1, h2, h3, h4, h5, h6');
}

function getHeading(node) {
  if (node.matches('h1, h2, h3, h4, h5, h6')) return node;
  return node.querySelector('h1, h2, h3, h4, h5, h6');
}

export default async function decorate(block) {
  const rows = [...block.children];

  // .ds-container max-width wrap; the content is wrapped, the section background
  // (if any) stays full-bleed.
  const container = document.createElement('div');
  container.className = 'news-container-inner';

  // DA flattens head + cards into ONE cell holding a flat sequence (#48/#52).
  // Gather those leaf elements; fall back to a head-row + cards-row shape.
  const flatCell = block.querySelector(':scope > div > div');
  let allNodes;
  if (flatCell && flatCell.children.length > 1) {
    allNodes = [...flatCell.children];
  } else {
    allNodes = rows.flatMap((row) => [...(row.firstElementChild?.children || [])]);
  }

  // Split on the FIRST card heading (h3): everything before is the section
  // head (section h2 + "See all news" link), the rest is the card stream.
  const firstCardIdx = allNodes.findIndex((n) => getHeading(n)?.tagName === 'H3');
  const headNodes = firstCardIdx === -1 ? allNodes : allNodes.slice(0, firstCardIdx);
  const cardNodes = firstCardIdx === -1 ? [] : allNodes.slice(firstCardIdx);

  // --- Head (#56: collect the whole head group) ---
  if (headNodes.length) {
    const head = document.createElement('div');
    head.className = 'news-head';

    const heading = headNodes.map((n) => getHeading(n)).find(Boolean);
    if (heading) {
      // Reuse the authored heading element (server-visible, avoid nesting).
      heading.classList.add('news-h2');
      head.append(heading);
    }

    // Keep the "See all news" anchor as a plain styled text link, NOT a button.
    const linkHost = headNodes.find((n) => n.matches('a') || n.querySelector('a'));
    const link = linkHost && (linkHost.matches('a') ? linkHost : linkHost.querySelector('a'));
    if (link) {
      link.classList.add('news-viewall');
      head.append(link);
    }

    container.append(head);
  }

  // --- Cards (#52: segment the card stream into one group per h3) ---
  if (cardNodes.length) {
    const list = document.createElement('div');
    list.className = 'news-list';

    const nodes = cardNodes;

    let current = null;
    let pendingMeta = null;

    nodes.forEach((node, i) => {
      const heading = getHeading(node);

      if (heading) {
        // A heading opens a new card.
        current = document.createElement('article');
        current.className = 'news-item';

        const media = document.createElement('div');
        media.className = 'news-item-media';
        media.setAttribute('aria-hidden', 'true');
        current.append(media);

        const copy = document.createElement('div');
        copy.className = 'news-item-copy';
        current.append(copy);

        if (pendingMeta) {
          copy.append(pendingMeta);
          pendingMeta = null;
        }

        heading.classList.add('news-item-h3');
        copy.append(heading);
        list.append(current);
        return;
      }

      // Non-heading node: meta if it immediately precedes a heading, else body.
      if (isHeading(nodes[i + 1])) {
        // Render the meta line from the delimited single cell via JS — don't
        // rely on authored spans (EDS strips <span> in cells).
        const meta = document.createElement('p');
        meta.className = 'news-item-meta';
        meta.textContent = node.textContent.trim();
        pendingMeta = meta;
      } else if (current) {
        node.classList.add('news-item-body');
        current.querySelector('.news-item-copy').append(node);
      }
    });

    container.append(list);
  }

  block.textContent = '';
  block.append(container);
}
