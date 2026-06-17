/**
 * audience — audience-tab section: a row of decorative tabs over a two-column
 * panel (left: label + heading + paragraph + outline CTA; right: a grid of
 * bordered path-tile links each with a trailing arrow).
 *
 * The tabs are decorative on a static page — the prototype only ships ONE panel
 * (Patient · Familie). All four tabs are rendered (the first is active and
 * server-visible); clicking a tab marks it active but the panel content is the
 * single authored panel. Tab labels + sublines are static chrome, defined here.
 *
 * Authoring rows (positional):
 *   1. label      — small eyebrow line above the heading
 *   2. heading    — the panel title; a real <h*> reused if present, else <h2>
 *   3. paragraph  — body copy
 *   4. CTA        — a single secondary link, authored as <em><a>
 *   5..N. paths   — one row per path tile, each a single cell holding a plain <a>
 */

const TABS = [
  { label: 'Patient · Familie', sub: 'Behandlung, Geburt, Vorsorge' },
  { label: 'Zuweiser · Ärzteschaft', sub: 'Portal, Fortbildung, Forschung' },
  { label: 'Karriere', sub: 'Stellen, Ausbildung, Pflege' },
  { label: 'International', sub: 'Internationale Patienten' },
];

const ARROW = '<svg class="aud-arrow" width="16" height="16" viewBox="0 0 16 16" '
  + 'aria-hidden="true" focusable="false"><path d="M3 8h9M8.5 4l4 4-4 4" '
  + 'fill="none" stroke="currentColor" stroke-width="1.6" '
  + 'stroke-linecap="round" stroke-linejoin="round"/></svg>';

export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const cellOf = (row) => row && row.firstElementChild;

  // 1. Classify rows: the first link-free row with a heading is the title; the
  //    first short link-free cell is the label/eyebrow; the first sentence-y
  //    link-free <p> is the body; the first <em>/secondary link row is the CTA;
  //    every remaining row holding a plain <a> is a path tile.
  const labelCell = cellOf(rows[0]);
  const headingRow = rows.find((r) => cellOf(r) && cellOf(r).querySelector('h1, h2, h3, h4, h5, h6'));
  const bodyRow = rows.find((r) => {
    const c = cellOf(r);
    return c && c !== labelCell && r !== headingRow
      && c.querySelector('p') && !c.querySelector('a');
  });
  const ctaRow = rows.find((r) => cellOf(r) && cellOf(r).querySelector('a')
    && (cellOf(r).querySelector('em') || cellOf(r).querySelector('strong')));

  const used = new Set([rows[0], headingRow, bodyRow, ctaRow]);
  const pathRows = rows.filter((r) => !used.has(r) && cellOf(r) && cellOf(r).querySelector('a'));

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // 2. Tabs (decorative). The first tab is the active, server-visible state.
  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Auswahl Zielgruppe');
  TABS.forEach((t, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = i === 0 ? 'atab is-active' : 'atab';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    tab.append(document.createTextNode(t.label));
    const sub = document.createElement('span');
    sub.className = 'sub';
    sub.textContent = t.sub;
    tab.append(sub);
    tabs.append(tab);
  });
  wrap.append(tabs);

  // 3. Panel: left column (label, heading, paragraph, CTA) + right path grid.
  const panel = document.createElement('div');
  panel.className = 'aud-panel';

  const left = document.createElement('div');
  left.className = 'aud-lead';

  if (labelCell) {
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = labelCell.textContent.trim();
    left.append(label);
  }

  if (headingRow) {
    let heading = cellOf(headingRow).querySelector('h1, h2, h3, h4, h5, h6');
    if (heading.tagName !== 'H2') {
      const h2 = document.createElement('h2');
      h2.innerHTML = heading.innerHTML;
      heading = h2;
    }
    left.append(heading);
  }

  if (bodyRow) {
    [...cellOf(bodyRow).querySelectorAll('p')].forEach((p) => left.append(p));
  }

  if (ctaRow) {
    const actions = document.createElement('div');
    actions.className = 'actions';
    [...cellOf(ctaRow).childNodes].forEach((n) => actions.append(n.cloneNode(true)));
    left.append(actions);
  }

  panel.append(left);

  const paths = document.createElement('div');
  paths.className = 'aud-paths';
  pathRows.forEach((row) => {
    const a = cellOf(row).querySelector('a');
    const tile = document.createElement('a');
    tile.href = a.getAttribute('href') || '#';
    const span = document.createElement('span');
    span.textContent = a.textContent.trim();
    tile.append(span);
    tile.insertAdjacentHTML('beforeend', ARROW);
    paths.append(tile);
  });
  panel.append(paths);

  wrap.append(panel);

  // 4. Decorative tab switching: mark the clicked tab active (single panel).
  tabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.atab');
    if (!tab) return;
    tabs.querySelectorAll('.atab').forEach((t) => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  });

  block.replaceChildren(wrap);
}
