/*
 * Ways 3-up — audience-routing photo cards.
 *
 * Each authored row is one card. Cells (in order):
 *   1. image  — the card photo (picture/img). May be empty (CSS fallback).
 *   2. title  — text label, may wrap an <a> that becomes the whole-card link.
 *
 * The WHOLE tile is the click target, so each card renders as a plain <a>
 * (NOT the button convention). The per-card decorative icon and the
 * "EXPLORE →" affordance are generated here.
 */

// Decorative icons (fill #fff for the dark scrim), one per card by index.
const ICONS = [
  '<svg class="way-icon" viewBox="0 0 208.67 184.5" aria-hidden="true" focusable="false"><path fill="#fff" d="M104.64,181.17a4.49,4.49,0,0,1-3.19-1.32L21,99.38a56.3,56.3,0,0,1,79.63-79.62l4,4,4.52-4.51a56,56,0,0,1,79.15.51l0,0,.43.43a56,56,0,0,1-.51,79.16l-80.45,80.44A4.48,4.48,0,0,1,104.64,181.17ZM60.8,12.27A47.3,47.3,0,0,0,27.36,93l77.28,77.28L181.93,93a47,47,0,0,0,.45-66.44l-.43-.44-.1-.09a47,47,0,0,0-66.37-.38l-7.66,7.66a4.53,4.53,0,0,1-3.18,1.32h0a4.53,4.53,0,0,1-3.18-1.32l-7.2-7.21A47,47,0,0,0,60.8,12.27Z"/></svg>',
  '<svg class="way-icon" viewBox="0 0 191.61 204.08" aria-hidden="true" focusable="false"><path fill="#fff" d="M28.64,200.48a4.51,4.51,0,0,1-4.5-4.5v-80.8H8.32a4.5,4.5,0,0,1-3.42-7.42L93,4.8a4.49,4.49,0,0,1,6.84,0l88.07,103a4.5,4.5,0,0,1-3.41,7.43H168.64V196a4.51,4.51,0,0,1-4.5,4.5Zm-10.55-94.3H28.64a4.5,4.5,0,0,1,4.5,4.5v80.8h126.5v-80.8a4.49,4.49,0,0,1,4.5-4.5h10.55L96.39,14.65Z"/></svg>',
  '<svg class="way-icon" viewBox="0 0 202.11 204.08" aria-hidden="true" focusable="false"><path fill="#fff" d="M194.21,199.56H7.21a4.49,4.49,0,0,1-4.5-4.5V171.69c0-14.23,10.64-27.39,29.95-37.05,18.33-9.16,42.49-14.2,68.05-14.2s49.72,5,68.05,14.2c19.31,9.66,30,22.82,30,37.05v23.37A4.5,4.5,0,0,1,194.21,199.56Zm-182.5-9h178V171.69c0-22.9-40.76-42.25-89-42.25s-89,19.35-89,42.25Zm89-84.5A51.31,51.31,0,0,1,49.45,54.82h0A51.26,51.26,0,0,1,100.7,3.56h0a51.25,51.25,0,0,1,0,102.5ZM58.45,54.82a42.26,42.26,0,1,0,42.26-42.26h0A42.31,42.31,0,0,0,58.45,54.82Z"/></svg>',
];

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const grid = document.createElement('div');
  grid.className = 'ways-grid';

  [...block.children].forEach((row, i) => {
    const cells = [...row.children];
    const imageCell = cells[0];
    const titleCell = cells[1];

    // Whole-card anchor — the entire tile is the click target.
    const card = document.createElement('a');
    card.className = 'way-card';

    // Resolve the link: prefer an authored <a> in the title cell.
    const anchor = titleCell?.querySelector('a');
    if (anchor) card.href = anchor.getAttribute('href') || '#';

    // Photo: clone the authored image, else render a CSS fallback.
    const img = imageCell?.querySelector('img');
    if (img) {
      const photo = img.cloneNode(true);
      photo.className = 'way-photo';
      photo.removeAttribute('width');
      photo.removeAttribute('height');
      if (!photo.getAttribute('alt')) photo.setAttribute('alt', '');
      photo.loading = 'lazy';
      card.append(photo);
    } else {
      const fallback = document.createElement('span');
      fallback.className = 'way-photo-fallback';
      fallback.setAttribute('aria-hidden', 'true');
      card.append(fallback);
    }

    const scrim = document.createElement('span');
    scrim.className = 'way-scrim';
    scrim.setAttribute('aria-hidden', 'true');
    card.append(scrim);

    const label = document.createElement('span');
    label.className = 'way-label';

    // Decorative per-card icon (EDS strips <span>/<svg> styling from cells,
    // so re-create it here).
    const iconWrap = document.createElement('span');
    iconWrap.innerHTML = ICONS[i % ICONS.length];
    const icon = iconWrap.firstElementChild;
    if (icon) label.append(icon);

    const title = document.createElement('span');
    title.className = 'way-title';
    title.textContent = (anchor?.textContent || titleCell?.textContent || '').trim();
    label.append(title);

    const arrow = document.createElement('span');
    arrow.className = 'way-arrow';
    arrow.textContent = 'EXPLORE →';
    label.append(arrow);

    card.append(label);
    grid.append(card);
  });

  block.textContent = '';

  const wrap = document.createElement('div');
  wrap.className = 'ways-wrap';
  wrap.append(grid);
  block.append(wrap);
}
