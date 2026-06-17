/**
 * articles — content-marketing blog card grid (3-up editorial).
 *
 * Lifted from the home-C-cinematic prototype's `.s.articles` section:
 *   .art-head  -> eyebrow + section <h2>
 *   .art-grid -> N blog cards, each:
 *     .art-img  (whole image is a plain <a> link wrapping a <picture>/<img>)
 *     .art-body -> .art-tag (plain text) + .art-title (<h3> in the article
 *                   link) + .art-excerpt + .art-date (plain text)
 *
 * Authoring contract (#62): DA delivers this block as ONE row / ONE cell with
 * every element a flat sibling. We collect nodes cell-level (#71) so bare-text
 * cells (eyebrow / tag / excerpt / date) survive, then segment by content (#52):
 * the lone section title is the FIRST <h2> (or first heading) at the top; each
 * card opens on a repeating per-article heading (<h3>). Classifiers match the
 * element itself OR a descendant, and media matches `picture, img` (#72/#53).
 */

/* Collect every meaningful node, recovering bare-text cells as <p> (#71). */
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

const isHeading = (el, sel) => el.matches(sel) || el.querySelector(sel);
const findMedia = (el) => (el.matches('picture, img') ? el : el.querySelector('picture, img'));
const findLink = (el) => (el.matches('a') ? el : el.querySelector('a'));

const cardHeadingSel = 'h3, h4';
const sectionHeadingSel = 'h1, h2';

/*
 * Build card groups when each card is authored in its OWN ROW (#73 one-row-per-
 * card shape): a row that contains a card heading (<h3>/<h4>) is a complete
 * card, so its field cells (media | tag | heading | excerpt | date) become that
 * card's group verbatim — preserving the authored order. This avoids the flat
 * heading-gap heuristic mis-assigning each card's media to the previous card
 * (and dropping the first card's image) when the per-card order is media-before-
 * tag. Rows before the first card row are the section head. Returns null when
 * the content is NOT one-row-per-card (<2 card rows, e.g. DA flattened all cards
 * into one cell) so the caller falls back to the flat heading-gap segmentation.
 */
function groupsFromCells(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  // a card row carries its card heading + several sibling cells (media, tag,
  // excerpt, date); a head row is the eyebrow / section title.
  const cardRows = rows.filter((r) => isHeading(r, cardHeadingSel));
  // need at least 2 card rows to trust the per-row shape; otherwise DA may have
  // flattened every card into one cell -> fall back to flat segmentation.
  if (cardRows.length < 2) return null;
  const head = [];
  const groups = [];
  rows.forEach((row) => {
    if (isHeading(row, cardHeadingSel)) {
      // each cell in the card row is one field (media / tag / heading / …).
      groups.push([...row.children]);
    } else if (!groups.length) {
      head.push(...row.children);
    }
  });
  return { head, groups };
}

