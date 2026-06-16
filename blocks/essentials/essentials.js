/**
 * essentials — "Get your essentials and more": section head + 3-up card grid.
 *
 * Authoring rows (positional):
 *   Row 1 (head):  [ kicker text | <h2> headline ]
 *   Rows 2..N (cards, repeated): [ image cell (optional, may be empty) | title | body | link cell ]
 *     - title → <h3>, body → <p>, link cell holds the <a> ("JFK restaurants →").
 *
 * Each card is image + body (h3 + paragraph + styled text link). Image is OPTIONAL;
 * when absent a --sky-100/navy placeholder block stands in. The link is a plain
 * styled <a> (.ess-link), NOT the button system.
 */

function pic(cell) {
  return cell ? cell.querySelector('picture, img, image-slot') : null;
}

function text(cell) {
  return cell ? cell.textContent.trim() : '';
}

export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // Head row
  const [headRow, ...cardRows] = rows;
  const headCells = [...headRow.children];
  const kicker = text(headCells[0]);
  const h2text = text(headCells[1]);

  const head = document.createElement('div');
  head.className = 'section-head';
  const headInner = document.createElement('div');
  if (kicker) {
    const k = document.createElement('div');
    k.className = 'kicker';
    k.textContent = kicker;
    headInner.append(k);
  }
  if (h2text) {
    const heading = document.createElement('h2');
    heading.textContent = h2text;
    headInner.append(heading);
  }
  head.append(headInner);

  // Card grid
  const grid = document.createElement('div');
  grid.className = 'ess-grid';

  cardRows.forEach((row) => {
    const cells = [...row.children];
    const imgCell = cells[0];
    const title = text(cells[1]);
    const body = text(cells[2]);
    const linkSrc = cells[3]?.querySelector('a');

    const card = document.createElement('div');
    card.className = 'ess-card';

    const image = pic(imgCell);
    if (image) {
      card.append(image);
    } else {
      const ph = document.createElement('span');
      ph.className = 'ess-img-fallback';
      card.append(ph);
    }

    const bodyEl = document.createElement('div');
    bodyEl.className = 'ess-body';
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title;
      bodyEl.append(h3);
    }
    if (body) {
      const p = document.createElement('p');
      p.textContent = body;
      bodyEl.append(p);
    }
    if (linkSrc) {
      const a = document.createElement('a');
      a.className = 'ess-link';
      a.href = linkSrc.getAttribute('href') || '#';
      a.textContent = linkSrc.textContent.trim();
      bodyEl.append(a);
    }
    card.append(bodyEl);

    grid.append(card);
  });

  wrap.append(head, grid);
  block.replaceChildren(wrap);
}
