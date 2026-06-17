/*
 * Partner wall block
 * Authored content shape (block.children = rows, row.children = cells):
 *   row 0  · eyebrow text            (single cell)
 *   row 1  · section heading         (single cell, ideally an <h2>)
 *   rows 2..n-1 · partner tiles      (single cell, each holds one <a>)
 *   row n  · foot link               (single cell, holds one <a>)
 * The final row is treated as the foot link when it contains a single anchor
 * and at least one partner tile precedes it.
 */

const CHEVRON = '›'; // ›

function makeChevron(className) {
  const chev = document.createElement('span');
  chev.className = className;
  chev.setAttribute('aria-hidden', 'true');
  chev.textContent = CHEVRON;
  return chev;
}

export default async function decorate(block) {
  const rows = [...block.children];

  // Build the constrained content wrapper.
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // --- Section head: eyebrow + heading -------------------------------------
  const head = document.createElement('div');
  head.className = 'partner-wall-head';
  const headLeft = document.createElement('div');
  headLeft.className = 'partner-wall-head-left';

  const eyebrowText = rows[0]?.textContent.trim();
  if (eyebrowText) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'partner-wall-eyebrow is-bracketed';
    eyebrow.textContent = eyebrowText;
    headLeft.append(eyebrow);
  }

  // Reuse an authored heading element if present (server-visible, avoid nesting).
  const titleCell = rows[1];
  let heading = titleCell?.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    heading.classList.add('partner-wall-headline');
  } else if (titleCell && titleCell.textContent.trim()) {
    heading = document.createElement('h2');
    heading.className = 'partner-wall-headline';
    heading.textContent = titleCell.textContent.trim();
  }
  if (heading) headLeft.append(heading);

  head.append(headLeft);
  wrap.append(head);

  // --- Determine partner tiles vs. foot link -------------------------------
  // Everything from row 2 onward holding a single anchor is a candidate.
  const candidates = rows.slice(2);
  let footRow = null;
  if (candidates.length > 1) {
    const last = candidates[candidates.length - 1];
    // Treat the trailing single-anchor row as the foot link.
    if (last.querySelector('a')) {
      footRow = last;
      candidates.pop();
    }
  }

  // --- Partner panel -------------------------------------------------------
  const panel = document.createElement('div');
  panel.className = 'partner-wall-panel';
  panel.setAttribute('role', 'list');

  candidates.forEach((row) => {
    const anchor = row.querySelector('a');
    if (!anchor) return;
    const tile = document.createElement('a');
    tile.className = 'partner-wall-tile';
    tile.href = anchor.getAttribute('href') || '#';
    tile.setAttribute('role', 'listitem');

    const name = document.createElement('span');
    name.className = 'partner-wall-name';
    name.textContent = anchor.textContent.trim();
    tile.setAttribute('aria-label', `${name.textContent} · visit website`);

    tile.append(name, makeChevron('partner-wall-chev'));
    panel.append(tile);
  });

  if (panel.children.length) wrap.append(panel);

  // --- Foot link -----------------------------------------------------------
  if (footRow) {
    const anchor = footRow.querySelector('a');
    const foot = document.createElement('div');
    foot.className = 'partner-wall-foot';
    const link = document.createElement('a');
    link.className = 'partner-wall-link';
    link.href = anchor.getAttribute('href') || '#';
    link.append(document.createTextNode(`${anchor.textContent.trim()} `));
    link.append(makeChevron('partner-wall-link-chev'));
    foot.append(link);
    wrap.append(foot);
  }

  block.replaceChildren(wrap);
}
