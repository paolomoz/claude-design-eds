/**
 * Locations block — yellow CTA band, 2 columns. Left = eyebrow + headline +
 * paragraph + CTA; right = flex-wrap list of plain city chips (NOT links).
 *
 * Authoring rows (in order):
 *   1. eyebrow   — small uppercase label (e.g. "18 Branches · 3 States")
 *   2. headline  — h2 text
 *   3. paragraph — supporting copy
 *   4. cta       — authored CTA: <em><strong><a> accent/dark; decorateButton() styles it
 *   5+. city     — one row per city chip; single text cell (chip label)
 *
 * @param {Element} block
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cell = (row) => row?.firstElementChild;

  const [eyebrowRow, headlineRow, paragraphRow, ctaRow, ...cityRows] = rows;

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // Left column: eyebrow, headline, paragraph, CTA.
  const left = document.createElement('div');

  const eyebrowText = cell(eyebrowRow)?.textContent.trim();
  if (eyebrowText) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = eyebrowText;
    left.append(eyebrow);
  }

  const headlineText = cell(headlineRow)?.textContent.trim();
  if (headlineText) {
    const h2 = document.createElement('h2');
    h2.className = 'cond';
    h2.textContent = headlineText;
    left.append(h2);
  }

  const paragraphText = cell(paragraphRow)?.textContent.trim();
  if (paragraphText) {
    const p = document.createElement('p');
    p.textContent = paragraphText;
    left.append(p);
  }

  // CTA — clone authored CTA nodes; decorateButton() applies .btn-accent at boot.
  const ctaCell = cell(ctaRow);
  if (ctaCell) {
    const ctaWrap = document.createElement('div');
    ctaWrap.className = 'cta-row';
    [...ctaCell.childNodes].forEach((node) => ctaWrap.append(node.cloneNode(true)));
    // Append the prototype pin icon into the (cloned) authored anchor.
    const anchor = ctaWrap.querySelector('a');
    if (anchor) {
      anchor.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>');
    }
    left.append(ctaWrap);
  }

  wrap.append(left);

  // Right column: plain city chips (spans, not links).
  const cityGrid = document.createElement('div');
  cityGrid.className = 'city-grid';
  cityRows.forEach((row) => {
    const label = cell(row)?.textContent.trim();
    if (!label) return;
    const chip = document.createElement('span');
    chip.className = 'city';
    chip.textContent = label;
    cityGrid.append(chip);
  });
  wrap.append(cityGrid);

  block.replaceChildren(wrap);
}
