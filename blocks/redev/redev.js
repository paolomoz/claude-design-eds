/*
 * redev block — JFK redevelopment band.
 * Author shape (one cell per row, stacked):
 *   kicker | headline | paragraph | cta1 (plain <a>) | cta2 (plain <a>) | image (optional, empty)
 */

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children].map((row) => row.firstElementChild);
  const [kickerCell, headlineCell, paraCell, cta1Cell, cta2Cell, imageCell] = rows;

  // Rebuild prototype DOM: .wrap > [copy, media]
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const copy = document.createElement('div');

  if (kickerCell) {
    const kicker = document.createElement('div');
    kicker.className = 'kicker';
    kicker.textContent = kickerCell.textContent.trim();
    copy.append(kicker);
  }

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
  const variants = ['btn--accent', 'btn--onblue'];
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

  const media = document.createElement('div');
  media.className = 'redev-media';
  const img = imageCell && imageCell.querySelector('img, picture, image-slot');
  if (img) {
    media.append(img);
  } else {
    media.classList.add('is-placeholder');
  }

  wrap.append(copy, media);
  block.replaceChildren(wrap);
}
