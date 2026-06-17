/**
 * featured — 2-up grid of feature cards (from prototype .ds-featured).
 *
 * Authored shape (flat block, one cell per line, in visual order):
 *   | dark         |   <- optional marker; flips the NEXT card to dark
 *   | Eyebrow text |
 *   | ## Heading   |   <- an h2 STARTS a new card group (#52)
 *   | Body copy    |
 *   | _Learn more_ |   <- a link wrapped in em -> btn-secondary (ak.js)
 *
 * Block JS flattens the authored cells, then segments them into one group per
 * h2: the text cell immediately before an h2 is that card's eyebrow; cells
 * after the h2 (until the next h2) are its body + CTA. A standalone "dark"
 * cell flags the next card as `.feature-card.dark` so the global on-dark
 * secondary CTA + knock-text rules apply (#41).
 */
export default async function decorate(block) {
  // DA flattens the authored content into ONE cell holding a flat sequence of
  // elements (#48/#52). Gather those leaf elements; fall back to one-cell-per-
  // row if authored that way.
  const cells = [];
  const flatCell = block.querySelector(':scope > div > div');
  if (flatCell && flatCell.children.length > 1) {
    cells.push(...flatCell.children);
  } else {
    [...block.children].forEach((row) => {
      [...row.children].forEach((cell) => cells.push(cell));
    });
  }

  // Match the element ITSELF or a descendant (#53) — flattened cells are bare.
  const HEADINGS = 'h1, h2, h3, h4, h5, h6';
  const find = (el, sel) => (el.matches(sel) ? el : el.querySelector(sel));
  const isDarkMarker = (cell) => {
    if (find(cell, `${HEADINGS}, a, img`)) return false;
    return cell.textContent.trim().toLowerCase() === 'dark';
  };
  const headingOf = (cell) => find(cell, HEADINGS);

  // Segment into card groups keyed on each h2.
  const groups = [];
  let current = null;
  let pendingDark = false;
  let pendingText = null; // a held text cell: eyebrow if an h2 follows, else body

  const flushText = () => {
    if (pendingText && current) current.body.push(pendingText);
    pendingText = null;
  };

  cells.forEach((cell) => {
    if (isDarkMarker(cell)) {
      flushText();
      pendingDark = true;
      return;
    }
    const heading = headingOf(cell);
    if (heading) {
      // The held text cell (if any) is THIS card's eyebrow, not the prior
      // card's body — so don't flush it into the previous group.
      current = {
        heading,
        dark: pendingDark,
        eyebrow: pendingText,
        body: [],
        cta: null,
      };
      groups.push(current);
      pendingDark = false;
      pendingText = null;
      return;
    }
    if (current && cell.querySelector('a')) {
      flushText();
      current.cta = cell;
      return;
    }
    // Plain-text cell: flush any prior held text into body, hold this one.
    flushText();
    pendingText = cell;
  });
  flushText();

  const grid = document.createElement('div');
  grid.className = 'featured-grid';

  // When no explicit "dark" markers were authored, fall back to the prototype's
  // alternating pattern (odd-index card is dark) so the 2-up grid still reads as
  // light + dark rather than two light cards (#59 ground match).
  const anyDark = groups.some((g) => g.dark);

  groups.forEach((group, i) => {
    const card = document.createElement('article');
    card.className = 'feature-card';
    const isDark = anyDark ? group.dark : i % 2 === 1;
    if (isDark) card.classList.add('dark');

    // Static gradient media wrap (decorative, no parallax).
    const mediaWrap = document.createElement('div');
    mediaWrap.className = 'feature-card-media-wrap';
    mediaWrap.setAttribute('aria-hidden', 'true');
    const media = document.createElement('div');
    media.className = 'feature-card-media';
    mediaWrap.append(media);
    card.append(mediaWrap);

    const copy = document.createElement('div');
    copy.className = 'feature-card-copy';

    if (group.eyebrow) {
      const eyebrow = group.eyebrow.querySelector('p') || group.eyebrow;
      eyebrow.classList.add('eyebrow', 'feature-card-eyebrow');
      copy.append(eyebrow);
    }

    // Reuse the authored heading element in place (server-visible).
    group.heading.classList.add('title-3', 'feature-card-h2');
    copy.append(group.heading);

    group.body.forEach((cell) => {
      const p = cell.querySelector('p') || cell;
      p.classList.add('body-md', 'feature-card-body');
      copy.append(p);
    });

    if (group.cta) {
      const actions = document.createElement('div');
      actions.className = 'feature-card-cta';
      // Clone the CTA cell contents as-is; em wrap -> btn-secondary via ak.js.
      [...group.cta.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
      copy.append(actions);
    }

    card.append(copy);
    grid.append(card);
  });

  block.textContent = '';
  block.append(grid);
}
