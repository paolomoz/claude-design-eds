/**
 * Quick actions block — 5-up grid of quick-action links.
 * Each authored row: [ link cell (the action, an <a> with the bold label) , sublabel cell ].
 * Icons are inline SVGs keyed by row index (copied verbatim from the prototype).
 *
 * @param {Element} block
 */

// Inline SVGs from the prototype's .quick section, in authoring order.
const ICONS = [
  '<svg viewBox="0 0 24 24"><path d="M3 21h18M5 21v-7l5-2 2-5 3 1-1 4 4 2v7"/><circle cx="8" cy="21" r="0.3"/></svg>',
  '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6.6 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4 13.4H3.9a2 2 0 1 1 0-4H4a1.6 1.6 0 0 0 1.5-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 11 4V3.9a2 2 0 1 1 4 0V4a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8z"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.3L3 18v3h3l6.4-6.3a4 4 0 0 0 5.3-5.4l-2.5 2.5-2.1-2.1z"/></svg>',
];

export default async function decorate(block) {
  const rows = [...block.children];

  const grid = document.createElement('div');
  grid.className = 'grid';

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const link = cells[0]?.querySelector('a');
    if (!link) return;

    const label = link.textContent.trim();
    const sublabel = cells[1]?.textContent.trim() || '';

    const a = document.createElement('a');
    a.href = link.getAttribute('href') || '#';

    const ico = document.createElement('span');
    ico.className = 'ico';
    ico.innerHTML = ICONS[i % ICONS.length];

    const txt = document.createElement('span');
    txt.className = 'txt';
    const b = document.createElement('b');
    b.textContent = label;
    const sub = document.createElement('span');
    sub.textContent = sublabel;
    txt.append(b, sub);

    a.append(ico, txt);
    grid.append(a);
  });

  block.replaceChildren(grid);
}
