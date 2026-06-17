/**
 * AI band — full-bleed dark rounded plate with a cover background image,
 * a heading and a single CTA. Lifted from the home-C-cinematic prototype.
 *
 * Expected authored rows (block.children):
 *   row 0 — cell: background image (decorative, empty alt)
 *   row 1 — cell: heading (reuse the authored element if present)
 *   row 2 — cell: CTA authored as <em><strong><a> -> .btn-accent
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Mark the block dark so the on-dark button override applies (#41).
  block.classList.add('dark');

  // Content wrap (recreate the prototype's max-width wrap).
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // Dark rounded plate.
  const plate = document.createElement('div');
  plate.className = 'plate';

  // Row 0 — decorative cover background image.
  const imgCell = rows[0];
  const img = imgCell?.querySelector('img');
  if (img) {
    const cover = img.cloneNode(true);
    cover.setAttribute('alt', '');
    cover.setAttribute('role', 'presentation');
    cover.loading = 'lazy';
    plate.append(cover);
  }

  // Inner pad holding the heading and CTA.
  const pad = document.createElement('div');
  pad.className = 'pad';

  // Row 1 — heading. Reuse the authored heading element if present.
  const titleCell = rows[1];
  const heading = titleCell?.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    pad.append(heading);
  } else if (titleCell && titleCell.textContent.trim()) {
    const h2 = document.createElement('h2');
    h2.textContent = titleCell.textContent.trim();
    pad.append(h2);
  }

  // Row 2 — CTA. Clone the authored anchor as-is (do not manufacture it);
  // the link decorator applies .btn.btn-accent from the <em><strong><a> wrap.
  const ctaCell = rows[2];
  if (ctaCell && ctaCell.querySelector('a')) {
    const actions = document.createElement('div');
    actions.className = 'actions';
    [...ctaCell.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
    pad.append(actions);
  }

  plate.append(pad);
  wrap.append(plate);

  block.textContent = '';
  block.append(wrap);
}
