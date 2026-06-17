/*
 * events — three-up events row.
 *
 * Authored shape (#62): ONE row, ONE cell, all elements as flat siblings, in
 * document order:
 *   eyebrow text, <h2> (section title), text-link <a> (head CTA),
 *   then per card: <picture> (media), date text, <h3> (title), venue text,
 *   <em><a> ghost CTA.
 *
 * We flatten, peel the section head (everything up to the first card media /
 * the first card heading), then segment the remaining siblings into cards.
 * Each card is anchored on its media <picture>; when no media survives we fall
 * back to the repeating <h3> heading as the boundary — so the rendered card
 * count always equals the authored count (one per heading).
 */

const MEDIA_BASE = '/img/surly/';

const isHeading = (el) => /^H[1-6]$/.test(el.tagName);
const hasMedia = (el) => el.tagName === 'PICTURE' || el.tagName === 'IMG'
  || !!el.querySelector?.('picture, img');
const hasLink = (el) => el.tagName === 'A' || !!el.querySelector?.('a');

/** Resolve a <picture>/<img> to a fully-qualified media URL, or '' if none. */
function mediaUrl(node) {
  if (!node) return '';
  const img = node.tagName === 'IMG' ? node : node.querySelector('img');
  const raw = img?.getAttribute('src');
  if (!raw) return '';
  // Absolute or root-relative authored src wins; a bare filename is resolved
  // under the root-relative media base (#44 — never an absolute origin).
  if (/^(https?:)?\/\//.test(raw) || raw.startsWith('/')) return raw;
  return `${MEDIA_BASE}${raw.split('/').pop()}`;
}

/** True for an element that carries no meaningful content. */
const isEmpty = (el) => !el.textContent.trim() && !el.querySelector('img, picture, a');

/** Build one card DOM node from its segment of flat siblings. */
function buildCard(segment) {
  const card = document.createElement('article');
  card.className = 'event-card';

  const pictureNode = segment.find(hasMedia);
  const headingNode = segment.find(isHeading);
  const url = mediaUrl(pictureNode);

  const media = document.createElement('div');
  media.className = 'event-card-media';
  if (url) media.style.backgroundImage = `url('${url}')`;
  card.append(media);

  const copy = document.createElement('div');
  copy.className = 'event-card-copy';

  // Date = the plain-text sibling that precedes the heading (yellow eyebrow).
  const headingPos = segment.indexOf(headingNode);
  const dateNode = segment
    .slice(0, headingPos < 0 ? segment.length : headingPos)
    .find((el) => !hasMedia(el) && !hasLink(el) && el.textContent.trim());
  if (dateNode) {
    const date = document.createElement('span');
    date.className = 'event-card-date';
    date.textContent = dateNode.textContent.trim();
    copy.append(date);
  }

  // Title — reuse the authored heading element (server-visible, avoid nesting).
  if (headingNode) {
    headingNode.classList.add('event-card-title');
    copy.append(headingNode);
  }

  // Venue = first plain-text sibling AFTER the heading (no link, no media).
  const after = headingPos < 0 ? [] : segment.slice(headingPos + 1);
  const venueNode = after.find(
    (el) => !isHeading(el) && !hasMedia(el) && !hasLink(el) && el.textContent.trim(),
  );
  if (venueNode) {
    const venue = document.createElement('span');
    venue.className = 'event-card-venue';
    venue.textContent = venueNode.textContent.trim();
    copy.append(venue);
  }

  card.append(copy);

  // CTA — clone the authored ghost link cell, preserving the <em> wrapper so
  // ak.js decorateButton applies .btn-secondary (ghost). Never manufacture one.
  const ctaNode = segment.find(hasLink);
  if (ctaNode) {
    const a = ctaNode.tagName === 'A' ? ctaNode : ctaNode.querySelector('a');
    const wrapper = a.closest('em') || a;
    const cta = document.createElement('div');
    cta.className = 'event-card-cta';
    cta.append(wrapper.cloneNode(true));
    card.append(cta);
  }

  return card;
}

export default async function decorate(block) {
  const nodes = [...block.querySelectorAll(':scope > div > div > *')].filter(
    (el) => !isEmpty(el),
  );

  const headingIdxs = nodes.map((el, i) => (isHeading(el) ? i : -1)).filter((i) => i >= 0);
  const titleIdx = headingIdxs[0] ?? -1; // section <h2>
  const cardHeadingIdxs = headingIdxs.slice(1); // one per card

  // --- Section head: eyebrow + heading left, text-link CTA right.
  const inner = document.createElement('div');
  inner.className = 'events-inner';

  const head = document.createElement('div');
  head.className = 'events-head';
  const lhs = document.createElement('div');
  lhs.className = 'lhs';

  if (titleIdx > 0 && !hasMedia(nodes[titleIdx - 1]) && !hasLink(nodes[titleIdx - 1])) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'events-head-eyebrow';
    eyebrow.textContent = nodes[titleIdx - 1].textContent.trim();
    lhs.append(eyebrow);
  }
  if (titleIdx >= 0) lhs.append(nodes[titleIdx]);
  head.append(lhs);

  // Head CTA = the first link before the first card.
  const firstCardHeading = cardHeadingIdxs[0] ?? nodes.length;
  const headLinkNode = nodes.slice(0, firstCardHeading).find(hasLink);
  if (headLinkNode) {
    const a = headLinkNode.tagName === 'A' ? headLinkNode : headLinkNode.querySelector('a');
    a.classList.add('events-head-link');
    head.append(a);
  }
  inner.append(head);

  // --- Cards. The card region is everything after the section head. Within it
  // the authored order per card is [media, date, <h3>, venue, <em><a> CTA], so
  // the split between consecutive cards falls right after each card's CTA — the
  // LAST link before the next card's heading. We segment on that boundary, which
  // keeps each card's trailing venue/CTA with its own heading (not the next
  // card's leading media). One segment per heading ⇒ rendered count == authored.
  const grid = document.createElement('div');
  grid.className = 'events-grid';

  const headLinkIdx = headLinkNode ? nodes.indexOf(headLinkNode) : -1;
  const cardStart = Math.max(titleIdx, headLinkIdx) + 1; // first card region index

  cardHeadingIdxs.forEach((hIdx, ci) => {
    const prevHeading = ci === 0 ? cardStart - 1 : cardHeadingIdxs[ci - 1];
    // Card start: after the previous card's CTA (last link between the previous
    // heading and this one), else right after the previous heading / head.
    let start = Math.max(cardStart, prevHeading + 1);
    for (let i = start; i < hIdx; i += 1) {
      if (hasLink(nodes[i])) start = i + 1;
    }
    // Card end: after THIS card's CTA (last link before the next heading), else
    // up to the next heading / end of list.
    const nextHeading = cardHeadingIdxs[ci + 1] ?? nodes.length;
    let end = nextHeading;
    for (let i = hIdx + 1; i < nextHeading; i += 1) {
      if (hasLink(nodes[i])) { end = i + 1; break; }
    }
    grid.append(buildCard(nodes.slice(start, end)));
  });

  inner.append(grid);

  block.textContent = '';
  block.append(inner);
}
