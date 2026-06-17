/*
 * before-after block (role: band)
 * Lifted from stardust prototype section.ba-band (home-A-cinematic.html).
 *
 * Authored shape: each row is one figure cell containing a <picture>/<img> and
 * a caption label. EDS strips <span>/<figcaption> wrappers inside cells, so the
 * corner mono figcaption ('BEFORE' / 'AFTER') is re-created here in JS. The
 * second cell gets the amber-on-ink `.after` treatment.
 */

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  const pair = document.createElement('div');
  pair.className = 'ba-pair';

  rows.forEach((row, i) => {
    const cell = row.firstElementChild || row;
    const img = cell.querySelector('img');
    const picture = cell.querySelector('picture');

    const figure = document.createElement('figure');
    figure.className = i === rows.length - 1 ? 'after' : 'before';

    if (picture) {
      figure.append(picture);
    } else if (img) {
      figure.append(img);
    }

    const caption = document.createElement('figcaption');
    caption.textContent = figure.classList.contains('after') ? 'AFTER' : 'BEFORE';
    figure.append(caption);

    pair.append(figure);
  });

  block.textContent = '';
  block.append(pair);
}
