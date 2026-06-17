/*
 * essentials-trio
 * Authored as ONE row / ONE cell holding all elements as flat siblings,
 * OR as one-element-per-row. We collect at the CELL level: for each cell,
 * push its child elements if any, else synthesize a <p> from the cell's
 * own text (so bare-text cells — eyebrows / numbers — survive). We then
 * segment the collected nodes by CONTENT, not by row/cell index.
 */

const NUMBER_PREFIX = /^\s*\d{1,2}\s*(?:[·.\-–—]|\b)/;

function isHeading(el) {
  return el && /^H[1-6]$/.test(el.tagName);
}

function getMedia(el) {
  if (!el) return null;
  if (el.tagName === 'PICTURE' || el.tagName === 'IMG') return el;
  return el.querySelector('picture, img');
}

function getLink(el) {
  if (!el) return null;
  if (el.tagName === 'A') return el;
  return el.querySelector('a');
}

// Cell-level cascade collector: flatten every cell into a list of nodes.
function collectNodes(block) {
  const nodes = [];
  const pushText = (raw) => {
    const text = raw.trim();
    if (!text) return;
    const p = document.createElement('p');
    p.textContent = text;
    nodes.push(p);
  };

  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    if (!cell.children.length) {
      // bare-text cell (one-element-per-row content): synthesize from its text.
      pushText(cell.textContent);
      return;
    }
    // Walk child NODES in order so bare text interleaved between elements
    // (the flat single-cell shape: "<img>01 · Eat<h3>…") is not dropped.
    cell.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        pushText(node.textContent);
      } else if (node.nodeType === 1) {
        nodes.push(node);
      }
    });
  });
  return nodes;
}

export default async function decorate(block) {
  const nodes = collectNodes(block);

  // ---- segment: head (until the first repeating boundary = a number-prefixed
  // eyebrow or the first card heading), then N cards delimited by heading. ----
  const head = { heading: null, link: null };
  const cards = [];
  let current = null;
  let sawCardStart = false;

  const startCard = () => {
    current = {
      num: null, title: null, copy: null, link: null, media: null,
    };
    cards.push(current);
  };

  nodes.forEach((el) => {
    const text = el.textContent.trim();
    const numbered = NUMBER_PREFIX.test(text);
    const heading = isHeading(el);
    const media = getMedia(el);
    const link = getLink(el);

    if (!sawCardStart) {
      // ---- head region: the band title (first heading) + amenities link.
      // The card region begins at the first card-boundary signal — a number
      // eyebrow, a media node, or a SECOND heading (repeating-heading boundary
      // when there is no number/media to delimit cards).
      if (numbered || media || (heading && head.heading)) {
        sawCardStart = true;
      } else {
        if (heading && !head.heading) { head.heading = el; return; }
        if (link && !head.link) { head.link = el; return; }
        if (!head.heading && text) { head.heading = el; return; }
        return;
      }
    }

    // ---- card region: segment by content. A new card starts on a number
    // eyebrow, a media node, or a repeating heading (whichever delimiter the
    // content actually carries) once the current card already holds that slot.
    const numberBoundary = numbered && (!current || current.num || current.title);
    const mediaBoundary = media && (!current || current.media);
    const headingBoundary = heading && current && current.title && !numbered && !media;
    if (numberBoundary || mediaBoundary || headingBoundary || !current) {
      startCard();
    }

    if (media) { current.media = media; return; }
    if (numbered && !current.num) { current.num = text; return; }
    if (heading && !current.title) { current.title = text; return; }
    if (link) { current.link = link; return; }
    if (text && !current.copy) { current.copy = text; }
  });

  // ---- build head ----
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const bandHead = document.createElement('div');
  bandHead.className = 'band-head';

  // reuse the authored heading element if present (server-visible)
  let headingEl = head.heading;
  if (headingEl && isHeading(headingEl)) {
    headingEl.classList.add('display-head');
  } else {
    const h2 = document.createElement('h2');
    h2.textContent = headingEl ? headingEl.textContent.trim() : 'Essentials at the gate.';
    h2.className = 'display-head';
    headingEl = h2;
  }
  // recreate two-line .line/<em> styling stripped by EDS (spans removed in cells)
  if (!headingEl.querySelector('.line')) {
    const raw = headingEl.textContent.trim();
    headingEl.textContent = '';
    // split into two lines on the last sentence break, else by words midpoint
    const parts = raw.split(/(?<=at)\s+/i);
    let l1 = raw;
    let l2 = '';
    if (parts.length >= 2) {
      [l1] = parts;
      l2 = parts.slice(1).join(' ');
    }
    const line1 = document.createElement('span');
    line1.className = 'line';
    line1.textContent = l1;
    headingEl.appendChild(line1);
    if (l2) {
      const line2 = document.createElement('span');
      line2.className = 'line';
      const em = document.createElement('em');
      em.textContent = l2;
      line2.appendChild(em);
      headingEl.appendChild(line2);
    }
  }
  bandHead.appendChild(headingEl);

  if (head.link) {
    const a = getLink(head.link) || head.link;
    a.className = 'band-link';
    bandHead.appendChild(a);
  }

  wrap.appendChild(bandHead);

  // ---- build card grid ----
  const grid = document.createElement('div');
  grid.className = 'trio';

  cards.forEach((card) => {
    const article = document.createElement('article');
    article.className = 'trio-card';

    // media — authored only. When the content is image-less (#2), leave the
    // card without an <img> so the `.trio-card:not(:has(img))` CSS fallback
    // (deep-blue wash + gradient) paints, matching the sibling guide/news
    // grids. Never inject a fixed brand image via an absolute origin (#44).
    const { media } = card;
    if (media) article.appendChild(media);

    const body = document.createElement('div');
    body.className = 'trio-body';

    if (card.num) {
      const num = document.createElement('span');
      num.className = 'trio-num';
      num.textContent = card.num;
      body.appendChild(num);
    }

    const lower = document.createElement('div');
    if (card.title) {
      const h3 = document.createElement('h3');
      h3.className = 'trio-title';
      h3.textContent = card.title;
      lower.appendChild(h3);
    }
    if (card.copy) {
      const p = document.createElement('p');
      p.className = 'trio-copy';
      p.textContent = card.copy;
      lower.appendChild(p);
    }
    if (card.link) {
      const a = card.link;
      a.className = 'trio-link';
      lower.appendChild(a);
    }
    body.appendChild(lower);
    article.appendChild(body);
    grid.appendChild(article);
  });

  wrap.appendChild(grid);

  block.textContent = '';
  block.appendChild(wrap);
}
