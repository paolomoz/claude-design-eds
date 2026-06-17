/**
 * loads and decorates the proof-row block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Row 0: the proof line. The dollar/stat figure is wrapped in a
  // <span class="stat-display"> — EDS strips spans in cells, so we
  // re-create the stat span here. Convention: author writes the stat
  // figure inside <strong> (or as the only emphasised run) in the cell.
  const lineCell = rows[0]?.firstElementChild;
  let proofLine;
  if (lineCell) {
    proofLine = document.createElement('p');
    proofLine.className = 'proof-line';
    const strong = lineCell.querySelector('strong, em, b');
    if (strong) {
      // Lead text is everything before the emphasised run; the emphasised
      // run becomes the stat-display span.
      const stat = document.createElement('span');
      stat.className = 'stat-display';
      stat.textContent = strong.textContent.trim();
      // Collect lead text from text nodes before the emphasised element.
      const lead = [...lineCell.childNodes]
        .filter((n) => n !== strong && !strong.contains(n))
        .map((n) => n.textContent)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (lead) proofLine.append(document.createTextNode(`${lead} `));
      proofLine.append(stat);
    } else {
      proofLine.textContent = lineCell.textContent.replace(/\s+/g, ' ').trim();
    }
  }

  // Row 1: the customer wordmarks — one per line/paragraph in the cell.
  // EDS strips spans, so re-create each name as a styled <span> with
  // role=listitem inside a role=list flex row.
  const logosCell = rows[1]?.firstElementChild;
  let logos;
  if (logosCell) {
    const names = [...logosCell.children]
      .map((el) => el.textContent.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (names.length === 0) {
      const fallback = logosCell.textContent.replace(/\s+/g, ' ').trim();
      if (fallback) names.push(...fallback.split(/\s*,\s*/).filter(Boolean));
    }
    if (names.length) {
      logos = document.createElement('div');
      logos.className = 'proof-logos';
      logos.setAttribute('role', 'list');
      logos.setAttribute('aria-label', 'Customers');
      names.forEach((name) => {
        const span = document.createElement('span');
        span.setAttribute('role', 'listitem');
        span.textContent = name;
        logos.append(span);
      });
    }
  }

  // Re-create the prototype's max-width content wrap.
  const wrap = document.createElement('div');
  wrap.className = 'proof-wrap';
  if (proofLine) wrap.append(proofLine);
  if (logos) wrap.append(logos);

  block.textContent = '';
  block.append(wrap);
}
