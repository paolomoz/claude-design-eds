/**
 * audiences — "Powering businesses of all sizes."
 *
 * Authoring contract (block.children = rows, row.children = cells):
 *   Row 1 (intro):  | <h2 title> | kicker text |
 *   Then one or more TRACK groups. A group is opened by a marker row whose
 *   first cell is a bare track-type keyword:
 *     | enterprises | | | | |
 *     | startups    | | | | |
 *     | platforms   | | | | |
 *   Inside a track, each subsequent row's FIRST cell is a part-type marker and
 *   the remaining cells carry that part's content:
 *     | head     | <h3 heading> | lead text | <a> CTA |
 *     | feature  | <img>/url | <h4 title> | <a> read-link | stat | stat | products |
 *     | rows     | <ul> of customer rows (each li: heading + trailing link) |
 *     | sub      | sub-heading text |
 *     | three-up | <cell with N (h4 + p + a) groups, or a list> | cols(2|3) |
 *
 * Every part is optional; authors may omit or reorder them. arrow-links render
 * as plain styled text links (.arrow-link), never buttons.
 */

const TRACK_TYPES = ['enterprises', 'startups', 'platforms'];
const PART_TYPES = ['head', 'feature', 'rows', 'sub', 'three-up', 'threeup'];

function cellText(cell) {
  return (cell?.textContent || '').trim();
}

function markerOf(row, dictionary) {
  const first = cellText(row.firstElementChild).toLowerCase();
  return dictionary.includes(first) ? first : null;
}

/** Reuse an authored heading if present, else build one at the given level. */
function headingFrom(cell, level) {
  if (!cell) return null;
  const existing = cell.querySelector('h1, h2, h3, h4, h5, h6');
  if (existing) return existing;
  const text = cellText(cell);
  if (!text) return null;
  const h = document.createElement(level);
  h.textContent = text;
  return h;
}

/** Style every authored anchor in a cell as a plain arrow-link, return them. */
function arrowLinks(cell) {
  if (!cell) return [];
  return [...cell.querySelectorAll('a')].map((a) => {
    const link = a.cloneNode(true);
    link.classList.add('arrow-link');
    return link;
  });
}

function buildHead(cells) {
  const head = document.createElement('div');
  head.className = 'audience-head';

  const h3 = headingFrom(cells[0], 'h3');
  if (h3) head.append(h3);

  const leadText = cellText(cells[1]);
  if (leadText) {
    const lead = document.createElement('p');
    lead.className = 'lead';
    lead.textContent = leadText;
    head.append(lead);
  }

  const [link] = arrowLinks(cells[2]);
  if (link) {
    const p = document.createElement('p');
    p.className = 'audience-head-link';
    p.append(link);
    head.append(p);
  }
  return head;
}

function buildFeature(cells) {
  const feature = document.createElement('div');
  feature.className = 'case-feature';

  // image: authored <img>, else a fully-qualified url string, else empty (CSS fallback)
  const imgCell = cells[0];
  const authoredImg = imgCell?.querySelector('img');
  if (authoredImg) {
    feature.append(authoredImg.cloneNode(true));
  } else {
    const url = cellText(imgCell);
    if (url) {
      const img = document.createElement('img');
      img.src = url;
      img.loading = 'lazy';
      img.alt = '';
      feature.append(img);
    } else {
      // no source authored: leave an empty media slot, CSS provides the fallback
      const slot = document.createElement('div');
      slot.className = 'case-feature-media';
      feature.append(slot);
    }
  }

  const body = document.createElement('div');
  body.className = 'case-feature-body';

  const h4 = headingFrom(cells[1], 'h4');
  if (h4) body.append(h4);

  const [readLink] = arrowLinks(cells[2]);
  if (readLink) {
    const p = document.createElement('p');
    p.append(readLink);
    body.append(p);
  }

  // stats: cells[3] and cells[4] each "<number> | <label>"
  const stats = document.createElement('div');
  stats.className = 'case-stats';
  [cells[3], cells[4]].forEach((statCell) => {
    const raw = cellText(statCell);
    if (!raw) return;
    const [value, ...rest] = raw.split('|');
    const item = document.createElement('div');
    const span = document.createElement('span');
    span.className = 'stat-display';
    span.textContent = value.trim();
    item.append(span);
    const label = rest.join('|').trim();
    if (label) {
      const p = document.createElement('p');
      p.textContent = label;
      item.append(p);
    }
    stats.append(item);
  });
  if (stats.children.length) body.append(stats);

  const products = cellText(cells[5]);
  if (products) {
    const p = document.createElement('p');
    p.className = 'case-feature-products';
    p.textContent = products;
    body.append(p);
  }

  feature.append(body);
  return feature;
}

