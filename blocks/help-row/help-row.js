/**
 * help-row — Evergreen Bank "How can we help?" quick-links row.
 *
 * An h3 heading + a flex row of 3 items, each a circular --eb-green-50 icon
 * badge (inline SVG) + an .eb-link label.
 *
 * Authoring rows (first row = heading, remaining rows = one item each):
 *   head | <heading>
 *   <icon-name: pin|calendar|chat> | <label>
 */

const ICONS = {
  pin: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  chat: '<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4z"/>',
};

function badge(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" class="help-row-icon" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.chat}</svg>`;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const items = [];
  let heading = 'How can we help?';

  rows.forEach((row) => {
    const cells = [...row.children].map((c) => c.textContent.trim());
    if ((cells[0] || '').toLowerCase() === 'head') {
      heading = cells[1] || heading;
    } else if (cells.some(Boolean)) {
      items.push({ icon: (cells[0] || 'chat').toLowerCase(), label: cells[1] || '' });
    }
  });

  block.textContent = '';

  const wrap = document.createElement('div');
  wrap.className = 'eb-container';

  const h = document.createElement('h3');
  h.textContent = heading;

  const list = document.createElement('div');
  list.className = 'help-row-list';

  items.forEach((item) => {
    const link = document.createElement('a');
    link.href = '#';
    link.className = 'help-row-item';
    link.innerHTML = `
      <span class="help-row-badge">${badge(item.icon)}</span>
      <span class="eb-link">${item.label}</span>`;
    list.append(link);
  });

  wrap.append(h, list);
  block.append(wrap);
}
