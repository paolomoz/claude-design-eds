/**
 * hero — photographic brand anchor (surly home: anniversary sticker).
 *
 * Full-bleed gradient over a photographic background; a torn cream "sticker"
 * sits bottom-left holding the lead copy. Source prototype: .ds-hero.
 *
 * Authoring contract (#62): the content page authors this block as ONE row
 * with ONE cell holding all elements as flat siblings. DO NOT hard-index rows.
 * Flatten the cell and classify each element by CONTENT, not position:
 *   - a <picture>/<img>            → background image (optional; CSS --bg fallback)
 *   - the heading (<h1>/<h2>…)     → the page's single <h1> (the title)
 *   - a link-bearing element       → the primary CTA (authored <strong><a> →
 *                                    decorates to .btn.btn-primary)
 *   - the remaining link-free <p>s → eyebrow, date, lockup, in source order:
 *       1st = eyebrow, 2nd = date, 3rd = lockup
 *
 * The eyebrow/date/lockup are link-free, heading-free text lines; classified
 * by ORDER among themselves (#51), since EDS strips authored <span>/class.
 */

function isImage(el) {
  return el.tagName === 'PICTURE' || el.tagName === 'IMG' || el.querySelector('picture, img');
}

function isHeading(el) {
  return /^H[1-6]$/.test(el.tagName) || el.querySelector('h1, h2, h3, h4, h5, h6');
}

function hasLink(el) {
  return el.tagName === 'A' || el.querySelector('a');
}

export default async function decorate(block) {
  // Flatten: read every authored element as a flat sibling list (#62).
  const els = [...block.querySelectorAll(':scope > div > div > *')];

  let picture = null;
  let heading = null;
  let cta = null;
  const lines = []; // link-free, heading-free text lines (eyebrow / date / lockup)

  els.forEach((el) => {
    if (isImage(el)) {
      picture = el.tagName === 'PICTURE' || el.tagName === 'IMG' ? el : el.querySelector('picture, img');
    } else if (isHeading(el)) {
      heading = /^H[1-6]$/.test(el.tagName) ? el : el.querySelector('h1, h2, h3, h4, h5, h6');
    } else if (hasLink(el)) {
      cta = el; // keep the wrapping element (carries <strong> for button decoration)
    } else if (el.textContent.trim()) {
      lines.push(el);
    }
  });

  // Background layer — full-bleed photo behind everything. Holds the authored
  // <picture> when present; CSS paints the --bg gradient fallback when empty.
  const bg = document.createElement('div');
  bg.className = 'hero-bg';
  if (picture) bg.append(picture);

  // The sticker — torn cream card, content-constrained.
  const sticker = document.createElement('div');
  sticker.className = 'hero-sticker';

  // Eyebrow / date / lockup by source order among the text lines (#51).
  const [eyebrow, date, lockup] = lines;
  if (eyebrow) {
    const e = document.createElement('div');
    e.className = 'hero-eyebrow';
    e.append(...eyebrow.childNodes);
    sticker.append(e);
  }

  // Title — promote to the page's single <h1> (#35). Unwrap any nested
  // heading so we don't get <h1><h1>…</h1></h1> (#55).
  if (heading) {
    const h1 = document.createElement('h1');
    h1.className = 'hero-title';
    h1.append(...heading.childNodes);
    sticker.append(h1);
  }

  if (date) {
    const d = document.createElement('div');
    d.className = 'hero-date';
    d.append(...date.childNodes);
    sticker.append(d);
  }

  if (lockup) {
    const l = document.createElement('div');
    l.className = 'hero-lockup';
    l.append(...lockup.childNodes);
    sticker.append(l);
  }

  // CTA — clone the authored cell's child nodes into an actions wrapper; the
  // EDS link decorator turns <strong><a> into .btn.btn-primary. Never
  // manufacture the anchor here.
  if (cta && cta.querySelector('a')) {
    const actions = document.createElement('div');
    actions.className = 'hero-actions';
    [...cta.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
    sticker.append(actions);
  }

  const wrap = document.createElement('div');
  wrap.className = 'hero-wrap';
  wrap.append(sticker);

  block.replaceChildren(bg, wrap);
}
