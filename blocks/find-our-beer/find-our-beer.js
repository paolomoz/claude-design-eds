/**
 * FIND OUR BEER — two-column where-to-buy band.
 *
 * Authored as ONE row / ONE cell holding flat siblings:
 *   - eyebrow text (a paragraph, e.g. "Where to buy")
 *   - an <h2> (the red heading, e.g. "Find Our Beer.")
 *   - a lede paragraph
 *   - a primary CTA authored as <strong><a> (yellow button)
 *   - a secondary CTA authored as <em><a> (yellow text link)
 *
 * We flatten, classify each element by content, build the copy column, and
 * move every CTA into a right-aligned CTA column. EDS's decorateButton runs
 * after this and applies .btn / .btn-primary / .btn-secondary from the
 * <strong>/<em> wrappers.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten: grab every leaf element authored inside the single cell.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  const copy = document.createElement('div');
  copy.className = 'find-copy';

  const cta = document.createElement('div');
  cta.className = 'find-cta';

  let headingSeen = false;

  nodes.forEach((node) => {
    const isHeading = /^H[1-6]$/.test(node.tagName);
    const hasLink = node.querySelector('a') || node.tagName === 'A';

    if (hasLink) {
      // A CTA — keep the <strong>/<em> wrapper so decorateButton can style it.
      cta.append(node.cloneNode(true));
      return;
    }

    if (isHeading) {
      // Reuse the authored heading element (server-visible, avoid nesting).
      node.classList.add('find-heading');
      copy.append(node);
      headingSeen = true;
      return;
    }

    // Text paragraphs: the first one is the eyebrow, the rest are lede copy.
    if (!headingSeen && !copy.querySelector('.find-eyebrow')) {
      node.classList.add('find-eyebrow');
    } else {
      node.classList.add('find-lede');
    }
    copy.append(node);
  });

  const find = document.createElement('div');
  find.className = 'find';
  find.append(copy);
  if (cta.children.length) find.append(cta);

  block.replaceChildren(find);
}
