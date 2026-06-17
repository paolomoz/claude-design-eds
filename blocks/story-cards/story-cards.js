/*
 * story-cards — Community Stories section.
 * Authoring contract (one row per logical unit):
 *   row 1 (head):  | eyebrow text | Community Stories (heading) | See all stories (link) |
 *   rows 2..7:     | image | By <name> | <title, with link + <strong> emphasis> |
 *
 * DA flattens repeating-card structures into a single row of sibling cells
 * (#52). When that happens we re-segment the flat children by the most-frequent
 * leading marker (here: the presence of a picture/img — the card's first cell).
 */

const CHEV = '›'; // ›

/** Build the inline chevron SVG-style glyph wrapper (we use a text glyph, styled in CSS). */
function chevSpan() {
  const s = document.createElement('span');
  s.setAttribute('aria-hidden', 'true');
  s.textContent = CHEV;
  return s;
}

/** True if the cell (or a descendant) is an image cell. */
function isImageCell(el) {
  if (!el) return false;
  const sel = 'picture, img';
  return (el.matches && el.matches(sel)) || !!el.querySelector(sel);
}

/**
 * Normalize a block into an array of "rows", each an array of cell elements.
 * Handles the clean multi-row table shape and the DA-flattened single-row shape.
 */
function readRows(block) {
  const rows = [...block.children];
  if (rows.length > 1) {
    return rows.map((r) => [...r.children]);
  }

  // Flattened: one row, many sibling cells. Segment by image-cell boundaries.
  const cells = rows.length === 1 ? [...rows[0].children] : [];
  if (!cells.length) return [];

  const imageIdx = cells
    .map((c, i) => (isImageCell(c) ? i : -1))
    .filter((i) => i >= 0);

  // No images at all → treat the whole thing as a single head row.
  if (!imageIdx.length) return [cells];

  const segments = [];
  // Anything before the first image is the head (eyebrow/title/CTA).
  if (imageIdx[0] > 0) segments.push(cells.slice(0, imageIdx[0]));
  imageIdx.forEach((start, k) => {
    const end = k + 1 < imageIdx.length ? imageIdx[k + 1] : cells.length;
    segments.push(cells.slice(start, end));
  });
  return segments;
}

/** Decorate the head row: eyebrow span, h2 italic title, tertiary "see all" link. */
function buildHead(cells) {
  const head = document.createElement('div');
  head.className = 'story-cards-head';

  const left = document.createElement('div');
  left.className = 'story-cards-head-left';

  // Find an authored heading to reuse (server-visible, avoid nesting).
  let heading;
  let eyebrowText = '';
  cells.forEach((cell) => {
    const h = (cell.matches && cell.matches('h1,h2,h3,h4,h5,h6'))
      ? cell : cell.querySelector('h1,h2,h3,h4,h5,h6');
    if (h && !heading) heading = h;
  });

  // Eyebrow = first text-only cell that isn't the heading and isn't a link.
  cells.forEach((cell) => {
    const hasHeading = heading
      && (cell === heading || cell.contains(heading));
    const hasLink = (cell.matches && cell.matches('a')) || cell.querySelector('a');
    if (!hasHeading && !hasLink && !eyebrowText) {
      const t = cell.textContent.trim();
      if (t) eyebrowText = t;
    }
  });

  if (eyebrowText) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'story-cards-eyebrow';
    eyebrow.textContent = eyebrowText;
    left.append(eyebrow);
  }

  if (heading) {
    heading.classList.add('story-cards-title');
    left.append(heading);
  }

  head.append(left);

  // Tertiary CTA: clone the authored anchor, style as text link (not a button).
  let cta;
  cells.forEach((cell) => {
    const a = (cell.matches && cell.matches('a')) ? cell : cell.querySelector('a');
    if (a && !cta) cta = a;
  });
  if (cta) {
    const link = cta.cloneNode(true);
    link.className = 'story-cards-tertiary';
    if (!link.querySelector('.story-cards-tertiary-chev')) {
      const chev = chevSpan();
      chev.classList.add('story-cards-tertiary-chev');
      link.append(' ', chev);
    }
    head.append(link);
  }

  return head;
}

