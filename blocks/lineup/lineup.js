/**
 * Lineup — the six-beer substrate grid (role: section).
 *
 * Authoring contract (#62): authors place everything as flat siblings inside a
 * single cell. We flatten and segment by content, never by row/cell index:
 *   - <p> eyebrow (first paragraph, before the title)         → section eyebrow
 *   - <h2>                                                     → section title
 *   - <a> "See all six"                                       → section "more" link
 *   - then, per beer (repeating, boundary = each <h3>):
 *       • a "No. NN" number line (paragraph starting "No.")
 *       • an italic vernacular blurb (a <p>)
 *       • <h3> beer name (the repeat-heading boundary)
 *       • a "Style · ABV · Badge" spec line, split on the · delimiter
 *
 * After decorate, rendered card count MUST equal authored <h3> count.
 */

const BEER_KEYS = [
  'tabernacle',
  'cutthroat',
  'goldspike',
  'antelope',
  'powder-day',
  'hoarfrost',
];

/** slugify a beer name to a substrate key (falls back to kebab-cased name). */
function beerKey(name, index) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (BEER_KEYS.includes(slug)) return slug;
  return BEER_KEYS[index] || slug;
}

/** dark-ground substrates (light text); the rest take ink text. */
const DARK_GROUND = new Set(['tabernacle', 'cutthroat', 'hoarfrost']);

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // 1. Flatten — collect every authored element as flat siblings.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // 2. Classify the section head (eyebrow / title / more-link) from the
  //    elements BEFORE the first <h3>.
  const firstHeadingIdx = nodes.findIndex((n) => n.tagName === 'H3');
  const headNodes = firstHeadingIdx === -1 ? nodes : nodes.slice(0, firstHeadingIdx);

  const titleEl = headNodes.find((n) => /^H[12]$/.test(n.tagName));
  const moreLink = headNodes.find((n) => n.tagName === 'A' || n.querySelector?.('a'));
  const eyebrowEl = headNodes.find(
    (n) => n.tagName === 'P' && n !== moreLink && !n.querySelector('a'),
  );

  // The card body begins after the last consumed head node — so the first
  // beer's leading "No. NN" / blurb (which also sit before the first <h3>)
  // are NOT swallowed by the head.
  const headSet = new Set([eyebrowEl, titleEl, moreLink].filter(Boolean));
  let bodyStart = 0;
  nodes.forEach((n, i) => { if (headSet.has(n)) bodyStart = i + 1; });

  // 3. Segment the beer cards by the repeating <h3> boundary. Each card owns
  //    the heading plus the siblings up to (but not including) the next heading,
  //    and we look back for the "No. NN" number / blurb that precede it.
  const headingIdxs = [];
  nodes.forEach((n, i) => { if (n.tagName === 'H3') headingIdxs.push(i); });

  const cards = headingIdxs.map((hIdx, k) => {
    const start = k === 0 ? bodyStart : headingIdxs[k - 1] + 1;
    const end = k + 1 < headingIdxs.length ? headingIdxs[k + 1] : nodes.length;
    // window of nodes belonging to this card (from after prev heading to next)
    const win = nodes.slice(Math.min(start, hIdx), end);
    const heading = nodes[hIdx];
    const before = win.filter((n) => nodes.indexOf(n) < hIdx);
    const after = win.filter((n) => nodes.indexOf(n) > hIdx);

    const text = (el) => (el ? el.textContent.trim() : '');

    // number line: a paragraph whose text starts with "No."
    const numEl = before.find((n) => /^no\.?\s/i.test(text(n)));
    // blurb: the other paragraph in the "before" window (the vernacular)
    const blurbEl = before.find((n) => n !== numEl && n.tagName === 'P');
    // spec line: first element after the heading containing the · delimiter
    const specEl = after.find((n) => text(n).includes('·') || /abv/i.test(text(n)))
      || after[0];

    return {
      number: text(numEl),
      blurb: text(blurbEl),
      name: text(heading),
      spec: text(specEl),
      index: k,
    };
  });

  // 4. Build the section head.
  const head = document.createElement('div');
  head.className = 'lineup-head';
  const headInner = document.createElement('div');
  if (eyebrowEl) {
    eyebrowEl.classList.add('lineup-eyebrow');
    headInner.append(eyebrowEl);
  }
  if (titleEl) headInner.append(titleEl);
  head.append(headInner);
  if (moreLink) {
    const a = moreLink.tagName === 'A' ? moreLink : moreLink.querySelector('a');
    if (a) {
      a.classList.add('lineup-more');
      if (!a.getAttribute('href')) a.setAttribute('href', '/beers');
      head.append(a);
    }
  }

  // 5. Build the beer grid.
  const grid = document.createElement('div');
  grid.className = 'lineup-grid';
  grid.setAttribute('role', 'list');

  cards.forEach((card) => {
    const key = beerKey(card.name, card.index);
    const a = document.createElement('a');
    a.className = 'lineup-beer';
    a.setAttribute('role', 'listitem');
    a.setAttribute('data-beer', key);
    a.setAttribute(
      'href',
      `/beers#${key}`,
    );
    if (!DARK_GROUND.has(key)) a.setAttribute('data-ink', 'dark');

    // number (top-right) — recreate the <span> styling in JS (#39)
    if (card.number) {
      const num = document.createElement('span');
      num.className = 'lineup-beer-num';
      // normalise to "No. NN"
      num.textContent = card.number.replace(/^no\.?\s*/i, 'No. ');
      a.append(num);
    }

    // vernacular blurb
    if (card.blurb) {
      const blurb = document.createElement('p');
      blurb.className = 'lineup-beer-vernacular';
      blurb.textContent = card.blurb;
      a.append(blurb);
    }

    // beer name <h3>
    const name = document.createElement('h3');
    name.className = 'lineup-beer-name';
    name.textContent = card.name;
    a.append(name);

    // parse "Style · ABV · Badge" by the · delimiter
    const parts = card.spec
      ? card.spec.split('·').map((s) => s.trim()).filter(Boolean)
      : [];
    // The badge is the trailing part containing "Year-round" or "Seasonal".
    let badge = '';
    const badgeIdx = parts.findIndex((p) => /year-round|seasonal/i.test(p));
    const specParts = [...parts];
    if (badgeIdx !== -1) {
      // a seasonal badge may itself contain a · (e.g. "Seasonal · Winter");
      // everything from the badge marker onwards is the badge.
      badge = specParts.splice(badgeIdx).join(' · ');
    }
    const style = specParts[0] || '';
    const abv = specParts[1] || '';

    if (style || abv) {
      const row = document.createElement('div');
      row.className = 'lineup-beer-row';
      const s1 = document.createElement('span');
      s1.textContent = style;
      const s2 = document.createElement('span');
      s2.textContent = abv;
      row.append(s1, s2);
      a.append(row);
    }

    if (badge) {
      const b = document.createElement('span');
      b.className = 'lineup-badge';
      b.textContent = badge;
      a.append(b);
    }

    grid.append(a);
  });

  // 6. Replace the authored cell with the decorated structure, wrapped to
  //    --container (#37). The section background stays full-bleed; only the
  //    content is constrained.
  block.textContent = '';
  const wrap = document.createElement('div');
  wrap.className = 'lineup-wrap';
  wrap.append(head, grid);
  block.append(wrap);
}
