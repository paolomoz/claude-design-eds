/**
 * loads and decorates the solutions-index block
 *
 * Authoring shape (block.children = rows, row.children = cells):
 *   Row 1 (intro): [ running-head label | heading (h2) | lede paragraph ]
 *   Rows 2..N (one per solution): [ index | name | claim | link (anchor) ]
 *
 * Each solution row is rendered as a whole-card anchor (<a class="ledger-row">)
 * whose href comes from the row's link cell. The "Explore X →" gesture is a
 * styled text link recreated here (no chip / button); the arrow span is
 * re-created in JS because EDS strips <span> elements from authored cells.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // ---- intro (chapter-head running head + heading + lede) ----
  const introRow = rows.shift();
  const introCells = [...introRow.children];

  const intro = document.createElement('div');
  intro.className = 'intro';

  // running head: mono "Solutions" label + folio "02 / 06"
  const head = document.createElement('div');
  head.className = 'chapter-head';
  const running = document.createElement('span');
  running.className = 'running';
  running.textContent = (introCells[0]?.textContent || '').trim();
  const folio = document.createElement('span');
  folio.className = 'folio';
  folio.textContent = (introCells[2]?.textContent || '').trim();
  head.append(running, folio);
  intro.append(head);

  // heading: reuse an authored heading element if present (server-visible)
  const titleCell = introCells[1];
  if (titleCell) {
    const authored = titleCell.querySelector('h1, h2, h3, h4, h5, h6');
    if (authored) {
      intro.append(authored);
    } else if (titleCell.textContent.trim()) {
      const h2 = document.createElement('h2');
      h2.textContent = titleCell.textContent.trim();
      intro.append(h2);
    }
  }

  // lede
  const ledeText = (introCells[3]?.textContent || '').trim();
  if (ledeText) {
    const lede = document.createElement('p');
    lede.className = 'chapter-lede';
    lede.textContent = ledeText;
    intro.append(lede);
  }

  // ---- ledger of whole-card anchors ----
  const ledger = document.createElement('div');
  ledger.className = 'ledger';

  rows.forEach((row) => {
    const cells = [...row.children];
    const linkCell = cells[3];
    const anchor = linkCell?.querySelector('a');

    const card = document.createElement('a');
    card.className = 'ledger-row';
    if (anchor?.href) card.href = anchor.getAttribute('href');

    const idx = document.createElement('span');
    idx.className = 'idx';
    idx.textContent = (cells[0]?.textContent || '').trim();

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = (cells[1]?.textContent || '').trim();

    const claim = document.createElement('span');
    claim.className = 'claim';
    claim.textContent = (cells[2]?.textContent || '').trim();

    const gesture = document.createElement('span');
    gesture.className = 'gesture';
    const gestureLabel = (anchor?.textContent || linkCell?.textContent || '').trim();
    gesture.append(document.createTextNode(`${gestureLabel} `));
    const arr = document.createElement('span');
    arr.className = 'arr';
    arr.setAttribute('aria-hidden', 'true');
    arr.textContent = '→';
    gesture.append(arr);

    card.append(idx, name, claim, gesture);
    ledger.append(card);
  });

  block.textContent = '';
  block.append(intro, ledger);
}
