/*
 * News block — JFK "News & promotions"
 * Author shape (rows):
 *   Row 1 (head):  [ kicker | h2 ]
 *   Row 2..n (card): [ image (optional, may be empty) | title | body | link-text ]
 */

function buildCard(cells) {
  const [imageCell, titleCell, bodyCell, linkCell] = cells;

  const card = document.createElement('article');
  card.className = 'news-card';

  // Image: optional cell. Always render a slot so the CSS placeholder fallback shows.
  const slot = document.createElement('div');
  slot.className = 'news-img';
  if (imageCell) {
    const pic = imageCell.querySelector('picture, img');
    if (pic) slot.append(pic);
  }
  card.append(slot);

  const body = document.createElement('div');
  body.className = 'news-body';

  if (titleCell) {
    const h3 = document.createElement('h3');
    h3.textContent = titleCell.textContent.trim();
    body.append(h3);
  }

  if (bodyCell) {
    const p = document.createElement('p');
    p.textContent = bodyCell.textContent.trim();
    body.append(p);
  }

  if (linkCell) {
    const existing = linkCell.querySelector('a');
    const a = document.createElement('a');
    a.className = 'news-link';
    if (existing) {
      a.href = existing.getAttribute('href') || '#';
      a.textContent = existing.textContent.trim();
    } else {
      a.href = '#';
      a.textContent = linkCell.textContent.trim();
    }
    body.append(a);
  }

  card.append(body);
  return card;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const [headRow, ...cardRows] = rows;

  const section = document.createElement('div');
  section.className = 'wrap';

  // Section head
  const head = document.createElement('div');
  head.className = 'section-head';
  const headInner = document.createElement('div');

  if (headRow) {
    const headCells = [...headRow.children];
    const [kickerCell, titleCell] = headCells;
    if (kickerCell) {
      const kicker = document.createElement('div');
      kicker.className = 'kicker';
      kicker.textContent = kickerCell.textContent.trim();
      headInner.append(kicker);
    }
    if (titleCell) {
      const h2 = document.createElement('h2');
      h2.textContent = titleCell.textContent.trim();
      headInner.append(h2);
    }
  }
  head.append(headInner);
  section.append(head);

  // Cards grid
  const grid = document.createElement('div');
  grid.className = 'news-grid';
  cardRows.forEach((row) => {
    grid.append(buildCard([...row.children]));
  });
  section.append(grid);

  block.replaceChildren(section);
}
