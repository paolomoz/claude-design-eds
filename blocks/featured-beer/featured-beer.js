/**
 * featured-beer — 3-up commerce strip.
 *
 * Authoring shape (one row per logical group):
 *   Row 0: eyebrow text | H2 title (heading element reused if present)
 *   Rows 1..N: one card each — cell(s) holding: badge text, h3 name,
 *              picture/img, style line, "Read about X" link.
 *   Last row: footer text-link ("See the lineup").
 *
 * Cards are classified by content (not position) so authors can omit fields.
 * The footer row is detected as a trailing row that has only a link and no image.
 */

function isHeading(el) {
  return el && /^H[1-6]$/.test(el.tagName);
}

function textOf(el) {
  return (el?.textContent || '').trim();
}

/**
 * Segment a flat list of sibling elements (h2, h3, p, picture, a…) into a
 * section header + per-card groups. DA flattens the whole block into a single
 * cell, so cards are NOT separate rows — they're delimited by their card
 * heading. The card heading level is the MOST FREQUENT heading tag (e.g. <h3>
 * for 3 beers); a lone <h2> section title is NOT a card boundary. Everything
 * before the first card heading is the header.
 */
function segmentFlat(container) {
  const kids = [...container.children];
  const counts = {};
  kids.filter(isHeading).forEach((h) => { counts[h.tagName] = (counts[h.tagName] || 0) + 1; });
  // Card heading = the heading tag that repeats most (ties → deepest level).
  const cardTag = Object.keys(counts)
    .sort((a, b) => (counts[b] - counts[a]) || (b.localeCompare(a)))[0];

  const head = [];
  const groups = [];
  let current = null;
  kids.forEach((el) => {
    if (el.tagName === cardTag) {
      current = [el];
      groups.push(current);
    } else if (current) {
      current.push(el);
    } else {
      head.push(el);
    }
  });
  return { head, groups };
}

