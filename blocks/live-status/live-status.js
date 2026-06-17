/**
 * live-status block (role: band)
 * Thin tinted live-systems band. Builds a single flex row with:
 *  - a LIVE chrome cell (pulse dot + mono label)
 *  - a main cell (mono caption over a big mono value)
 *  - companion stats (two mono numbers each with a small caption)
 *
 * Expected authored structure (block.children = rows, row.children = cells):
 *  row 0: [LIVE label] [caption] [value]
 *  row 1 (optional): [comp-1 number] [comp-1 caption] [comp-2 number] [comp-2 caption]
 *
 * EDS strips <span> in cells, so all mono spans / the pulse dot are recreated here.
 */

/** Pull plain text from a cell, falling back to empty string. */
function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

export default async function decorate(block) {
  const rows = [...block.children];
  const headRow = rows[0];
  const compRow = rows[1];
  const headCells = headRow ? [...headRow.children] : [];
  const compCells = compRow ? [...compRow.children] : [];

  // Wrap = re-create the prototype's max-width content wrapper.
  const wrap = document.createElement('div');
  wrap.className = 'live-wrap';

  const row = document.createElement('div');
  row.className = 'live-row';

  // 1. LIVE chrome cell — pulse dot + label.
  const chrome = document.createElement('p');
  chrome.className = 'live-chrome';
  const dot = document.createElement('span');
  dot.className = 'pulse-dot';
  dot.setAttribute('aria-hidden', 'true');
  chrome.append(dot, ` ${cellText(headCells[0]) || 'LIVE'}`);
  row.append(chrome);

  // 2. Main cell — caption + big value.
  const main = document.createElement('div');
  main.className = 'live-main';

  const capText = cellText(headCells[1]);
  // Reuse an authored heading element if present (server-visible, avoid nesting).
  const authoredHeading = headCells[1] && headCells[1].querySelector('h1, h2, h3, h4, h5, h6');
  if (authoredHeading) {
    authoredHeading.classList.add('cap');
    main.append(authoredHeading);
  } else if (capText) {
    const cap = document.createElement('p');
    cap.className = 'cap';
    cap.textContent = capText;
    main.append(cap);
  }

  const valText = cellText(headCells[2]);
  if (valText) {
    const val = document.createElement('p');
    val.className = 'val';
    val.textContent = valText;
    main.append(val);
  }
  row.append(main);

  // 3. Companions — two stats, each a mono number + a small caption.
  if (compCells.length) {
    const companions = document.createElement('div');
    companions.className = 'live-companions';
    for (let i = 0; i < compCells.length; i += 2) {
      const nText = cellText(compCells[i]);
      const pText = cellText(compCells[i + 1]);
      if (nText || pText) {
        const c = document.createElement('div');
        c.className = 'c';
        const n = document.createElement('span');
        n.className = 'n';
        n.textContent = nText;
        const p = document.createElement('p');
        p.textContent = pText;
        c.append(n, p);
        companions.append(c);
      }
    }
    if (companions.children.length) row.append(companions);
  }

  wrap.append(row);
  block.replaceChildren(wrap);

  // Periodic sweep on the row (disabled under prefers-reduced-motion via CSS).
  if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    row.classList.add('live-sweep');
    setInterval(() => {
      row.classList.add('sweep');
      setTimeout(() => row.classList.remove('sweep'), 1800);
    }, 6000);
  }
}
