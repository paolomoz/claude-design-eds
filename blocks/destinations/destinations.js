/**
 * loads and decorates the destinations block
 * @param {Element} block The block element
 *
 * Author shape:
 *   head row: [ h2 | "All destinations →" link ]
 *   then one row per destination: [ image(optional,empty) | city | from-price | country | blurb ]
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const [headRow, ...destRows] = rows;

  // ----- Section head -----
  const head = document.createElement('div');
  head.className = 'md-section-head';
  const headCells = headRow ? [...headRow.children] : [];

  const heading = headCells[0]?.querySelector('h1, h2, h3, h4, h5, h6')
    || (() => { const h = document.createElement('h2'); h.textContent = headCells[0]?.textContent.trim() || ''; return h; })();
  // normalize to h2
  if (heading.tagName !== 'H2') {
    const h2 = document.createElement('h2');
    h2.append(...heading.childNodes);
    heading.replaceWith(h2);
    head.append(h2);
  } else {
    head.append(heading);
  }

  const link = headCells[1]?.querySelector('a');
  if (link) {
    link.classList.add('md-text-link');
    head.append(link);
  }

  // ----- Destination grid -----
  const grid = document.createElement('div');
  grid.className = 'md-dest-grid';

  destRows.forEach((row) => {
    const cells = [...row.children];
    const [imgCell, cityCell, priceCell, countryCell, blurbCell] = cells;

    const card = document.createElement('article');
    card.className = 'md-dest-card';

    // Image (optional). Fall back to tinted placeholder if empty.
    const imgWrap = document.createElement('div');
    imgWrap.className = 'md-dest-img';
    const picture = imgCell?.querySelector('picture, img');
    if (picture) {
      imgWrap.append(picture.closest('picture') || picture);
    } else {
      imgWrap.classList.add('md-dest-img-empty');
    }
    card.append(imgWrap);

    const body = document.createElement('div');
    body.className = 'md-dest-body';

    const toprow = document.createElement('div');
    toprow.className = 'md-dest-toprow';
    const h3 = document.createElement('h3');
    h3.textContent = cityCell?.textContent.trim() || '';
    const price = document.createElement('span');
    price.className = 'md-dest-price';
    price.textContent = priceCell?.textContent.trim() || '';
    toprow.append(h3, price);

    const country = document.createElement('p');
    country.className = 'md-dest-country';
    country.textContent = countryCell?.textContent.trim() || '';

    const blurb = document.createElement('p');
    blurb.className = 'md-dest-blurb';
    blurb.textContent = blurbCell?.textContent.trim() || '';

    body.append(toprow, country, blurb);
    card.append(body);
    grid.append(card);
  });

  block.textContent = '';
  block.classList.add('md-section');
  block.append(head, grid);
}
