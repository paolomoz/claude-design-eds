/**
 * flight-search — JFK home configurator card (interactive, section role).
 *
 * Source prototype: home-B-cinematic .config-shell / .config-card. An interactive
 * card overlapping the hero with Departures / Arrivals / Parking tabs, a
 * Destination / Flight-Number segmented control, a date + destination input row,
 * and a Search button. Tab + segment switching is wired in block JS (#17/#28 —
 * block JS runs). The form is a non-submitting <div> wrapper with
 * <button type="button"> (#20 — no real <form>, EDS CSP eats inline handlers).
 *
 * Authoring shape (#62/#71 — DA delivers ONE row, ONE cell, flat siblings; this
 * block has fixed chrome so the authorable content is small and OPTIONAL):
 *   - a link  -> the "All departing flights" value link (plain <a>, not a button)
 *   - the first bare-text line  -> date input default value
 *   - the next bare-text line   -> destination input placeholder
 *   - the last bare-text line   -> the trailing tip text
 * Everything missing falls back to the prototype's defaults, so an EMPTY block
 * still renders the full card.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg(attrs, children) {
  const el = document.createElementNS(SVG_NS, 'svg');
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  (children || []).forEach((c) => el.appendChild(c));
  return el;
}

function path(d) {
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', d);
  return p;
}

function calendarIcon() {
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', '3');
  rect.setAttribute('y', '5');
  rect.setAttribute('width', '18');
  rect.setAttribute('height', '16');
  rect.setAttribute('rx', '2');
  return svg({
    viewBox: '0 0 24 24',
    width: '18',
    height: '18',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.7',
    'stroke-linecap': 'round',
    class: 'flight-search-cal',
  }, [rect, path('M3 10h18M8 3v4M16 3v4')]);
}

/**
 * Cell-level cascade collector (#71): iterate :scope > div > div cells; push each
 * cell's child elements, ELSE synthesize a <p> from the cell's own bare text so a
 * one-element-per-row layout doesn't silently drop bare-text cells.
 */
function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) out.push(...kids);
    else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      out.push(p);
    }
  });
  return out.length ? out : [...block.children];
}

function makeTab(label, selected) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'config-tab';
  btn.setAttribute('role', 'tab');
  btn.setAttribute('aria-selected', selected ? 'true' : 'false');
  btn.textContent = label;
  return btn;
}

function makeSegment(label, pressed) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  btn.textContent = label;
  return btn;
}

export default async function decorate(block) {
  // --- read optional authored content, classify by content (not index) ---
  const nodes = collectNodes(block);
  let allLink = null;
  const texts = [];
  nodes.forEach((n) => {
    const link = n.matches('a') ? n : n.querySelector('a');
    if (link && !allLink) {
      allLink = link;
      return;
    }
    const t = n.textContent.trim();
    if (t) texts.push(t);
  });

  const dateValue = texts[0] || 'May 24, 2026';
  const destPlaceholder = texts[1] || 'Select your destination';
  const tipText = texts[2] || 'Tip · search by flight number for the fastest result';
  const allLinkText = (allLink && allLink.textContent.trim()) || 'All departing flights';
  const allLinkHref = (allLink && allLink.getAttribute('href')) || '#';

  // --- build the card ---
  const card = document.createElement('div');
  card.className = 'config-card';

  // tabs
  const tabs = document.createElement('div');
  tabs.className = 'config-tabs';
  tabs.setAttribute('role', 'tablist');
  const tabEls = ['Departures', 'Arrivals', 'Parking'].map((l, i) => makeTab(l, i === 0));
  tabs.append(...tabEls);

  // body
  const body = document.createElement('div');
  body.className = 'config-body';

  const segments = document.createElement('div');
  segments.className = 'config-segments';
  segments.setAttribute('role', 'group');
  segments.setAttribute('aria-label', 'Search by');
  const segEls = ['Destination', 'Flight Number'].map((l, i) => makeSegment(l, i === 0));
  segments.append(...segEls);

  // non-submitting form row (#20 — <div>, not <form>)
  const row = document.createElement('div');
  row.className = 'config-row';

  const dateField = document.createElement('div');
  dateField.className = 'config-field';
  const dateLabel = document.createElement('label');
  dateLabel.textContent = 'Date (required)';
  const dateInputWrap = document.createElement('div');
  dateInputWrap.className = 'input';
  const dateInput = document.createElement('input');
  dateInput.type = 'text';
  dateInput.value = dateValue;
  dateInput.setAttribute('aria-label', 'Date');
  dateInputWrap.append(dateInput, calendarIcon());
  dateField.append(dateLabel, dateInputWrap);

  const destField = document.createElement('div');
  destField.className = 'config-field';
  const destLabel = document.createElement('label');
  destLabel.textContent = 'Destination airport (required)';
  const destInputWrap = document.createElement('div');
  destInputWrap.className = 'input';
  const destInput = document.createElement('input');
  destInput.type = 'text';
  destInput.placeholder = destPlaceholder;
  destInputWrap.append(destInput);
  destField.append(destLabel, destInputWrap);

  const searchBtn = document.createElement('button');
  searchBtn.type = 'button';
  searchBtn.className = 'btn-search';
  searchBtn.textContent = 'Search';

  row.append(dateField, destField, searchBtn);
  body.append(segments, row);

  // after-row: plain styled value link + tip (the link is a value, not a button)
  const after = document.createElement('div');
  after.className = 'config-after';
  const a = document.createElement('a');
  a.className = 'all-link';
  a.href = allLinkHref;
  a.textContent = allLinkText;
  const tip = document.createElement('small');
  tip.textContent = tipText;
  after.append(a, tip);

  card.append(tabs, body, after);

  // --- interactivity: tab + segment switching (#28) ---
  tabEls.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabEls.forEach((t) => t.setAttribute('aria-selected', t === tab ? 'true' : 'false'));
    });
  });
  segEls.forEach((seg) => {
    seg.addEventListener('click', () => {
      segEls.forEach((s) => s.setAttribute('aria-pressed', s === seg ? 'true' : 'false'));
    });
  });

  block.replaceChildren(card);
}
