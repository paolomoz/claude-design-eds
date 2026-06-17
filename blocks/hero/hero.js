/**
 * Hero block — Surly home.
 * Authored as ONE row / ONE cell with all elements as flat siblings:
 *   eyebrow <p>, the page <h1>, a lede <p>, then N credit <p> rows
 *   shaped as `label · value`.
 * We flatten, classify by content/position, and rebuild the prototype DOM
 * (eyebrow / h1 with <em> emphasis / lede / .credits k-v grid) inside a
 * full-bleed .wrap so the paper background bleeds edge to edge.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten: collect every leaf element regardless of authored row/cell nesting.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // The single page heading.
  const heading = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  const headingIndex = heading ? nodes.indexOf(heading) : -1;

  // A credit row is a paragraph AFTER the heading shaped as a single
  // `label · value` (or label/value) pair — exactly one delimiter, two parts.
  // The eyebrow also contains separators but sits before the heading and has
  // more than two segments, so position + the 2-part test keep them distinct.
  const SEP = /\s[·|/–—-]\s/;
  const isCredit = (n, i) => n.tagName === 'P'
    && (headingIndex === -1 || i > headingIndex)
    && n.textContent.split(SEP).length === 2;

  nodes.forEach((node, i) => {
    if (node === heading) {
      const h1 = document.createElement('h1');
      // Recreate <em> emphasis: EDS strips author emphasis classes, so wrap
      // the emphasized run ourselves. Prefer an authored <em>; else fall back
      // to the trailing sentence fragment before the final period.
      const em = node.querySelector('em');
      if (em) {
        h1.innerHTML = node.innerHTML;
      } else {
        h1.textContent = node.textContent;
      }
      wrap.append(h1);
      return;
    }

    // Eyebrow: text/paragraph that appears before the heading.
    if (headingIndex !== -1 && i < headingIndex && !isCredit(node, i)) {
      const eyebrow = document.createElement('div');
      eyebrow.className = 'eyebrow';
      eyebrow.textContent = node.textContent.trim();
      wrap.append(eyebrow);
      return;
    }

    if (isCredit(node, i)) {
      // collected below
      return;
    }

    // Remaining paragraph after the heading = lede.
    if (node.tagName === 'P' && node.textContent.trim()) {
      const lede = document.createElement('p');
      lede.className = 'lede';
      lede.textContent = node.textContent.trim();
      wrap.append(lede);
    }
  });

  // Build the credits k/v grid from every delimited row, in authored order.
  const creditNodes = nodes.filter((n, i) => isCredit(n, i));
  if (creditNodes.length) {
    const credits = document.createElement('div');
    credits.className = 'credits';
    creditNodes.forEach((node) => {
      const [k, ...rest] = node.textContent.split(SEP);
      const v = rest.join(' ').trim();
      const cell = document.createElement('div');
      const kEl = document.createElement('div');
      kEl.className = 'k';
      kEl.textContent = k.trim();
      const vEl = document.createElement('div');
      vEl.className = 'v';
      vEl.textContent = v;
      cell.append(kEl, vEl);
      credits.append(cell);
    });
    wrap.append(credits);
  }

  block.textContent = '';
  block.append(wrap);
}
