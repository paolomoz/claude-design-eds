/**
 * NEWS — three-up news row on an elevated surface.
 *
 * Authored shape (#62): ONE row with ONE cell holding all elements as flat
 * siblings — a section eyebrow, an <h2> title, a "see all" link, then a
 * repeating run of <h3> (card title) + eyebrow + lede + byline per card.
 * We DEFAULT to flattening and segment by content, never by row/cell index.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten every authored element into one flat list of siblings.
  let items = [...block.querySelectorAll(':scope > div > div > *')];
  if (!items.length) items = [...block.querySelectorAll(':scope > div > *')];

  const isHeading = (el, tag) => el && el.tagName === tag;
  const firstLink = (el) => (el ? el.querySelector('a') || (el.tagName === 'A' ? el : null) : null);
  const firstPicture = (el) => (el ? el.querySelector('picture, img') : null);
  const text = (el) => (el ? el.textContent.trim() : '');

  // --- Segment: head (everything before the first H3) vs cards (H3 boundaries).
  const firstCardIdx = items.findIndex((el) => isHeading(el, 'H3'));
  const headItems = firstCardIdx === -1 ? items : items.slice(0, firstCardIdx);
  const cardItems = firstCardIdx === -1 ? [] : items.slice(firstCardIdx);

  // --- Build the section head: eyebrow + <h2> left, text-link CTA right.
  const head = document.createElement('header');
  head.className = 'news-head';

  const lhs = document.createElement('div');
  lhs.className = 'lhs';

  const titleEl = headItems.find((el) => isHeading(el, 'H2'));
  const ctaSource = headItems.find((el) => firstLink(el));
  // Eyebrow = the first non-title, non-link text element in the head.
  const eyebrowEl = headItems.find(
    (el) => el !== titleEl && el !== ctaSource && text(el),
  );

  if (eyebrowEl) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'news-eyebrow';
    eyebrow.textContent = text(eyebrowEl);
    lhs.append(eyebrow);
  }

  if (titleEl) {
    // Reuse the authored heading element (server-visible, avoid nesting).
    titleEl.classList.add('news-head-title');
    lhs.append(titleEl);
  }
  head.append(lhs);

  // Clone the CTA cell's anchor as-is (don't manufacture a button).
  const ctaAnchor = firstLink(ctaSource);
  if (ctaAnchor) {
    const cta = ctaAnchor.cloneNode(true);
    cta.classList.add('news-head-link');
    head.append(cta);
  }

  // --- Build cards by repeating-<h3> boundary.
  const grid = document.createElement('div');
  grid.className = 'news-grid';

  const boundaries = [];
  cardItems.forEach((el, i) => {
    if (isHeading(el, 'H3')) boundaries.push(i);
  });

  boundaries.forEach((start, b) => {
    const end = boundaries[b + 1] ?? cardItems.length;
    const group = cardItems.slice(start, end);

    const card = document.createElement('article');
    card.className = 'news-card';

    // Media: real authored picture if the card carries one, else hatch fallback.
    const media = document.createElement('div');
    media.className = 'news-media';
    const pic = group.map(firstPicture).find(Boolean);
    if (pic) {
      media.classList.add('has-image');
      media.append(pic.closest('picture') || pic);
    } else {
      media.setAttribute('aria-label', 'Image placeholder, hatched');
    }
    card.append(media);

    const copy = document.createElement('div');
    copy.className = 'news-copy';

    const titleH3 = group[0];
    // Among the remaining elements: paragraphs feed eyebrow / lede / byline.
    const rest = group
      .slice(1)
      .filter((el) => !firstPicture(el) && text(el));

    // Eyebrow = first short kicker line; lede = body; byline = ruled footer.
    let eyebrow;
    let lede;
    let byline;
    if (rest.length >= 3) {
      [eyebrow, lede, byline] = rest;
    } else if (rest.length === 2) {
      [lede, byline] = rest;
    } else if (rest.length === 1) {
      [lede] = rest;
    }

    if (eyebrow) {
      const span = document.createElement('span');
      span.className = 'news-card-eyebrow';
      span.textContent = text(eyebrow);
      copy.append(span);
    }

    if (titleH3) {
      titleH3.classList.add('news-card-title');
      copy.append(titleH3);
    }

    if (lede) {
      const p = document.createElement('p');
      p.className = 'news-lede';
      p.textContent = text(lede);
      copy.append(p);
    }

    if (byline) {
      const p = document.createElement('p');
      p.className = 'news-byline';
      p.textContent = text(byline);
      copy.append(p);
    }

    card.append(copy);
    grid.append(card);
  });

  // Replace block contents with the decorated structure inside a max-width wrap.
  block.textContent = '';
  const wrap = document.createElement('div');
  wrap.className = 'news-wrap';
  wrap.append(head, grid);
  block.append(wrap);
}
