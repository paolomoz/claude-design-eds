/**
 * New products — 4-up product grid (prototype <section class="section">).
 *
 * Author rows (positional):
 *  - Row 0 (head): [ kicker text | h2 title | "all products" link ]
 *  - Rows 1..n (product): [ image (optional, may be empty) | tag | title | meta ]
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const [headRow, ...productRows] = rows;

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // --- section head -------------------------------------------------------
  const head = document.createElement('div');
  head.className = 'section-head';

  if (headRow) {
    const [kickerCell, titleCell, linkCell] = headRow.children;

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

    const link = linkCell?.querySelector('a');
    if (link) {
      link.classList.add('chev-link');
      const chev = document.createElement('span');
      chev.className = 'chev';
      chev.textContent = '»';
      link.append(' ', chev);
      head.append(link);
    }
  }
  wrap.append(head);

  // --- product grid -------------------------------------------------------
  const grid = document.createElement('div');
  grid.className = 'product-grid';

  productRows.forEach((row) => {
    const [imageCell, tagCell, titleCell, metaCell] = row.children;

    const card = document.createElement('a');
    card.className = 'product-card';
    card.href = imageCell?.querySelector('a')?.href || '#';

    const media = document.createElement('div');
    media.className = 'media';
    const picture = imageCell?.querySelector('picture, img');
    if (picture) {
      media.append(picture);
    } else {
      media.classList.add('media-empty');
    }
    card.append(media);

    const body = document.createElement('div');
    body.className = 'body';

    const tagText = tagCell?.textContent.trim();
    if (tagText) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = tagText;
      body.append(tag);
    }

    const titleText = titleCell?.textContent.trim();
    if (titleText) {
      const h3 = document.createElement('h3');
      h3.textContent = titleText;
      body.append(h3);
    }

    const metaText = metaCell?.textContent.trim();
    if (metaText) {
      const meta = document.createElement('p');
      meta.className = 'meta';
      meta.textContent = metaText;
      body.append(meta);
    }

    const cta = document.createElement('span');
    cta.className = 'cta';
    cta.textContent = 'View product ';
    const chev = document.createElement('span');
    chev.className = 'chev';
    chev.textContent = '»';
    cta.append(chev);
    body.append(cta);

    card.append(body);
    grid.append(card);
  });

  wrap.append(grid);

  block.textContent = '';
  block.append(wrap);
}
