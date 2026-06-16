/*
 * Lineup — interactive "What's on tap" beer selector.
 *
 * Authoring shape (table-div rows):
 *   Row 0  head:  [ eyebrow | headline (use <br> to wrap) | intro paragraph ]
 *   Row 1+ beer:  [ name | style | abv | ibu | notes | blurb | glass-color ]
 *
 * glass-color is a single representative hex (e.g. #F6B221); the JS builds the
 * fill gradient as linear-gradient(180deg, <hex>, <hex darkened ~22%>).
 *
 * Interaction: clicking a beer button sets it active → swaps the glass-fill
 * gradient + abv% + ibu, and re-renders the detail panel (style/name/blurb/
 * notes) plus the strength bar (width = abv / 11, capped at 100%).
 */

/* Darken a #rrggbb hex by `amount` (0..1) to make the gradient's lower stop. */
function darken(hex, amount = 0.22) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return hex;
  const ch = [m[1], m[2], m[3]]
    .map((h) => Math.max(0, Math.round(parseInt(h, 16) * (1 - amount))))
    .map((v) => v.toString(16).padStart(2, '0'));
  return `#${ch.join('')}`;
}

const fillGradient = (hex) => `linear-gradient(180deg, ${hex}, ${darken(hex)})`;
const strengthWidth = (abv) => `${Math.min(100, (parseFloat(abv) / 11) * 100)}%`;

const cell = (row, i) => (row?.children[i] ? row.children[i].textContent.trim() : '');

const BUBBLES = [
  {
    left: 24, bottom: 8, size: 9, dur: 3.2, delay: 0, alpha: 0.55,
  },
  {
    left: 52, bottom: 4, size: 6, dur: 2.6, delay: 0.6, alpha: 0.5,
  },
  {
    left: 70, bottom: 10, size: 7, dur: 3.6, delay: 1.1, alpha: 0.5,
  },
  {
    left: 38, bottom: 2, size: 5, dur: 2.9, delay: 1.6, alpha: 0.45,
  },
];

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const head = rows[0];
  const eyebrow = cell(head, 0) || '01 — The Lineup';
  const headlineHTML = head?.children[1]?.innerHTML.trim() || "WHAT'S<br>ON&nbsp;TAP";
  const intro = cell(head, 2);

  const beers = rows.slice(1).map((row, i) => ({
    num: String(i + 1).padStart(2, '0'),
    name: cell(row, 0),
    style: cell(row, 1),
    abv: cell(row, 2),
    ibu: cell(row, 3),
    notes: cell(row, 4),
    blurb: cell(row, 5),
    color: cell(row, 6) || '#F6B221',
  }));

  if (!beers.length) return;

  const bubbles = BUBBLES.map((b) => `<span class="lineup-bubble" style="left:${b.left}%; bottom:${b.bottom}%; width:${b.size}px; height:${b.size}px; --bh-dur:${b.dur}s; --bh-delay:${b.delay}s; --bh-alpha:${b.alpha};"></span>`).join('');

  const list = beers.map((b, i) => `
    <button class="lineup-item" type="button" role="tab" data-index="${i}" aria-selected="${i === 0 ? 'true' : 'false'}">
      <span class="lineup-item-num">${b.num}</span>
      <span class="lineup-item-name">${b.name}</span>
      <span class="lineup-item-style">${b.style}</span>
      <span class="lineup-item-abv">${b.abv}%</span>
    </button>`).join('');

  block.innerHTML = `
    <div class="lineup-head">
      <div class="lineup-head-text">
        <div class="lineup-eyebrow">
          <span class="lineup-diamond" aria-hidden="true"></span>
          <span class="lineup-eyebrow-text">${eyebrow}</span>
        </div>
        <h2 class="lineup-headline">${headlineHTML}</h2>
      </div>
      ${intro ? `<p class="lineup-intro">${intro}</p>` : ''}
    </div>

    <div class="lineup-grid">
      <div class="lineup-glass-display">
        <svg class="lineup-glass-hex" viewBox="0 0 200 200" aria-hidden="true">
          <path d="M100 26 L140 49 V95 L100 118 L60 95 V49 Z" fill="none" stroke="var(--accent)" stroke-opacity=".18" stroke-width="1.2"/>
          <path d="M100 92 L150 121 V179" fill="none" stroke="var(--accent)" stroke-opacity=".12" stroke-width="1.2"/>
        </svg>
        <div class="lineup-abv" aria-hidden="true"><span data-abv>${beers[0].abv}</span><span class="lineup-abv-pct">%</span></div>
        <div class="lineup-ibu" aria-hidden="true"><span data-ibu>${beers[0].ibu}</span> IBU</div>
        <div class="lineup-glass">
          <div class="lineup-glass-body">
            <div class="lineup-glass-fill" data-fill style="background:${fillGradient(beers[0].color)};">${bubbles}</div>
            <div class="lineup-glass-head" aria-hidden="true"></div>
          </div>
        </div>
      </div>

      <div class="lineup-detail-col">
        <div class="lineup-detail" data-detail aria-live="polite">
          <div class="lineup-detail-style" data-style>${beers[0].style}</div>
          <h3 class="lineup-detail-name" data-name>${beers[0].name}</h3>
          <p class="lineup-detail-blurb" data-blurb>${beers[0].blurb}</p>
          <div class="lineup-detail-row">
            <span class="lineup-detail-label">Notes</span>
            <span class="lineup-detail-value" data-notes>${beers[0].notes}</span>
          </div>
          <div class="lineup-detail-row">
            <span class="lineup-detail-label">Strength</span>
            <span class="lineup-strength-track">
              <span class="lineup-strength-bar" data-strength style="width:${strengthWidth(beers[0].abv)};"></span>
            </span>
          </div>
        </div>

        <div class="lineup-list" role="tablist" aria-label="Beer lineup">${list}</div>
      </div>
    </div>`;

  const abvEl = block.querySelector('[data-abv]');
  const ibuEl = block.querySelector('[data-ibu]');
  const fillEl = block.querySelector('[data-fill]');
  const detailEl = block.querySelector('[data-detail]');
  const styleEl = block.querySelector('[data-style]');
  const nameEl = block.querySelector('[data-name]');
  const blurbEl = block.querySelector('[data-blurb]');
  const notesEl = block.querySelector('[data-notes]');
  const strengthEl = block.querySelector('[data-strength]');
  const items = [...block.querySelectorAll('.lineup-item')];

  const select = (index) => {
    const b = beers[index];
    if (!b) return;
    items.forEach((it, i) => it.setAttribute('aria-selected', String(i === index)));
    abvEl.textContent = b.abv;
    ibuEl.textContent = b.ibu;
    fillEl.style.background = fillGradient(b.color);
    styleEl.textContent = b.style;
    nameEl.textContent = b.name;
    blurbEl.textContent = b.blurb;
    notesEl.textContent = b.notes;
    strengthEl.style.width = strengthWidth(b.abv);
    // Re-trigger the detail enter animation.
    detailEl.classList.remove('is-entering');
    // eslint-disable-next-line no-void
    void detailEl.offsetWidth;
    detailEl.classList.add('is-entering');
  };

  items.forEach((it, i) => it.addEventListener('click', () => select(i)));
}
