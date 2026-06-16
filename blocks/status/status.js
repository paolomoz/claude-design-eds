/**
 * status — JFK "Know before you go" live wait-times.
 * Authoring rows (positional):
 *   Row 1 (lede):  [ kicker | <h2> headline | paragraph ]
 *   Rows 2..N (terminals): [ num | name | gen-wait | gen-status | tsa-wait | tsa-status ]
 *     - status cells are one of: ok | warn | bad (drive the wait-val color).
 * The SECURITY / CUSTOMS tabs toggle the active style (the prototype's CUSTOMS
 * data is mocked; the table renders the authored terminals). The terminal badge
 * colors follow the prototype's fixed severity palette by row index.
 */

const BADGE = ['#1d9e5f', '#d98a00', '#e0b400', '#d95f18', '#d93a2b'];

function text(cell) { return cell ? cell.textContent.trim() : ''; }

function waitVal(value, status) {
  const span = document.createElement('span');
  span.className = `wait-val ${/ok|warn|bad/.test(status) ? status : 'ok'}`;
  span.textContent = value;
  return span;
}

export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const [ledeRow, ...termRows] = rows;
  const lc = [...ledeRow.children];

  const grid = document.createElement('div');
  grid.className = 'status-grid';

  // --- lede ---
  const lede = document.createElement('div');
  lede.className = 'lede';
  const kicker = document.createElement('div');
  kicker.className = 'kicker';
  kicker.textContent = text(lc[0]);
  const h2 = document.createElement('h2');
  h2.textContent = text(lc[1]);
  const p = document.createElement('p');
  p.textContent = text(lc[2]);
  lede.append(kicker, h2, p);

  // --- wait card ---
  const card = document.createElement('div');
  card.className = 'wait-card';

  const tabs = document.createElement('div');
  tabs.className = 'wait-tabs';
  ['SECURITY', 'CUSTOMS'].forEach((label, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = i === 0 ? 'active' : '';
    b.textContent = label;
    b.addEventListener('click', () => {
      tabs.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
    });
    tabs.append(b);
  });

  const table = document.createElement('table');
  table.className = 'wait-table';
  table.innerHTML = '<thead><tr><th>Terminal</th><th>General</th><th>TSA Pre&#10003;</th></tr></thead>';
  const tbody = document.createElement('tbody');
  termRows.forEach((row, i) => {
    const c = [...row.children];
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'tbadge';
    badge.style.background = BADGE[i % BADGE.length];
    badge.textContent = text(c[0]);
    tdName.append(badge, document.createTextNode(text(c[1])));
    const tdGen = document.createElement('td');
    tdGen.append(waitVal(text(c[2]), text(c[3])));
    const tdTsa = document.createElement('td');
    tdTsa.append(waitVal(text(c[4]), text(c[5])));
    tr.append(tdName, tdGen, tdTsa);
    tbody.append(tr);
  });
  table.append(tbody);

  const foot = document.createElement('div');
  foot.className = 'wait-foot';
  foot.innerHTML = '<span class="live-dot">Live</span><span>Updated 7:18 PM ET · measured from queue entry</span>';

  card.append(tabs, table, foot);
  grid.append(lede, card);

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  wrap.append(grid);
  block.replaceChildren(wrap);
}
