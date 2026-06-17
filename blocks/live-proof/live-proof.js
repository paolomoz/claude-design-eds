/*
 * Live Proof Block
 * Stat-grid proof section: a proof head (section title with a leading live pulse
 * dot + a chevron text-link) over a 4-column grid of top-rule stat cards.
 *
 * Authored content shape (block.children = rows, row.children = cells):
 *   Row 0 — proof head: [ title cell (contains an <h2>) , link cell (a single <a>) ]
 *   Rows 1..N — stats:   [ number cell (e.g. "135+") , caption cell ]
 *
 * Final numbers render visible (no countup). prefers-reduced-motion is honored
 * in CSS (pulse animation disabled).
 */

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Wrapper that re-creates the prototype's centered max-width content column.
  const wrap = document.createElement('div');
  wrap.className = 'live-proof-wrap';

  // ── Row 0: proof head (title + chevron link) ──────────────────────────────
  const headRow = rows[0];
  if (headRow) {
    const cells = [...headRow.children];
    const head = document.createElement('div');
    head.className = 'proof-head';

    // Title cell — reuse the authored heading element (server-visible) if present.
    const titleCell = cells[0];
    if (titleCell) {
      let heading = titleCell.querySelector('h1, h2, h3, h4, h5, h6');
      if (!heading) {
        heading = document.createElement('h2');
        heading.textContent = titleCell.textContent.trim();
      }
      // Re-create the leading pulse dot in JS (EDS strips <span> in cells).
      const pulse = document.createElement('span');
      pulse.className = 'pulse';
      pulse.setAttribute('aria-hidden', 'true');
      heading.prepend(pulse);
      head.append(heading);
    }

    // Link cell — plain styled text link (NOT a button); clone the cell anchor.
    const linkCell = cells[1];
    const anchor = linkCell && linkCell.querySelector('a');
    if (anchor) {
      const link = anchor.cloneNode(true);
      link.classList.add('chevlink');
      // Re-create the chevron glyph in JS (cells strip <span>).
      const chev = document.createElement('span');
      chev.className = 'chev';
      chev.setAttribute('aria-hidden', 'true');
      chev.textContent = '›';
      link.append(' ', chev);
      head.append(link);
    }

    wrap.append(head);
  }

  // ── Rows 1..N: stat cards ─────────────────────────────────────────────────
  const grid = document.createElement('div');
  grid.className = 'stat-grid';

  rows.slice(1).forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;

    const stat = document.createElement('div');
    stat.className = 'stat';

    const num = document.createElement('div');
    num.className = 'num';
    num.textContent = (cells[0]?.textContent || '').trim();
    stat.append(num);

    const capText = (cells[1]?.textContent || '').trim();
    if (capText) {
      const cap = document.createElement('p');
      cap.className = 'cap';
      cap.textContent = capText;
      stat.append(cap);
    }

    grid.append(stat);
  });

  if (grid.children.length) wrap.append(grid);

  block.textContent = '';
  block.append(wrap);
}
