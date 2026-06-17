/**
 * featured-beer — catalog-browse 3-up strip (prototype data-section="featured-beer").
 *
 * A head (eyebrow + section <h2>), a 3-up card grid, and a foot text-link.
 * Each card carries: a badge, a product name (<h3>), a can photo
 * (<picture><img>), a style/ABV line, and a "Read about X →" link.
 *
 * Authoring shape — ONE ROW PER CARD (#73):
 *   leading rows  the head — rows with NO per-card heading:
 *                   row: eyebrow text
 *                   row: <h2>Brewed for the altitude.</h2>
 *   card rows     each row has cells, in authored field order:
 *                   badge | <h3>Name</h3> | <picture><img></picture>
 *                          | style line | <a>Read about Name →</a>
 *   foot row      a single cell whose only content is a link → the foot
 *
 * Cards are segmented per ROW (not per heading) so authored field ORDER is
 * preserved and each image stays with its OWN card (#73). The card heading is
 * the per-card boundary; the lone <h2> belongs to the head, not a card.
 * Media is matched as `picture, img` (#72); classifiers test the element itself
 * OR a descendant (#53).
 */

function matchEl(el, sel) {
  return el && (el.matches(sel) ? el : el.querySelector(sel));
}

const CARD_HEADING = 'h3, h4';
const SECTION_HEADING = 'h2';

export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const headNodes = [];
  const cards = [];

  rows.forEach((row) => {
    const cells = [...row.children];
    const hasCardHeading = cells.some((c) => matchEl(c, CARD_HEADING));
    if (hasCardHeading) {
      cards.push(cells);
    } else {
      // Leading / head rows (eyebrow, <h2>) and the foot link row.
      cells.forEach((c) => {
        [...c.children].forEach((k) => headNodes.push(k));
        if (!c.children.length && c.textContent.trim()) {
          const p = document.createElement('p');
          p.textContent = c.textContent.trim();
          headNodes.push(p);
        }
      });
    }
  });

  // Split the non-card nodes into head (before the cards) and foot.
  // The foot is a trailing run that is purely a link (the "See the lineup →").
  const headOut = [];
  const footOut = [];
  headNodes.forEach((n) => {
    // The eyebrow and h2 are not link-bearing; the foot is a bare link.
    if (matchEl(n, 'a') && !matchEl(n, SECTION_HEADING)) {
      footOut.push(n);
    } else {
      headOut.push(n);
    }
  });

  const out = document.createDocumentFragment();
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // ----- Head: eyebrow + section heading -----
  const head = document.createElement('div');
  head.className = 'featured-beer-head';
  headOut.forEach((n) => {
    const h2 = matchEl(n, SECTION_HEADING);
    if (h2) {
      const inner = n.matches(SECTION_HEADING) ? n : h2;
      const title = document.createElement('h2');
      title.className = 'section-h2';
      title.append(...inner.childNodes);
      head.append(title);
    } else if (n.textContent.trim()) {
      const eyebrow = document.createElement('p');
      eyebrow.className = 'section-eyebrow';
      eyebrow.textContent = n.textContent.trim();
      head.append(eyebrow);
    }
  });
  if (head.children.length) wrap.append(head);

  // ----- Card grid -----
  const grid = document.createElement('div');
  grid.className = 'card-grid';

  cards.forEach((cells) => {
    const card = document.createElement('article');
    card.className = 'card';

    let badge = null;
    let heading = null;
    let media = null;
    let style = null;
    let link = null;

    cells.forEach((cell) => {
      const h = matchEl(cell, CARD_HEADING);
      const a = matchEl(cell, 'a');
      const pic = matchEl(cell, 'picture, img');
      if (pic && !media) {
        media = pic;
      } else if (h && !heading) {
        heading = h;
      } else if (a && !link) {
        link = a;
      } else if (cell.textContent.trim()) {
        // First non-heading text cell = badge; next = style line.
        if (!badge) badge = cell.textContent.trim();
        else if (!style) style = cell.textContent.trim();
      }
    });

    if (badge) {
      const b = document.createElement('span');
      b.className = 'card-badge';
      b.textContent = badge;
      card.append(b);
    }
    if (heading) {
      const name = document.createElement('h3');
      name.className = 'card-name';
      name.append(...heading.childNodes);
      card.append(name);
    }
    if (media) {
      const photoWrap = document.createElement('div');
      photoWrap.className = 'card-photo-wrap';
      photoWrap.append(media);
      card.append(photoWrap);
    }
    if (style) {
      const s = document.createElement('p');
      s.className = 'card-style';
      s.textContent = style;
      card.append(s);
    }
    if (link) {
      link.classList.add('card-readmore');
      card.append(link);
    }

    grid.append(card);
  });

  wrap.append(grid);

  // ----- Foot: text link -----
  if (footOut.length) {
    const foot = document.createElement('div');
    foot.className = 'strip-foot';
    footOut.forEach((n) => {
      const a = matchEl(n, 'a');
      if (a) {
        a.classList.add('text-link');
        foot.append(a);
      }
    });
    if (foot.children.length) wrap.append(foot);
  }

  out.append(wrap);
  block.replaceChildren(out);
}
