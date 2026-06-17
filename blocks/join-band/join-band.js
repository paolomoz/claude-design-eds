/**
 * Join Band block — recruitment band.
 * Authoring shape (block.children = rows, row.children = cells):
 *   Row 1: title cell — contains an authored heading (e.g. <h2>JOIN OUR TEAM</h2>)
 *   Row 2: link  cell — contains a plain <a> (no strong/em); rendered as a white
 *          underlined text link, NOT a button.
 *
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Max-width content wrap (the section background stays full-bleed).
  const container = document.createElement('div');
  container.className = 'container';

  // Row 1 — title. Reuse an authored heading if present (server-visible),
  // otherwise fall back to the cell's text in an <h2>.
  const titleCell = rows[0]?.firstElementChild;
  if (titleCell) {
    const heading = titleCell.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      container.append(heading);
    } else {
      const h2 = document.createElement('h2');
      h2.textContent = titleCell.textContent.trim();
      container.append(h2);
    }
  }

  // Row 2 — link. Clone the authored anchor verbatim (plain <a>, per-block styled).
  const linkCell = rows[1]?.firstElementChild;
  const anchor = linkCell?.querySelector('a');
  if (anchor) {
    container.append(anchor.cloneNode(true));
  }

  block.textContent = '';
  block.append(container);
}
