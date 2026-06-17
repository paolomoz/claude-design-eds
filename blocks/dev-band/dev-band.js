/*
 * dev-band block (role: section)
 * Dark developer band: left copy (heading + prose + two CTAs + three throughput
 * meter stats) and a right syntax-highlighted code panel.
 *
 * Authored row shape (block.children = rows, row.children = cells):
 *   1. heading        — a single cell holding an <h2> (reused as-is)
 *   2. copy           — a single cell holding the body paragraph(s)
 *   3. ctas           — a single cell with the CTA links (<strong>/<em> wrapped)
 *   4–6. stat rows    — three cells each: [number] [fill % e.g. "88"] [caption]
 *   last. code panel  — a single cell holding the code (one <code>/<pre> or text)
 *
 * Meter bars are rendered at their final widths inline (no JS fill animation).
 * Code-panel token <span>s (.k/.s/.c) are re-created here since EDS strips spans.
 */

const esc = (s) => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

/* Highlight `const`/`let`/`var` keywords (.k) and quoted strings (.s)
 * in a comment-free span of code. Returns safe HTML. */
function tokenizeNonComment(text) {
  let out = '';
  const re = /('[^']*'|"[^"]*")|\b(const|let|var)\b/g;
  let last = 0;
  let m = re.exec(text);
  while (m) {
    out += esc(text.slice(last, m.index));
    out += m[1]
      ? `<span class="s">${esc(m[1])}</span>`
      : `<span class="k">${esc(m[2])}</span>`;
    last = m.index + m[0].length;
    m = re.exec(text);
  }
  out += esc(text.slice(last));
  return out;
}

/* Re-tokenize a code line: keywords (.k), strings (.s) and `//` comments (.c).
 * Re-creates the prototype's token <span>s since EDS strips spans in cells. */
function tokenize(line) {
  const commentIdx = line.indexOf('//');
  if (commentIdx !== -1 && !/['"]/.test(line.slice(0, commentIdx))) {
    const before = tokenizeNonComment(line.slice(0, commentIdx));
    const comment = esc(line.slice(commentIdx));
    return `${before}<span class="c">${comment}</span>`;
  }
  return tokenizeNonComment(line);
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Wrap: re-create the prototype's max-width content wrap.
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const grid = document.createElement('div');
  grid.className = 'dev-grid';

  const copy = document.createElement('div');
  copy.className = 'dev-copy';

  // 1. Heading — reuse the authored <h2> (server-visible; avoid nesting).
  const headingCell = rows[0]?.firstElementChild;
  const heading = headingCell?.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    copy.append(heading);
  } else if (headingCell && headingCell.textContent.trim()) {
    const h2 = document.createElement('h2');
    h2.textContent = headingCell.textContent.trim();
    copy.append(h2);
  }

  // 2. Copy — body paragraph(s).
  const copyCell = rows[1]?.firstElementChild;
  if (copyCell) {
    [...copyCell.children].forEach((p) => copy.append(p.cloneNode(true)));
    if (!copyCell.children.length && copyCell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = copyCell.textContent.trim();
      copy.append(p);
    }
  }

  // 3. CTAs — clone the cell contents; ak.js decorateButton applies btn classes.
  const ctaCell = rows[2]?.firstElementChild;
  if (ctaCell && ctaCell.querySelector('a')) {
    const ctas = document.createElement('div');
    ctas.className = 'dev-ctas';
    [...ctaCell.childNodes].forEach((n) => ctas.append(n.cloneNode(true)));
    copy.append(ctas);
  }

  // 4–6. Stat rows: [number] [fill %] [caption].
  const statRows = rows.slice(3, rows.length - 1)
    .filter((row) => row.children.length >= 2);
  if (statRows.length) {
    const stats = document.createElement('div');
    stats.className = 'dev-stats';
    statRows.forEach((row) => {
      const cells = [...row.children];
      const numText = cells[0]?.textContent.trim() || '';
      const fillText = (cells[1]?.textContent.trim() || '').replace('%', '');
      const capText = cells[2]?.textContent.trim() || '';
      const pct = Number.parseInt(fillText, 10);

      const stat = document.createElement('div');

      const num = document.createElement('div');
      num.className = 'num';
      num.textContent = numText;
      stat.append(num);

      if (!Number.isNaN(pct)) {
        const meter = document.createElement('div');
        meter.className = 'meter';
        const fill = document.createElement('span');
        fill.style.width = `${pct}%`;
        meter.append(fill);
        stat.append(meter);
      }

      if (capText) {
        const cap = document.createElement('p');
        cap.className = 'cap';
        cap.textContent = capText;
        stat.append(cap);
      }
      stats.append(stat);
    });
    copy.append(stats);
  }

  grid.append(copy);

  // Last row: code panel.
  const codeCell = rows[rows.length - 1]?.firstElementChild;
  if (codeCell) {
    const codeEl = codeCell.querySelector('code, pre');
    const raw = (codeEl ? codeEl.textContent : codeCell.textContent) || '';
    const lines = raw.replace(/\n+$/, '').split('\n');
    const pre = document.createElement('pre');
    pre.className = 'code-panel';
    const code = document.createElement('code');
    code.innerHTML = lines.map(tokenize).join('\n');
    pre.append(code);
    const panel = document.createElement('div');
    panel.className = 'dev-code';
    panel.append(pre);
    grid.append(panel);
  }

  wrap.append(grid);
  block.textContent = '';
  block.append(wrap);
}
