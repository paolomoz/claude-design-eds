/**
 * heritage — brand-anchor editorial spread (prototype data-section="heritage").
 *
 * A black, 2-column editorial spread. LEFT: an eyebrow above a GIANT display
 * numeral (the founding year, authored as <h2>1996</h2>). RIGHT: brewery-origin
 * prose paragraphs. Content constrained to --maxw.
 *
 * Authoring rows (classified by CONTENT, never by index):
 *   row 1   eyebrow line  ("The early days")
 *   row 2   <h2>1996</h2> — the giant year numeral (heading element)
 *   rows 3+ one prose paragraph each
 *
 * Decode is a cell-level cascade collector (#71): iterate :scope>div>div cells;
 * push child elements, else synth a <p> from the cell's text. Then classify:
 *   - the first heading (h1..h6) is the giant year
 *   - the short text run BEFORE the year is the eyebrow
 *   - everything else is prose
 */

function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) {
      out.push(...kids);
    } else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      out.push(p);
    }
  });
  return out.length ? out : [...block.children];
}

function isHeading(el) {
  return el.matches('h1, h2, h3, h4, h5, h6') || el.querySelector('h1, h2, h3, h4, h5, h6');
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  // The giant year is the first heading; the eyebrow is the text run that
  // precedes it; everything after the year is prose.
  const yearIdx = nodes.findIndex(isHeading);
  const yearNode = yearIdx >= 0 ? nodes[yearIdx] : null;

  const before = yearIdx >= 0 ? nodes.slice(0, yearIdx) : [];
  const after = yearIdx >= 0 ? nodes.slice(yearIdx + 1) : nodes;

  const eyebrowNode = before.find((n) => n.textContent.trim()) || null;
  const proseNodes = after.filter((n) => n.textContent.trim());

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // LEFT column — eyebrow + giant year numeral.
  const left = document.createElement('div');
  left.className = 'heritage-text';

  if (eyebrowNode) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'heritage-eyebrow';
    eyebrow.textContent = eyebrowNode.textContent.trim();
    left.append(eyebrow);
  }

  if (yearNode) {
    // Unwrap the cell's own heading so we don't double it (#55).
    const inner = yearNode.matches('h1, h2, h3, h4, h5, h6')
      ? yearNode
      : yearNode.querySelector('h1, h2, h3, h4, h5, h6') || yearNode;
    const year = document.createElement('h2');
    year.className = 'heritage-year';
    year.append(...inner.childNodes);
    left.append(year);
  }

  // RIGHT column — prose.
  const right = document.createElement('div');
  right.className = 'heritage-prose';
  proseNodes.forEach((n) => {
    if (n.matches('p')) {
      right.append(n);
    } else {
      const p = document.createElement('p');
      p.append(...n.childNodes);
      right.append(p);
    }
  });

  wrap.append(left, right);
  block.replaceChildren(wrap);
}
