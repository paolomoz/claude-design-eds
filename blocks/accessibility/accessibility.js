/*
 * accessibility block — JFK accessibility band (.access-band inside section.block).
 * Author shape (one cell per row, stacked):
 *   headline | paragraph | cta1 (plain <a>) | cta2 (plain <a>) | image (optional, empty)
 */

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children].map((row) => row.firstElementChild);
  const [headlineCell, paraCell, cta1Cell, cta2Cell, imageCell] = rows;

  // Rebuild prototype DOM: .wrap > .access-band > [.access-copy, media]
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const band = document.createElement('div');
  band.className = 'access-band';

  const copy = document.createElement('div');
  copy.className = 'access-copy';

  if (headlineCell) {
    const h2 = document.createElement('h2');
    h2.textContent = headlineCell.textContent.trim();
    copy.append(h2);
  }

  if (paraCell) {
    const p = document.createElement('p');
    p.textContent = paraCell.textContent.trim();
    copy.append(p);
  }

  // CTAs: clone authored plain <a> and apply the prototype variant class.
  const variants = ['btn--primary', 'btn--ghost'];
  const ctaRow = document.createElement('div');
  ctaRow.className = 'cta-row';
  [cta1Cell, cta2Cell].forEach((cell, i) => {
    const link = cell && cell.querySelector('a');
    if (!link) return;
    const cta = link.cloneNode(true);
    cta.classList.add('btn', variants[i]);
    ctaRow.append(cta);
  });
  if (ctaRow.children.length) copy.append(ctaRow);

  band.append(copy);

  const media = document.createElement('div');
  media.className = 'access-media';
  const img = imageCell && imageCell.querySelector('img, picture, image-slot');
  if (img) {
    media.append(img);
  } else {
    media.classList.add('is-placeholder');
  }
  band.append(media);

  wrap.append(band);
  block.replaceChildren(wrap);
}
