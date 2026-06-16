/**
 * guide — "Your guide to JFK": section head + horizontal scroller of overlay cards.
 *
 * Authoring rows (positional):
 *   Row 1 (head):  [ kicker text | <h2> headline ]
 *   Rows 2..N (cards, repeated): [ image cell (optional, may be empty) | label cell ]
 *     - The label cell holds the card text and, if present, the link (<a>) that the
 *       whole card points to. A bare paragraph with text becomes a non-link card.
 *
 * The card is an overlay: optional image fills it, a scrim darkens the lower edge,
 * and the label sits bottom-left with a circular arrow. Image is OPTIONAL — when
 * absent, the .guide-card background (navy) + CSS fallback stand in. NOT the button
 * system; the card link is a plain styled <a>.
 */

function pic(cell) {
  return cell ? cell.querySelector('picture, img, image-slot') : null;
}

export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // Head row
  const [headRow, ...cardRows] = rows;
  const headCells = [...headRow.children];
  const kicker = headCells[0]?.textContent.trim() || '';
  const h2 = headCells[1]?.querySelector('h1,h2,h3,h4,h5,h6') || headCells[1];

  const head = document.createElement('div');
  head.className = 'section-head';
  const headInner = document.createElement('div');
  if (kicker) {
    const k = document.createElement('div');
    k.className = 'kicker';
    k.textContent = kicker;
    headInner.append(k);
  }
  if (h2) {
    const heading = document.createElement('h2');
    heading.textContent = h2.textContent.trim();
    headInner.append(heading);
  }
  head.append(headInner);

  // Scroller of cards
  const scroller = document.createElement('div');
  scroller.className = 'guide-scroller';

  cardRows.forEach((row) => {
    const cells = [...row.children];
    const imgCell = cells[0];
    const labelCell = cells[1] || cells[0];

    const link = labelCell?.querySelector('a');
    const labelText = (link || labelCell)?.textContent.trim() || '';

    const card = document.createElement(link ? 'a' : 'div');
    card.className = 'guide-card';
    if (link) card.href = link.getAttribute('href') || '#';

    const image = pic(imgCell);
    if (image) {
      card.append(image);
    } else {
      const ph = document.createElement('span');
      ph.className = 'guide-img-fallback';
      card.append(ph);
    }

    const scrim = document.createElement('span');
    scrim.className = 'guide-scrim';
    card.append(scrim);

    const label = document.createElement('span');
    label.className = 'guide-label';
    label.append(document.createTextNode(labelText));
    const arr = document.createElement('span');
    arr.className = 'arr';
    arr.textContent = '→';
    label.append(arr);
    card.append(label);

    scroller.append(card);
  });

  wrap.append(head, scroller);
  block.replaceChildren(wrap);
}
