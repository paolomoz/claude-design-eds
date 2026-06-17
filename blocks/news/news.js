/**
 * News / momentum list.
 *
 * Authoring shape (block.children = rows, row.children = cells):
 *   Row 1  — section head:  [ <h2> + optional <p> ]            (one cell, has a heading)
 *   Row 2+ — news row:      [ tag ] [ <h3> + blurb ] [ cta <a> ]
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Build the .wrap container that recreates the prototype's max-width content box.
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // ---- Section head (first row, identified by a heading) ----
  const headRow = rows.find((row) => row.querySelector('h1, h2, h3, h4, h5, h6'));
  if (headRow) {
    const head = document.createElement('div');
    head.className = 'section-head';
    [...headRow.firstElementChild.childNodes].forEach((n) => head.append(n.cloneNode(true)));
    wrap.append(head);
  }

  // ---- News rows (every row after the head) ----
  const newsRows = document.createElement('div');
  newsRows.className = 'news-rows';

  rows.filter((row) => row !== headRow).forEach((row) => {
    const cells = [...row.children];
    const article = document.createElement('article');
    article.className = 'news-row';

    // Tag — mono eyebrow. EDS strips <span> in cells, so re-create the class in JS.
    const tagCell = cells[0];
    if (tagCell) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = tagCell.textContent.trim();
      article.append(tag);
    }

    // Title + blurb — reuse the authored heading element if present (avoid nesting).
    const bodyCell = cells[1];
    if (bodyCell) {
      const body = document.createElement('div');
      [...bodyCell.childNodes].forEach((n) => body.append(n.cloneNode(true)));
      article.append(body);
    }

    // CTA — clone the cell anchor as a plain styled text link (not a button).
    const ctaCell = cells[2];
    const cta = ctaCell && ctaCell.querySelector('a');
    if (cta) {
      const link = cta.cloneNode(true);
      link.classList.add('chevlink');
      // Append the chevron glyph the prototype renders as a styled span.
      const chev = document.createElement('span');
      chev.className = 'chev';
      chev.textContent = '›';
      link.append(' ', chev);
      article.append(link);
    }

    newsRows.append(article);
  });

  wrap.append(newsRows);

  block.textContent = '';
  block.append(wrap);
}
