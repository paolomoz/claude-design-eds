/*
 * Stories block — 6-up housing-stories testimony grid.
 * Lifted from stardust prototype home-C-cinematic.html (.stories / .story-card).
 *
 * Authoring model (block.children = rows, row.children = cells):
 *   row 0: title       — heading cell (reused server-visible element)
 *   row 1: intro        — paragraph cell
 *   rows 2..n-1: stories — each row: [ name (h3) | excerpt (p) | read link (a) ]
 *   last row: cta        — cell holding the primary CTA link (cloned as-is)
 *
 * The portrait is a placeholder tile (per prototype provenance: captured
 * portraits are stock photos awaiting brand-team photography), recreated in JS
 * from the person's name initial.
 */

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  const container = document.createElement('div');
  container.className = 'stories-inner';

  // --- Title (row 0): reuse the authored heading element if present ---
  const titleCell = rows[0]?.firstElementChild;
  if (titleCell) {
    const heading = titleCell.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      container.append(heading);
    } else if (titleCell.textContent.trim()) {
      const h2 = document.createElement('h2');
      h2.textContent = titleCell.textContent.trim();
      container.append(h2);
    }
  }

  // --- Intro (row 1) ---
  const introCell = rows[1]?.firstElementChild;
  if (introCell && introCell.textContent.trim()) {
    const intro = document.createElement('p');
    intro.className = 'stories-intro';
    intro.textContent = introCell.textContent.trim();
    container.append(intro);
  }

  // --- Story rows: every row that has a heading/name + excerpt ---
  // CTA row is the last row when it holds only a link and no heading.
  const grid = document.createElement('div');
  grid.className = 'stories-grid-inner';

  const bodyRows = rows.slice(2);
  let ctaRow = null;

  bodyRows.forEach((row, i) => {
    const cells = [...row.children];
    const heading = cells[0]?.querySelector('h1, h2, h3, h4, h5, h6');
    const nameText = (heading?.textContent || cells[0]?.textContent || '').trim();

    // A trailing single-cell row that has a link but no name/heading is the CTA.
    const isLastRow = i === bodyRows.length - 1;
    const onlyLink = !heading
      && cells.length === 1
      && cells[0]?.querySelector('a');

    if (isLastRow && onlyLink) {
      ctaRow = row;
      return;
    }

    if (!nameText) return;

    const card = document.createElement('article');
    card.className = 'story-card';

    // Head: placeholder portrait + name
    const head = document.createElement('div');
    head.className = 'story-head';

    const portrait = document.createElement('span');
    portrait.className = 'story-portrait';
    portrait.setAttribute('aria-hidden', 'true');

    const eyebrow = document.createElement('span');
    eyebrow.className = 'placeholder-eyebrow';
    eyebrow.textContent = 'PLACEHOLDER · other';

    const shape = document.createElement('span');
    shape.className = 'placeholder-shape';
    shape.textContent = nameText.charAt(0).toUpperCase();

    portrait.append(eyebrow, shape);

    const h3 = document.createElement('h3');
    h3.textContent = nameText;

    head.append(portrait, h3);
    card.append(head);

    // Excerpt
    const excerptCell = cells[1];
    if (excerptCell && excerptCell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = excerptCell.textContent.trim();
      card.append(p);
    }

    // Read-story link (plain anchor, pinned to bottom)
    const linkCell = cells[2] || cells[1];
    const sourceLink = linkCell?.querySelector('a');
    if (sourceLink) {
      const more = sourceLink.cloneNode(true);
      more.className = 'story-more';
      card.append(more);
    }

    grid.append(card);
  });

  if (grid.children.length) container.append(grid);

  // --- CTA: clone the authored link cell, do not manufacture a button ---
  if (ctaRow) {
    const ctaCell = ctaRow.firstElementChild;
    if (ctaCell && ctaCell.querySelector('a')) {
      const cta = document.createElement('div');
      cta.className = 'stories-cta';
      [...ctaCell.childNodes].forEach((n) => cta.append(n.cloneNode(true)));
      container.append(cta);
    }
  }

  block.textContent = '';
  block.append(container);
}
