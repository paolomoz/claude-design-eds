/*
 * Closing block — end-of-page CTA band.
 * Authoring shape (block.children = rows, row.children = cells):
 *   row 1: [ title cell: <h2> + supporting <p> ]
 *   row 2: [ ctas cell: <strong><a> (primary) + <em><a> (secondary) ]
 * The link decorator in scripts.js maps <strong><a> -> .btn-primary and
 * <em><a> -> .btn-secondary, so we clone the cell anchors as-is.
 */

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const titleCell = rows[0]?.firstElementChild;
  const ctaCell = rows[1]?.firstElementChild;

  // Max-width wrap: section background stays full-bleed, content is wrapped.
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const row = document.createElement('div');
  row.className = 'row';

  // Left: reuse the authored heading + supporting copy (server-visible, no nesting).
  const text = document.createElement('div');
  text.className = 'text';
  if (titleCell) {
    [...titleCell.childNodes].forEach((n) => text.append(n.cloneNode(true)));
  }
  row.append(text);

  // Right: clone the CTA cell anchors into .ctas (don't manufacture buttons).
  if (ctaCell && ctaCell.querySelector('a')) {
    const ctas = document.createElement('div');
    ctas.className = 'ctas';
    [...ctaCell.childNodes].forEach((n) => ctas.append(n.cloneNode(true)));
    row.append(ctas);
  }

  wrap.append(row);
  block.replaceChildren(wrap);
}
