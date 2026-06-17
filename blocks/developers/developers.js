/**
 * developers block — section role.
 *
 * Expected authored rows (block.children), each row.children = cells:
 *   0: chapter-head   — cell0 running label ("For developers"), cell1 folio ("05 / 06")
 *   1: title          — cell holds the section <h2>
 *   2: lede           — cell holds the lede paragraph
 *   3: plate-head     — cell0 mono label, cell1 the "View docs" link
 *   4..n: dev-col     — cell0 <h3> title, cell1 paragraph
 *
 * Authors may omit cells; handle gracefully. EDS strips <span> in cells, so the
 * running/folio/mono spans are re-created in JS.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  const text = (el) => (el ? el.textContent.trim() : '');

  // build the max-width content wrap
  const inner = document.createElement('div');
  inner.className = 'developers-inner';

  // ---- row 0: chapter-head ----
  const headRow = rows[0];
  if (headRow) {
    const cells = [...headRow.children];
    const head = document.createElement('div');
    head.className = 'chapter-head';

    const running = document.createElement('span');
    running.className = 'running';
    running.textContent = text(cells[0]);
    head.append(running);

    const folio = document.createElement('span');
    folio.className = 'folio';
    folio.textContent = text(cells[1]);
    head.append(folio);

    inner.append(head);
  }

  // ---- row 1: title (reuse authored heading if present) ----
  const titleRow = rows[1];
  if (titleRow) {
    const cell = titleRow.firstElementChild;
    const authored = cell && cell.querySelector('h1, h2, h3, h4, h5, h6');
    if (authored) {
      inner.append(authored);
    } else if (text(cell)) {
      const h2 = document.createElement('h2');
      h2.textContent = text(cell);
      inner.append(h2);
    }
  }

  // ---- row 2: lede ----
  const ledeRow = rows[2];
  if (ledeRow && text(ledeRow.firstElementChild)) {
    const lede = document.createElement('p');
    lede.className = 'chapter-lede';
    lede.textContent = text(ledeRow.firstElementChild);
    inner.append(lede);
  }

  // ---- the bordered plate ----
  const plate = document.createElement('div');
  plate.className = 'dev-plate';

  // plate-head bar (row 3)
  const plateHeadRow = rows[3];
  if (plateHeadRow) {
    const cells = [...plateHeadRow.children];
    const plateHead = document.createElement('div');
    plateHead.className = 'plate-head';

    const mono = document.createElement('span');
    mono.className = 'mono';
    mono.textContent = text(cells[0]);
    plateHead.append(mono);

    // clone the docs link as a gesture link (not a button)
    const link = cells[1] && cells[1].querySelector('a');
    if (link) {
      const gesture = link.cloneNode(true);
      gesture.classList.add('gesture');
      const arr = document.createElement('span');
      arr.className = 'arr';
      arr.textContent = '→';
      gesture.append(' ', arr);
      plateHead.append(gesture);
    }

    plate.append(plateHead);
  }

  // dev-cols grid (rows 4..n)
  const colRows = rows.slice(4);
  if (colRows.length) {
    const cols = document.createElement('div');
    cols.className = 'dev-cols';

    colRows.forEach((row) => {
      const cells = [...row.children];
      const col = document.createElement('div');
      col.className = 'dev-col';

      const titleCell = cells[0];
      const authored = titleCell && titleCell.querySelector('h1, h2, h3, h4, h5, h6');
      if (authored) {
        col.append(authored);
      } else if (text(titleCell)) {
        const h3 = document.createElement('h3');
        h3.textContent = text(titleCell);
        col.append(h3);
      }

      if (text(cells[1])) {
        const p = document.createElement('p');
        p.textContent = text(cells[1]);
        col.append(p);
      }

      cols.append(col);
    });

    plate.append(cols);
  }

  inner.append(plate);

  block.textContent = '';
  block.append(inner);
}
