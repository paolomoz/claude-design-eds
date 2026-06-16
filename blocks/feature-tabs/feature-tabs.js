/**
 * Feature Tabs Block
 * Interactive tab switcher. Row 1 holds the section intro
 * (eyebrow, heading, sub paragraph); each following row is one tab/panel.
 */

/**
 * Promotes a cell's heading to a real heading element so it stays server-visible.
 * If the cell already contains an h1-h6, it is reused as-is.
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
  const rows = [...block.children];
  const [introRow, ...tabRows] = rows;

  // Intro
  const center = document.createElement('div');
  center.className = 'center';
  if (introRow) {
    const cells = [...introRow.children];
    const [eyebrowCell, headingCell, subCell] = cells;
    if (eyebrowCell && eyebrowCell.textContent.trim()) {
      const eyebrow = document.createElement('p');
      eyebrow.className = 'eyebrow';
      eyebrow.textContent = eyebrowCell.textContent.trim();
      center.append(eyebrow);
    }
    if (headingCell) center.append(toHeading(headingCell, 'h2'));
    if (subCell && subCell.textContent.trim()) {
      const sub = document.createElement('p');
      sub.className = 'sub';
      sub.textContent = subCell.textContent.trim();
      center.append(sub);
    }
  }

  const tablist = document.createElement('div');
  tablist.className = 'switch-tabs';
  tablist.setAttribute('role', 'tablist');

  const panels = document.createElement('div');
  panels.className = 'panels';

  tabRows.forEach((row, i) => {
    const [labelCell, eyebrowCell, headingCell, paraCell, imgCell] = [...row.children];
    const active = i === 0;
    const id = `feature-tab-${i}`;
    const panelId = `feature-panel-${i}`;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tab';
    tab.id = id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
    tab.setAttribute('aria-controls', panelId);
    tab.textContent = labelCell ? labelCell.textContent.trim() : `Tab ${i + 1}`;
    tablist.append(tab);

    const panel = document.createElement('div');
    panel.className = active ? 'panel on' : 'panel';
    panel.id = panelId;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', id);

    const text = document.createElement('div');
    if (eyebrowCell && eyebrowCell.textContent.trim()) {
      const eyebrow = document.createElement('p');
      eyebrow.className = 'eyebrow';
      eyebrow.textContent = eyebrowCell.textContent.trim();
      text.append(eyebrow);
    }
    if (headingCell) text.append(toHeading(headingCell, 'h3'));
    if (paraCell && paraCell.textContent.trim()) {
      const para = document.createElement('p');
      para.textContent = paraCell.textContent.trim();
      text.append(para);
    }
    panel.append(text);

    const picture = imgCell ? imgCell.querySelector('picture') : null;
    if (picture) {
      panel.append(picture);
    } else if (imgCell) {
      const img = imgCell.querySelector('img');
      if (img) panel.append(img);
    }

    panels.append(panel);
  });

  const tabButtons = [...tablist.children];
  const panelEls = [...panels.children];

  tablist.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    const idx = tabButtons.indexOf(tab);
    if (idx < 0) return;
    tabButtons.forEach((t, i) => t.setAttribute('aria-selected', i === idx ? 'true' : 'false'));
    panelEls.forEach((p, i) => p.classList.toggle('on', i === idx));
  });

  block.replaceChildren(center, tablist, panels);
}