export default async function decorate(block) {
  const rows = [...block.children];

  // DA collapses the authored content into one row / one cell with the cards
  // as flat siblings delimited by <h3>. Detect that shape and segment it;
  // otherwise fall back to the one-row-per-card shape.
  const firstCell = rows[0]?.firstElementChild || rows[0];
  const flatCellHeadings = firstCell
    ? [...firstCell.children].filter(isHeading).length : 0;
  const flat = rows.length === 1 && flatCellHeadings >= 1;

  const wrap = document.createElement('div');
  wrap.className = 'featured-beer-inner';

  let headerEls = [];
  let cardSources = [];
  let footerSource = null;

  if (flat) {
    const { head, groups } = segmentFlat(firstCell);
    headerEls = head;
    cardSources = groups;
    // The "See the lineup" link is a trailing link-only element that DA appends
    // to the LAST card group (no heading of its own). Split it off: a final
    // element that is/holds only an <a> and no picture, sitting in a group that
    // already has its own picture, is the section footer — not card content.
    const lastGroup = cardSources[cardSources.length - 1];
    if (lastGroup && lastGroup.length > 1) {
      const tail = lastGroup[lastGroup.length - 1];
      const isLinkOnly = (tail.tagName === 'A' || tail.querySelector?.('a'))
        && !(tail.tagName === 'PICTURE' || tail.querySelector?.('picture,img'))
        && !isHeading(tail);
      if (isLinkOnly) {
        footerSource = [lastGroup.pop()];
      }
    }
  }

  // ---- Header ----
  if (flat && headerEls.length) {
    const header = document.createElement('div');
    header.className = 'fb-header';
    const headingEl = headerEls.find(isHeading);
    headerEls.forEach((el) => {
      if (el === headingEl) {
        el.classList.add('ds-section-h2');
        header.append(el);
      } else if (textOf(el)) {
        const eyebrow = document.createElement('p');
        eyebrow.className = 'ds-section-eyebrow';
        eyebrow.textContent = textOf(el);
        header.append(eyebrow);
      }
    });
    wrap.append(header);
  } else if (!flat) {
    const headerRow = rows.shift();
    if (headerRow) {
      const cells = [...headerRow.children];
      const header = document.createElement('div');
      header.className = 'fb-header';

      const eyebrowText = textOf(cells[0]);
      if (eyebrowText) {
        const eyebrow = document.createElement('p');
        eyebrow.className = 'ds-section-eyebrow';
        eyebrow.textContent = eyebrowText;
        header.append(eyebrow);
      }

      const titleCell = cells[1] || cells[0];
      const authoredHeading = titleCell?.querySelector('h1,h2,h3,h4,h5,h6');
      if (authoredHeading) {
        authoredHeading.classList.add('ds-section-h2');
        header.append(authoredHeading);
      } else if (cells[1]) {
        const h2 = document.createElement('h2');
        h2.className = 'ds-section-h2';
        h2.textContent = textOf(cells[1]);
        header.append(h2);
      }
      wrap.append(header);
    }

    // ---- Footer (trailing link-only row) ----
    const last = rows[rows.length - 1];
    if (last && !last.querySelector('picture,img') && last.querySelector('a')
        && !last.querySelector('h1,h2,h3,h4,h5,h6')) {
      footerSource = rows.pop();
    }
    cardSources = rows;
  }

  // ---- Cards ----
  const grid = document.createElement('div');
  grid.className = 'ds-card-grid';

  cardSources.forEach((source) => {
    const card = document.createElement('article');
    card.className = 'ds-card';

    // `source` is either a flat array of sibling elements (flat shape) or a
    // row element (multi-row shape). Normalise to an element list + a query root.
    const isArr = Array.isArray(source);
    const els = isArr ? source : [...source.querySelectorAll('*')];
    const find = (sel) => (isArr
      ? source.find((e) => e.matches?.(sel) || e.querySelector?.(sel))
      : source.querySelector(sel));
    const pictureEl = isArr
      ? (source.find((e) => e.tagName === 'PICTURE') || find('picture'))
      : source.querySelector('picture');
    const img = pictureEl || find('img');
    const heading = els.find(isHeading);
    const linkHost = isArr
      ? source.find((e) => e.tagName === 'A' || e.querySelector?.('a'))
      : source;
    const link = linkHost && (linkHost.tagName === 'A' ? linkHost : linkHost.querySelector('a'));

    // Gather candidate text nodes excluding the heading + link + picture.
    const texts = (isArr
      ? source.filter((e) => !isHeading(e) && e.tagName !== 'A' && e.tagName !== 'PICTURE'
          && !e.querySelector?.('a') && !e.querySelector?.('picture,img'))
      : [...source.children]
        .map((cell) => [...cell.children].filter(
          (c) => !isHeading(c) && c.tagName !== 'A' && c.tagName !== 'PICTURE',
        ))
        .flat())
      .map(textOf).filter(Boolean);

    // Style line = the beer-style/strength line, identified by ABV or a % (NOT
    // a bare ·, which also appears in availability badges like "Seasonal · Winter").
    // Badge = the remaining (availability) text.
    let styleIdx = texts.findIndex((t) => /%|ABV/i.test(t));
    if (styleIdx < 0) styleIdx = texts.findIndex((t) => /·/.test(t));
    const styleText = styleIdx >= 0 ? texts[styleIdx] : '';
    const badgeText = texts.find((t, i) => i !== styleIdx) || '';

    if (badgeText) {
      const badge = document.createElement('span');
      badge.className = 'ds-card-badge';
      badge.textContent = badgeText;
      card.append(badge);
    }

    if (heading) {
      heading.className = 'ds-card-name';
      card.append(heading);
    }

    const photoWrap = document.createElement('div');
    photoWrap.className = 'ds-card-photo-wrap';
    if (img) {
      const imgEl = img.tagName === 'PICTURE' ? img.querySelector('img') : img;
      if (imgEl) {
        imgEl.classList.add('ds-card-photo');
        imgEl.loading = 'lazy';
      }
      photoWrap.append(img);
    }
    card.append(photoWrap);

    if (styleText) {
      const style = document.createElement('p');
      style.className = 'ds-card-style';
      style.textContent = styleText;
      card.append(style);
    }

    if (link) {
      link.className = 'ds-card-readmore';
      if (!link.getAttribute('aria-label')) {
        link.setAttribute('aria-label', textOf(link));
      }
      card.append(link);
    }

    grid.append(card);
  });

  wrap.append(grid);

  // ---- Footer text-link ----
  if (footerSource) {
    const foot = document.createElement('div');
    foot.className = 'ds-strip-foot';
    const link = Array.isArray(footerSource)
      ? footerSource.map((e) => (e.tagName === 'A' ? e : e.querySelector?.('a'))).find(Boolean)
      : footerSource.querySelector('a');
    if (link) {
      link.className = 'ds-text-link';
      foot.append(link);
    }
    wrap.append(foot);
  }

  block.textContent = '';
  block.append(wrap);
}
