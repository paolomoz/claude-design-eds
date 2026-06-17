/**
 * whats-happening block
 *
 * Authored content shape (block.children = rows, row.children = cells):
 *   Row 1 — heading | kicker            (section title + sub-line)
 *   Rows 2..n-2 — news cards            heading | body | link
 *   Row n-1 — sessions band             image | heading | cta
 *   Row n — book row                    cover | eyebrow | heading | link
 *
 * The last two rows are detected structurally: the sessions band row carries a
 * CTA whose anchor is button-wrapped (em/strong) and the book row leads with a
 * small cover image. Everything in between is a news card.
 */

/** Promote an arrow-styled text link: ensure it carries the arrow-link class. */
function asArrowLink(anchor) {
  if (!anchor) return null;
  anchor.classList.add('arrow-link');
  return anchor;
}

/** Reuse an authored heading if present, else wrap the cell's text in `tag`. */
function headingFrom(cell, tag) {
  if (!cell) return null;
  const existing = cell.querySelector('h1, h2, h3, h4, h5, h6');
  if (existing) return existing;
  const h = document.createElement(tag);
  h.textContent = cell.textContent.trim();
  return h;
}

/** First image in a cell, normalised to a plain <img> (drop EDS <picture>). */
function imageFrom(cell) {
  if (!cell) return null;
  const img = cell.querySelector('img');
  return img || null;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  const wrap = document.createElement('div');
  wrap.className = 'wh-wrap';

  // ── Row 1: section heading + kicker ──────────────────────────────────────
  const headRow = rows.shift();
  if (headRow) {
    const cells = [...headRow.children];
    const heading = headingFrom(cells[0], 'h2');
    if (heading) {
      // server-visible heading reused as-is; only force the display size
      heading.classList.add('wh-title');
      wrap.append(heading);
    }
    const kickerText = cells[1]?.textContent.trim();
    if (kickerText) {
      const kicker = document.createElement('p');
      kicker.className = 'section-kicker';
      kicker.textContent = kickerText;
      wrap.append(kicker);
    }
  }

  // ── Detect the trailing band + book rows ────────────────────────────────
  // Book row: last row, leads with an image and has no button-wrapped CTA.
  // Sessions band: the row before it that carries a button (em/strong > a).
  let bookRow = null;
  let bandRow = null;

  if (rows.length) {
    const last = rows[rows.length - 1];
    if (imageFrom(last) && last.children.length >= 2) {
      bookRow = rows.pop();
    }
  }
  if (rows.length) {
    const last = rows[rows.length - 1];
    if (last.querySelector('em a, strong a')) {
      bandRow = rows.pop();
    }
  }

  // ── News cards (remaining rows) ─────────────────────────────────────────
  if (rows.length) {
    const grid = document.createElement('div');
    grid.className = 'news-grid';
    rows.forEach((row) => {
      const cells = [...row.children];
      const card = document.createElement('article');
      card.className = 'news-card';

      const heading = headingFrom(cells[0], 'h3');
      if (heading) card.append(heading);

      const bodyText = cells[1]?.textContent.trim();
      if (bodyText) {
        const p = document.createElement('p');
        p.textContent = bodyText;
        card.append(p);
      }

      const link = asArrowLink(cells[2]?.querySelector('a'));
      if (link) card.append(link);

      grid.append(card);
    });
    wrap.append(grid);
  }

  // ── Sessions band (dark) ────────────────────────────────────────────────
  if (bandRow) {
    const cells = [...bandRow.children];
    const band = document.createElement('div');
    band.className = 'sessions-band';

    const art = imageFrom(cells[0]);
    if (art) {
      art.classList.add('band-art');
      art.setAttribute('alt', '');
      art.setAttribute('aria-hidden', 'true');
      art.loading = 'lazy';
      band.append(art);
    }

    const copy = document.createElement('div');
    copy.className = 'band-copy';
    const heading = headingFrom(cells[1], 'h3');
    if (heading) copy.append(heading);

    const ctaCell = cells[2];
    const ctaAnchor = ctaCell?.querySelector('a');
    if (ctaAnchor) {
      const p = document.createElement('p');
      p.className = 'band-cta';
      // clone the cell's anchor as-is — ak.js applies .btn from em/strong
      p.append(ctaAnchor.cloneNode(true));
      copy.append(p);
    }
    band.append(copy);
    wrap.append(band);
  }

  // ── Book row ────────────────────────────────────────────────────────────
  if (bookRow) {
    const cells = [...bookRow.children];
    const row = document.createElement('div');
    row.className = 'book-row';

    const cover = imageFrom(cells[0]);
    if (cover) {
      cover.loading = 'lazy';
      row.append(cover);
    }

    const copy = document.createElement('div');
    copy.className = 'book-copy';

    const eyebrowText = cells[1]?.textContent.trim();
    if (eyebrowText) {
      const eyebrow = document.createElement('p');
      eyebrow.className = 'book-eyebrow mono';
      eyebrow.textContent = eyebrowText;
      copy.append(eyebrow);
    }

    const heading = headingFrom(cells[2], 'h3');
    if (heading) copy.append(heading);

    const link = asArrowLink(cells[3]?.querySelector('a'));
    if (link) {
      const p = document.createElement('p');
      p.append(link);
      copy.append(p);
    }
    row.append(copy);
    wrap.append(row);
  }

  block.textContent = '';
  block.append(wrap);
}
