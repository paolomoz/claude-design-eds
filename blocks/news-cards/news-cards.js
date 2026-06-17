/**
 * news-cards — light --surface band with a two-line section head and a 3-up
 * card grid. Lifted from the stardust prototype's `.news-band > .news`.
 *
 * Authoring shape (DA-flattened, #62): ONE row with ONE cell holding all
 * elements as flat siblings — a section heading (the head), an optional
 * "All news" link, then one repeating <h3> per card with its eyebrow,
 * media (picture/img), copy and "Learn more" link interleaved.
 *
 * Decoration is content-driven (#48/#52), never row/cell index based:
 *   1. CELL-LEVEL cascade collect every node (#71) — push a cell's children,
 *      else synthesize a <p> from the cell's own bare text.
 *   2. Everything BEFORE the first card heading is the head (#56): the section
 *      title (rendered as <h2>) + an optional "All news" link.
 *   3. Segment the rest into one card per <h3> boundary (#52/#63); classify
 *      each card's nodes by content — picture/img media, eyebrow, copy,
 *      "Learn more" link — matching the element itself OR a descendant (#53),
 *      and media via `picture, img` (#72).
 */

function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) {
      out.push(...kids);
    } else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      out.push(p);
    }
  });
  return out.length ? out : [...block.children];
}