/** Decorate a single card row → <article>. */
function buildCard(cells) {
  const article = document.createElement('article');
  article.className = 'story-cards-card';

  const imageCell = cells.find((c) => isImageCell(c));
  const rest = cells.filter((c) => c !== imageCell);

  // Image
  const media = document.createElement('div');
  media.className = 'story-cards-card-image';
  if (imageCell) {
    const pic = imageCell.querySelector('picture')
      || (imageCell.matches && imageCell.matches('picture') ? imageCell : null);
    const img = imageCell.querySelector('img')
      || (imageCell.matches && imageCell.matches('img') ? imageCell : null);
    if (pic) media.append(pic.cloneNode(true));
    else if (img) media.append(img.cloneNode(true));
  }
  article.append(media);

  const body = document.createElement('div');
  body.className = 'story-cards-card-body';

  // Title cell = the one containing a link (or a heading); byline = the other text cell.
  let titleCell;
  let bylineCell;
  rest.forEach((cell) => {
    const hasLink = (cell.matches && cell.matches('a')) || cell.querySelector('a');
    const hasHeading = (cell.matches && cell.matches('h1,h2,h3,h4,h5,h6'))
      || cell.querySelector('h1,h2,h3,h4,h5,h6');
    if ((hasLink || hasHeading) && !titleCell) titleCell = cell;
    else if (!bylineCell) bylineCell = cell;
  });
  if (!titleCell && rest.length) [titleCell] = rest.slice(-1);

  if (bylineCell) {
    const byline = document.createElement('p');
    byline.className = 'story-cards-card-byline';
    byline.textContent = bylineCell.textContent.trim();
    body.append(byline);
  }

  // Title (reuse authored heading if present), link inside.
  let storyHref = '';
  if (titleCell) {
    const srcHeading = (titleCell.matches && titleCell.matches('h1,h2,h3,h4,h5,h6'))
      ? titleCell : titleCell.querySelector('h1,h2,h3,h4,h5,h6');
    const title = srcHeading || document.createElement('h3');
    title.classList.add('story-cards-card-title');

    const srcAnchor = (titleCell.matches && titleCell.matches('a'))
      ? titleCell : titleCell.querySelector('a');
    if (srcAnchor) {
      storyHref = srcAnchor.getAttribute('href') || '';
      // If the heading does not already wrap the anchor, wrap its content.
      if (!title.querySelector('a')) {
        const a = srcAnchor.cloneNode(true);
        title.textContent = '';
        title.append(a);
      }
    } else if (!srcHeading) {
      title.textContent = titleCell.textContent.trim();
    }
    body.append(title);
  }

  // Foot: chev-circle link to the story.
  const foot = document.createElement('div');
  foot.className = 'story-cards-card-foot';
  const chevLink = document.createElement('a');
  chevLink.className = 'story-cards-chev-circle';
  chevLink.href = storyHref || '#';
  const titleText = titleCell ? titleCell.textContent.trim() : 'story';
  chevLink.setAttribute('aria-label', `Read ${titleText}`);
  chevLink.append(chevSpan());
  foot.append(chevLink);
  body.append(foot);

  article.append(body);
  return article;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = readRows(block);
  if (!rows.length) return;

  // The head row is the first segment that has NO image cell.
  let headCells = null;
  const cardSegments = [];
  rows.forEach((cells) => {
    if (!cells.some((c) => isImageCell(c)) && !headCells) headCells = cells;
    else cardSegments.push(cells);
  });

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  if (headCells) wrap.append(buildHead(headCells));

  const grid = document.createElement('div');
  grid.className = 'story-cards-grid';
  cardSegments.forEach((cells) => grid.append(buildCard(cells)));
  wrap.append(grid);

  block.textContent = '';
  block.append(wrap);
}
