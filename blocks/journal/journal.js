/**
 * journal — full-bleed tinted cross-link band.
 *
 * Authoring shape (block.children = rows, row.children = cells):
 *   row 0: chapter-head  | cell 0 = running label, cell 1 = folio (e.g. "06 / 06")
 *   row 1: title         | cell 0 = authored heading (h2)
 *   row 2..N: entry      | cell 0 = headline text, cell 1 = link (text = gesture
 *                          label, href = destination). The whole card is the anchor.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // inner content wrap → re-creates the prototype .container (max-width)
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // --- row 0: chapter running-head ---
  const headRow = rows[0];
  if (headRow) {
    const cells = [...headRow.children];
    const head = document.createElement('div');
    head.className = 'chapter-head';

    const running = document.createElement('span');
    running.className = 'running';
    running.textContent = cells[0]?.textContent.trim() || '';

    const folio = document.createElement('span');
    folio.className = 'folio';
    folio.textContent = cells[1]?.textContent.trim() || '';

    head.append(running, folio);
    wrap.append(head);
  }

  // --- row 1: section title (reuse authored heading if present) ---
  const titleRow = rows[1];
  if (titleRow) {
    const cell = titleRow.firstElementChild;
    const heading = cell?.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      wrap.append(heading);
    } else if (cell?.textContent.trim()) {
      const h2 = document.createElement('h2');
      h2.textContent = cell.textContent.trim();
      wrap.append(h2);
    }
  }

  // --- rows 2..N: journal entries (whole-card anchors) ---
  const list = document.createElement('div');
  list.className = 'journal-list';

  rows.slice(2).forEach((row) => {
    const cells = [...row.children];
    const headlineText = cells[0]?.textContent.trim();
    if (!headlineText) return;

    const link = cells[1]?.querySelector('a');
    const entry = document.createElement('a');
    entry.className = 'journal-entry';
    if (link?.href) entry.href = link.getAttribute('href');

    const headline = document.createElement('span');
    headline.className = 'headline';
    headline.textContent = headlineText;

    const gesture = document.createElement('span');
    gesture.className = 'gesture';
    gesture.textContent = (link?.textContent.trim() || cells[1]?.textContent.trim() || '');

    // re-create the trailing arrow stripped from the cell markup
    const arr = document.createElement('span');
    arr.className = 'arr';
    arr.setAttribute('aria-hidden', 'true');
    arr.textContent = '→';
    gesture.append(' ', arr);

    entry.append(headline, gesture);
    list.append(entry);
  });

  if (list.children.length) wrap.append(list);

  block.textContent = '';
  block.append(wrap);
}
