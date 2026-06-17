/**
 * backbone-stats — full-bleed dark "vault" band.
 *
 * Authoring shape (block.children = rows, row.children = cells):
 *   row 0:  [ running label ] [ folio ]      → chapter-head
 *   row 1:  [ <h2> heading ]                 → section title (reuse authored heading)
 *   row 2+: [ figure ] [ caption ]           → stat-ledger rows
 *
 * EDS strips <span>/class inside cells, so the chapter-head / fig / cap
 * span styling is re-created here in JS.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Inner content wrap (band background bleeds full-width; content stays maxw).
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // --- chapter-head (row 0): running label + folio ---
  const headRow = rows[0];
  if (headRow) {
    const cells = [...headRow.children];
    const head = document.createElement('div');
    head.className = 'chapter-head';

    const running = document.createElement('span');
    running.className = 'running';
    running.textContent = cells[0] ? cells[0].textContent.trim() : '';

    const folio = document.createElement('span');
    folio.className = 'folio';
    folio.textContent = cells[1] ? cells[1].textContent.trim() : '';

    head.append(running, folio);
    wrap.append(head);
  }

  // --- heading (row 1): reuse authored heading element if present ---
  const titleRow = rows[1];
  if (titleRow) {
    const cell = titleRow.firstElementChild;
    const heading = cell && cell.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      wrap.append(heading);
    } else if (cell && cell.textContent.trim()) {
      const h2 = document.createElement('h2');
      h2.textContent = cell.textContent.trim();
      wrap.append(h2);
    }
  }

  // --- gradient rule ---
  const rule = document.createElement('hr');
  rule.className = 'gradient-rule';
  rule.setAttribute('aria-hidden', 'true');
  wrap.append(rule);

  // --- stat-ledger (rows 2+): fig / cap ---
  const ledger = document.createElement('div');
  ledger.className = 'stat-ledger';

  rows.slice(2).forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;
    const line = document.createElement('div');
    line.className = 'row';

    const fig = document.createElement('span');
    fig.className = 'fig';
    fig.textContent = cells[0] ? cells[0].textContent.trim() : '';

    const cap = document.createElement('span');
    cap.className = 'cap';
    cap.textContent = cells[1] ? cells[1].textContent.trim() : '';

    line.append(fig, cap);
    ledger.append(line);
  });

  if (ledger.children.length) wrap.append(ledger);

  block.textContent = '';
  block.append(wrap);
}