export default async function decorate(block) {
  const cellShape = groupsFromCells(block);
  const nodes = cellShape ? cellShape.head : collectNodes(block);

  // --- Segment: section head vs. card region ---
  // The lone section title is an h2 (one level up); each card carries an h3.
  // The head is the eyebrow(s) + the section h2; the card region is everything
  // AFTER the section title (so the first card's leading tag/media, which sit
  // before its own h3, stay with the cards rather than leaking into the head).
  let firstCardIdx = nodes.findIndex((n) => isHeading(n, sectionHeadingSel)
    && !isHeading(n, cardHeadingSel));
  // index AFTER the section title; if there is no section title, fall back to
  // the first card heading; if neither, everything is a card.
  if (firstCardIdx !== -1) {
    firstCardIdx += 1;
  } else {
    firstCardIdx = nodes.findIndex((n) => isHeading(n, cardHeadingSel));
    if (firstCardIdx === -1) firstCardIdx = nodes.length;
  }

  const headNodes = cellShape ? cellShape.head : nodes.slice(0, firstCardIdx);
  const cardNodes = cellShape ? [] : nodes.slice(firstCardIdx);

  // --- Build the section head (.art-head: eyebrow + h2) ---
  const head = document.createElement('div');
  head.className = 'art-head';
  headNodes.forEach((n) => {
    if (isHeading(n, 'h1, h2, h3, h4, h5, h6')) {
      const src = n.matches('h1, h2, h3, h4, h5, h6')
        ? n
        : n.querySelector('h1, h2, h3, h4, h5, h6');
      const h2 = document.createElement('h2');
      h2.append(...src.childNodes);
      head.append(h2);
    } else {
      // eyebrow / supporting text
      const span = document.createElement('span');
      span.className = 'eyebrow';
      span.textContent = n.textContent.trim();
      if (span.textContent) head.append(span);
    }
  });

  // --- Segment cards on the repeating heading boundary ---
  // Each card is `tag? -> media? -> heading -> excerpt? -> date?`. The heading
  // is the stable anchor. The hard part is splitting the inter-heading gap:
  // the FRONT of a gap is the previous card's body (excerpt/date) and the TAIL
  // is the next card's lead (tag + optional media). The lead is at most a
  // trailing media node plus the single text node immediately before it (the
  // tag); everything earlier in the gap is the previous card's body.
  const headingIdx = cardNodes
    .map((n, i) => (isHeading(n, cardHeadingSel) ? i : -1))
    .filter((i) => i !== -1);

  // Pull the lead run (tag + media) out of the gap that ENDS at heading `hi`.
  function leadRun(start, end) {
    // nodes [start, end) sit before heading at `end`; return the tail indices
    // that form this card's lead.
    let i = end - 1;
    const lead = [];
    if (i >= start && findMedia(cardNodes[i])) { lead.unshift(i); i -= 1; }
    // the text node right before the media (or right before the heading when
    // there is no media) is the tag
    if (i >= start && !findMedia(cardNodes[i])) { lead.unshift(i); }
    return lead;
  }

  // When each card is authored in its own cell (#48 one-row-per-card), use those
  // groups verbatim — they preserve the authored media->tag->heading order, which
  // the flat heading-gap heuristic below mis-segments (it assumes tag->media).
  const groups = cellShape ? cellShape.groups : [];
  if (!cellShape) {
    headingIdx.forEach((hi, k) => {
      const prevH = k === 0 ? -1 : headingIdx[k - 1];
      const lead = leadRun(prevH + 1, hi);
      const group = [...lead.map((i) => cardNodes[i]), cardNodes[hi]];
      // body of THIS card = nodes after the heading up to the next card's lead
      const nextH = headingIdx[k + 1];
      const bodyEnd = nextH === undefined
        ? cardNodes.length
        : leadRun(hi + 1, nextH)[0] ?? nextH;
      for (let i = hi + 1; i < bodyEnd; i += 1) group.push(cardNodes[i]);
      groups.push(group);
    });
    // no headings at all -> treat each non-empty node group as one card line
    if (!groups.length && cardNodes.length) groups.push(cardNodes);
  }

  const grid = document.createElement('div');
  grid.className = 'art-grid';

  groups.forEach((group) => {
    const article = document.createElement('article');
    article.className = 'art';

    // media + the card link (the article link href, if present)
    const mediaNode = group.find((n) => findMedia(n));
    const media = mediaNode ? findMedia(mediaNode) : null;

    // the heading's own link (title wrapped in <a>) gives us the article href
    const headingNode = group.find((n) => isHeading(n, cardHeadingSel));
    const headingEl = headingNode
      && (headingNode.matches(cardHeadingSel)
        ? headingNode
        : headingNode.querySelector(cardHeadingSel));
    // an explicit standalone link node, else a link wrapping the heading/media
    const linkNode = group.find((n) => findLink(n)
      && !isHeading(n, cardHeadingSel) && !findMedia(n));
    const href = (linkNode && findLink(linkNode).getAttribute('href'))
      || (headingNode && findLink(headingNode) && findLink(headingNode).getAttribute('href'))
      || (mediaNode && findLink(mediaNode) && findLink(mediaNode).getAttribute('href'))
      || '';

    // cover image, wrapped in a plain anchor (the whole image is the link).
    // When no media is authored the anchor is empty and the CSS background
    // fallback (--forest-tint) renders the cover, so no broken <img> ships.
    const imgLink = document.createElement('a');
    imgLink.className = 'art-img';
    if (href) imgLink.href = href;
    if (media) imgLink.append(media.cloneNode(true));
    article.append(imgLink);

    // card body
    const body = document.createElement('div');
    body.className = 'art-body';

    // Remaining text nodes, in order: tag, (title), excerpt, date.
    // Title is rendered from the heading inside its link; the other plain-text
    // nodes are classified by position relative to the heading.
    const textNodes = group.filter((n) => n !== mediaNode
      && n !== headingNode
      && n !== linkNode
      && n.textContent.trim());

    const headingPos = group.indexOf(headingNode);
    const beforeHeading = [];
    const afterHeading = [];
    group.forEach((n, i) => {
      if (!textNodes.includes(n)) return;
      if (headingPos !== -1 && i < headingPos) beforeHeading.push(n);
      else afterHeading.push(n);
    });

    // tag = first text node before the heading (forest, uppercase)
    if (beforeHeading[0]) {
      const tag = document.createElement('span');
      tag.className = 'art-tag';
      tag.textContent = beforeHeading[0].textContent.trim();
      body.append(tag);
    }

    // title = <h3> wrapped in the article link
    if (headingEl) {
      const titleLink = document.createElement('a');
      if (href) titleLink.href = href;
      const h3 = document.createElement('h3');
      h3.className = 'art-title';
      h3.append(...headingEl.childNodes);
      titleLink.append(h3);
      body.append(titleLink);
    }

    // excerpt + date follow the heading. Last text node = date; the rest
    // (joined) form the excerpt.
    if (afterHeading.length) {
      const dateNode = afterHeading[afterHeading.length - 1];
      const excerptNodes = afterHeading.slice(0, -1);
      excerptNodes.forEach((n) => {
        const p = document.createElement('p');
        p.className = 'art-excerpt';
        p.textContent = n.textContent.trim();
        if (p.textContent) body.append(p);
      });
      const date = document.createElement('span');
      date.className = 'art-date';
      date.textContent = dateNode.textContent.trim();
      if (date.textContent) body.append(date);
    }

    article.append(body);
    grid.append(article);
  });

  // --- Wrap content in the prototype's centered max-width container ---
  const wrap = document.createElement('div');
  wrap.className = 'articles-inner';
  if (head.childElementCount) wrap.append(head);
  wrap.append(grid);

  block.replaceChildren(wrap);
}
