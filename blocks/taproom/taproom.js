/**
 * taproom — "Come Buzz By" section: header (eyebrow + headline), then a 2-col
 * grid of an info card (address + hours table + Get Directions CTA) and a map
 * placeholder card (hex-pattern bg + bobbing hex pin + caption).
 *
 * Author rows (positional):
 *   row 0: eyebrow            e.g. "03 — The Taproom"
 *   row 1: headline           e.g. "COME BUZZ BY"
 *   row 2: find-the-hive label  +  address (cell 0 = label, cell 1 = address)
 *   row 3..n-2: one hours line per row → [ day | time ]   (repeated-row shape)
 *   row n-1: CTA cell         author <strong><a> → filled accent pill (primary)
 *   last row: map caption text
 *
 * To keep the CTA and caption unambiguous, the LAST row is always the map
 * caption and the SECOND-TO-LAST row is the CTA; every row between row 2 and
 * the CTA is treated as an hours line.
 *
 * @param {Element} block The block element
 */
import { getConfig, decorateLink } from '../../scripts/ak.js';

/* Bobbing hex map pin lifted from the prototype (kept inline — no image cell). */
const PIN_SVG = `
  <div class="taproom-map-pin" aria-hidden="true">
    <svg width="46" height="52" viewBox="0 0 30 34" focusable="false">
      <path d="M15 1 L28.8 9 V25 L15 33 L1.2 25 V9 Z" fill="var(--accent)" stroke="#0B0B0B" stroke-width="1.5"/>
      <circle cx="15" cy="16" r="5" fill="#0B0B0B"/>
    </svg>
  </div>`;

export default async function decorate(block) {
  const rows = [...block.children];
  const text = (row) => (row ? row.textContent.trim() : '');
  const html = (cell) => (cell ? cell.innerHTML.trim() : '');

  const eyebrow = text(rows[0]);
  const headline = text(rows[1]);

  // row 2: [ label | address ]
  const infoRow = rows[2];
  const infoCells = infoRow ? [...infoRow.children] : [];
  const hiveLabel = infoCells[0]?.textContent.trim() || '';
  const address = html(infoCells[1]);

  // last row = map caption; second-to-last = CTA; middle = hours lines.
  const captionRow = rows[rows.length - 1];
  const ctaRow = rows[rows.length - 2];
  const hoursRows = rows.slice(3, rows.length - 2);

  const hours = hoursRows.map((row) => {
    const cells = [...row.children];
    return `
      <div class="taproom-hours-row">
        <span class="taproom-hours-day">${cells[0]?.textContent.trim() || ''}</span>
        <span class="taproom-hours-time">${cells[1]?.innerHTML.trim() || ''}</span>
      </div>`;
  }).join('');

  // CTA: clone authored cell so decorateLink() applies pill classes (primary).
  let cta = '';
  if (ctaRow?.firstElementChild) {
    const config = getConfig();
    const clone = ctaRow.firstElementChild.cloneNode(true);
    clone.querySelectorAll('a').forEach((a) => decorateLink(config, a));
    cta = `<div class="taproom-cta">${clone.innerHTML}</div>`;
  }

  const caption = text(captionRow);

  block.innerHTML = `
    <div class="taproom-head">
      <div class="taproom-eyebrow">
        <span class="taproom-diamond"></span>
        <span class="taproom-eyebrow-text">${eyebrow}</span>
      </div>
      <h2 class="taproom-headline">${headline}</h2>
    </div>
    <div class="taproom-grid">
      <div class="taproom-info">
        <div class="taproom-info-label">${hiveLabel}</div>
        <div class="taproom-address">${address}</div>
        <div class="taproom-hours">${hours}</div>
        ${cta}
      </div>
      <div class="taproom-map">
        ${PIN_SVG}
        <div class="taproom-map-caption">${caption}</div>
      </div>
    </div>`;
}
