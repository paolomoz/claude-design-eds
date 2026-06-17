/*
 * story-hero — featured-story hero with a 5-slide carousel.
 *
 * Authoring shape (block.children = rows, row.children = cells):
 *   Row 0: [ eyebrow text ]
 *   Row 1: [ headline (h1/h2 with <strong>) ] [ byline ] [ primary href ] [ CTAs ]
 *   Row 2..N: one slide per row — [ image ] [ headline w/ strong ] [ byline ] [ href ]
 *
 * The CTA cell is cloned verbatim (global btn system styles the strong/em links).
 * Eyebrow + per-slide headline emphasis are recreated as DOM in JS (EDS strips
 * spans in cells, so we rebuild the styled markup here).
 */

const AUTOPLAY_MS = 6000;

// Parse a headline cell's HTML into the h1, preserving <strong> emphasis (#39).
// If the source cell wraps its own heading element, unwrap it so we don't nest
// a second <h1>/<h2> inside the live headline (which produces a duplicate
// heading + a doubled font-size cascade).
function buildHeadline(h1, sourceEl) {
  h1.replaceChildren();
  if (!sourceEl) return;
  const inner = sourceEl.querySelector('h1, h2, h3, h4, h5, h6') || sourceEl;
  [...inner.childNodes].forEach((n) => h1.append(n.cloneNode(true)));
}

function textFrom(cell) {
  return cell ? cell.textContent.trim() : '';
}

function firstLinkHref(cell) {
  const a = cell?.querySelector('a');
  return a ? a.getAttribute('href') : null;
}

