/*
 * terminal-waits — deep-blue live security-wait signage band.
 *
 * Authoring model (skill #62): the content page authors this block as ONE row
 * with ONE cell holding every line as a flat sibling. The split-flap / count-up
 * animation of the prototype is dropped — numbers render statically.
 *
 * Collection (skill #71): CELL-LEVEL cascade — iterate `:scope > div > div`
 * cells and for EACH cell push its child elements if any, ELSE synthesise a <p>
 * from the cell's own text (one-element-per-row content puts the title, meta and
 * per-terminal lines as bare-text cells that a plain `> *` walk would drop).
 *
 * Classification (skill: by content, not index): the collected nodes are then
 * segmented into a head (title + meta), N terminal cards (each begins at a bare
 * integer line = the terminal number — the repeating boundary), and a foot
 * (updated stamp + link).
 */

function textOf(el) {
  return (el.textContent || '').trim();
}

/* A terminal card is a run of lines starting with a bare integer
   (the big terminal number). Within a card, lines map by content:
   - integer            -> terminal number  (.tno)
   - "Terminal One"     -> label            (.tlabel)
   - "12 min · general" -> wait value + unit (.wait)
   - "TSA Pre✓ · …"     -> TSA note          (.tsa) + sets warn flag
   - "warn"/"busy"      -> explicit warn marker (consumed) */
