/**
 * feature-cards — Evergreen Bank 4-up feature card grid.
 *
 * Lifted from the prototype's first `.eb-container` grid after the hero.
 * Four `.eb-card`s in a row; the first two get a tinted (--eb-green-50)
 * background, the rest stay white. Each card has an inline SVG icon, an
 * h3 title, a body paragraph, and an `.eb-link` text link with a trailing
 * arrow (NOT a button).
 *
 * Authoring rows — one per card:
 *   <bg: tinted|white> | <title> | <body> | <link text>
 * The icon is chosen by card position (coin, card, home, chart). Tinted is
 * the default for the first two cards; "white" forces the plain background.
 */

const ICONS = [
  '<g><circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M9.5 10c0-1 1-1.7 2.5-1.7s2.5.7 2.5 1.7-1 1.5-2.5 1.7-2.5.7-2.5 1.7 1 1.7 2.5 1.7 2.5-.7 2.5-1.7"/></g>',
  '<g><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M6.5 15h4"/></g>',
  '<g><path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/></g>',
  '<g><path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 15l3.5-4 3 2.5L19 7"/></g>',
];

const ARROW = '<svg class="feature-cards-arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

function cardIcon(i) {
  return `<svg class="feature-cards-icon" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[i % ICONS.length]}</svg>`;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  const grid = document.createElement('div');
  grid.className = 'feature-cards-grid';

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const bg = (cells[0]?.textContent || '').trim().toLowerCase();
    const title = cells[1]?.textContent.trim() || '';
    const body = cells[2]?.textContent.trim() || '';
    const linkText = cells[3]?.textContent.trim() || '';

    const card = document.createElement('div');
    card.className = 'eb-card feature-cards-card';
    if (bg === 'tinted') card.classList.add('feature-cards-card-tinted');

    card.innerHTML = `
      ${cardIcon(i)}
      <h3 class="feature-cards-title">${title}</h3>
      <p class="feature-cards-body">${body}</p>`;

    if (linkText) {
      const link = document.createElement('a');
      link.href = '#';
      link.className = 'eb-link feature-cards-link';
      link.innerHTML = `${linkText} ${ARROW}`;
      card.append(link);
    }

    grid.append(card);
  });

  block.replaceChildren(grid);
}
