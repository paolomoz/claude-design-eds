/**
 * customers-index — "At every scale" customer proof section.
 *
 * Authoring shape (each row = one record, cells left→right):
 *   running text | folio            → chapter-head
 *   title (heading element)         → h2  (single cell, reuse authored heading)
 *   lede                            → chapter-lede
 *   name | claim | gesture link     → a .case-row  (4 of these)
 *   tag  | paragraph                → .track       (2 of these)
 *
 * Rows are classified by cell count and content: a 2-cell row whose first cell
 * has no link and whose value is short is a chapter-head (running/folio) when it
 * is the first such row; a 3-cell row whose last cell holds a link is a case
 * row; remaining 2-cell rows are tracks. To keep the contract unambiguous the
 * first three rows are positional (head, title, lede) and the rest are detected.
 */

const ARROW = '→'; // → recreated in JS (#39); EDS strips authored <span>

function textCell(cell) {
  return (cell?.textContent || '').trim();
}

export default async function decorate(block) {
  const rows = [...block.children];

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // --- Row 0: chapter head (running | folio) ---
  const headRow = rows[0];
  if (headRow) {
    const cells = [...headRow.children];
    const head = document.createElement('div');
    head.className = 'chapter-head';
    const running = document.createElement('span');
    running.className = 'running';
    running.textContent = textCell(cells[0]);
    const folio = document.createElement('span');
    folio.className = 'folio';
    folio.textContent = textCell(cells[1]);
    head.append(running, folio);
    wrap.append(head);
  }

  // --- Row 1: title — reuse the authored heading element if present ---
  const titleRow = rows[1];
  if (titleRow) {
    const cell = titleRow.firstElementChild;
    const authored = cell?.querySelector('h1, h2, h3, h4, h5, h6');
    if (authored) {
      authored.remove();
      wrap.append(authored);
    } else {
      const h2 = document.createElement('h2');
      h2.textContent = textCell(cell);
      wrap.append(h2);
    }
  }

  // --- Row 2: lede ---
  const ledeRow = rows[2];
  if (ledeRow) {
    const lede = document.createElement('p');
    lede.className = 'chapter-lede';
    lede.textContent = textCell(ledeRow.firstElementChild);
    wrap.append(lede);
  }

  // --- Remaining rows: case rows (3 cells, link in last) and tracks (2 cells) ---
  const caseRows = [];
  const trackRows = [];
  rows.slice(3).forEach((row) => {
    const cells = [...row.children];
    const link = row.querySelector('a');
    if (link && cells.length >= 3) {
      caseRows.push(cells);
    } else if (cells.length >= 2) {
      trackRows.push(cells);
    }
  });

  if (caseRows.length) {
    const index = document.createElement('div');
    index.className = 'case-index';
    caseRows.forEach((cells) => {
      const link = cells[2].querySelector('a');
      const anchor = document.createElement('a');
      anchor.className = 'case-row';
      anchor.href = link ? link.getAttribute('href') : '#';

      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = textCell(cells[0]);

      const claim = document.createElement('span');
      claim.className = 'claim';
      claim.textContent = textCell(cells[1]);

      // gesture text-link styling re-created here (#39) — strip the cloned
      // anchor's own attributes so the whole .case-row stays the click target.
      const gesture = document.createElement('span');
      gesture.className = 'gesture';
      const label = (link ? link.textContent : textCell(cells[2])).trim();
      gesture.append(document.createTextNode(`${label} `));
      const arr = document.createElement('span');
      arr.className = 'arr';
      arr.textContent = ARROW;
      gesture.append(arr);

      anchor.append(name, claim, gesture);
      index.append(anchor);
    });
    wrap.append(index);
  }

  if (trackRows.length) {
    const tracks = document.createElement('div');
    tracks.className = 'tracks';
    trackRows.forEach((cells) => {
      const track = document.createElement('div');
      track.className = 'track';
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = textCell(cells[0]);
      const p = document.createElement('p');
      p.textContent = textCell(cells[1]);
      track.append(tag, p);
      tracks.append(track);
    });
    wrap.append(tracks);
  }

  block.textContent = '';
  block.append(wrap);
}
