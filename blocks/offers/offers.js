/**
 * Offers block — section head (eyebrow + headline + "All offers" link) and a
 * 3-col grid of whole-card <a> offer cards (bg image + gradient + tag + headline + "View offer").
 *
 * Authoring rows (in order):
 *   1. head row  — cell 1: eyebrow text | cell 2: headline text | cell 3: "All offers" link
 *   then one row PER offer card:
 *   offer row    — cell 1: image (optional <picture>/<img>) | cell 2: tag
 *                  | cell 3: headline | cell 4: link (href + "View offer" label)
 *
 * @param {Element} block
 */
const ARROW = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'; // eslint-disable-line max-len

export default async function decorate(block) {
  const rows = [...block.children];
  const [headRow, ...offerRows] = rows;

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // ----- Section head -----
  const headCells = headRow ? [...headRow.children] : [];
  const head = document.createElement('div');
  head.className = 'sec-head';

  const headText = document.createElement('div');
  const eyebrowText = headCells[0]?.textContent.trim();
  if (eyebrowText) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'eyebrow kicker';
    eyebrow.textContent = eyebrowText;
    headText.append(eyebrow);
  }
  const headlineText = headCells[1]?.textContent.trim();
  if (headlineText) {
    const h2 = document.createElement('h2');
    h2.className = 'cond';
    h2.textContent = headlineText;
    headText.append(h2);
  }
  head.append(headText);

  const headLink = headCells[2]?.querySelector('a');
  if (headLink) {
    const link = document.createElement('a');
    link.className = 'link';
    link.href = headLink.getAttribute('href') || '#';
    link.append(headLink.textContent.trim());
    link.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>');
    head.append(link);
  }

  wrap.append(head);

  // ----- Offer grid -----
  const grid = document.createElement('div');
  grid.className = 'offer-grid';

  offerRows.forEach((row) => {
    const cells = [...row.children];
    const pic = cells[0]?.querySelector('picture, img');
    const tagText = cells[1]?.textContent.trim();
    const headingText = cells[2]?.textContent.trim();
    const cardLink = cells[3]?.querySelector('a');
    const href = cardLink?.getAttribute('href') || cells[3]?.textContent.trim() || '#';
    const moreText = cardLink?.textContent.trim() || 'View offer';

    const card = document.createElement('a');
    card.className = 'offer';
    card.href = href;

    // Background image (optional) — empty falls back to dark gradient (CSS .ov over --ink-2).
    if (pic) {
      const bg = document.createElement('div');
      bg.className = 'offer-img';
      bg.append(pic.closest('picture') || pic);
      card.append(bg);
    }

    const ov = document.createElement('div');
    ov.className = 'ov';
    card.append(ov);

    const c = document.createElement('div');
    c.className = 'c';
    if (tagText) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = tagText;
      c.append(tag);
    }
    if (headingText) {
      const h3 = document.createElement('h3');
      h3.textContent = headingText;
      c.append(h3);
    }
    const more = document.createElement('span');
    more.className = 'more';
    more.append(moreText, ' ');
    more.insertAdjacentHTML('beforeend', ARROW);
    c.append(more);

    card.append(c);
    grid.append(card);
  });

  wrap.append(grid);
  block.replaceChildren(wrap);
}
