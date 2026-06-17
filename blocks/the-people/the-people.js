/*
 * The People block (role: band)
 * Full-bleed split band: two whole-tile anchors, each a cover photo with a
 * bottom overlay (eyebrow, taproom name, teaser, underlined CTA).
 *
 * Authored shape: each tile is one row. Cells (order-independent, classified
 * by content):
 *   - image cell      → contains an <img> (the cover photo)
 *   - title cell      → contains a heading (the taproom name)
 *   - cta/link cell   → contains an <a> (supplies the tile href + CTA label)
 *   - remaining text  → eyebrow (first) then teaser
 */

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
const isHeading = (el) => el && /^H[1-6]$/.test(el.tagName);

/**
 * DA flattens both taprooms into a single cell with their elements as flat
 * siblings delimited by the taproom <h2>. Segment that flat list into one
 * group per heading; fall back to one-row-per-tile when authored that way.
 */
function tileSources(block) {
  const rows = [...block.children];
  const firstCell = rows[0]?.firstElementChild || rows[0];
  const flatHeadings = firstCell
    ? [...firstCell.children].filter(isHeading).length : 0;
  if (rows.length === 1 && flatHeadings >= 2) {
    const groups = [];
    let current = null;
    [...firstCell.children].forEach((el) => {
      if (isHeading(el)) {
        current = [el];
        groups.push(current);
      } else if (current) {
        current.push(el);
      }
    });
    return groups; // array of element-arrays
  }
  return rows; // array of row elements
}

export default async function decorate(block) {
  const sources = tileSources(block);

  const tiles = sources.map((source) => {
    const isArr = Array.isArray(source);
    const cells = isArr ? source : [...source.children];
    const has = (el, sel) => (el.matches?.(sel) || !!el.querySelector?.(sel));

    // Classify cells/elements by their server-visible content.
    const imgCell = cells.find((c) => has(c, 'img'));
    const headingCell = cells.find((c) => isHeading(c) || c.querySelector?.('h1, h2, h3, h4, h5, h6'));
    const linkCell = cells.find((c) => has(c, 'a'));
    const textCells = cells.filter((c) => c !== imgCell
      && c !== headingCell
      && c !== linkCell
      && c.textContent.trim());

    // The tile itself is the click target — a plain anchor wrapping everything.
    const half = document.createElement('a');
    half.className = 'ds-people-half';

    const anchor = linkCell
      && (linkCell.tagName === 'A' ? linkCell : linkCell.querySelector('a'));
    if (anchor) half.href = anchor.getAttribute('href') || '#';

    // Cover image (absolute), or an empty element that falls back to a CSS bg.
    const bg = imgCell && (imgCell.tagName === 'IMG' ? imgCell : imgCell.querySelector('img'));
    if (bg) {
      bg.classList.add('ds-people-half-bg');
      bg.loading = 'lazy';
      half.append(bg);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'ds-people-half-bg';
      placeholder.setAttribute('aria-hidden', 'true');
      half.append(placeholder);
    }

    const scrim = document.createElement('div');
    scrim.className = 'ds-people-half-scrim';
    scrim.setAttribute('aria-hidden', 'true');
    half.append(scrim);

    const overlay = document.createElement('div');
    overlay.className = 'ds-people-overlay';

    // Eyebrow = first remaining text cell.
    if (textCells[0]) {
      const eyebrow = document.createElement('p');
      eyebrow.className = 'ds-people-eyebrow';
      eyebrow.textContent = textCells[0].textContent.trim();
      overlay.append(eyebrow);
    }

    // Taproom name — reuse the authored heading (promote to h2 for the outline).
    if (headingCell) {
      const authored = isHeading(headingCell)
        ? headingCell : headingCell.querySelector('h1, h2, h3, h4, h5, h6');
      let h2 = authored;
      if (authored.tagName !== 'H2') {
        h2 = document.createElement('h2');
        h2.innerHTML = authored.innerHTML;
        authored.replaceWith(h2);
      }
      h2.className = 'ds-people-h3';
      overlay.append(h2);
    }

    // Teaser = second remaining text cell.
    if (textCells[1]) {
      const teaser = document.createElement('p');
      teaser.className = 'ds-people-teaser';
      teaser.textContent = textCells[1].textContent.trim();
      overlay.append(teaser);
    }

    // CTA — re-create the styled run in JS (EDS strips <span> in cells).
    if (anchor) {
      const cta = document.createElement('span');
      cta.className = 'ds-people-cta';
      cta.textContent = anchor.textContent.trim();
      overlay.append(cta);
    }

    half.append(overlay);
    return half;
  });

  block.replaceChildren(...tiles);
}
