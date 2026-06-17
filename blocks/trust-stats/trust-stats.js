/**
 * trust-stats — forest-green full-bleed stat row.
 * Authored as one row per stat: cell1 = number string (e.g. "19,047"),
 * cell2 = label (e.g. "Verified evaluations").
 *
 * Cell-level cascade collector: iterate every cell, and for EACH cell push its
 * child elements if any, ELSE synthesize a node from the cell's own bare text.
 * Stats are then segmented by row, classifying the collected nodes by content
 * (first text-bearing node = number, remaining = label). Numbers are rendered as
 * static text — the prototype's decorative count-up is dropped (and would be
 * honoring prefers-reduced-motion anyway).
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Build the full-bleed inner wrap so the green band bleeds edge-to-edge
  // while the cells stay within --container (proto .spine__row.container).
  const row = document.createElement('div');
  row.className = 'trust-stats-row';

  rows.forEach((rowEl) => {
    // Cell-level cascade collector: gather text-bearing nodes from each cell.
    const collected = [];
    [...rowEl.children].forEach((cell) => {
      const kids = [...cell.children].filter((el) => el.textContent.trim() !== '');
      if (kids.length) {
        kids.forEach((el) => collected.push(el.textContent.trim()));
      } else {
        const text = cell.textContent.trim();
        if (text) collected.push(text);
      }
    });

    if (!collected.length) return;

    // Classify by content/position: first node = number, the rest = label.
    const [num, ...rest] = collected;
    const label = rest.join(' ').trim();

    const cell = document.createElement('div');
    cell.className = 'trust-stats-cell';

    const numEl = document.createElement('div');
    numEl.className = 'trust-stats-num';
    numEl.textContent = num;
    cell.append(numEl);

    if (label) {
      const labEl = document.createElement('div');
      labEl.className = 'trust-stats-lab';
      labEl.textContent = label;
      cell.append(labEl);
    }

    row.append(cell);
  });

  block.textContent = '';
  block.append(row);
}
