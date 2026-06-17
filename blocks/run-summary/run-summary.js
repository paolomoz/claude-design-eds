/**
 * run-summary — dashboard hero / run header.
 *
 * Authored shape (one element per row, bare-text cells):
 *   row 1 → url command line          (e.g. "acmecorp.com · brand-faithful Mode A")
 *   row 2 → section title             ("acmecorp.com — redesigned")  → <h2>
 *   row 3 → status pill text          ("migrating")
 *   row 4+ → meta items               ("started 12 min ago", "12 pages", "eta ~4 min")
 *
 * Cells may carry their own elements OR be bare-text; we collect at the cell
 * level (one node per cell) and classify BY CONTENT, never by row index.
 */

// Collect one node per content cell: prefer the cell's child element,
// else synthesize a <p> from the cell's own text.
function collectCells(block) {
  const nodes = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const child = cell.querySelector(':scope > *');
    if (child) {
      nodes.push(child);
    } else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      nodes.push(p);
    }
  });
  return nodes;
}

// Wrap the em-dash tail of the title in a .light span (EDS strips spans,
// so re-create it here). "acmecorp.com — redesigned" → "<span>— redesigned</span>".
function decorateTitle(heading) {
  const text = heading.textContent.trim();
  const match = text.match(/^(.*?)(\s*[—–-]\s*.+)$/);
  if (!match) {
    heading.textContent = text;
    return;
  }
  heading.textContent = '';
  heading.append(document.createTextNode(`${match[1].trim()} `));
  const light = document.createElement('span');
  light.className = 'light';
  light.textContent = match[2].trim();
  heading.append(light);
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const nodes = collectCells(block);

  // Classify by content.
  const heading = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  const headingIdx = nodes.indexOf(heading);
  const rest = nodes.filter((n) => n !== heading);

  // The first node (before the heading) is the $ command url;
  // everything after the heading is meta (status pill + items).
  let url = null;
  if (headingIdx !== 0 && rest.length) {
    url = rest.shift();
  }
  const metaNodes = rest;

  const hero = document.createElement('section');
  hero.className = 'dash-hero';

  if (url) {
    const urlEl = document.createElement('div');
    urlEl.className = 'dash-url';
    urlEl.textContent = url.textContent.trim();
    hero.append(urlEl);
  }

  // Section title → <h2>.
  const h2 = document.createElement('h2');
  h2.className = 'dash-title';
  if (heading) {
    h2.textContent = heading.textContent;
  } else if (metaNodes.length) {
    h2.textContent = metaNodes.shift().textContent.trim();
  }
  decorateTitle(h2);
  hero.append(h2);

  if (metaNodes.length) {
    const meta = document.createElement('div');
    meta.className = 'dash-meta';

    // First meta node → status pill (short, single token); recreate pulse in JS.
    const [first, ...items] = metaNodes;
    const pill = document.createElement('span');
    pill.className = 'status-pill';
    const pulse = document.createElement('span');
    pulse.className = 'pulse';
    pill.append(pulse, document.createTextNode(` ${first.textContent.trim()}`));
    meta.append(pill);

    // Remaining nodes → meta items. Wrap leading/inline figures in <b>.
    items.forEach((node) => {
      const item = document.createElement('span');
      item.className = 'dash-meta-item';
      const text = node.textContent.trim();
      // Emphasise the value: a number, a duration, or the trailing "ago" phrase.
      const m = text.match(/^(.*?)(\b[~\d][\w~. ]*?(?:ago)?)\s*$/);
      if (m && m[2] && m[1].trim()) {
        item.append(document.createTextNode(`${m[1].trim()} `));
        const b = document.createElement('b');
        b.textContent = m[2].trim();
        item.append(b);
      } else if (/^\d/.test(text)) {
        // Leading number ("12 pages") → bold the number.
        const [, value, tail] = text.match(/^(\d[\d.,]*)\s*(.*)$/);
        const b = document.createElement('b');
        b.textContent = value;
        item.append(b);
        if (tail) item.append(document.createTextNode(` ${tail}`));
      } else {
        item.textContent = text;
      }
      meta.append(item);
    });

    hero.append(meta);
  }

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  wrap.append(hero);

  block.textContent = '';
  block.append(wrap);
}
