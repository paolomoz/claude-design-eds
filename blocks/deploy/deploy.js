/**
 * deploy block — "04 · DEPLOY & CONTRIBUTE" dark band.
 * Lifted from home-A-cinematic.html section.band#deploy.
 *
 * Authoring shape (block.children = rows, row.children = cells):
 *   row 0: eyebrow text        e.g. "04 · DEPLOY & CONTRIBUTE"
 *          | right-side label  e.g. "OPEN SOURCE · APACHE 2.0 · SINCE 2026"
 *   row 1: heading             <h2> (authored heading reused)
 *   row 2: card 1 | DEPLOY tag | <h3> | <p> | amber mono text link <a>
 *   row 3: card 2 | CONTRIBUTE tag | <h3> | <p> | code/pre cell
 *   row 4: tail line (Times-italic) with trailing mono link
 *
 * EDS strips <span> inside cells, so the eyebrow segments, the code-block
 * token coloring, and the tail trailing link are re-created here in JS.
 */

/** Build the mono eyebrow from "NUM · LABEL" plus an optional right label. */
function buildEyebrow(text, rightText) {
  const eyebrow = document.createElement('div');
  eyebrow.className = 'eyebrow';

  const raw = (text || '').trim();
  // split a leading "NN" off, then a "·" separator, then the rest.
  const match = raw.match(/^(\S+)\s*·\s*(.+)$/);
  if (match) {
    const num = document.createElement('span');
    num.className = 'num';
    [num.textContent] = [match[1]];
    const sep = document.createElement('span');
    sep.className = 'sep';
    sep.textContent = '·';
    const label = document.createElement('span');
    [, , label.textContent] = match;
    eyebrow.append(num, sep, label);
  } else if (raw) {
    const label = document.createElement('span');
    label.textContent = raw;
    eyebrow.append(label);
  }

  if (rightText && rightText.trim()) {
    const right = document.createElement('span');
    right.className = 'right';
    right.textContent = rightText.trim();
    eyebrow.append(right);
  }

  return eyebrow;
}

/**
 * Re-create the code-block prompt/cmd/arg span coloring (prototype #39).
 * Each non-empty line is "$ <command> <argument>": the leading "$" is the
 * prompt, the next token-run up to the last whitespace is the command, and
 * the final token is the argument.
 */
function buildCodeBlock(pre) {
  const codeBlock = document.createElement('pre');
  codeBlock.className = 'code-block';

  const lines = (pre.textContent || '').replace(/\n+$/, '').split('\n');
  lines.forEach((line, i) => {
    if (i > 0) codeBlock.append(document.createTextNode('\n'));
    const trimmed = line.trim();
    if (!trimmed) return;

    const m = trimmed.match(/^(\$)\s+(.*?)\s+(\S+)$/);
    if (m) {
      const prompt = document.createElement('span');
      prompt.className = 'prompt';
      [prompt.textContent] = [m[1]];
      const cmd = document.createElement('span');
      cmd.className = 'cmd';
      [cmd.textContent] = [m[2]];
      const arg = document.createElement('span');
      arg.className = 'arg';
      [arg.textContent] = [m[3]];
      codeBlock.append(prompt, cmd, document.createTextNode(' '), arg);
    } else {
      codeBlock.append(document.createTextNode(line));
    }
  });

  return codeBlock;
}

/** Build one .card from its row's cells. */
function buildCard(row) {
  const cells = [...row.children];
  const card = document.createElement('div');
  card.className = 'card';

  const [tagCell, titleCell, bodyCell, extraCell] = cells;

  if (tagCell && tagCell.textContent.trim()) {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = tagCell.textContent.trim();
    card.append(tag);
  }

  // reuse the authored heading element if present (server-visible)
  if (titleCell) {
    const heading = titleCell.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      card.append(heading);
    } else if (titleCell.textContent.trim()) {
      const h3 = document.createElement('h3');
      h3.textContent = titleCell.textContent.trim();
      card.append(h3);
    }
  }

  if (bodyCell) {
    bodyCell.querySelectorAll('p').forEach((p) => card.append(p));
  }

  if (extraCell) {
    const pre = extraCell.querySelector('pre');
    if (pre) {
      card.append(buildCodeBlock(pre));
    } else {
      const link = extraCell.querySelector('a');
      if (link) {
        link.classList.add('text-link');
        const wrap = document.createElement('p');
        wrap.style.marginTop = '12px';
        wrap.append(link);
        card.append(wrap);
      }
    }
  }

  return card;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  const inner = document.createElement('div');
  inner.className = 'deploy-inner';

  // row 0 — eyebrow
  const eyebrowRow = rows[0];
  if (eyebrowRow) {
    const [textCell, rightCell] = [...eyebrowRow.children];
    inner.append(buildEyebrow(
      textCell ? textCell.textContent : '',
      rightCell ? rightCell.textContent : '',
    ));
  }

  // row 1 — head (reuse authored heading)
  const headRow = rows[1];
  if (headRow) {
    const head = document.createElement('div');
    head.className = 'head';
    const heading = headRow.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      head.append(heading);
    } else if (headRow.textContent.trim()) {
      const h2 = document.createElement('h2');
      h2.textContent = headRow.textContent.trim();
      head.append(h2);
    }
    inner.append(head);
  }

  // rows 2 & 3 — the two cards
  const two = document.createElement('div');
  two.className = 'two';
  [rows[2], rows[3]].forEach((row) => {
    if (row) two.append(buildCard(row));
  });
  inner.append(two);

  // row 4 — tail line with trailing mono link
  const tailRow = rows[4];
  if (tailRow) {
    const tail = document.createElement('p');
    tail.className = 'tail';
    const cell = tailRow.firstElementChild || tailRow;
    const link = cell.querySelector('a');

    // move prose (everything that isn't the trailing link) into the tail
    const source = cell.querySelector('p') || cell;
    [...source.childNodes].forEach((node) => {
      if (link && (node === link || (node.nodeType === 1 && node.contains(link)))) return;
      tail.append(node.cloneNode(true));
    });

    if (link) {
      const linkSpan = document.createElement('span');
      linkSpan.className = 'link';
      linkSpan.append(link);
      tail.append(linkSpan);
    }
    inner.append(tail);
  }

  block.textContent = '';
  block.append(inner);
}
