/**
 * the-place — full-bleed photo band with a bottom-up scrim, a yellow
 * "Est 1996" tag pinned top-right, and a bottom-anchored overlay
 * (heading + body paragraph + yellow underlined text link).
 *
 * Authored rows (each row = one cell):
 *   1. Background picture/image
 *   2. Tag text (e.g. "Est 1996")
 *   3. Heading (H2)
 *   4. Body paragraph
 *   5. Text link (a plain <a> — styled per-block, NOT a button)
 *
 * Any row may be omitted; the block degrades gracefully.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cellOf = (row) => row?.firstElementChild;

  // --- Background image -----------------------------------------------------
  const picture = block.querySelector('picture');
  const img = block.querySelector('img');
  const bg = document.createElement('div');
  bg.className = 'ds-the-place-bg';
  if (picture) {
    bg.append(picture);
  } else if (img) {
    bg.append(img);
  }
  // (empty bg falls back to a dark gradient via CSS)

  // --- Scrim ----------------------------------------------------------------
  const scrim = document.createElement('div');
  scrim.className = 'ds-the-place-scrim';
  scrim.setAttribute('aria-hidden', 'true');

  // --- Tag (server text becomes a styled span; EDS strips authored spans) ---
  let tag = null;
  const tagRow = rows.find((r) => r !== rows[0] && cellOf(r) && !cellOf(r).querySelector('picture, img, h1, h2, h3, h4, h5, h6, a'));
  const tagText = tagRow ? cellOf(tagRow).textContent.trim() : '';
  if (tagText) {
    tag = document.createElement('span');
    tag.className = 'ds-the-place-tag';
    tag.textContent = tagText;
  }

  // --- Overlay --------------------------------------------------------------
  const overlay = document.createElement('div');
  overlay.className = 'ds-the-place-overlay';

  // Reuse the authored heading element if present (server-visible, no nesting).
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    heading.classList.add('ds-the-place-h2');
    overlay.append(heading);
  }

  // Body paragraph: first text-only cell that isn't the tag or a heading/link.
  const bodyRow = rows.find((r) => {
    const cell = cellOf(r);
    if (!cell || r === tagRow) return false;
    if (cell.querySelector('picture, img, h1, h2, h3, h4, h5, h6, a')) return false;
    return cell.textContent.trim() && cell.textContent.trim() !== tagText;
  });
  if (bodyRow) {
    const body = cellOf(bodyRow);
    const p = body.querySelector('p') || body;
    p.classList.add('ds-the-place-body');
    overlay.append(p);
  }

  // Text link: clone the authored anchor, style as a per-block text link.
  const link = block.querySelector('a');
  if (link) {
    link.classList.add('ds-text-link');
    overlay.append(link);
  }

  // --- Assemble -------------------------------------------------------------
  block.textContent = '';
  block.append(bg, scrim);
  if (tag) block.append(tag);
  block.append(overlay);
}
