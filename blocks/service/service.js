/**
 * Service block — 2-column: copy (left) + overlapping image gallery with badge (right).
 *
 * Authoring rows (in order):
 *   1. eyebrow   — kicker text (e.g. "Maintenance & Repair")
 *   2. headline  — h2 text
 *   3. paragraph — supporting copy
 *   4. cta       — authored CTAs: <strong><a> primary, <em><a> secondary
 *   5. image 1   — optional <picture>/<img>; empty falls back to dark placeholder (.g1)
 *   6. image 2   — optional <picture>/<img>; empty falls back to dark placeholder (.g2)
 *   7. badge     — first cell = big number, second cell = label
 *
 * @param {Element} block
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cell = (row) => row?.firstElementChild;

  const [eyebrowRow, headlineRow, paragraphRow, ctaRow, img1Row, img2Row, badgeRow] = rows;

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const grid = document.createElement('div');
  grid.className = 'grid';

  // ----- Left: copy -----
  const copy = document.createElement('div');
  copy.className = 'copy';

  const eyebrowText = cell(eyebrowRow)?.textContent.trim();
  if (eyebrowText) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'eyebrow kicker';
    eyebrow.textContent = eyebrowText;
    copy.append(eyebrow);
  }

  const headlineText = cell(headlineRow)?.textContent.trim();
  if (headlineText) {
    const h2 = document.createElement('h2');
    h2.className = 'cond';
    h2.textContent = headlineText;
    copy.append(h2);
  }

  const paragraphText = cell(paragraphRow)?.textContent.trim();
  if (paragraphText) {
    const p = document.createElement('p');
    p.textContent = paragraphText;
    copy.append(p);
  }

  // CTA row — clone authored CTA nodes; decorateButton() applies .btn classes at boot.
  const ctaCell = cell(ctaRow);
  if (ctaCell) {
    const cta = document.createElement('div');
    cta.className = 'cta-row';
    [...ctaCell.childNodes].forEach((node) => cta.append(node.cloneNode(true)));
    copy.append(cta);
  }

  grid.append(copy);

  // ----- Right: overlapping gallery + badge -----
  const gallery = document.createElement('div');
  gallery.className = 'gallery';

  const buildSlot = (row, slotClass) => {
    const slot = document.createElement('div');
    slot.className = `slot ${slotClass}`;
    const pic = cell(row)?.querySelector('picture, img');
    // Empty image cell falls back to the dark placeholder background (CSS).
    if (pic) slot.append(pic.closest('picture') || pic);
    return slot;
  };

  gallery.append(buildSlot(img1Row, 'g1'));
  gallery.append(buildSlot(img2Row, 'g2'));

  // Yellow badge: number + label.
  const badgeCells = badgeRow ? [...badgeRow.children] : [];
  const numText = badgeCells[0]?.textContent.trim();
  const labelText = badgeCells[1]?.textContent.trim();
  if (numText || labelText) {
    const badge = document.createElement('div');
    badge.className = 'badge-yrs';
    if (numText) {
      const b = document.createElement('b');
      b.className = 'cond';
      b.textContent = numText;
      badge.append(b);
    }
    if (labelText) {
      const span = document.createElement('span');
      span.textContent = labelText;
      badge.append(span);
    }
    gallery.append(badge);
  }

  grid.append(gallery);
  wrap.append(grid);
  block.replaceChildren(wrap);
}