export default async function decorate(block) {
  const rows = [...block.children];

  const eyebrowText = textFrom(rows[0]?.firstElementChild) || 'Featured story';

  // The intro/default row carries the initial headline, byline, CTAs.
  const introRow = rows[1];
  const introCells = introRow ? [...introRow.children] : [];
  const [introHeadlineCell, introBylineCell, , ctaCell] = introCells;

  // Remaining rows are slides.
  const slideRows = rows.slice(2);

  // Collect per-slide data: image, headline source, byline, primary href.
  const slides = slideRows.map((row) => {
    const cells = [...row.children];
    const [imgCell, headlineCell, bylineCell, hrefCell] = cells;
    return {
      img: imgCell?.querySelector('img, picture') || null,
      headline: headlineCell || introHeadlineCell || null,
      byline: textFrom(bylineCell) || textFrom(introBylineCell),
      href: firstLinkHref(hrefCell) || firstLinkHref(headlineCell) || null,
    };
  });

  // --- Build the new DOM ---------------------------------------------------
  block.replaceChildren();

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const grid = document.createElement('div');
  grid.className = 'hero-grid';

  // Copy column
  const copy = document.createElement('div');
  copy.className = 'hero-copy';

  const eyebrow = document.createElement('span');
  eyebrow.className = 'hero-eyebrow';
  eyebrow.textContent = eyebrowText;

  // Reuse an authored heading if present; otherwise create the single <h1>.
  let headline = introHeadlineCell?.querySelector('h1, h2, h3, h4, h5, h6');
  if (headline) {
    headline.remove();
    headline.removeAttribute('id');
  } else {
    headline = document.createElement('h1');
    buildHeadline(headline, introHeadlineCell);
  }
  headline.className = 'hero-headline';
  headline.setAttribute('aria-live', 'polite');

  const subhead = document.createElement('p');
  subhead.className = 'hero-subhead';
  subhead.textContent = slides[0]?.byline || textFrom(introBylineCell) || '';

  copy.append(eyebrow, headline, subhead);

  // CTAs — clone the authored cell anchors; global btn system styles them.
  let primaryCta = null;
  if (ctaCell && ctaCell.querySelector('a')) {
    const actions = document.createElement('div');
    actions.className = 'actions';
    [...ctaCell.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
    copy.append(actions);
    primaryCta = actions.querySelector('strong a, a');
  }

  // Carousel column
  const carouselWrap = document.createElement('div');
  carouselWrap.className = 'hero-carousel-wrap';

  const carousel = document.createElement('div');
  carousel.className = 'hero-carousel';
  carousel.setAttribute('role', 'region');
  carousel.setAttribute('aria-label', 'Featured patient stories');
  carousel.setAttribute('aria-roledescription', 'carousel');

  const slidesEl = document.createElement('div');
  slidesEl.className = 'hero-slides';

  slides.forEach((slide, i) => {
    const slideEl = document.createElement('div');
    slideEl.className = 'hero-slide';
    slideEl.setAttribute('role', 'group');
    slideEl.setAttribute('aria-roledescription', 'slide');
    slideEl.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
    if (slide.img) {
      const media = slide.img.cloneNode(true);
      const img = media.tagName === 'IMG' ? media : media.querySelector('img');
      if (img) {
        img.loading = i === 0 ? 'eager' : 'lazy';
        if (i === 0) img.setAttribute('fetchpriority', 'high');
      }
      slideEl.append(media);
    }
    slidesEl.append(slideEl);
  });

  carousel.append(slidesEl);

  // Controls
  const controls = document.createElement('div');
  controls.className = 'hero-carousel-controls';

  const nav = document.createElement('div');
  nav.className = 'carousel-nav';
  nav.setAttribute('role', 'group');
  nav.setAttribute('aria-label', 'Carousel controls');

  const chevron = '<path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  const svg = (flip) => `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"${flip ? ' style="transform:scaleX(-1)"' : ''}>${chevron}</svg>`;

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'chev-circle';
  prevBtn.setAttribute('aria-label', 'Previous story');
  prevBtn.innerHTML = svg(false);

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'chev-circle';
  nextBtn.setAttribute('aria-label', 'Next story');
  nextBtn.innerHTML = svg(true);

  nav.append(prevBtn, nextBtn);

  const indicators = document.createElement('div');
  indicators.className = 'carousel-indicators';
  indicators.setAttribute('role', 'tablist');
  indicators.setAttribute('aria-label', 'Featured stories');

  const dots = slides.map((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.textContent = String(i + 1);
    dot.setAttribute('aria-label', `Story ${i + 1}`);
    if (i === 0) dot.setAttribute('aria-current', 'true');
    indicators.append(dot);
    return dot;
  });

  controls.append(nav, indicators);
  carouselWrap.append(carousel, controls);

  grid.append(copy, carouselWrap);
  wrap.append(grid);
  block.append(wrap);

  // --- Carousel behavior ---------------------------------------------------
  let index = 0;
  const total = slides.length || 1;

  function update() {
    slidesEl.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, i) => {
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    const slide = slides[index];
    if (slide) {
      buildHeadline(headline, slide.headline);
      subhead.textContent = slide.byline || '';
      if (primaryCta && slide.href) primaryCta.setAttribute('href', slide.href);
    }
  }

  function goTo(i) {
    index = (i + total) % total;
    update();
  }

  prevBtn.addEventListener('click', () => goTo(index - 1));
  nextBtn.addEventListener('click', () => goTo(index + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  carousel.setAttribute('tabindex', '0');
  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      goTo(index - 1);
    } else if (e.key === 'ArrowRight') {
      goTo(index + 1);
    }
  });

  // Initial paint (headline emphasis, byline, CTA href for slide 0).
  update();

  // Autoplay 6s, gated on prefers-reduced-motion.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer = null;

  function stopAutoplay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startAutoplay() {
    if (reduce.matches || total <= 1) return;
    stopAutoplay();
    timer = setInterval(() => goTo(index + 1), AUTOPLAY_MS);
  }

  block.addEventListener('mouseenter', stopAutoplay);
  block.addEventListener('mouseleave', startAutoplay);
  block.addEventListener('focusin', stopAutoplay);
  block.addEventListener('focusout', startAutoplay);
  reduce.addEventListener('change', () => {
    if (reduce.matches) stopAutoplay();
    else startAutoplay();
  });

  startAutoplay();
}
