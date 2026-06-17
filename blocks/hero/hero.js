/*
 * hero — 5-slide full-bleed photographic carousel.
 *
 * Authored as ONE row / ONE cell holding all elements as flat siblings:
 *   [picture] eyebrow-text h1 cta cta  [picture] eyebrow-text h2 cta cta  ...
 * Exactly ONE server <h1> (slide 1 headline); slides 2-5 headlines are <h2>.
 * We segment the flat run by heading boundaries (each heading opens a new
 * slide) rather than by row/cell index, so the rendered slide count always
 * equals the authored headline count.
 *
 * Eyebrow: EDS strips <span> in cells, so the eyebrow arrives as a bare text
 * run (a stray text node, <p>, or <em>) sitting before each heading. We
 * re-create the .hero-eyebrow <span> styling here.
 *
 * CTAs: <strong><a> -> accent (white-on-photo); <em><a> -> secondary
 * (translucent, on-dark variant). The global decorateButton() in the runtime
 * applies the .btn classes from that emphasis after this block runs; we just
 * clone the anchors into the cta-row.
 *
 * The Lenis parallax is dropped — this script does not read scroll.
 */

const AUTOPLAY_MS = 5000;

function isHeading(el) {
  return el && /^H[1-6]$/.test(el.tagName);
}

function eyebrowText(el) {
  // a bare text-run node that should become the eyebrow span
  if (!el || isHeading(el)) return null;
  if (el.querySelector && el.querySelector('a, picture, img')) return null;
  const text = el.textContent.trim();
  return text || null;
}

export default async function decorate(block) {
  // Flatten: author puts everything in one cell as flat siblings. The pipeline
  // wraps block cells in <div><div>…</div></div>, but a hand-authored content
  // file may place the headings/paragraphs as DIRECT children of the block.
  // Tolerate both: prefer the nested cell content, fall back to direct children
  // (otherwise the slide run is empty and the hero renders a blank box).
  let nodes = [...block.querySelectorAll(':scope > div > div > *')];
  if (!nodes.length) nodes = [...block.children].filter((n) => !n.matches('div:has(> div)'));
  if (!nodes.length) nodes = [...block.children];

  // Segment into slides on the HEADING boundary — each heading owns one slide.
  // This tolerates both authoring orders:
  //   (a) eyebrow/picture lead-in BEFORE the heading (lead-in attaches forward);
  //   (b) heading FIRST, then label + description + CTAs (this content file).
  // A new slide opens on a heading, or on a leading picture before the first
  // heading. Everything else (text, links, picture) folds into the open slide:
  // the first non-link text run is the eyebrow, links become CTAs.
  const slides = [];
  let current = null;
  const openSlide = (props) => {
    current = {
      picture: null, eyebrow: null, heading: null, ctas: [], ...props,
    };
    slides.push(current);
  };

  nodes.forEach((node) => {
    const pic = node.matches('picture') ? node : node.querySelector?.('picture, img');
    const links = node.tagName === 'A' ? [node] : [...(node.querySelectorAll?.('a') || [])];
    const eb = eyebrowText(node);

    if (isHeading(node)) {
      // attach to an open lead-in that still lacks a heading, else open anew
      if (current && !current.heading) current.heading = node;
      else openSlide({ heading: node });
    } else if (pic) {
      if (current && !current.heading && !current.picture) current.picture = pic;
      else openSlide({ picture: pic });
    } else if (links.length) {
      if (!current) openSlide({});
      current.ctas.push(...links);
    } else if (eb) {
      if (!current) openSlide({ eyebrow: eb });
      else if (!current.eyebrow) current.eyebrow = eb;
      // subsequent non-link text (description) is dropped from the slot — the
      // hero copy is eyebrow + headline + CTAs (matches the prototype).
    }
  });

  // Build the rendered carousel.
  const slidesWrap = document.createElement('div');
  slidesWrap.className = 'hero-slides';
  slidesWrap.setAttribute('data-hero-slides', '');

  slides.forEach((slide, i) => {
    const el = document.createElement('div');
    el.className = `hero-slide${i === 0 ? ' is-active' : ''}`;
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', `${i + 1} of ${slides.length}`);

    if (slide.picture) {
      const pic = slide.picture.closest('picture') || slide.picture;
      el.append(pic);
    }

    const inner = document.createElement('div');
    inner.className = 'hero-inner';
    const slot = document.createElement('div');
    slot.className = 'hero-slot';

    if (slide.eyebrow) {
      const span = document.createElement('span');
      span.className = 'hero-eyebrow';
      span.textContent = slide.eyebrow;
      slot.append(span);
    }

    if (slide.heading) {
      slide.heading.classList.add('hero-headline');
      slot.append(slide.heading);
    }

    if (slide.ctas.length) {
      const row = document.createElement('div');
      row.className = 'hero-cta-row';
      slide.ctas.forEach((a) => {
        // keep the author emphasis wrapper so decorateButton() can map it
        const wrapper = a.closest('strong, em') || a;
        row.append(wrapper);
      });
      slot.append(row);
    }

    inner.append(slot);
    el.append(inner);
    slidesWrap.append(el);
  });

  // Screen-reader status (autoplay announcement).
  const status = document.createElement('p');
  status.className = 'hero-sr-only';
  status.id = 'hero-status';
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'Autoplay is on.';

  block.textContent = '';
  block.append(status, slidesWrap);

  // Indicators.
  const indicators = document.createElement('div');
  indicators.className = 'hero-indicators';
  indicators.setAttribute('role', 'tablist');
  indicators.setAttribute('aria-label', 'Slide indicators');
  const buttons = slides.map((_slide, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-current', i === 0 ? 'true' : 'false');
    b.setAttribute('aria-label', `Slide ${i + 1} of ${slides.length}`);
    b.setAttribute('data-hero-indicator', String(i));
    indicators.append(b);
    return b;
  });
  if (slides.length > 1) block.append(indicators);

  const slideEls = [...slidesWrap.children];
  let active = 0;

  const show = (next) => {
    if (next === active || slideEls.length < 2) return;
    slideEls[active].classList.remove('is-active');
    buttons[active]?.setAttribute('aria-current', 'false');
    active = (next + slideEls.length) % slideEls.length;
    slideEls[active].classList.add('is-active');
    buttons[active]?.setAttribute('aria-current', 'true');
  };

  // Autoplay rotation, honoring prefers-reduced-motion.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer = null;
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  const start = () => {
    stop();
    if (reduce.matches || slideEls.length < 2) return;
    timer = setInterval(() => show(active + 1), AUTOPLAY_MS);
  };

  buttons.forEach((b, i) => b.addEventListener('click', () => { show(i); start(); }));

  // Pause on hover.
  block.addEventListener('mouseenter', stop);
  block.addEventListener('mouseleave', start);
  reduce.addEventListener('change', start);

  start();
}
