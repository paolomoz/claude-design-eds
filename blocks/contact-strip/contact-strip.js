/**
 * Contact Strip block
 * Full-bleed yellow band with a centered, max-width wrap holding a two-column
 * grid: a heading + paragraph on the left and a mailto CTA on the right.
 *
 * Authored shape is FLAT — one cell per row:
 *   Row 1 | <heading>            (card title)
 *   Row 2 | <p>                  (supporting copy — may be its own row)
 *   Row 3 | <a href="mailto:…">  (plain mailto anchor — styled by block CSS)
 * The heading + copy go in the left column; the mailto anchor is the right CTA.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // The section stays full-bleed; the CONTENT is wrapped at --maxw.
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // --- Left: heading + supporting paragraphs (any row that is not the mailto CTA) ---
  const textCol = document.createElement('div');
  textCol.className = 'contact-text';

  let cta = null;
  rows.forEach((row) => {
    const cell = row.firstElementChild;
    if (!cell) return;
    const link = cell.querySelector('a[href^="mailto:"]') || cell.querySelector('a');
    // The lone anchor row is the CTA; everything else is left-column text.
    if (link && cell.textContent.trim() === link.textContent.trim()) {
      cta = link;
      return;
    }
    [...cell.childNodes].forEach((node) => textCol.append(node.cloneNode(true)));
  });
  wrap.append(textCol);

  // --- Right: mailto CTA. A channel value, not a chip button. ---
  if (cta) wrap.append(cta.cloneNode(true));

  block.textContent = '';
  block.append(wrap);
}
