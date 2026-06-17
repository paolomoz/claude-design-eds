/**
 * loads and decorates the beer-hall block
 *
 * Beer Hall destination split. Authored as ONE row with ONE cell holding all
 * elements as flat siblings (CRITICAL #62):
 *   - a <picture>/<img>        → the 4/5 media panel (optional; CSS gradient fallback)
 *   - an eyebrow text line     → "Minneapolis · Prospect Park"
 *   - an <h2> title            → "The Beer Hall."
 *   - a lede paragraph         → the descriptive copy
 *   - an "Address" label line   → recreated as the yellow uppercase span
 *   - a street-address line     → "520 Malcolm Avenue SE · Minneapolis, MN 55414"
 *   - N hours rows, ONE dt|dd pair PER ROW, delimited:
 *       "Tue–Thu | 4 – 10 pm", "Fri | 3 – 11 pm", …
 *   - two CTA links (primary <strong><a>, secondary ghost <em><a>)
 *
 * We flatten the cell and classify each node by content (not by row/cell index),
 * then rebuild the prototype's split structure.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten: collect every authored element regardless of row/cell nesting.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  const isHeading = (el) => /^H[1-6]$/.test(el.tagName) || el.querySelector('h1, h2, h3, h4, h5, h6');
  const isImage = (el) => el.tagName === 'PICTURE' || el.tagName === 'IMG' || el.querySelector('picture, img');
  const hasLink = (el) => el.querySelector('a');
  // An hours row carries exactly one "day | hours" pair, split on an explicit
  // field delimiter ONLY — never on the en-dashes inside "Tue–Thu" / "4 – 10 pm".
  const HOURS_DELIM = /\s*[|·]\s*|\t/;
  // A row is an hours row when it is short, starts with a day token, and carries
  // the field delimiter (or is a "Mon Closed" style pair).
  const DAY_START = /^(mon|tue|tues|wed|wednes|thu|thur|thurs|fri|sat|sun|daily|weekday|weekend)/i;
  const looksLikeHours = (text) => text.length < 40
    && DAY_START.test(text)
    && (HOURS_DELIM.test(text) || /\b(am|pm|closed|open)\b/i.test(text));

  let picture = null;
  let heading = null;
  const ctaNodes = [];
  const textNodes = [];

  nodes.forEach((el) => {
    if (isImage(el)) {
      picture = el.tagName === 'PICTURE' || el.tagName === 'IMG'
        ? el : el.querySelector('picture, img');
    } else if (isHeading(el)) {
      heading = /^H[1-6]$/.test(el.tagName) ? el : el.querySelector('h1, h2, h3, h4, h5, h6');
    } else if (hasLink(el)) {
      ctaNodes.push(el);
    } else if (el.textContent.trim()) {
      textNodes.push(el);
    }
  });

  // Segment the text lines: hours rows vs. prose. The "Address" label and the
  // street line frame the hours block; everything before the first hours/label
  // line is eyebrow + lede.
  const hoursRows = [];
  const proseLines = [];
  let streetLine = null;
  let sawAddressLabel = false;

  textNodes.forEach((el) => {
    const text = el.textContent.trim();
    if (/^address$/i.test(text)) {
      sawAddressLabel = true;
      return;
    }
    if (looksLikeHours(text)) {
      // One dt|dd pair per row, read by delimiter.
      const parts = text.split(HOURS_DELIM).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        hoursRows.push({ day: parts[0], time: parts.slice(1).join(' ') });
      } else if (parts.length === 1) {
        hoursRows.push({ day: parts[0], time: '' });
      }
    } else if (sawAddressLabel && !streetLine) {
      // First non-hours line after the Address label is the street address.
      streetLine = text;
    } else {
      proseLines.push(text);
    }
  });

  // Assert the hours list is non-empty — a silently-empty hours block means the
  // delimiter parse failed and the block rendered a hollow address card.
  if (!hoursRows.length) {
    // eslint-disable-next-line no-console
    console.warn('beer-hall: no hours rows parsed — check the authored "day | hours" delimiter.');
  }

  // ---- Build: media panel (left) -------------------------------------------
  const media = document.createElement('div');
  media.className = 'beer-hall-media';
  media.setAttribute('role', 'img');
  media.setAttribute('aria-label', 'The Surly Beer Hall, Minneapolis');
  if (picture) {
    const img = picture.tagName === 'IMG' ? picture : picture.querySelector('img');
    const src = img?.getAttribute('src');
    if (src) {
      // Fully-qualify the media image for a CSS background.
      const url = new URL(src, window.location.origin).href;
      media.style.backgroundImage = `url('${url}')`;
    }
  }

  // ---- Build: copy panel (right) -------------------------------------------
  const copy = document.createElement('div');
  copy.className = 'beer-hall-copy';

  // Eyebrow = first prose line; lede = the remaining prose.
  const [eyebrow, ...lede] = proseLines;
  if (eyebrow) {
    const e = document.createElement('span');
    e.className = 'beer-hall-eyebrow';
    e.textContent = eyebrow;
    copy.append(e);
  }

  // Reuse the authored heading element (server-visible, avoid nesting).
  if (heading) {
    heading.classList.add('beer-hall-heading');
    copy.append(heading);
  }

  lede.forEach((text) => {
    const p = document.createElement('p');
    p.className = 'beer-hall-lede';
    p.textContent = text;
    copy.append(p);
  });

  // Address block — ruled top/bottom, holding the yellow label, street line,
  // and the hours definition list.
  if (streetLine || hoursRows.length) {
    const address = document.createElement('div');
    address.className = 'beer-hall-address';

    // Re-create the yellow uppercase 'Address' label span (EDS strips <span>).
    const label = document.createElement('span');
    label.className = 'beer-hall-label';
    label.textContent = 'Address';
    address.append(label);

    if (streetLine) {
      const street = document.createElement('p');
      street.className = 'beer-hall-street';
      street.textContent = streetLine;
      address.append(street);
    }

    if (hoursRows.length) {
      const dl = document.createElement('dl');
      dl.className = 'beer-hall-hours';
      hoursRows.forEach(({ day, time }) => {
        const dt = document.createElement('dt');
        dt.textContent = day;
        const dd = document.createElement('dd');
        dd.textContent = time;
        dl.append(dt, dd);
      });
      address.append(dl);
    }

    copy.append(address);
  }

  // CTAs: clone the authored cells/links as-is so decorateButton() in ak.js
  // applies .btn.btn-primary (<strong><a>) and .btn.btn-secondary (<em><a>).
  if (ctaNodes.length) {
    const ctas = document.createElement('div');
    ctas.className = 'beer-hall-ctas';
    ctaNodes.forEach((node) => {
      [...node.childNodes].forEach((child) => ctas.append(child.cloneNode(true)));
    });
    copy.append(ctas);
  }

  const inner = document.createElement('div');
  inner.className = 'beer-hall-inner';
  inner.append(media, copy);

  block.textContent = '';
  block.append(inner);
}
