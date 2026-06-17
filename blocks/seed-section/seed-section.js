/**
 * seed-section — dark manifesto band lifted from the stardust cinematic prototype.
 *
 * Authoring shape (block.children = rows, row.children = cells):
 *   row 0: [ eyebrow label e.g. "01 · THE SEED" ] [ right meta e.g. "DETERMINISTIC · TODAY-ONLY" ]
 *   row 1: [ <h2> section title (may contain <em>) ]
 *   row 2: [ pivot line (may contain <em>) ]
 *   row 3: [ lede paragraph ]
 *   row 4+: each card row -> [ tag ] [ heading (may contain <em>) ] [ body ]
 *
 * EDS strips <span> inside cells, so the eyebrow's num/sep/right spans are
 * re-created here in JS.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Build the wrapper that re-creates the prototype's .container max-width wrap.
  const wrap = document.createElement('div');
  wrap.className = 'seed-section-wrap';

  // --- Eyebrow (row 0) ---
  const eyebrowRow = rows[0];
  if (eyebrowRow) {
    const cells = [...eyebrowRow.children];
    const eyebrow = document.createElement('div');
    eyebrow.className = 'eyebrow';

    // Left cell: "01 · THE SEED" -> split into num + sep + label spans.
    const leftText = (cells[0]?.textContent || '').trim();
    if (leftText) {
      const parts = leftText.split('·').map((p) => p.trim()).filter(Boolean);
      const num = document.createElement('span');
      num.className = 'num';
      [num.textContent] = parts;
      eyebrow.append(num);
      const label = parts.slice(1).join(' · ');
      if (label) {
        const sep = document.createElement('span');
        sep.className = 'sep';
        sep.textContent = '·';
        const labelSpan = document.createElement('span');
        labelSpan.textContent = label;
        eyebrow.append(sep, labelSpan);
      }
    }

    // Right cell: meta text pushed to the right.
    const rightText = (cells[1]?.textContent || '').trim();
    if (rightText) {
      const right = document.createElement('span');
      right.className = 'right';
      right.textContent = rightText;
      eyebrow.append(right);
    }

    if (eyebrow.childElementCount) wrap.append(eyebrow);
  }

  // --- Head: title (h2) + pivot + lede ---
  const head = document.createElement('div');
  head.className = 'head';

  // Title (row 1): reuse an authored heading if present, else promote to <h2>.
  const titleCell = rows[1]?.firstElementChild;
  if (titleCell) {
    const heading = titleCell.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      heading.classList.add('title');
      head.append(heading);
    } else if (titleCell.textContent.trim()) {
      const h2 = document.createElement('h2');
      h2.className = 'title';
      h2.innerHTML = titleCell.innerHTML;
      head.append(h2);
    }
  }

  // Pivot (row 2).
  const pivotCell = rows[2]?.firstElementChild;
  if (pivotCell && pivotCell.textContent.trim()) {
    const pivot = document.createElement('p');
    pivot.className = 'pivot';
    pivot.innerHTML = pivotCell.innerHTML;
    head.append(pivot);
  }

  // Lede (row 3).
  const ledeCell = rows[3]?.firstElementChild;
  if (ledeCell && ledeCell.textContent.trim()) {
    const lede = document.createElement('p');
    lede.className = 'lede';
    lede.innerHTML = ledeCell.innerHTML;
    head.append(lede);
  }

  if (head.childElementCount) wrap.append(head);

  // --- Three-card grid (rows 4+) ---
  const cardRows = rows.slice(4).filter((r) => r.textContent.trim());
  if (cardRows.length) {
    const three = document.createElement('div');
    three.className = 'three';

    cardRows.forEach((row) => {
      const cells = [...row.children];
      const card = document.createElement('article');
      card.className = 'card';

      // tag
      const tagText = (cells[0]?.textContent || '').trim();
      if (tagText) {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.textContent = tagText;
        card.append(tag);
      }

      // heading
      const headingCell = cells[1];
      if (headingCell && headingCell.textContent.trim()) {
        const existing = headingCell.querySelector('h1, h2, h3, h4, h5, h6');
        if (existing) {
          card.append(existing);
        } else {
          const h3 = document.createElement('h3');
          h3.innerHTML = headingCell.innerHTML;
          card.append(h3);
        }
      }

      // body
      const bodyCell = cells[2];
      if (bodyCell && bodyCell.textContent.trim()) {
        const p = document.createElement('p');
        p.innerHTML = bodyCell.innerHTML;
        card.append(p);
      }

      three.append(card);
    });

    wrap.append(three);
  }

  block.textContent = '';
  block.append(wrap);
}
