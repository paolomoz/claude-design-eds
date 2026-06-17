/**
 * loads and decorates the businesses block (role: section)
 *
 * Lifted from the `.biz` section of home-C-cinematic.html. The section already
 * owns the lead <h2>; this block renders the intro lede, then two "tracks",
 * each = a track heading + lede followed by a media grid (enterprise stories or
 * startup cards), and closes with a 3-up support row of service blurbs.
 *
 * Authored structure (block.children = rows, row.children = cells). The FIRST
 * cell of every row is a type key so the block can parse rows by intent:
 *
 *   [ intro ]            [ lede paragraph ]
 *   [ track ]            [ title (heading) ] [ lede paragraph ]
 *   [ enterprise-story ] [ image ] [ caption ]
 *   [ enterprise-story ] [ image ] [ caption ]
 *   …
 *   [ track ]            [ title (heading) ] [ lede paragraph ]
 *   [ startup ]          [ image ] [ blurb ]
 *   [ startup ]          [ image ] [ blurb ]
 *   …
 *   [ support ]          [ title (heading) ] [ body paragraph ]
 *   [ support ]          [ title (heading) ] [ body paragraph ]
 *   [ support ]          [ title (heading) ] [ body paragraph ]
 *
 * Consecutive enterprise-story / startup / support rows are collected into a
 * single grid. Titles reuse an authored heading element if the cell contains
 * one (server-visible, avoids nesting); otherwise a fresh <h3> is created.
 * EDS strips <span> in cells, so any inline class styling is re-created here.
 *
 * @param {Element} block The block element
 */

function rowKey(row) {
  const first = row.children[0];
  return first ? first.textContent.trim().toLowerCase() : '';
}

function headingFrom(cell, level = 'h3') {
  if (!cell) return null;
  const authored = cell.querySelector('h1, h2, h3, h4, h5, h6');
  if (authored) return authored;
  const text = cell.textContent.trim();
  if (!text) return null;
  const h = document.createElement(level);
  h.textContent = text;
  return h;
}

function paragraphFrom(cell, className) {
  if (!cell || !cell.textContent.trim()) return null;
  const p = document.createElement('p');
  if (className) p.className = className;
  p.append(...cell.childNodes);
  return p;
}

function buildStory(cells) {
  // cells: [ key ] [ image ] [ caption ]
  const fig = document.createElement('figure');
  fig.className = 'story';

  const img = cells[1] ? cells[1].querySelector('img') : null;
  if (img) fig.append(img.cloneNode(true));

  const caption = cells[2] ? cells[2].textContent.trim() : '';
  if (caption) {
    const cap = document.createElement('figcaption');
    cap.textContent = caption;
    fig.append(cap);
  }
  return fig;
}

function buildStartup(cells) {
  // cells: [ key ] [ image ] [ blurb ]
  const card = document.createElement('article');
  card.className = 'startup';

  const img = cells[1] ? cells[1].querySelector('img') : null;
  if (img) card.append(img.cloneNode(true));

  const blurb = paragraphFrom(cells[2]);
  if (blurb) card.append(blurb);
  return card;
}

function buildSupport(cells) {
  // cells: [ key ] [ title ] [ body ]
  const item = document.createElement('div');
  item.className = 'support-item';

  const heading = headingFrom(cells[1], 'h3');
  if (heading) item.append(heading);

  const body = paragraphFrom(cells[2]);
  if (body) item.append(body);
  return item;
}

export default async function decorate(block) {
  const rows = [...block.children];

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // Group of consecutive same-type rows currently being collected.
  let currentGrid = null;
  let currentType = null;

  const flushGrid = () => {
    if (currentGrid && currentGrid.childElementCount) wrap.append(currentGrid);
    currentGrid = null;
    currentType = null;
  };

  rows.forEach((row) => {
    const key = rowKey(row);
    const cells = [...row.children];

    if (key === 'intro') {
      flushGrid();
      const p = paragraphFrom(cells[1], 'intro');
      if (p) wrap.append(p);
      return;
    }

    if (key === 'track') {
      flushGrid();
      const heading = headingFrom(cells[1], 'h3');
      if (heading) {
        heading.classList.add('track');
        wrap.append(heading);
      }
      const lede = paragraphFrom(cells[2], 'track-lede');
      if (lede) wrap.append(lede);
      return;
    }

    if (key === 'enterprise-story') {
      if (currentType !== 'enterprise-story') {
        flushGrid();
        currentGrid = document.createElement('div');
        currentGrid.className = 'ent-grid';
        currentType = 'enterprise-story';
      }
      currentGrid.append(buildStory(cells));
      return;
    }

    if (key === 'startup') {
      if (currentType !== 'startup') {
        flushGrid();
        currentGrid = document.createElement('div');
        currentGrid.className = 'startup-grid';
        currentType = 'startup';
      }
      currentGrid.append(buildStartup(cells));
      return;
    }

    if (key === 'support') {
      if (currentType !== 'support') {
        flushGrid();
        currentGrid = document.createElement('div');
        currentGrid.className = 'support';
        currentType = 'support';
      }
      currentGrid.append(buildSupport(cells));
    }
  });

  flushGrid();

  block.replaceChildren(wrap);
}
