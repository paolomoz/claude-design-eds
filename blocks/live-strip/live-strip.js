/**
 * live-strip — dark edge-to-edge operational ticker.
 *
 * Authoring shape (block.children = rows, row.children = cells):
 *   Row 1 (single cell): the live label text, e.g. "Live".
 *   Rows 2..N (two cells): metric label | metric value, e.g.
 *     "Global GDP running on Stripe:" | "1.66283266%"
 *
 * EDS strips <span> wrappers from authored cells, so the pulsing label and the
 * bolded metric runs are (re)built here in the DOM. The value is rendered
 * statically — any data-countup choreography in the prototype is decorative.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Constrain the ticker content to the max-width wrap; the dark background
  // stays full-bleed on the section.
  const row = document.createElement('div');
  row.className = 'wrap live-strip__row';

  rows.forEach((tr, i) => {
    const cells = [...tr.children];

    if (i === 0) {
      // Live label — a pulsing green dot (added via ::before in CSS) + text.
      const label = document.createElement('span');
      label.className = 'live-strip__label';
      label.textContent = (cells[0]?.textContent || 'Live').trim();
      row.append(label);
      return;
    }

    const labelText = (cells[0]?.textContent || '').trim();
    const valueText = (cells[1]?.textContent || '').trim();
    if (!labelText && !valueText) return;

    const item = document.createElement('span');
    item.className = 'live-strip__item';
    if (labelText) item.append(`${labelText} `);
    if (valueText) {
      const strong = document.createElement('strong');
      strong.textContent = valueText;
      item.append(strong);
    }
    row.append(item);
  });

  block.textContent = '';
  block.append(row);
}
