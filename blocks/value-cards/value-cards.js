/**
 * Value Cards Block
 * Centered heading followed by three cards (icon, heading, paragraph).
 * Row 1 holds the section heading; rows 2+ each hold one card.
 */

const ICONS = {
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />',
  clock: '<circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />',
  chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />',
};

/**
 * Builds an inline lucide-style SVG for the given icon key.
 * @param {string} key One of the keys in ICONS
 * @returns {SVGElement|null}
 */
function buildIcon(key) {
  const paths = ICONS[key];
  if (!paths) return null;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = paths;
  return svg;
}

/**
 * Reuses an authored heading from a cell, or wraps its content in one.
 * @param {Element} cell The source cell
 * @param {string} fallbackTag Tag to use when the cell has no heading
 * @returns {Element} A heading element
 */
function toHeading(cell, fallbackTag) {
  const existing = cell.querySelector('h1, h2, h3, h4, h5, h6');
  if (existing) return existing;
  const heading = document.createElement(fallbackTag);
  heading.innerHTML = cell.innerHTML;
  return heading;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const [headingRow, ...cardRows] = [...block.children];

  const center = document.createElement('div');
  center.className = 'center';
  if (headingRow) {
    const cell = headingRow.firstElementChild || headingRow;
    center.append(toHeading(cell, 'h2'));
  }

  const cards = document.createElement('div');
  cards.className = 'cards3';

  cardRows.forEach((row) => {
    const [iconCell, headingCell, paraCell] = [...row.children];
    const card = document.createElement('div');
    card.className = 'vcard';

    const ic = document.createElement('div');
    ic.className = 'ic';
    const icon = iconCell ? buildIcon(iconCell.textContent.trim().toLowerCase()) : null;
    if (icon) ic.append(icon);
    card.append(ic);

    if (headingCell) card.append(toHeading(headingCell, 'h3'));
    if (paraCell && paraCell.textContent.trim()) {
      const para = document.createElement('p');
      para.textContent = paraCell.textContent.trim();
      card.append(para);
    }

    cards.append(card);
  });

  block.replaceChildren(center, cards);
}
