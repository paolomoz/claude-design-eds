/**
 * finder block — dark band with a lead-side (eyebrow + h2 + paragraph) and a
 * white search card. The card has tabs (Klinik / Arzt / Fachgebiet /
 * Krankheitsbild) and a 2x2 field grid (region input + 3 selects), a hint and
 * a non-submitting "Suchen" button.
 *
 * Authoring shape (block.children = rows, row.children = cells):
 *   row 0 — eyebrow text
 *   row 1 — heading (reuse authored heading element if present)
 *   row 2 — lead paragraph
 *   row 3 — tab labels, one per line
 *   row 4 — select fields, one per line: "Label | Option, Option, Option"
 *   row 5 — region field: "Label | placeholder"
 *   row 6 — hint text
 *   row 7 — button label
 *
 * @param {Element} block The block element
 */

const FIELD_TYPES = ['Klinik', 'Arzt', 'Fachgebiet', 'Krankheitsbild'];

function lines(cell) {
  if (!cell) return [];
  return [...cell.querySelectorAll('p')]
    .map((p) => p.textContent.trim())
    .filter(Boolean);
}

export default async function decorate(block) {
  // Dark band → 'dark' so the global ghost-secondary override applies.
  // id=finder is the hero "Klinik finden" anchor target.
  block.classList.add('dark');
  block.id = 'finder';

  const rows = [...block.children];
  const cell = (i) => rows[i]?.firstElementChild;

  const eyebrowText = cell(0)?.textContent.trim() || '';
  const headingCell = cell(1);
  const leadText = cell(2)?.textContent.trim() || '';
  const tabLabels = lines(cell(3));
  const fieldRows = lines(cell(4));
  const regionRow = cell(5)?.textContent.trim() || '';
  const hintText = cell(6)?.textContent.trim() || '';
  const buttonLabel = cell(7)?.textContent.trim() || 'Suchen';

  block.textContent = '';

  // --- lead side ---------------------------------------------------------
  const lead = document.createElement('div');
  lead.className = 'lead-side';

  if (eyebrowText) {
    const eyebrow = document.createElement('div');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = eyebrowText;
    lead.append(eyebrow);
  }

  // Reuse the authored heading element if present; otherwise make an <h2>.
  let heading = headingCell?.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    heading = heading.cloneNode(true);
  } else {
    heading = document.createElement('h2');
    heading.textContent = headingCell?.textContent.trim() || '';
  }
  lead.append(heading);

  if (leadText) {
    const p = document.createElement('p');
    p.textContent = leadText;
    lead.append(p);
  }

  // --- card --------------------------------------------------------------
  const card = document.createElement('div');
  card.className = 'finder-card';

  // tabs
  const tabs = document.createElement('div');
  tabs.className = 'finder-tabs';
  tabs.setAttribute('role', 'tablist');
  (tabLabels.length ? tabLabels : FIELD_TYPES).forEach((label, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'finder-tab';
    tab.setAttribute('role', 'tab');
    tab.textContent = label;
    if (i === 0) {
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
    } else {
      tab.setAttribute('aria-selected', 'false');
    }
    tabs.append(tab);
  });
  card.append(tabs);

  // field grid
  const grid = document.createElement('div');
  grid.className = 'finder-grid';

  // region (text input) first
  let fieldIndex = 0;
  const makeFieldId = () => {
    fieldIndex += 1;
    return `finder-field-${fieldIndex}`;
  };

  const [regionLabel = 'Region oder PLZ', regionPlaceholder = ''] = regionRow
    .split('|')
    .map((s) => s.trim());
  const regionField = document.createElement('div');
  regionField.className = 'field';
  const regionId = makeFieldId();
  const regLabel = document.createElement('label');
  regLabel.setAttribute('for', regionId);
  regLabel.textContent = regionLabel;
  const regInput = document.createElement('input');
  regInput.id = regionId;
  regInput.type = 'text';
  regInput.placeholder = regionPlaceholder;
  regionField.append(regLabel, regInput);
  grid.append(regionField);

  // select fields
  fieldRows.forEach((row) => {
    const [label, opts = ''] = row.split('|').map((s) => s.trim());
    const field = document.createElement('div');
    field.className = 'field';
    const id = makeFieldId();
    const lab = document.createElement('label');
    lab.setAttribute('for', id);
    lab.textContent = label;
    const select = document.createElement('select');
    select.id = id;
    opts
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)
      .forEach((o) => {
        const option = document.createElement('option');
        option.textContent = o;
        select.append(option);
      });
    field.append(lab, select);
    grid.append(field);
  });

  card.append(grid);

  // actions: hint + non-submitting button (NO <form>, type="button")
  const actions = document.createElement('div');
  actions.className = 'finder-actions';
  if (hintText) {
    const hint = document.createElement('span');
    hint.className = 'hint';
    hint.textContent = hintText;
    actions.append(hint);
  }
  const search = document.createElement('button');
  search.type = 'button';
  search.className = 'btn btn-primary';
  search.textContent = buttonLabel;
  actions.append(search);
  card.append(actions);

  // Full-bleed band: .finder owns the background; the content is wrapped to
  // --maxw inside a .wrap.
  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  wrap.append(lead, card);
  block.append(wrap);

  // --- interactivity (tabs) ---------------------------------------------
  tabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.finder-tab');
    if (!tab) return;
    tabs.querySelectorAll('.finder-tab').forEach((t) => {
      t.classList.remove('is-active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('is-active');
    tab.setAttribute('aria-selected', 'true');
  });
}
