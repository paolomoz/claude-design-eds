/**
 * Hero block — split layout lifted from en-it-C-cinematic.html
 * section[data-section="hero"]. A decorative aurora image bleeds from the
 * right column; copy + CTAs sit in the left column.
 *
 * Authoring shape (block.children = rows, row.children = cells):
 *   row 0 — aurora image cell (decorative; may be empty → CSS fallback)
 *   row 1 — title cell (an authored heading; mark the highlight run with <em>)
 *   row 2 — CTAs cell (strong<a> = primary, em<a> = secondary)
 *
 * EDS strips <span> from authored cells, so the highlight gesture is
 * re-created here in JS from the authored <em> (or a marked run).
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const [imageRow, titleRow, ctaRow] = rows;

  // ── grid + copy column ──────────────────────────────────────────────
  const grid = document.createElement('div');
  grid.className = 'hero-grid';

  const copy = document.createElement('div');
  copy.className = 'hero-copy';

  // Title — reuse the authored heading element if present (server-visible,
  // avoid nesting). Re-create the highlight <span class="hl"> from the
  // authored <em> (EDS strips bare <span> in cells).
  const titleCell = titleRow?.firstElementChild;
  if (titleCell) {
    const heading = titleCell.querySelector('h1, h2, h3, h4, h5, h6') || titleCell;
    heading.querySelectorAll('em').forEach((em) => {
      const hl = document.createElement('span');
      hl.className = 'hl';
      hl.append(...em.childNodes);
      em.replaceWith(hl);
    });
    copy.append(heading);
  }

  // CTAs — clone the cell's anchors as-is; the link decorator applies
  // .btn / .btn-primary / .btn-secondary from the strong/em wrap at boot.
  const ctaCell = ctaRow?.firstElementChild;
  if (ctaCell && ctaCell.querySelector('a')) {
    const ctas = document.createElement('div');
    ctas.className = 'hero-ctas';
    [...ctaCell.childNodes].forEach((n) => ctas.append(n.cloneNode(true)));
    copy.append(ctas);
  }

  grid.append(copy);

  // empty right column — the aurora bleeds through it
  const spacer = document.createElement('div');
  spacer.setAttribute('aria-hidden', 'true');
  grid.append(spacer);

  // ── decorative aurora (absolutely positioned, bleeds from the right) ──
  const imageCell = imageRow?.firstElementChild;
  const img = imageCell?.querySelector('img');
  if (img) {
    img.classList.add('hero-aurora');
    img.setAttribute('aria-hidden', 'true');
    img.setAttribute('alt', '');
    block.prepend(img);
  } else {
    // no authored image — CSS fallback paints the aurora element
    const fallback = document.createElement('span');
    fallback.className = 'hero-aurora';
    fallback.setAttribute('aria-hidden', 'true');
    block.prepend(fallback);
  }

  // replace the authored rows with the decorated grid
  rows.forEach((row) => row.remove());
  block.append(grid);
}
