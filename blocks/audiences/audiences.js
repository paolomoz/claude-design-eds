/**
 * loads and decorates the audiences block
 *
 * Authored structure (block.children = rows, row.children = cells):
 *   Row 1  — section head:    [ title (heading) ] [ intro paragraph ]
 *   Row 2  — card 1:          [ kicker ] [ title (heading) ] [ body ] [ CTA ]
 *   Row 3  — card 2:          [ kicker ] [ title (heading) ] [ body ] [ CTA ]
 *   Row 4  — card 3:          [ kicker ] [ title (heading) ] [ body ] [ CTA ]
 *   Row 5+ — proof row:       [ label ] [ link ] [ link ] … (plain text links)
 *
 * The first card's CTA is authored as <strong><a> (primary), the others as
 * <em><a> (secondary). decorateButton() in ak.js applies the button classes at
 * page boot, so this block just clones the CTA cell as-is.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // ── Section head (row 1): heading + intro ───────────────────────────────
  const headRow = rows.shift();
  if (headRow) {
    const head = document.createElement('div');
    head.className = 'section-head';
    const [titleCell, introCell] = headRow.children;

    if (titleCell) {
      // Reuse an authored heading element if present (server-visible, no nesting).
      const heading = titleCell.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        head.append(heading);
      } else if (titleCell.textContent.trim()) {
        const h2 = document.createElement('h2');
        h2.textContent = titleCell.textContent.trim();
        head.append(h2);
      }
    }

    if (introCell && introCell.textContent.trim()) {
      const p = document.createElement('p');
      p.append(...introCell.childNodes);
      head.append(p);
    }

    if (head.childElementCount) wrap.append(head);
  }

  // ── Proof row: the LAST row whose first cell has no heading and whose
  //    later cells are plain links (label + customer-story links). ──────────
  let proofRow = null;
  const last = rows[rows.length - 1];
  if (last) {
    const cells = [...last.children];
    const hasHeading = cells.some((c) => c.querySelector('h1, h2, h3, h4, h5, h6'));
    const linkCells = cells.filter((c) => c.querySelector('a'));
    if (!hasHeading && linkCells.length >= 1 && cells.length >= 2) {
      proofRow = rows.pop();
    }
  }

  // ── Audience cards (remaining rows) ─────────────────────────────────────
  const grid = document.createElement('div');
  grid.className = 'aud-grid';

  rows.forEach((row) => {
    const cells = [...row.children];
    const card = document.createElement('div');
    card.className = 'aud';

    const [kickerCell, titleCell, bodyCell, ctaCell] = cells;

    // Kicker eyebrow — EDS strips <span> in cells, so re-create the class here.
    if (kickerCell && kickerCell.textContent.trim()) {
      const kicker = document.createElement('p');
      kicker.className = 'kicker';
      kicker.textContent = kickerCell.textContent.trim();
      card.append(kicker);
    }

    // Card title → reuse authored heading if present, else <h3>.
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

    // Body copy.
    if (bodyCell && bodyCell.textContent.trim()) {
      const p = document.createElement('p');
      p.append(...bodyCell.childNodes);
      card.append(p);
    }

    // CTA — clone the cell's contents verbatim; decorateButton() styles it.
    if (ctaCell && ctaCell.querySelector('a')) {
      [...ctaCell.childNodes].forEach((n) => card.append(n.cloneNode(true)));
    }

    grid.append(card);
  });

  if (grid.childElementCount) wrap.append(grid);

  // ── Customer-stories proof row (plain text links, not buttons) ──────────
  if (proofRow) {
    const proof = document.createElement('div');
    proof.className = 'proof-row';
    const cells = [...proofRow.children];

    const [labelCell, ...linkCells] = cells;
    if (labelCell && labelCell.textContent.trim()) {
      const lbl = document.createElement('span');
      lbl.className = 'lbl';
      lbl.textContent = labelCell.textContent.trim();
      proof.append(lbl);
    }

    linkCells.forEach((cell) => {
      cell.querySelectorAll('a').forEach((a) => proof.append(a.cloneNode(true)));
    });

    if (proof.childElementCount) wrap.append(proof);
  }

  block.replaceChildren(wrap);
}
