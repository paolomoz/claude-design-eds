/**
 * news — list-rows of news items.
 *
 * Authoring shape (block.children = rows, row.children = cells):
 *   Row 1 (header): [ title cell with an h2, link cell with the 'Alle News' <a> ]
 *   Rows 2..n (one per news item). DA flattens the prototype's <ul>/<li>, so a
 *   row arrives in one of two shapes:
 *     - one cell per field:  [ date | headline | tag | (optional go-link) ]
 *     - a single delimited cell: 'date · headline · tag' (split on '·')
 *   We render each item as a grid row: <time> + <h4> headline link + tag chip
 *   + go-arrow link.
 *
 * @param {Element} block
 */
export default async function decorate(block) {
  const rows = [...block.children];

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // ---- header (first row) -------------------------------------------------
  const headerRow = rows.shift();
  if (headerRow) {
    const head = document.createElement('div');
    head.className = 'head';

    const cells = [...headerRow.children];
    const [titleCell, linkCell] = cells;

    // Reuse an authored heading if present (server-visible, avoid nesting).
    const authoredHeading = titleCell?.querySelector('h1, h2, h3, h4, h5, h6');
    if (authoredHeading) {
      head.append(authoredHeading);
    } else if (titleCell) {
      const h2 = document.createElement('h2');
      h2.textContent = titleCell.textContent.trim();
      head.append(h2);
    }

    // 'Alle News' text link — reuse the authored anchor as a plain <a>.
    const link = (linkCell || titleCell)?.querySelector('a');
    if (link) head.append(link);

    wrap.append(head);
  }

  // ---- list ---------------------------------------------------------------
  const list = document.createElement('ul');
  list.className = 'list';

  rows.forEach((row) => {
    const cells = [...row.children];
    const item = document.createElement('li');
    item.className = 'item';

    let date = '';
    let datetime = '';
    let headlineLink = null;
    let headlineText = '';
    let tag = '';
    let goLink = null;

    if (cells.length >= 3) {
      // one cell per field: date | headline | tag | (optional go-link)
      const [dateCell, headlineCell, tagCell, goCell] = cells;
      date = dateCell.textContent.trim();
      datetime = dateCell.querySelector('time')?.getAttribute('datetime') || '';
      headlineLink = headlineCell.querySelector('a');
      headlineText = headlineCell.textContent.trim();
      tag = tagCell.textContent.trim();
      goLink = goCell?.querySelector('a') || null;
    } else {
      // single delimited cell: 'date · headline · tag'
      const cell = cells[0];
      if (!cell) return;
      headlineLink = cell.querySelector('a');
      datetime = cell.querySelector('time')?.getAttribute('datetime') || '';
      const parts = cell.textContent.split('·').map((p) => p.trim());
      [date = '', headlineText = '', tag = ''] = parts;
      if (headlineLink && parts.length < 2) headlineText = headlineLink.textContent.trim();
    }

    // date
    const time = document.createElement('time');
    if (datetime) time.setAttribute('datetime', datetime);
    time.textContent = date;
    item.append(time);

    // headline as an <h4> sub-item under the <h2>
    const h4 = document.createElement('h4');
    if (headlineLink) {
      headlineLink.textContent = headlineLink.textContent.trim() || headlineText;
      h4.append(headlineLink);
    } else {
      h4.textContent = headlineText;
    }
    item.append(h4);

    // tag chip (re-create the <span class="tag"> the prototype used; EDS
    // strips authored <span> in cells, so build it here)
    if (tag) {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag';
      tagEl.textContent = tag;
      item.append(tagEl);
    }

    // go-arrow link
    if (goLink) {
      goLink.classList.add('go');
      if (!goLink.getAttribute('aria-label')) goLink.setAttribute('aria-label', 'Weiterlesen');
      goLink.textContent = '→';
      item.append(goLink);
    } else {
      const go = document.createElement('a');
      go.className = 'go';
      go.href = headlineLink?.getAttribute('href') || '#';
      go.setAttribute('aria-label', 'Weiterlesen');
      go.textContent = '→';
      item.append(go);
    }

    list.append(item);
  });

  wrap.append(list);

  block.textContent = '';
  block.append(wrap);
}
