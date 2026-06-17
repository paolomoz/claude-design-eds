/**
 * stories — 2-up card strip (split media/copy), centered head over the cards.
 * Lifted from the prototype's `.ds-stories` section (home-B3-proposed.html).
 *
 * Authoring shape (one cell per row, flattened):
 *   row 0          : section head  (an <h2> — reused as-is)
 *   row 1..N       : alternating cells. A row whose cell contains a heading
 *                    (h3/h4) starts a NEW card. Following non-heading rows
 *                    (body copy, CTA) belong to that card until the next
 *                    heading. So a card is: [heading][body][cta].
 *
 * The first card renders light; the second renders dark
 * (`.stories-card.dark`, cinema-substrate bg). CTA cells are CLONED, not
 * manufactured — author emphasis drives the button class via ak.js
 * (strong = btn-primary on the light card, em+strong = btn-accent on dark).
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // DA flattens the authored content into ONE cell holding a flat sequence of
  // elements (#48/#52). Gather those leaf elements; fall back to the legacy
  // one-cell-per-row shape if the content was authored that way.
  const flatCell = block.querySelector(':scope > div > div');
  const cells = (flatCell && flatCell.children.length > 1)
    ? [...flatCell.children]
    : [...block.children].map((row) => row.firstElementChild).filter(Boolean);

  // The section max-width wrap (plain background stays full-bleed; CONTENT wraps).
  const wrap = document.createElement('div');
  wrap.className = 'stories-wrap';

  // Match a selector against the element ITSELF or a descendant (#53): after
  // flattening, "cells" are bare elements (<h3>/<p>), not wrapper cells.
  const HEADINGS = 'h1, h2, h3, h4, h5, h6';
  const find = (el, sel) => (el.matches(sel) ? el : el.querySelector(sel));

  // 1. Head — first cell, reuse an authored heading if present.
  const head = document.createElement('div');
  head.className = 'stories-head';
  const headCell = cells.shift();
  if (headCell) {
    const heading = find(headCell, HEADINGS);
    if (heading) {
      heading.classList.add('title-3');
      head.append(heading);
    } else {
      const h2 = document.createElement('h2');
      h2.className = 'title-3';
      h2.textContent = headCell.textContent.trim();
      head.append(h2);
    }
  }

  // 2. Segment remaining cells into cards, split on heading cells (#52).
  const cards = [];
  let current = null;
  cells.forEach((cell) => {
    const heading = find(cell, HEADINGS);
    if (heading) {
      current = { heading, body: null, cta: null };
      cards.push(current);
    } else if (current) {
      if (find(cell, 'a')) current.cta = cell;
      else if (!current.body) current.body = cell;
    }
  });

  const track = document.createElement('div');
  track.className = 'stories-track';

  cards.forEach((card, i) => {
    const article = document.createElement('article');
    article.className = 'stories-card';
    if (i % 2 === 1) article.classList.add('dark');

    // media — empty; the gradient background is painted by CSS.
    const media = document.createElement('div');
    media.className = 'stories-card-media';
    media.setAttribute('aria-hidden', 'true');

    const copy = document.createElement('div');
    copy.className = 'stories-card-copy';

    if (card.heading) {
      card.heading.classList.add('title-4');
      copy.append(card.heading);
    }
    if (card.body) {
      const body = document.createElement('p');
      body.className = 'body-md';
      body.textContent = card.body.textContent.trim();
      copy.append(body);
    }
    if (card.cta && card.cta.querySelector('a')) {
      const actions = document.createElement('div');
      actions.className = 'stories-card-actions';
      [...card.cta.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
      copy.append(actions);
    }

    article.append(media, copy);
    track.append(article);
  });

  wrap.append(head, track);
  block.textContent = '';
  block.append(wrap);
}
