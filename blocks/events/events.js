/**
 * events block — Veranstaltungen
 *
 * Authored content shape (rows = block.children, cells = row.children):
 *   Row 1 (header):  [ h2 "Veranstaltungen" ] [ link "Alle Veranstaltungen" ]
 *   Row 2 (events):  [ flat sequence of events ]
 *
 * DA flattens the four event cards into a single cell. We segment that flat
 * sequence by the repeating <h4> (each event's title). Around each <h4> we
 * collect: a "day · month" date string, an uppercase kicker, the title, and a
 * location meta line. The grouping per event, in source order, is:
 *   <date string> , <kicker> , <h4 title> , <location meta>
 * We anchor on the <h4> and read the date/kicker that precede it and the meta
 * that follows it.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // ---- Header ----------------------------------------------------------
  const headerRow = rows[0];
  if (headerRow) {
    const head = document.createElement('div');
    head.className = 'head';

    const cells = [...headerRow.children];

    // Title cell: reuse an authored heading element if present (server-visible,
    // avoid nesting); otherwise wrap the text in an h2.
    const titleCell = cells[0];
    if (titleCell) {
      const heading = titleCell.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        head.append(heading);
      } else {
        const h2 = document.createElement('h2');
        h2.textContent = titleCell.textContent.trim();
        head.append(h2);
      }
    }

    // Link cell: a plain text-link (<a>). Clone the authored anchor as-is.
    const linkCell = cells[1];
    const link = linkCell ? linkCell.querySelector('a') : null;
    if (link) {
      const a = link.cloneNode(true);
      a.className = 'all-link';
      head.append(a);
    }

    wrap.append(head);
  }

  // ---- Events grid -----------------------------------------------------
  const grid = document.createElement('div');
  grid.className = 'grid';

  // The events live in the remaining rows' cells, flattened. Collect every
  // child node from those cells in order.
  const nodes = [];
  rows.slice(1).forEach((row) => {
    [...row.children].forEach((cell) => {
      nodes.push(...cell.childNodes);
    });
  });

  // Text content of a node, trimmed; '' for empty/whitespace.
  const textOf = (n) => (n.textContent || '').trim();

  // Locate the index of every <h4> — each marks one event title.
  const elems = nodes.filter((n) => n.nodeType === 1 || textOf(n));
  const titleIdxs = [];
  elems.forEach((n, i) => {
    if (n.nodeType === 1 && n.tagName === 'H4') titleIdxs.push(i);
  });

  titleIdxs.forEach((idx, k) => {
    const title = elems[idx];
    const start = k === 0 ? 0 : titleIdxs[k - 1] + 1;
    const end = k + 1 < titleIdxs.length ? titleIdxs[k + 1] : elems.length;

    const before = elems.slice(start, idx).map(textOf).filter(Boolean);
    const after = elems.slice(idx + 1, end).map(textOf).filter(Boolean);

    // Of the strings preceding the title: one is the "day · month" date, the
    // rest are the kicker. Find the date by the "·" separator (fall back to a
    // leading number).
    let dateStr = '';
    let kicker = '';
    // Middle dot (·), bullet (•), or pipe separators between day and month.
    const dateRe = /[·•|]/;
    const beforeRest = [];
    before.forEach((s) => {
      if (!dateStr && (dateRe.test(s) || /^\d{1,2}\b/.test(s))) {
        dateStr = s;
      } else {
        beforeRest.push(s);
      }
    });
    kicker = beforeRest.join(' ');

    // Meta (location) is whatever text follows the title.
    const meta = after.join(' ');

    // Parse "day · month" → day + month.
    let day = '';
    let month = '';
    if (dateStr) {
      const parts = dateStr.split(dateRe).map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        [day, month] = parts;
      } else {
        const m = dateStr.match(/^(\d{1,2})\s*(.*)$/);
        if (m) { [, day, month] = m; month = month.trim(); }
      }
    }

    // Build the card.
    const card = document.createElement('article');
    card.className = 'event';

    const date = document.createElement('div');
    date.className = 'date';
    const d = document.createElement('div');
    d.className = 'd';
    d.textContent = day;
    const m = document.createElement('div');
    m.className = 'm';
    m.textContent = month;
    date.append(d, m);

    const body = document.createElement('div');
    body.className = 'body';
    if (kicker) {
      const kEl = document.createElement('div');
      kEl.className = 'kicker';
      kEl.textContent = kicker;
      body.append(kEl);
    }
    const h4 = document.createElement('h4');
    h4.textContent = textOf(title);
    body.append(h4);
    if (meta) {
      const metaEl = document.createElement('div');
      metaEl.className = 'meta';
      metaEl.textContent = meta;
      body.append(metaEl);
    }

    card.append(date, body);
    grid.append(card);
  });

  wrap.append(grid);

  block.textContent = '';
  block.append(wrap);
}