/** Customer rows: reuse the authored <ul> if present, else build from <p>/<a> pairs. */
function buildRows(cells) {
  const cell = cells[0];
  const authoredList = cell?.querySelector('ul, ol');
  const ul = document.createElement('ul');
  ul.className = 'case-rows';

  if (authoredList) {
    [...authoredList.children].forEach((li) => {
      const item = document.createElement('li');
      const h4 = li.querySelector('h1, h2, h3, h4, h5, h6');
      if (h4) {
        item.append(h4.cloneNode(true));
      } else {
        // text before the link becomes the heading
        const clone = li.cloneNode(true);
        clone.querySelectorAll('a').forEach((a) => a.remove());
        const h = document.createElement('h4');
        h.textContent = clone.textContent.trim();
        if (h.textContent) item.append(h);
      }
      const [link] = arrowLinks(li);
      if (link) item.append(link);
      ul.append(item);
    });
  }
  return ul.children.length ? ul : null;
}

/** three-up: each child cell after the count carries one card (h4 + p + optional a). */
function buildThreeUp(cells, cols) {
  const grid = document.createElement('div');
  grid.className = 'three-up';
  if (cols === 2) grid.classList.add('three-up-2');

  cells.forEach((cell) => {
    if (!cell || !cellText(cell)) return;
    const card = document.createElement('div');
    const h4 = headingFrom(cell, 'h4');
    if (h4) card.append(h4);
    // description: first <p> that is not the heading
    const desc = [...cell.querySelectorAll('p')].find((p) => !p.querySelector('a'));
    if (desc) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.trim();
      card.append(p);
    }
    const [link] = arrowLinks(cell);
    if (link) card.append(link);
    if (card.children.length) grid.append(card);
  });
  return grid.children.length ? grid : null;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  block.textContent = '';

  const wrap = document.createElement('div');
  wrap.className = 'audiences-wrap';

  let cursor = 0;

  // Intro row: title + kicker
  const introRow = rows[cursor];
  if (introRow && !markerOf(introRow, TRACK_TYPES)) {
    const cells = [...introRow.children];
    const h2 = headingFrom(cells[0], 'h2');
    if (h2) wrap.append(h2);
    const kickerText = cellText(cells[1]);
    if (kickerText) {
      const kicker = document.createElement('p');
      kicker.className = 'section-kicker';
      kicker.textContent = kickerText;
      wrap.append(kicker);
    }
    cursor += 1;
  }

  // Track groups
  let track = null;
  rows.slice(cursor).forEach((row) => {
    const trackType = markerOf(row, TRACK_TYPES);

    if (trackType) {
      track = document.createElement('div');
      track.className = 'audience-track';
      track.id = trackType;
      track.dataset.trackType = trackType;
      wrap.append(track);
      return;
    }
    if (!track) return;

    const part = markerOf(row, PART_TYPES);
    const cells = [...row.children].slice(1); // drop the marker cell

    let node = null;
    if (part === 'head') node = buildHead(cells);
    else if (part === 'feature') node = buildFeature(cells);
    else if (part === 'rows') node = buildRows(cells);
    else if (part === 'sub') {
      const text = cellText(cells[0]);
      if (text) {
        node = document.createElement('h4');
        node.className = 'case-sub';
        node.textContent = text;
      }
    } else if (part === 'three-up' || part === 'threeup') {
      const cols = parseInt(cellText(cells[cells.length - 1]), 10);
      const cardCells = Number.isNaN(cols) ? cells : cells.slice(0, -1);
      node = buildThreeUp(cardCells, cols);
    }

    if (node) track.append(node);
  });

  block.append(wrap);
}
