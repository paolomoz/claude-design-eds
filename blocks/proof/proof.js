/*
 * Proof band block — dark trust/impact band for The Road Home.
 * Lifted from stardust prototype home-C-cinematic.html (.proof section).
 *
 * Authoring shape (rows -> cells):
 *   Row 0:  [ heading ] [ intro paragraph ]          -> proof-head
 *   Row 1+: [ stat number ] [ stat description ]     -> one .stat each
 *
 * Brand imagery (trust marks + per-stat impact icons) is fixed and rendered
 * here rather than authored — the prototype hard-codes these assets.
 */

const IMG_BASE = '/img/theroadhome';

// Fixed trust marks shown in the head.
const MARKS = [
  {
    src: `${IMG_BASE}/charity-navigator.png`,
    alt: 'Charity Navigator Four-Star Charity rating',
    className: '',
  },
  {
    src: `${IMG_BASE}/trh-100-year-logo.png`,
    alt: 'The Road Home 100 Year anniversary mark',
    className: 'centennial',
  },
];

// Per-stat impact icons, in authoring order.
const STAT_ICONS = [
  `${IMG_BASE}/impact-1.svg`,
  `${IMG_BASE}/impact-2.svg`,
  `${IMG_BASE}/impact-3.svg`,
];

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // On-dark surface: lets the global on-dark button/secondary rules apply.
  block.classList.add('dark');

  const rows = [...block.children];
  const [headRow, ...statRows] = rows;

  // Centered max-width wrap (full-bleed background, wrapped content).
  const inner = document.createElement('div');
  inner.className = 'proof-inner';

  // ---- Head: title + intro on the left, trust marks on the right ----
  const head = document.createElement('div');
  head.className = 'proof-head';

  const headText = document.createElement('div');
  if (headRow) {
    const [titleCell, introCell] = headRow.children;

    // Reuse an authored heading if present; otherwise promote the title text.
    if (titleCell) {
      const heading = titleCell.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        headText.append(heading);
      } else if (titleCell.textContent.trim()) {
        const h2 = document.createElement('h2');
        h2.textContent = titleCell.textContent.trim();
        headText.append(h2);
      }
    }

    if (introCell && introCell.textContent.trim()) {
      const p = introCell.querySelector('p') || document.createElement('p');
      if (!p.textContent.trim()) p.textContent = introCell.textContent.trim();
      headText.append(p);
    }
  }
  head.append(headText);

  const marks = document.createElement('div');
  marks.className = 'proof-marks';
  MARKS.forEach(({ src, alt, className }) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.loading = 'lazy';
    if (className) img.className = className;
    marks.append(img);
  });
  head.append(marks);
  inner.append(head);

  // ---- Stats grid ----
  const stats = document.createElement('div');
  stats.className = 'stats';

  statRows.forEach((row, i) => {
    const [numberCell, descCell] = row.children;
    const stat = document.createElement('div');
    stat.className = 'stat';

    const iconSrc = STAT_ICONS[i];
    if (iconSrc) {
      const icon = document.createElement('img');
      icon.src = iconSrc;
      icon.alt = '';
      icon.loading = 'lazy';
      stat.append(icon);
    }

    if (numberCell && numberCell.textContent.trim()) {
      const number = document.createElement('span');
      number.className = 'stat-number';
      number.textContent = numberCell.textContent.trim();
      stat.append(number);
    }

    if (descCell && descCell.textContent.trim()) {
      const p = descCell.querySelector('p') || document.createElement('p');
      if (!p.textContent.trim()) p.textContent = descCell.textContent.trim();
      stat.append(p);
    }

    stats.append(stat);
  });
  inner.append(stats);

  block.textContent = '';
  block.append(inner);
}
