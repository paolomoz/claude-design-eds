/**
 * hero — rotating editorial promo hero (surly home).
 *
 * A full-bleed background-image stage that cross-fades between N slides on a
 * 7-second autoplay timer, with a right-side pagination rail of numbered
 * timer-bars. Each slide anchors an editorial copy stack (eyebrow + headline +
 * lede + CTAs) bottom-left within the content container. Source prototype:
 * .ds-hero / .ds-hero__stage / .ds-hero__slide / .ds-hero__scrim /
 * .ds-hero__copy / .ds-hero__ctas / .ds-hero__pagination.
 *
 * Authoring contract (#62): the content page authors this block as ONE row
 * with ONE cell holding every slide's elements as a FLAT sibling list. DO NOT
 * hard-index rows. Flatten the cell and SEGMENT into slides by the
 * repeating-heading boundary — each heading starts a new slide. Within a slide,
 * classify each element by CONTENT, not position:
 *   - a <picture>/<img>        → the slide's background image (read its src,
 *                                apply as background-image; CSS --bg fallback)
 *   - the heading (<h1>/<h2>…) → the slide headline. The FIRST slide's headline
 *                                is the page's single <h1>; later slides use
 *                                <h2> (the carousel reads headings generically)
 *   - a link-bearing <p>       → a CTA line (authored <strong><a> →
 *                                .btn.btn-primary, <em><a> → .btn.btn-secondary)
 *   - the first link-free <p>  → the eyebrow (re-created as the yellow uppercase
 *                                .ds-eyebrow span styling that EDS strips)
 *   - remaining link-free <p>s → the lede
 *
 * After decorate, the rendered slide count MUST equal the authored
 * repeat-heading count (N headings = N slides, never 1). Slide 0 renders
 * visible by default so the hero is never blank pre-JS.
 */

const PAGINATION_LABELS = [
  '01 — Anniversary',
  '02 — Flagship',
  '03 — New Release',
  '04 — Beer Hall',
  '05 — Live Music',
  '06 — Limited',
];

function isImage(el) {
  return el.tagName === 'PICTURE' || el.tagName === 'IMG' || el.querySelector('picture, img');
}

function isHeading(el) {
  return /^H[1-6]$/.test(el.tagName) || el.querySelector('h1, h2, h3, h4, h5, h6');
}

function hasLink(el) {
  return el.tagName === 'A' || el.querySelector('a');
}

function imgSrc(el) {
  const img = el.tagName === 'IMG' ? el : el.querySelector('img');
  return img ? img.getAttribute('src') : '';
}

function headingText(el) {
  if (!el) return '';
  const h = /^H[1-6]$/.test(el.tagName) ? el : el.querySelector('h1, h2, h3, h4, h5, h6');
  return (h ? h.textContent : el.textContent).trim();
}

function slideName(slide, eyebrow) {
  return headingText(slide.heading) || headingText(eyebrow);
}

