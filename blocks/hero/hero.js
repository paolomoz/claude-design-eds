/**
 * hero — JFK navy hero with giant wordmark, tagline, and the ASK toolbar.
 *
 * Authoring rows (positional):
 *   1. headline        — wordmark text, e.g. "JFK" (an accent dot is appended)
 *   2. tagline         — one line of supporting copy
 *   3. background image — OPTIONAL <picture>/<img>; empty falls back to navy gradient
 *   4..N: suggestion chips — one chip per row (single cell each)
 *
 * Tab labels (ASK / DEPARTURES / ARRIVALS / PARKING) are fixed in JS. Only the
 * ASK panel has content; the other tabs just toggle the active style. The ask
 * input is non-functional (visual only; <button type="button">, no form/submit).
 */

function text(cell) { return cell ? cell.textContent.trim() : ''; }

const TABS = ['ASK', 'DEPARTURES', 'ARRIVALS', 'PARKING'];

export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const headline = text(rows[0]?.firstElementChild) || 'JFK';
  const tagline = text(rows[1]?.firstElementChild);
  const imageCell = rows[2]?.firstElementChild;
  const picture = imageCell ? imageCell.querySelector('picture, img') : null;
  const chips = rows.slice(3)
    .map((r) => text(r.firstElementChild))
    .filter(Boolean);

  block.classList.toggle('hero--solid', !picture);

  // ----- media + scrim -----
  const media = document.createElement('div');
  media.className = 'hero-media';
  if (picture) media.append(picture);

  const scrim = document.createElement('div');
  scrim.className = 'hero-scrim';

  // ----- inner content -----
  const inner = document.createElement('div');
  inner.className = 'wrap hero-inner';

  const wordmark = document.createElement('h1');
  wordmark.className = 'wordmark';
  wordmark.textContent = headline;
  const dot = document.createElement('span');
  dot.className = 'jfk-dot';
  dot.textContent = '.';
  wordmark.append(dot);
  inner.append(wordmark);

  if (tagline) {
    const p = document.createElement('p');
    p.className = 'tagline';
    p.textContent = tagline;
    inner.append(p);
  }

  // ----- toolbar -----
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';

  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  tabs.setAttribute('role', 'tablist');
  const tabEls = TABS.map((label, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = i === 0 ? 'tab active' : 'tab';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    tab.textContent = label;
    if (i === 0) {
      const spark = document.createElement('span');
      spark.className = 'spark';
      spark.textContent = '✦';
      tab.append(spark);
    }
    return tab;
  });
  tabs.append(...tabEls);

  tabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    tabEls.forEach((t) => {
      const on = t === tab;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  });

  // ASK panel — the only panel with content; stays visible across tabs.
  const panel = document.createElement('div');
  panel.className = 'panel';

  const askRow = document.createElement('div');
  askRow.className = 'ask-row';

  const label = document.createElement('label');
  label.className = 'ask-input';
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.style.color = 'rgb(133, 147, 184)';
  icon.textContent = '✦';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Ask me anything about your trip';
  label.append(icon, input);

  const send = document.createElement('button');
  send.type = 'button';
  send.className = 'ask-send';
  send.textContent = 'ASK ✦';
  askRow.append(label, send);
  panel.append(askRow);

  if (chips.length) {
    const chipWrap = document.createElement('div');
    chipWrap.className = 'chips';
    chips.forEach((c) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = c;
      chipWrap.append(chip);
    });
    panel.append(chipWrap);
  }

  toolbar.append(tabs, panel);
  inner.append(toolbar);

  block.replaceChildren(media, scrim, inner);
}
