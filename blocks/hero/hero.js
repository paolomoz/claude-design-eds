/**
 * Hero block — two-column hero on a full-bleed --color-surface band.
 * Left: eyebrow + h1 + lede + two CTAs + a 4-up KPI strip.
 * Right: full-bleed image with an ink-gradient overlay + credit caption.
 *
 * Authoring contract (block.children = rows, row.children = cells):
 *   Row 1  | eyebrow text                                   |
 *   Row 2  | <h1> headline (the page's single h1)            |
 *   Row 3  | lede paragraph                                  |
 *   Row 4  | <strong><a> primary CTA + <em><a> secondary CTA |
 *   Row 5  | number | label   (KPI 1)                        |
 *   Row 6  | number | label   (KPI 2)                        |
 *   Row 7  | number | label   (KPI 3)                        |
 *   Row 8  | number | label   (KPI 4)                        |
 *   Row 9  | <picture>/<img> image | credit caption          |
 *
 * Decoration queries by element type (h1 / p / picture), never by fixed
 * row index, so authors may reorder or omit fields without breaking layout.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // --- Image + credit: the row whose first cell carries a picture/img. ---
  const imageRow = rows.find((r) => r.querySelector('picture, img'));
  const picture = imageRow?.querySelector('picture, img') || null;
  let credit = '';
  if (imageRow) {
    const cells = [...imageRow.children];
    // credit is the text of any cell that is NOT the media cell
    const creditCell = cells.find((c) => !c.querySelector('picture, img'));
    credit = creditCell ? creditCell.textContent.trim() : '';
  }

  // --- Headline: reuse the authored <h1> in place (server-visible). ---
  const headline = block.querySelector('h1') || null;

  // Resolve the direct block-child row that contains a given descendant.
  const rowOf = (el) => (el ? rows.find((r) => r.contains(el)) : null);

  // --- CTA cell: the first cell containing an anchor. ---
  const ctaCell = rows
    .map((r) => r.firstElementChild)
    .find((c) => c && c.querySelector('a'));
  const ctaRow = rowOf(ctaCell);
  const headlineRow = rowOf(headline);

  // --- Text content: eyebrow + lede are the remaining standalone paragraphs/
  //     text cells that are not the headline, CTA, KPI, or image. ---
  const usedRows = new Set([imageRow, ctaRow].filter(Boolean));

  // KPI rows: a row with exactly two cells, both plain text, no anchors/media,
  // and the first cell looking like a number/stat.
  const kpiRows = rows.filter((r) => {
    if (usedRows.has(r)) return false;
    if (r === headlineRow) return false;
    const cells = [...r.children];
    if (cells.length !== 2) return false;
    if (r.querySelector('a, picture, img, h1')) return false;
    return cells[0].textContent.trim().length > 0
      && cells[1].textContent.trim().length > 0;
  });
  kpiRows.forEach((r) => usedRows.add(r));

  // Remaining single-text rows (not headline/cta/kpi/image) = eyebrow, lede.
  const textRows = rows.filter((r) => {
    if (usedRows.has(r)) return false;
    if (r.contains(headline)) return false;
    if (r.querySelector('a, picture, img')) return false;
    return r.textContent.trim().length > 0;
  });

  // --- Build the left text column. ---
  const text = document.createElement('div');
  text.className = 'text';

  // First standalone text row → eyebrow; remaining → lede paragraphs.
  textRows.forEach((r, i) => {
    const value = r.textContent.trim();
    if (!value) return;
    if (i === 0) {
      const eyebrow = document.createElement('div');
      eyebrow.className = 'eyebrow';
      eyebrow.textContent = value;
      text.append(eyebrow);
    }
  });

  // Headline — move the authored <h1> into the column (avoid nesting/re-creating).
  if (headline) {
    text.append(headline);
  }

  // Lede — any text rows after the eyebrow.
  textRows.slice(1).forEach((r) => {
    const value = r.textContent.trim();
    if (!value) return;
    const p = document.createElement('p');
    p.className = 'lede';
    p.textContent = value;
    text.append(p);
  });

  // CTAs — clone the cell's anchors as-is; the global decorator turns
  // <strong><a> into .btn-primary and <em><a> into .btn-secondary.
  if (ctaCell && ctaCell.querySelector('a')) {
    const actions = document.createElement('div');
    actions.className = 'actions';
    [...ctaCell.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
    text.append(actions);
  }

  // KPI strip — re-create the .kpi / .n / .l span-class structure in JS,
  // since EDS strips <span>/class attributes from authored cells.
  if (kpiRows.length) {
    const strip = document.createElement('div');
    strip.className = 'kpi-strip';
    strip.setAttribute('aria-label', 'Kennzahlen');
    kpiRows.forEach((r) => {
      const [numCell, labelCell] = r.children;
      const kpi = document.createElement('div');
      kpi.className = 'kpi';
      const n = document.createElement('div');
      n.className = 'n';
      n.innerHTML = numCell.innerHTML.trim();
      const l = document.createElement('div');
      l.className = 'l';
      l.innerHTML = labelCell.innerHTML.trim();
      kpi.append(n, l);
      strip.append(kpi);
    });
    text.append(strip);
  }

  // --- Build the right image column. ---
  const image = document.createElement('div');
  image.className = 'image';
  if (picture) {
    image.append(picture);
  }
  if (credit) {
    const cap = document.createElement('div');
    cap.className = 'credit';
    cap.textContent = credit;
    image.append(cap);
  }

  // --- Assemble inside a .wrap so the surface band bleeds full-width
  //     while content stays constrained to --maxw. ---
  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  wrap.append(text, image);

  block.textContent = '';
  block.append(wrap);
}
