/**
 * loads and decorates the brand-band block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Read rows positionally.
  const years = rows[0]?.textContent.trim() || '';
  const headline = rows[1]?.textContent.trim() || '';
  const paragraph = rows[2]?.textContent.trim() || '';
  const movieCell = rows[3];
  const movieLink = movieCell?.querySelector('a');
  const imageCell = rows[4];
  const picture = imageCell?.querySelector('picture, img');

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // Left column — text content.
  const left = document.createElement('div');

  if (years) {
    const span = document.createElement('span');
    span.className = 'years';
    span.textContent = years;
    left.append(span);
  }

  if (headline) {
    const h2 = document.createElement('h2');
    h2.textContent = headline;
    left.append(h2);
  }

  if (paragraph) {
    const p = document.createElement('p');
    p.textContent = paragraph;
    left.append(p);
  }

  if (movieLink) {
    movieLink.classList.add('chev-link', 'on-dark');
    const chev = document.createElement('span');
    chev.className = 'chev';
    chev.textContent = '»';
    movieLink.append(' ', chev);
    left.append(movieLink);
  }

  // Right column — optional image, dark placeholder fallback otherwise.
  const right = document.createElement('div');
  if (picture) {
    right.append(picture);
  } else {
    const slot = document.createElement('div');
    slot.className = 'image-slot';
    right.append(slot);
  }

  wrap.append(left, right);

  block.textContent = '';
  block.append(wrap);
}
