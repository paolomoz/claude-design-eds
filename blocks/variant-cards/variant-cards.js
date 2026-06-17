/**
 * variant-cards — 3-up variant preview grid (one card per rendered variant).
 *
 * Section title "Variants" → <h2>. Each variant is a card with an inline-SVG
 * wireframe thumbnail, an optional "approved" badge (mint border), a title, and
 * a meta line. The approved card is flagged by an authored `approved` keyword
 * on that card.
 *
 * Authoring shape (DA flattens to one cell of flat siblings — tolerate both):
 *   Variants                       ← section heading (h2 or bare text)
 *   A · faithful · 1:15 · captured + fixes
 *   B · photo-amplified · 1:42 · the chosen one · approved
 *   C · cinematic · 2:08 · live-systems · Pass 6
 * Each card is one delimited <p> line (split on ·): first segment = title,
 * a trailing `approved` keyword flags the approved card, the remainder = meta.
 */

/* Inline SVG wireframe mockups, keyed by card index (0=A, 1=B approved, 2=C). */
const THUMBS = [
  `<svg viewBox="0 0 160 110" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="160" height="110" fill="#1c1c23"/>
    <rect x="0" y="0" width="160" height="14" fill="#0F2A4D"/>
    <rect x="14" y="26" width="76" height="6" fill="#e6e6e6"/>
    <rect x="14" y="36" width="60" height="6" fill="#e6e6e6"/>
    <rect x="14" y="50" width="34" height="10" rx="2" fill="#C4554E"/>
    <rect x="96" y="26" width="50" height="36" rx="4" fill="#9aa9bc" opacity="0.4"/>
    <rect x="14" y="74" width="132" height="28" rx="3" fill="#444" opacity="0.4"/>
  </svg>`,
  `<svg viewBox="0 0 160 110" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="160" height="110" fill="#F8F4ED"/>
    <rect x="0" y="0" width="160" height="14" fill="#0F2A4D"/>
    <rect x="14" y="26" width="50" height="74" rx="4" fill="#9aa9bc"/>
    <rect x="20" y="48" width="30" height="3" fill="#fff" opacity="0.7"/>
    <rect x="20" y="55" width="22" height="3" fill="#fff" opacity="0.5"/>
    <rect x="74" y="26" width="72" height="8" fill="#0F2A4D"/>
    <rect x="74" y="40" width="66" height="3" fill="#1a1a1a" opacity="0.6"/>
    <rect x="74" y="48" width="56" height="3" fill="#1a1a1a" opacity="0.4"/>
    <rect x="74" y="64" width="30" height="9" rx="2" fill="#C4554E"/>
    <rect x="74" y="82" width="72" height="20" rx="2" fill="#E8E2D5"/>
  </svg>`,
  `<svg viewBox="0 0 160 110" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="160" height="110" fill="#0F2A4D"/>
    <rect x="0" y="0" width="160" height="14" fill="#0a1a30"/>
    <rect x="14" y="32" width="80" height="10" fill="#fff" opacity="0.95"/>
    <rect x="14" y="44" width="60" height="10" fill="#C4554E"/>
    <rect x="14" y="62" width="100" height="3" fill="#fff" opacity="0.5"/>
    <rect x="14" y="68" width="80" height="3" fill="#fff" opacity="0.5"/>
    <circle cx="125" cy="50" r="22" fill="none" stroke="#C4554E" stroke-width="1.5" opacity="0.7"/>
    <circle cx="125" cy="50" r="14" fill="#C4554E" opacity="0.3"/>
    <rect x="14" y="82" width="60" height="20" rx="2" fill="#fff" opacity="0.08"/>
    <rect x="78" y="82" width="60" height="20" rx="2" fill="#fff" opacity="0.08"/>
  </svg>`,
];

const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';

/* Cell-level cascade collector (#62/#68/#71): iterate each cell, push its child
   elements if any, else synthesise a <p> from the cell's own text. */
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

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  // The first heading (or first node) is the section title; the rest are cards.
  const headIdx = nodes.findIndex(isHeading);
  const headNode = headIdx >= 0 ? nodes[headIdx] : nodes[0];
  const cardNodes = nodes.filter((n) => n !== headNode);

  const headText = (headNode.textContent || 'Variants').trim();

  const frag = document.createDocumentFragment();
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // Section heading → <h2>.
  const sectH = document.createElement('div');
  sectH.className = 'sect-h';
  const h2 = document.createElement('h2');
  h2.textContent = headText;
  sectH.append(h2);
  // Optional hint after the heading: "N rendered · M approved".
  const rendered = cardNodes.length;
  const approvedCount = cardNodes.filter((n) => /\bapproved\b/i.test(n.textContent)).length;
  if (rendered) {
    const hint = document.createElement('span');
    hint.className = 'sect-h__hint';
    hint.textContent = `${rendered} rendered · ${approvedCount} approved`;
    sectH.append(hint);
  }
  wrap.append(sectH);

  const grid = document.createElement('div');
  grid.className = 'variants';

  cardNodes.forEach((node, i) => {
    // Split the delimited line into segments; first = title, rest = meta.
    const raw = node.textContent.trim();
    const segs = raw.split('·').map((s) => s.trim()).filter(Boolean);
    const approved = /\bapproved\b/i.test(raw);
    // Drop a trailing "approved" keyword from the meta segments.
    const metaSegs = segs.slice(1).filter((s) => !/^approved$/i.test(s));
    const title = segs[0] || raw;
    const meta = metaSegs.join(' · ');

    const card = document.createElement('article');
    card.className = approved ? 'variant variant--approved' : 'variant';

    const thumb = document.createElement('div');
    thumb.className = 'variant__thumb';
    thumb.innerHTML = THUMBS[i % THUMBS.length];

    if (approved) {
      const badge = document.createElement('span');
      badge.className = 'variant__badge';
      badge.innerHTML = `${CHECK_SVG} approved`;
      thumb.append(badge);
    }

    const body = document.createElement('div');
    body.className = 'variant__body';
    const titleEl = document.createElement('div');
    titleEl.className = 'variant__title';
    titleEl.textContent = title;
    body.append(titleEl);
    if (meta) {
      const metaEl = document.createElement('div');
      metaEl.className = 'variant__meta';
      metaEl.textContent = meta;
      body.append(metaEl);
    }

    card.append(thumb, body);
    grid.append(card);
  });

  wrap.append(grid);
  frag.append(wrap);
  block.replaceChildren(frag);
}
