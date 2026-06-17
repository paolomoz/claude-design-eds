/*
 * taproom block
 * One block instance = one taproom card (reused for #heber-valley and #park-city).
 *
 * Authored content is FLAT: each authoring row is one cell holding a single
 * heading or paragraph (this is what DA/snowflake produces — authors type lines,
 * not nested <dl>/<ol> markup). The block parses those flat rows into the
 * tabular card structure:
 *   - "01 — The original · Opened 1996"   (leading number)  -> .taproom-tag (.num split out)
 *   - <h2> heading                                          -> card title
 *   - caption line (plain, before the first "Key: value")   -> .taproom-caption
 *   - "Key: value" lines                            -> .taproom-data <dl> (PLACEHOLDER -> .ribbon)
 *   - <h3> "On tap this week"                               -> .taproom-tap heading
 *   - "01 · Name · Style · ABV" lines                       -> .tap-list rows (num/name/style)
 *   - location line (no link) + "Directions" link           -> .taproom-foot
 * EDS strips authored <span>s in cells, so .num / .ribbon / tap spans are recreated here.
 */

const PLACEHOLDER_RE = /placeholder/i;
// A tap-list row: leading 1-2 digit number then a middot separator.
const TAP_RE = /^\s*\d{1,2}\s*[·]/;
// A data row: "Key: value".
const DATA_RE = /^\s*([^:]{1,30}):\s*(.+)$/;

/** Build the head: tag eyebrow (with .num), title heading, caption. */
function buildHead(tagText, headingEl, captionText) {
  const head = document.createElement('div');
  head.className = 'taproom-head';

  if (tagText) {
    const tag = document.createElement('div');
    tag.className = 'taproom-tag';
    // "01 — The original · Opened 1996" -> leading number split into <span class="num">.
    const m = tagText.match(/^\s*(\d+)\s*[—–-]?\s*(.*)$/);
    if (m && m[2]) {
      const [, numText, labelText] = m;
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = numText;
      const label = document.createElement('span');
      label.textContent = labelText.trim();
      tag.append(num, label);
    } else {
      const label = document.createElement('span');
      label.textContent = tagText;
      tag.append(label);
    }
    head.append(tag);
  }

  if (headingEl) head.append(headingEl);

  if (captionText) {
    const cap = document.createElement('div');
    cap.className = 'taproom-caption';
    cap.textContent = captionText;
    head.append(cap);
  }

  return head;
}

/** Build the thumb. Holds an authored <picture>/<img>, or stays empty (CSS fallback). */
function buildThumb(imageCell) {
  const thumb = document.createElement('div');
  thumb.className = 'taproom-thumb';
  if (imageCell) {
    const pic = imageCell.querySelector('picture');
    const img = imageCell.querySelector('img');
    if (pic) thumb.append(pic);
    else if (img) thumb.append(img);
  }
  return thumb;
}

/** Build the data <dl> from "Key: value" lines; PLACEHOLDER values get a yellow .ribbon. */
function buildData(dataLines) {
  const dl = document.createElement('dl');
  dl.className = 'taproom-data';
  dataLines.forEach(({ key, value, cell }) => {
    const dt = document.createElement('dt');
    dt.textContent = key.toUpperCase();
    const dd = document.createElement('dd');
    const anchor = cell.querySelector('a');
    if (PLACEHOLDER_RE.test(value)) {
      const ribbon = document.createElement('span');
      ribbon.className = 'ribbon';
      ribbon.textContent = value;
      dd.append(ribbon);
    } else if (anchor && anchor.textContent.trim() === value) {
      // Preserve a value that is itself a link (e.g. mailto on the Email line).
      dd.append(anchor.cloneNode(true));
    } else {
      dd.textContent = value;
    }
    dl.append(dt, dd);
  });
  return dl;
}

/** Build the on-tap list. Each line "01 · Name · Style · ABV" -> num/name/style spans. */
function buildTap(headingText, tapLines) {
  const tap = document.createElement('div');
  tap.className = 'taproom-tap';

  const h4 = document.createElement('h4');
  h4.textContent = (headingText || 'On tap this week').trim();
  tap.append(h4);

  const ol = document.createElement('ol');
  ol.className = 'tap-list';
  tapLines.forEach((line) => {
    const out = document.createElement('li');
    const segs = line.split('·').map((s) => s.trim()).filter(Boolean);
    if (segs.length >= 3) {
      const [num, name, ...styleParts] = segs;
      const numSpan = document.createElement('span');
      numSpan.className = 'num';
      numSpan.textContent = num;
      const nameSpan = document.createElement('span');
      nameSpan.textContent = name;
      const styleSpan = document.createElement('span');
      styleSpan.className = 'style';
      styleSpan.textContent = styleParts.join(' · ');
      out.append(numSpan, nameSpan, styleSpan);
    } else {
      out.textContent = line.trim();
    }
    ol.append(out);
  });
  tap.append(ol);
  return tap;
}

/** Build the foot: location line on the left, Directions link on the right. */
function buildFoot(locationText, linkEl) {
  const foot = document.createElement('div');
  foot.className = 'taproom-foot';

  const span = document.createElement('span');
  span.textContent = locationText || '';
  foot.append(span);

  if (linkEl) foot.append(linkEl.cloneNode(true));
  return foot;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  let tagText = '';
  let headingEl = null;
  let captionText = '';
  let imageCell = null;
  const dataLines = [];
  let tapHeadingText = '';
  const tapLines = [];
  let locationText = '';
  let linkEl = null;
  let seenTapHeading = false;
  let seenData = false;

  rows.forEach((row) => {
    const cell = row.firstElementChild;
    if (!cell) return;
    const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
    const link = cell.querySelector('a');
    const text = cell.textContent.trim();
    if (!text && !cell.querySelector('picture, img')) return;

    if (cell.querySelector('picture, img')) {
      imageCell = cell;
    } else if (heading && /on tap/i.test(text)) {
      tapHeadingText = text;
      seenTapHeading = true;
    } else if (heading && !headingEl) {
      // Promote any authored heading to <h2> (server-visible, avoids nesting).
      if (heading.tagName === 'H2') {
        headingEl = heading;
      } else {
        const h2 = document.createElement('h2');
        h2.innerHTML = heading.innerHTML;
        if (heading.id) h2.id = heading.id;
        headingEl = h2;
      }
    } else if (seenTapHeading && TAP_RE.test(text)) {
      tapLines.push(text);
    } else if (link && /direction/i.test(text)) {
      linkEl = link;
    } else if (!seenTapHeading && DATA_RE.test(text)) {
      const m = text.match(DATA_RE);
      dataLines.push({ key: m[1].trim(), value: m[2].trim(), cell });
      seenData = true;
    } else if (!seenData && !tagText && /^\s*\d+\b/.test(text)) {
      tagText = text;
    } else if (!seenData && !captionText) {
      captionText = text;
    } else {
      // Trailing plain line before the Directions link = the foot location line.
      locationText = text;
    }
  });

  const card = document.createElement('article');
  card.className = 'taproom-card';
  if (headingEl?.id) card.setAttribute('aria-labelledby', headingEl.id);

  card.append(buildHead(tagText, headingEl, captionText));
  card.append(buildThumb(imageCell));
  if (dataLines.length) card.append(buildData(dataLines));
  if (tapLines.length) card.append(buildTap(tapHeadingText, tapLines));
  if (locationText || linkEl) card.append(buildFoot(locationText, linkEl));

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  wrap.append(card);

  block.textContent = '';
  block.append(wrap);
}
