/*
 * find-rail — Surly "Find near you" retailer rail.
 *
 * Authored shape (#62): ONE row / ONE cell holding all elements as flat
 * siblings — eyebrow, the <h2> display title (with an <em> word), a body
 * paragraph, the CTA (a <strong><a> the runtime decorates into .btn.btn-primary),
 * and the 13 state links. We DEFAULT to flattening and classify by CONTENT, not
 * by row/cell index:
 *   - heading            → the display title (reused as-is, server-visible)
 *   - link in <strong>   → the CTA (cloned, not manufactured)
 *   - short standalone a  → a state chip (2-3 letter code)
 *   - remaining paragraph/text → eyebrow (first) then body (rest)
 * After decorate the rendered state count MUST equal the authored count (13).
 */

const STATE_RE = /^[A-Z]{2,3}$/;

export default async function decorate(block) {
  // Flatten: collect every leaf element authored in the cell, in order.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  const inner = document.createElement('div');
  inner.className = 'find-rail-inner';
  const grid = document.createElement('div');
  grid.className = 'find-rail-grid';
  const left = document.createElement('div');
  const states = document.createElement('div');
  states.className = 'find-rail-states';
  states.setAttribute('role', 'list');
  states.setAttribute('aria-label', 'States where Surly is distributed');

  let heading = null;
  let cta = null;
  const stateLinks = [];
  const texts = [];

  nodes.forEach((node) => {
    if (/^H[1-6]$/.test(node.tagName)) {
      heading = node;
      return;
    }
    // State chips first: short anchors (2-3 letter codes), one node or many.
    const anchors = node.tagName === 'A' ? [node] : [...node.querySelectorAll('a')];
    const stateAnchors = anchors.filter((a) => STATE_RE.test(a.textContent.trim()));
    if (stateAnchors.length) {
      stateLinks.push(...stateAnchors);
      return;
    }
    // CTA: a link emphasised with <strong> (→ .btn.btn-primary via the runtime).
    // Keep the <strong> wrapper so decorateButton's closest('strong') matches.
    const strong = node.matches('strong') ? node : node.querySelector('strong');
    if (strong && strong.querySelector('a')) {
      cta = strong;
      return;
    }
    // Everything else is prose (eyebrow / body).
    if (node.textContent.trim()) texts.push(node);
  });

  // Eyebrow = first prose block; body = the rest.
  if (texts.length) {
    const eyebrow = texts.shift();
    eyebrow.classList.add('find-rail-eyebrow');
    left.append(eyebrow);
  }
  if (heading) {
    heading.classList.add('find-rail-title');
    left.append(heading);
  }
  texts.forEach((p) => {
    p.classList.add('find-rail-body');
    left.append(p);
  });
  if (cta) left.append(cta);

  // State chips — reconstruct active home state (MN) by matching the code.
  stateLinks.forEach((a) => {
    const code = a.textContent.trim().toUpperCase();
    a.classList.add('find-rail-state');
    a.setAttribute('role', 'listitem');
    if (code === 'MN') a.classList.add('is-home');
    states.append(a);
  });

  grid.append(left, states);
  inner.append(grid);
  block.replaceChildren(inner);
}
