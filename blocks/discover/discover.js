/**
 * Discover — tinted section with a 6-col discover grid
 * (prototype <section class="section tinted">).
 *
 * Author rows (positional):
 *  - Row 0 (head): [ kicker text | h2 title ]
 *  - Rows 1..n (card): [ feature flag ("feature" or empty)
 *                        | image (optional, may be empty) | title | body ]
 *    feature cards span 3 cols (wider); the rest span 2.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const [headRow, ...cardRows] = rows;

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // --- section head -------------------------------------------------------
  const head = document.createElement('div');
  head.className = 'section-head';

  if (headRow) {
    const [kickerCell, titleCell] = headRow.children;
    const titleGroup = document.createElement('div');

    const kickerText = kickerCell?.textContent.trim();
    if (kickerText) {
      const kicker = document.createElement('span');
      kicker.className = 'kicker';
      kicker.textContent = kickerText;
      titleGroup.append(kicker);
    }
    const titleText = titleCell?.textContent.trim();
    if (titleText) {
      const h2 = document.createElement('h2');
      h2.textContent = titleText;
      titleGroup.append(h2);
    }
    head.append(titleGroup);
  }
  wrap.append(head);

  // --- discover grid ------------------------------------------------------
  const grid = document.createElement('div');
  grid.className = 'discover-grid';

  cardRows.forEach((row) => {
    const [flagCell, imageCell, titleCell, bodyCell] = row.children;

    const card = document.createElement('a');
    card.className = 'discover-card';
    card.href = imageCell?.querySelector('a')?.href || '#';

    const isFeature = flagCell?.textContent.trim().toLowerCase() === 'feature';
    if (isFeature) card.classList.add('feature');

    const picture = imageCell?.querySelector('picture, img');
    if (picture) {
      card.append(picture);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'media-empty';
      card.append(placeholder);
    }

    const body = document.createElement('div');
    body.className = 'body';

    const titleText = titleCell?.textContent.trim();
    if (titleText) {
      const h3 = document.createElement('h3');
      h3.textContent = titleText;
      body.append(h3);
    }

    const bodyText = bodyCell?.textContent.trim();
    if (bodyText) {
      const p = document.createElement('p');
      p.textContent = bodyText;
      body.append(p);
    }

    const more = document.createElement('span');
    more.className = 'chev-link';
    more.textContent = 'Read more ';
    const chev = document.createElement('span');
    chev.className = 'chev';
    chev.textContent = '»';
    more.append(chev);
    body.append(more);

    card.append(body);
    grid.append(card);
  });

  wrap.append(grid);

  block.textContent = '';
  block.append(wrap);
}
