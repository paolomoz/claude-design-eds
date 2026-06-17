/**
 * developer — technical credibility (split-media: points list + figure)
 *
 * Lifted from stardust prototype section.dev (home-C-cinematic.html). The whole
 * section sits on a dark midnight ground; the block root carries `.dark` and
 * `.dev` so the global on-dark secondary/ghost button override applies (#41).
 *
 * Authoring rows (positional):
 *   1. headline      — reuse the authored heading if present, else <h2>
 *   2. lede          — intro paragraph
 *   3. figure image  — optional cell holding a <picture>/<img>
 *   4..N. point rows — cell 1: mono <code> kicker, cell 2: prose
 *   last. CTAs       — <strong><a> -> primary, <em><a> -> secondary (ghost)
 *
 * The <code> kicker that leads each point is re-created here in decorate()
 * (#39) — EDS strips inline structure in cells, so the kicker is authored as a
 * plain cell and wrapped in <code> in JS.
 */

function text(cell) {
  return cell ? cell.textContent.trim() : '';
}

export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // Mark the dark surface so the on-dark button override (styles.css #41) applies.
  block.classList.add('dark');

  // Heading — reuse an authored heading element if present (server-visible,
  // avoids nesting); otherwise promote the title text to <h2>.
  const headingRow = rows[0];
  let heading = headingRow ? headingRow.querySelector('h1, h2, h3, h4, h5, h6') : null;
  if (!heading && headingRow) {
    heading = document.createElement('h2');
    heading.textContent = text(headingRow);
  }

  // Lede — first link-free paragraph in the second row.
  const lede = document.createElement('p');
  lede.className = 'lede';
  lede.textContent = text(rows[1]);

  // Figure image — optional cell holding a <picture>/<img>.
  const figureRow = rows[2];
  const pic = figureRow ? figureRow.querySelector('picture, img') : null;
  const figure = document.createElement('figure');
  if (pic) figure.append(pic.closest('picture') || pic);

  // CTA row — the last row whose cell contains an anchor.
  const ctaRow = [...rows].reverse().find((r) => r.querySelector('a'));

  // Point rows — every row between the lede/figure and the CTA row that is not
  // the heading, lede, figure or CTA row. Each carries: kicker cell | prose cell.
  const pointRows = rows.filter((r, i) => i > 2 && r !== ctaRow);

  const points = document.createElement('ul');
  points.className = 'points';
  pointRows.forEach((row) => {
    const cells = [...row.children];
    const kickerText = text(cells[0]);
    const proseText = text(cells[1]);
    if (!kickerText && !proseText) return;
    const li = document.createElement('li');
    if (kickerText) {
      const code = document.createElement('code');
      code.textContent = kickerText;
      li.append(code);
    }
    if (proseText) li.append(document.createTextNode(proseText));
    points.append(li);
  });

  const cols = document.createElement('div');
  cols.className = 'cols';
  cols.append(points, figure);

  // CTAs — clone the cell's child nodes; the EDS link decorator applies
  // .btn-primary (<strong><a>) / .btn-secondary (<em><a>); the secondary
  // becomes a ghost-on-dark via the global .section.dark override.
  const ctas = document.createElement('div');
  ctas.className = 'ctas';
  if (ctaRow) {
    const cell = ctaRow.firstElementChild;
    [...cell.childNodes].forEach((n) => ctas.append(n.cloneNode(true)));
  }

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  if (heading) wrap.append(heading);
  wrap.append(lede, cols);
  if (ctas.childNodes.length) wrap.append(ctas);

  block.replaceChildren(wrap);
}