const isHeading = (el) => el.matches('h1, h2, h3, h4, h5, h6') || el.querySelector('h1, h2, h3, h4, h5, h6');
const isCardHeading = (el) => el.matches('h3') || el.querySelector('h3');
const media = (el) => (el.matches('picture, img') ? el : el.querySelector('picture, img'));
const link = (el) => (el.matches('a') ? el : el.querySelector('a'));
const text = (el) => (el ? el.textContent.trim() : '');

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  // The head's section title is the only non-h3 heading (rendered <h2>); its
  // link is the only link that appears before the first card heading. Card
  // eyebrow/media precede their <h3>, so split on those landmarks, not on the
  // first <h3> (which would strand the first card's eyebrow + image in the head).
  const titleSource = nodes.find((n) => isHeading(n) && !isCardHeading(n));
  const firstCardIdx = nodes.findIndex(isCardHeading);
  const headLink = firstCardIdx === -1
    ? null
    : nodes.slice(0, firstCardIdx).map(link).find((a) => a);

  /* ---- head: 'News & promotions.' display head + 'All news' link ---- */
  const head = document.createElement('div');
  head.className = 'news-cards-head';

  const h2 = document.createElement('h2');
  h2.className = 'news-cards-display-head';
  if (titleSource) {
    const inner = titleSource.matches('h1, h2, h3, h4, h5, h6')
      ? titleSource
      : titleSource.querySelector('h1, h2, h3, h4, h5, h6');
    [...inner.childNodes].forEach((n) => h2.append(n.cloneNode(true)));
  }
  head.append(h2);

  if (headLink) {
    const a = headLink.cloneNode(true);
    a.className = 'news-cards-link';
    head.append(a);
  }

  /* ---- card grid ----
     One card per <h3> (the only reliable per-card boundary — media may be
     absent, #64). Per card the order is: eyebrow, media, <h3>, copy, link.
     So between two headings the LEADING nodes (eyebrow + media) belong to the
     NEXT card and the TRAILING nodes (copy + link) belong to the PREVIOUS one.
     Anchor each card on its <h3>, then attach the run of nodes BEFORE it that
     aren't already owned by the previous heading's trailing content. */
  const grid = document.createElement('div');
  grid.className = 'news-cards-grid';

  const headSet = new Set([titleSource, headLink].filter(Boolean));
  const gridNodes = nodes.filter((n) => !headSet.has(n));
  const headingIdx = gridNodes
    .map((n, idx) => (isCardHeading(n) ? idx : -1))
    .filter((idx) => idx !== -1);

  const cards = headingIdx.map((hIdx, k) => {
    // leading run: nodes after the previous heading's trailing content, up to
    // this heading. The lead starts at the first media in the gap, else at the
    // last non-link text node (the eyebrow) before this heading.
    const prevHeading = k === 0 ? -1 : headingIdx[k - 1];
    const gap = gridNodes.slice(prevHeading + 1, hIdx);
    let leadStart = gap.findIndex((n) => media(n));
    if (leadStart === -1) {
      // no media in gap: the eyebrow is the last bare-text node before heading
      for (let j = gap.length - 1; j >= 0; j -= 1) {
        if (!link(gap[j]) && text(gap[j])) { leadStart = j; break; }
      }
    } else {
      // media found: pull in a bare-text eyebrow that immediately precedes it
      while (leadStart > 0 && !link(gap[leadStart - 1]) && text(gap[leadStart - 1])
        && !media(gap[leadStart - 1])) {
        leadStart -= 1;
      }
    }
    const lead = leadStart === -1 ? [] : gap.slice(leadStart);
    // trailing run: everything after this heading up to the next heading's lead
    const next = k + 1 < headingIdx.length ? headingIdx[k + 1] : gridNodes.length;
    const after = gridNodes.slice(hIdx + 1, next);
    let nextLeadStart = after.findIndex((n) => media(n));
    if (nextLeadStart === -1) {
      nextLeadStart = after.length;
      for (let j = after.length - 1; j >= 0; j -= 1) {
        if (!link(after[j]) && text(after[j])) { nextLeadStart = j; } else break;
      }
    }
    const trailing = after.slice(0, nextLeadStart);
    return [...lead, gridNodes[hIdx], ...trailing];
  });

  cards.forEach((cardNodes, i) => {
    const card = document.createElement('article');
    card.className = 'news-cards-card';

    const mediaEl = cardNodes.map(media).find((m) => m);
    const mediaWrap = document.createElement('div');
    mediaWrap.className = 'news-cards-media';
    if (mediaEl) mediaWrap.append(mediaEl.cloneNode(true));
    const num = document.createElement('span');
    num.className = 'news-cards-num';
    num.textContent = String(i + 1).padStart(2, '0');
    mediaWrap.append(num);
    card.append(mediaWrap);

    const body = document.createElement('div');
    body.className = 'news-cards-body';

    const headingEl = cardNodes.find(isCardHeading);
    const cardLink = cardNodes.map(link).find((a) => a);

    // Eyebrow = first non-heading, non-link, non-media text node before the title.
    const headingPos = cardNodes.indexOf(headingEl);
    const eyebrowEl = cardNodes.find((n, idx) => idx < headingPos
      && !isCardHeading(n) && !media(n) && !link(n) && text(n));
    if (eyebrowEl) {
      const eyebrow = document.createElement('span');
      eyebrow.className = 'news-cards-eyebrow';
      eyebrow.textContent = text(eyebrowEl);
      body.append(eyebrow);
    }

    if (headingEl) {
      const h3 = document.createElement('h3');
      h3.className = 'news-cards-title';
      const inner = headingEl.matches('h3') ? headingEl : headingEl.querySelector('h3');
      [...inner.childNodes].forEach((n) => h3.append(n.cloneNode(true)));
      body.append(h3);
    }

    // Copy = remaining non-heading/non-link/non-media/non-eyebrow text nodes.
    cardNodes.forEach((n) => {
      if (n === headingEl || n === eyebrowEl || isCardHeading(n) || media(n) || link(n)) return;
      if (!text(n)) return;
      const p = document.createElement('p');
      p.className = 'news-cards-copy';
      p.textContent = text(n);
      body.append(p);
    });

    if (cardLink) {
      const a = cardLink.cloneNode(true);
      a.className = 'news-cards-cardlink';
      body.append(a);
    }

    card.append(body);
    grid.append(card);
  });

  /* ---- wrap (recreate prototype max-width container) ---- */
  const wrap = document.createElement('div');
  wrap.className = 'news-cards-wrap';
  wrap.append(head, grid);

  block.replaceChildren(wrap);
}
