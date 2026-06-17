/**
 * alerts — full-bleed blue advisory band (role: band)
 *
 * Prototype: home-B-cinematic .alerts. Two-column band: left = eyebrow +
 * headline (with an <em> de-emphasis span) + paragraph + two CTAs; right = a
 * big numeral with a label and a small note.
 *
 * Authoring (DA-flattened, #62): ONE row, ONE cell holding all elements as
 * flat siblings — OR one element per row. We DEFAULT to a cell-level cascade
 * collector (#71): iterate cells, push each cell's child elements, else
 * synthesize a <p> from the cell's bare text. Then classify the collected
 * nodes by content, never by row/cell index:
 *   - eyebrow   — first short link-free <p> before the heading
 *   - heading   — the <h2>/<h1> title (its <em>/<strong> emphasis is kept)
 *   - body      — sentence-length link-free <p> after the heading
 *   - CTAs      — link-bearing nodes (<strong><a> primary, <em><a> ghost)
 *   - numeral   — a node whose text starts with a number (the '3')
 *   - label     — short line after the numeral
 *   - note      — remaining trailing text
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
  return el.matches('h1, h2, h3, h4, h5, h6') || !!el.querySelector('h1, h2, h3, h4, h5, h6');
}

function hasLink(el) {
  return el.matches('a') || !!el.querySelector('a');
}

function startsWithNumber(el) {
  return /^\s*\d/.test(el.textContent.trim());
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  const headingNode = nodes.find(isHeading);
  const headingIdx = headingNode ? nodes.indexOf(headingNode) : -1;

  // Link-bearing nodes are CTAs.
  const ctaNodes = nodes.filter(hasLink);

  // Text nodes that are neither heading nor CTA.
  const textNodes = nodes.filter(
    (n) => !isHeading(n) && !hasLink(n),
  );

  // eyebrow: short text BEFORE the heading; body: sentence text AFTER it.
  const beforeHeading = headingIdx >= 0
    ? textNodes.filter((n) => nodes.indexOf(n) < headingIdx)
    : [];
  const afterHeading = headingIdx >= 0
    ? textNodes.filter((n) => nodes.indexOf(n) > headingIdx)
    : textNodes;

  const eyebrowNode = beforeHeading[0]
    || textNodes.find((n) => n.textContent.trim().length < 60 && !startsWithNumber(n));

  // Among after-heading text nodes: the numeral starts with a digit.
  const numeralNode = afterHeading.find(startsWithNumber)
    || textNodes.find(startsWithNumber);

  const remaining = afterHeading.filter(
    (n) => n !== eyebrowNode && n !== numeralNode,
  );
  const bodyNode = remaining.find((n) => n.textContent.trim().length >= 40);
  const shortTexts = remaining.filter((n) => n !== bodyNode);

  // --- Build the prototype DOM ---
  const inner = document.createElement('div');
  inner.className = 'wrap alerts__inner';

  // LEFT column
  const left = document.createElement('div');

  if (eyebrowNode) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'alerts__eyebrow';
    eyebrow.textContent = eyebrowNode.textContent.trim();
    left.append(eyebrow);
  }

  if (headingNode) {
    // Reuse the authored heading element (server-visible); avoid nesting.
    const srcHeading = headingNode.matches('h1, h2, h3, h4, h5, h6')
      ? headingNode
      : headingNode.querySelector('h1, h2, h3, h4, h5, h6');
    const h2 = document.createElement('h2');
    // Re-create the <em> de-emphasis span (#39): EDS strips inline <span>,
    // so rebuild the emphasis run from the source heading's <em> if present,
    // otherwise clone the heading's child nodes verbatim.
    if (srcHeading && srcHeading.querySelector('em')) {
      [...srcHeading.childNodes].forEach((n) => h2.append(n.cloneNode(true)));
    } else if (srcHeading) {
      h2.textContent = srcHeading.textContent.trim();
    } else {
      h2.textContent = headingNode.textContent.trim();
    }
    left.append(h2);
  }

  if (bodyNode) {
    const p = document.createElement('p');
    p.textContent = bodyNode.textContent.trim();
    left.append(p);
  }

  if (ctaNodes.length) {
    const ctas = document.createElement('div');
    ctas.className = 'ctas';
    ctaNodes.forEach((node) => {
      const anchor = node.matches('a') ? node : node.querySelector('a');
      if (!anchor) return;
      const a = anchor.cloneNode(true);
      a.classList.add('btn');
      // <strong><a> → primary → white-on-blue (btn-onblue);
      // <em><a> → ghost outline (btn-ghost). (#25/#41)
      const ghost = node.matches('em') || !!node.closest('em') || node.querySelector('em');
      a.classList.add(ghost ? 'btn-ghost' : 'btn-onblue');
      ctas.append(a);
    });
    if (ctas.children.length) left.append(ctas);
  }

  inner.append(left);

  // RIGHT column — numeral. Drop count-up; render the value statically.
  const right = document.createElement('div');
  right.className = 'alerts__numeral';

  if (numeralNode) {
    const big = document.createElement('span');
    big.className = 'big';
    // Strip a leading number off the text and render it statically.
    const m = numeralNode.textContent.trim().match(/^\s*(\d[\d,]*)/);
    big.textContent = m ? m[1] : '3';
    right.append(big);
  }

  // label + note from the short trailing texts.
  const [labelNode, noteNode] = shortTexts;
  if (labelNode) {
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = labelNode.textContent.trim();
    right.append(label);
  }
  if (noteNode) {
    const small = document.createElement('small');
    small.textContent = noteNode.textContent.trim();
    right.append(small);
  }

  if (right.children.length) inner.append(right);

  block.replaceChildren(inner);
}