export default async function decorate(block) {
  // Flatten: read every authored element as a flat sibling list (#62).
  const els = [...block.querySelectorAll(':scope > div > div > *')];

  // Segment into slides. Each authored slide leads with its background
  // <picture>, then eyebrow → heading → lede → CTAs. So a PICTURE is the
  // repeating boundary marker: it opens a new slide and everything up to the
  // next picture belongs to it. When no pictures are authored at all, fall back
  // to the heading as the boundary (each heading still opens a slide).
  const hasPictures = els.some((el) => isImage(el));
  const newSlide = () => ({
    heading: null,
    picture: null,
    texts: [],
    ctas: [],
  });

  const slides = [];
  let pending = null;
  els.forEach((el) => {
    const boundary = hasPictures ? isImage(el) : isHeading(el);
    if (boundary || !pending) {
      pending = newSlide();
      slides.push(pending);
    }
    if (isImage(el)) pending.picture = el;
    else if (isHeading(el)) {
      pending.heading = /^H[1-6]$/.test(el.tagName) ? el : el.querySelector('h1, h2, h3, h4, h5, h6');
    } else if (hasLink(el)) pending.ctas.push(el);
    else if (el.textContent.trim()) pending.texts.push(el);
  });

  if (!slides.length) return;

  const prefersReduced = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const stage = document.createElement('div');
  stage.className = 'hero-stage';

  const pagination = document.createElement('div');
  pagination.className = 'hero-pagination';
  pagination.setAttribute('role', 'tablist');
  pagination.setAttribute('aria-label', 'Hero stories');

  const slideEls = [];
  const pageBtns = [];

  slides.forEach((slide, i) => {
    const active = i === 0;

    const slideEl = document.createElement('div');
    slideEl.className = 'hero-slide';
    slideEl.dataset.active = active ? 'true' : 'false';
    slideEl.setAttribute('aria-hidden', active ? 'false' : 'true');
    const src = slide.picture ? imgSrc(slide.picture) : '';
    if (src) slideEl.style.backgroundImage = `url('${src}')`;

    const scrim = document.createElement('div');
    scrim.className = 'hero-scrim';
    slideEl.append(scrim);

    const copy = document.createElement('div');
    copy.className = 'hero-copy';

    // Eyebrow — first link-free text line. Re-create the yellow uppercase
    // .ds-eyebrow span styling EDS strips from authored cells (#span-strip).
    const [eyebrow, ...lede] = slide.texts;
    if (eyebrow) {
      const e = document.createElement('span');
      e.className = 'hero-eyebrow';
      e.append(...eyebrow.childNodes);
      copy.append(e);
    }

    // Headline — slide 0 is the page's single <h1>; later slides use <h2>.
    if (slide.heading) {
      const tag = i === 0 ? 'h1' : 'h2';
      const h = document.createElement(tag);
      h.className = 'hero-headline';
      h.textContent = headingText(slide.heading);
      copy.append(h);
    }

    lede.forEach((p) => {
      const l = document.createElement('p');
      l.className = 'hero-lede';
      l.append(...p.childNodes);
      copy.append(l);
    });

    // CTAs — clone the authored link cells; the EDS link decorator paints
    // <strong><a>/<em><a> into the global btn system. Never manufacture anchors.
    if (slide.ctas.length) {
      const actions = document.createElement('div');
      actions.className = 'hero-ctas';
      slide.ctas.forEach((c) => {
        [...c.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
      });
      copy.append(actions);
    }

    slideEl.append(copy);
    stage.append(slideEl);
    slideEls.push(slideEl);

    // Pagination control — numbered label + story name + animated timer bar.
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.active = active ? 'true' : 'false';
    btn.dataset.target = String(i);
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-label', `Story ${i + 1} of ${slides.length} — ${slideName(slide, eyebrow)}`);

    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = PAGINATION_LABELS[i] || `${String(i + 1).padStart(2, '0')} — Story`;
    btn.append(num);

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = slideName(slide, eyebrow);
    btn.append(label);

    const bar = document.createElement('span');
    bar.className = 'timer-bar';
    btn.append(bar);

    pagination.append(btn);
    pageBtns.push(btn);
  });

  stage.append(pagination);
  block.replaceChildren(stage);

  // ── rotation logic ────────────────────────────────────────────────────────
  let current = 0;
  let timer;

  const show = (idx) => {
    if (idx === current) return;
    slideEls.forEach((s, i) => {
      const active = i === idx;
      s.dataset.active = active ? 'true' : 'false';
      s.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    pageBtns.forEach((b, i) => {
      b.dataset.active = i === idx ? 'true' : 'false';
    });
    current = idx;
  };

  const stop = () => { if (timer) clearInterval(timer); };
  const start = () => {
    if (prefersReduced || slideEls.length < 2) return;
    stop();
    timer = setInterval(() => show((current + 1) % slideEls.length), 7000);
  };

  pageBtns.forEach((b, i) => {
    b.addEventListener('click', () => { show(i); start(); });
  });

  stage.addEventListener('mouseenter', stop);
  stage.addEventListener('mouseleave', start);
  stage.addEventListener('focusin', stop);
  stage.addEventListener('focusout', start);

  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { show((current + 1) % slideEls.length); start(); }
    if (e.key === 'ArrowLeft') { show((current - 1 + slideEls.length) % slideEls.length); start(); }
  });

  start();
}
