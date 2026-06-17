/**
 * loads and decorates the logo-strip block
 *
 * Authoring shape: one row per customer; the first cell holds the customer's
 * wordmark text. EDS strips <span> wrappers inside cells, so the prototype's
 * `.logos span` styling is re-created here as `.logo` named spans.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Re-create the prototype's max-width wrap (the section border stays
  // full-bleed; only the content is wrapped).
  const wrap = document.createElement('div');
  wrap.className = 'wrap logos';
  wrap.setAttribute('role', 'list');
  wrap.setAttribute('aria-label', 'Customers');

  [...block.children].forEach((row) => {
    const cell = row.firstElementChild;
    const text = cell ? cell.textContent.trim() : '';
    if (!text) return;
    // Re-create the `.logos span` styling (EDS strips authored <span>s in cells).
    const logo = document.createElement('span');
    logo.className = 'logo';
    logo.setAttribute('role', 'listitem');
    logo.textContent = text;
    wrap.append(logo);
  });

  block.textContent = '';
  block.append(wrap);
}
