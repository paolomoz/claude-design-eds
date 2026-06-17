/**
 * Community block — enumeration spread.
 *
 * Authored as ONE row / ONE cell holding flat siblings:
 *   - a heading (the eyebrow / section title)  → rendered as <h2 class="pre">
 *   - 12 <p>, one per community-member name     → built into <ul class="roster">
 *   - a closing <p>                             → rendered as <p class="closing">
 *
 * decorate() flattens the cell and classifies by content (heading vs
 * repeating names vs trailing paragraph) rather than by row/cell index.
 * Odd/even roster colour is applied via :nth-child in CSS.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten: grab every authored element regardless of row/cell nesting.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // First heading = the eyebrow / title. Reuse the authored element if it is
  // already a heading (server-visible, avoids nesting); otherwise promote the
  // first paragraph to an <h2>.
  let pre = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  const paragraphs = nodes.filter((n) => n.tagName === 'P');

  if (!pre && paragraphs.length) {
    const first = paragraphs.shift();
    pre = document.createElement('h2');
    pre.textContent = first.textContent.trim();
  } else if (pre) {
    // Normalise an authored heading to <h2> with the right class.
    if (pre.tagName !== 'H2') {
      const h2 = document.createElement('h2');
      h2.textContent = pre.textContent.trim();
      pre.replaceWith(h2);
      pre = h2;
    }
  }
  if (pre) pre.classList.add('pre');

  // The trailing paragraph is the closing line; everything before it is a name.
  const closing = paragraphs.length > 1 ? paragraphs.pop() : null;
  const names = paragraphs;

  // Build the two-column roster from the name paragraphs.
  const roster = document.createElement('ul');
  roster.className = 'roster';
  names.forEach((p) => {
    const li = document.createElement('li');
    li.textContent = p.textContent.trim();
    roster.append(li);
  });

  if (closing) closing.classList.add('closing');

  // Reassemble inside a centered wrap (recreates the prototype's .inner),
  // in order: eyebrow, roster, closing.
  const inner = document.createElement('div');
  inner.className = 'inner';
  if (pre) inner.append(pre);
  if (roster.children.length) inner.append(roster);
  if (closing) inner.append(closing);

  block.textContent = '';
  block.append(inner);
}
