/**
 * News block — <h2> + lede over a 3-col grid of news articles.
 * Each article: top ink border, <h3> title, <p> body, bottom-anchored .arrow-link.
 *
 * Authoring shape:
 *   Row 0: heading cell (h2) | lede cell (optional)
 *   Rows 1..n (one per article): title | body | link href
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // --- Header row: <h2> (+ optional lede) ---------------------------------
  const headerRow = rows.shift();
  const header = document.createElement('div');
  header.className = 'news-head';

  if (headerRow) {
    const [titleCell, ledeCell] = headerRow.children;
    if (titleCell) {
      // Reuse an authored heading element if present (server-visible, avoid nesting).
      const heading = titleCell.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        header.append(heading);
      } else if (titleCell.textContent.trim()) {
        const h2 = document.createElement('h2');
        h2.textContent = titleCell.textContent.trim();
        header.append(h2);
      }
    }
    if (ledeCell && ledeCell.textContent.trim()) {
      const lede = document.createElement('p');
      lede.className = 'lede';
      lede.textContent = ledeCell.textContent.trim();
      header.append(lede);
    }
  }

  // --- Article grid -------------------------------------------------------
  const grid = document.createElement('div');
  grid.className = 'news-grid';

  rows.forEach((row) => {
    const [titleCell, bodyCell, linkCell] = row.children;

    const article = document.createElement('article');

    // Title -> <h3> (reuse authored heading if any).
    if (titleCell) {
      const heading = titleCell.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        const h3 = document.createElement('h3');
        h3.textContent = heading.textContent.trim();
        article.append(h3);
      } else if (titleCell.textContent.trim()) {
        const h3 = document.createElement('h3');
        h3.textContent = titleCell.textContent.trim();
        article.append(h3);
      }
    }

    // Body -> <p>.
    if (bodyCell && bodyCell.textContent.trim()) {
      const p = bodyCell.querySelector('p') || document.createElement('p');
      if (!p.parentElement) p.textContent = bodyCell.textContent.trim();
      article.append(p);
    }

    // Link -> plain <a class="arrow-link"> (clone the cell anchor, NOT a button).
    if (linkCell) {
      const anchor = linkCell.querySelector('a');
      if (anchor) {
        const link = anchor.cloneNode(true);
        link.classList.add('arrow-link');
        article.append(link);
      }
    }

    grid.append(article);
  });

  // --- Wrap (recreate the prototype's max-width content wrapper) -----------
  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  wrap.append(header, grid);

  block.textContent = '';
  block.append(wrap);
}
