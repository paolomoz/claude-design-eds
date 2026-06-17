/**
 * loads and decorates the services block
 * @param {Element} block The block element
 *
 * Authored shape (DA flattens the 4 cards into one cell):
 *   row 0: [ h2 title | a "Alle Themen" text-link ]
 *   row 1: [ flattened stream of card content, segmented by the repeating h3 ]
 *           each card = img + kicker(p) + h3 + paragraph + "Mehr erfahren" a
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // ---- wrap (recreate prototype .wrap / --maxw) ----
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // ---- header row (h2 + text link) ----
  const headRow = rows[0];
  const head = document.createElement('div');
  head.className = 'head';
  if (headRow) {
    const cells = [...headRow.children];
    // reuse an authored heading element if present (server-visible, avoid nesting)
    const titleCell = cells[0];
    const heading = titleCell?.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      head.append(heading);
    } else if (titleCell) {
      const h2 = document.createElement('h2');
      h2.textContent = titleCell.textContent.trim();
      head.append(h2);
    }
    // "Alle Themen" text link — plain <a> styled as .btn-text
    const linkCell = cells[1];
    const link = linkCell?.querySelector('a');
    if (link) {
      link.classList.add('btn-text');
      head.append(link);
    }
  }
  wrap.append(head);

  // ---- card grid ----
  const grid = document.createElement('div');
  grid.className = 'grid';

  const isImage = (el) => el.matches('picture, img') || el.querySelector('picture, img');
  const isHeading = (el) => el.matches('h1, h2, h3, h4, h5, h6')
    || el.querySelector('h1, h2, h3, h4, h5, h6');
  const isLink = (el) => el.matches('a') || (el.querySelector('a') && !el.querySelector('p'));
  const pickImage = (el) => (el.matches('picture, img') ? el : el.querySelector('picture, img'));
  const pickLink = (el) => (el.matches('a') ? el : el.querySelector('a'));
  const pickHeading = (el) => (el.matches('h1, h2, h3, h4, h5, h6')
    ? el : el.querySelector('h1, h2, h3, h4, h5, h6'));

  // Build one card from a flat list of content nodes (cells or siblings).
  const buildCard = (nodes) => {
    const card = document.createElement('article');
    card.className = 'svc';
    const imgWrap = document.createElement('div');
    imgWrap.className = 'img';
    const body = document.createElement('div');
    body.className = 'body';
    card.append(imgWrap, body);

    nodes.forEach((node) => {
      if (isImage(node)) {
        imgWrap.append(pickImage(node));
      } else if (isHeading(node)) {
        body.append(pickHeading(node));
      } else if (isLink(node)) {
        body.append(pickLink(node));
      } else {
        const text = node.textContent.trim();
        if (!text) return;
        const p = document.createElement('p');
        // a paragraph before the heading is the kicker
        if (!body.querySelector('h1, h2, h3, h4, h5, h6')) {
          p.className = 'kicker';
        }
        p.textContent = text;
        body.append(p);
      }
    });
    return card;
  };

  const cardRows = rows.slice(1);
  // Shape A: one row per card (each row's cells are the card's content).
  // Shape B: DA flattened all cards into one cell (segment by repeating heading).
  const flattened = cardRows.length === 1
    && [...(cardRows[0].firstElementChild?.children || [])]
      .filter((el) => el.matches('h1, h2, h3, h4, h5, h6')).length > 1;

  if (flattened) {
    const nodes = [...cardRows[0].firstElementChild.children];
    let group = [];
    const flush = () => { if (group.length) grid.append(buildCard(group)); group = []; };
    nodes.forEach((node) => {
      if (node.matches('h3') && group.some((n) => n.matches('h1, h2, h3, h4, h5, h6'))) {
        flush();
      }
      group.push(node);
    });
    flush();
  } else {
    cardRows.forEach((row) => {
      const nodes = [...row.children];
      if (nodes.some((n) => n.textContent.trim() || isImage(n))) {
        grid.append(buildCard(nodes));
      }
    });
  }

  wrap.append(grid);

  block.textContent = '';
  block.append(wrap);
}
