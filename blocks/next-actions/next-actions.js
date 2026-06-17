/**
 * next-actions — closing CTA card ("Next: deploy once migration finishes").
 *
 * Lifts the prototype section.next: a lightning-bolt head (section title),
 * a body paragraph with an inline pink /contact chip, and a row of 5 CTAs.
 *
 * Authoring (content-driven, classified by CONTENT not row/cell index):
 *   - a heading cell        → the section title  → rendered as <h2>.next-head
 *   - a link-free paragraph → the body copy      → <p>.next-body
 *   - a cell with link(s)   → the CTA actions    → cloned into .next-btns
 *
 * CTA emphasis → global button class (decorateButton in ak.js):
 *   <strong><a>          → .btn.btn-primary    Approve & deploy
 *   <em><a>              → .btn.btn-secondary  Open prototype gallery
 *   <em><strong><a>      → .btn.btn-accent     Pause migration (warn)
 *   plain <a>            → ghost               Refresh /contact, Tweak design
 *
 * Icons are NOT authored (EDS strips inline SVG/spans from cells) — they are
 * re-created here, matched to each action by its link text. The inline pink
 * /contact chip in the body is likewise re-created (EDS strips <span>).
 */

const ICONS = {
  head: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  approve: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>',
  gallery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
  tweak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
};

/** Cell-level cascade collector: push each cell's child elements, else
 *  synthesize a <p> from the cell's own bare text (one-element-per-row DA
 *  shape drops bare-text cells under a plain `> *` selector). */
function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) out.push(...kids);
    else if (cell.textContent.trim()) {
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

/** Match an action icon by the link's visible text. */
function iconFor(textRaw) {
  const t = textRaw.toLowerCase();
  if (t.includes('approve')) return ICONS.approve;
  if (t.includes('gallery') || t.includes('prototype')) return ICONS.gallery;
  if (t.includes('pause')) return ICONS.pause;
  if (t.includes('refresh')) return ICONS.refresh;
  if (t.includes('tweak') || t.includes('design')) return ICONS.tweak;
  return '';
}

/** Re-create the inline pink /contact chip the prototype styles as a span. */
function decorateChip(p) {
  const slug = '/contact';
  if (!p.textContent.includes(slug)) return;
  const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  const targets = [];
  let node = walker.nextNode();
  while (node) {
    if (node.nodeValue.includes(slug)) targets.push(node);
    node = walker.nextNode();
  }
  targets.forEach((textNode) => {
    const idx = textNode.nodeValue.indexOf(slug);
    if (idx < 0) return;
    const after = textNode.splitText(idx);
    after.splitText(slug.length);
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = slug;
    after.replaceWith(chip);
  });
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  const headingNode = nodes.find(isHeading);
  const ctaNode = nodes.find(hasLink);
  const bodyNode = nodes.find(
    (n) => n !== headingNode && n !== ctaNode && !hasLink(n) && n.textContent.trim(),
  );

  const next = document.createElement('div');
  next.className = 'next';

  // Head — section title as <h2> with the lightning bolt icon.
  const head = document.createElement('h2');
  head.className = 'next-head';
  head.innerHTML = ICONS.head;
  const headInner = headingNode
    ? (headingNode.querySelector('h1, h2, h3, h4, h5, h6') || headingNode)
    : null;
  if (headInner) head.append(...[...headInner.childNodes].map((n) => n.cloneNode(true)));
  next.append(head);

  // Body — link-free paragraph, /contact re-created as a styled chip.
  if (bodyNode) {
    const body = document.createElement('p');
    body.className = 'next-body';
    const src = bodyNode.matches('p') ? bodyNode : (bodyNode.querySelector('p') || bodyNode);
    body.append(...[...src.childNodes].map((n) => n.cloneNode(true)));
    decorateChip(body);
    next.append(body);
  }

  // Actions — clone the CTA cell's anchors; decorateButton applies .btn-*.
  if (ctaNode) {
    const btns = document.createElement('div');
    btns.className = 'next-btns';
    [...ctaNode.childNodes].forEach((n) => btns.append(n.cloneNode(true)));
    btns.querySelectorAll('a').forEach((a) => {
      const svg = iconFor(a.textContent);
      if (svg && !a.querySelector('svg')) a.insertAdjacentHTML('afterbegin', svg);
      // A plain (non-emphasised) anchor is the ghost variant.
      if (!a.closest('strong, em')) a.classList.add('btn-ghost');
    });
    next.append(btns);
  }

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  wrap.append(next);
  block.replaceChildren(wrap);
}