function buildCard(lines) {
  const cell = document.createElement('div');
  cell.className = 'term-cell';

  let warn = false;

  lines.forEach((raw) => {
    const line = raw.trim();
    if (!line) return;

    // explicit warn marker
    if (/^(warn|busy)$/i.test(line)) {
      warn = true;
      return;
    }

    // bare terminal number
    if (/^\d+$/.test(line)) {
      const tno = document.createElement('span');
      tno.className = 'tno';
      tno.textContent = line;
      cell.append(tno);
      return;
    }

    // wait value + unit, e.g. "27 min · general"
    const waitMatch = line.match(/^(\d+)\s+(.+)$/);
    if (waitMatch && /min|wait|general|priority/i.test(line)) {
      const wait = document.createElement('div');
      wait.className = 'wait';

      const dot = document.createElement('span');
      dot.className = 'dot';

      const [, value, unit] = waitMatch;

      const v = document.createElement('span');
      v.className = 'v';
      v.textContent = value;

      const u = document.createElement('span');
      u.className = 'u';
      u.textContent = unit;

      wait.append(dot, v, u);
      cell.append(wait);
      return;
    }

    // TSA note
    if (/tsa/i.test(line)) {
      const tsa = document.createElement('div');
      tsa.className = 'tsa';
      // re-create the bold tail after the separator (EDS strips <span>/<b>)
      const sep = line.indexOf('·');
      if (sep !== -1) {
        const head = line.slice(0, sep + 1);
        const tail = line.slice(sep + 1).trim();
        tsa.append(document.createTextNode(`${head} `));
        const b = document.createElement('b');
        b.textContent = tail;
        tsa.append(b);
      } else {
        tsa.textContent = line;
      }
      cell.append(tsa);
      return;
    }

    // terminal label, e.g. "Terminal One" — bold the terminal word
    const tlabel = document.createElement('span');
    tlabel.className = 'tlabel';
    const labelMatch = line.match(/^terminal\s+(.+)$/i);
    if (labelMatch) {
      const [, name] = labelMatch;
      tlabel.append(document.createTextNode('Terminal '));
      const b = document.createElement('b');
      b.textContent = name;
      tlabel.append(b);
    } else {
      tlabel.textContent = line;
    }
    cell.append(tlabel);
  });

  if (warn) cell.classList.add('warn');
  return cell;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // 1. CELL-LEVEL cascade collector — flatten authored cells into a node list.
  const nodes = [];
  let titleHeading = null;
  let foundLink = null;

  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) {
      kids.forEach((kid) => {
        if (!titleHeading && /^H[1-6]$/.test(kid.tagName)) {
          titleHeading = kid; // reuse an authored heading (server-visible)
        } else if (kid.tagName === 'A' || kid.querySelector?.('a')) {
          foundLink = kid.tagName === 'A' ? kid : kid.querySelector('a');
          nodes.push({ type: 'link', el: foundLink });
        } else {
          nodes.push({ type: 'text', text: textOf(kid) });
        }
      });
    } else {
      const t = textOf(cell);
      if (t) nodes.push({ type: 'text', text: t });
    }
  });

  // 2. Segment: lines before the first bare-integer line are the head;
  //    each subsequent bare-integer starts a terminal card; trailing
  //    non-card lines (and the link) are the foot.
  const isNumber = (n) => n.type === 'text' && /^\d+$/.test(n.text);
  const firstCardIdx = nodes.findIndex(isNumber);

  const headLines = firstCardIdx === -1
    ? nodes.filter((n) => n.type === 'text').map((n) => n.text)
    : nodes.slice(0, firstCardIdx).filter((n) => n.type === 'text').map((n) => n.text);

  // Title text fallback if no authored heading was found.
  const titleText = titleHeading ? '' : (headLines.shift() || 'Terminals.');
  const metaText = headLines.shift() || '';

  // A line that belongs to the foot, not a card: a "Updated …" / time stamp.
  // These never join a terminal card even when they trail the last card.
  const isFoot = (n) => n.type === 'text'
    && !isNumber(n)
    && /updated|\d\s*(am|pm)\b|\b(am|pm)\b|\bet\b|\d:\d/i.test(n.text);

  // A card-body line: label / wait / tsa / explicit warn — anything that is
  // neither a card-starting number nor a foot stamp nor a link.
  const cards = [];
  const footLines = [];
  if (firstCardIdx !== -1) {
    let current = null;
    for (let i = firstCardIdx; i < nodes.length; i += 1) {
      const n = nodes[i];
      if (n.type === 'link') {
        if (current) { cards.push(current); current = null; }
      } else if (isFoot(n)) {
        if (current) { cards.push(current); current = null; }
        footLines.push(n.text);
      } else if (isNumber(n)) {
        if (current) cards.push(current);
        current = [n.text];
      } else if (current) {
        current.push(n.text);
      } else {
        footLines.push(n.text);
      }
    }
    if (current) cards.push(current);
  }

  // 3. Build the DOM.
  block.textContent = '';

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // Head
  const head = document.createElement('div');
  head.className = 'terminal-waits__head';

  // Reuse an authored heading if present (server-visible — avoid re-nesting);
  // otherwise synthesise an <h2>.
  let heading = titleHeading;
  if (!heading) {
    heading = document.createElement('h2');
    heading.textContent = titleText;
  }
  head.append(heading);

  if (metaText) {
    const meta = document.createElement('span');
    meta.className = 'meta';
    // bold the segment between separators, e.g.
    // "Live · Security & customs waits · refreshed every 5 min"
    const parts = metaText.split('·');
    if (parts.length >= 2) {
      const [lead, strong] = parts;
      meta.append(document.createTextNode(`${lead.trim()} · `));
      const b = document.createElement('b');
      b.textContent = strong.trim();
      meta.append(b);
      const rest = parts.slice(2).join('·');
      if (rest.trim()) meta.append(document.createTextNode(` · ${rest.trim()}`));
    } else {
      meta.textContent = metaText;
    }
    head.append(meta);
  }
  wrap.append(head);

  // Board
  const board = document.createElement('div');
  board.className = 'terminals-board';
  cards.forEach((lines) => board.append(buildCard(lines)));
  wrap.append(board);

  // Foot
  if (footLines.length || foundLink) {
    const foot = document.createElement('div');
    foot.className = 'terminal-waits__foot';
    if (footLines.length) {
      const [stampText] = footLines;
      const stamp = document.createElement('span');
      stamp.textContent = stampText;
      foot.append(stamp);
    }
    if (foundLink) foot.append(foundLink);
    wrap.append(foot);
  }

  block.append(wrap);
}
