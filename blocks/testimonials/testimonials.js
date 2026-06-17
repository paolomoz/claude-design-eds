/**
 * Testimonials — light-surface quote carousel.
 * Authored as ONE row / ONE cell holding flat siblings: a <blockquote> per quote
 * optionally followed by its attribution (paragraph / figcaption / em text).
 * We flatten, segment on each blockquote boundary into one slide per quote, and
 * wire prev/next round controls to rotate slides.
 * @param {Element} block
 */
export default async function decorate(block) {
  // Two authored shapes:
  //  (a) one row per quote, cells = [quote, attribution?] (this content file);
  //  (b) one flat cell with a <blockquote>/heading per quote + attribution runs.
  // Read each row's cells first; if a row only holds inline text we take the
  // cell text directly (the quote/attribution are bare text, not wrapped
  // elements, so ':scope > div > div > *' is empty for shape (a)).
  const rows = [...block.querySelectorAll(':scope > div')];
  const groups = [];

  rows.forEach((row) => {
    const cells = [...row.children];
    const flat = [...row.querySelectorAll(':scope > div > *')];
    if (flat.length) {
      // shape (b): flat element run within one cell
      flat.forEach((node) => {
        const text = (node.textContent || '').trim();
        if (!text) return;
        const isQuote = node.matches('blockquote, h1, h2, h3, h4');
        if (isQuote || groups.length === 0) groups.push({ quote: text, attribution: '' });
        else {
          const cur = groups[groups.length - 1];
          cur.attribution = cur.attribution ? `${cur.attribution} ${text}` : text;
        }
      });
      return;
    }
    // shape (a): one row = one quote, cells carry quote then attribution
    const quote = (cells[0]?.textContent || '').trim();
    if (!quote) return;
    const attribution = (cells[1]?.textContent || '').trim();
    groups.push({ quote, attribution });
  });

  const carousel = document.createElement('div');
  carousel.className = 'quote-carousel';

  groups.forEach((group, i) => {
    const figure = document.createElement('figure');
    figure.className = `quote-slide${i === 0 ? ' is-active' : ''}`;

    const blockquote = document.createElement('blockquote');
    blockquote.textContent = group.quote;
    figure.append(blockquote);

    if (group.attribution) {
      const figcaption = document.createElement('figcaption');
      figcaption.textContent = group.attribution;
      figure.append(figcaption);
    }
    carousel.append(figure);
  });

  // Controls — only meaningful with more than one slide.
  if (groups.length > 1) {
    const controls = document.createElement('div');
    controls.className = 'quote-carousel-controls';

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.setAttribute('aria-label', 'Previous slide');
    prev.textContent = '‹';

    const next = document.createElement('button');
    next.type = 'button';
    next.setAttribute('aria-label', 'Next slide');
    next.textContent = '›';

    controls.append(prev, next);
    carousel.append(controls);

    let index = 0;
    const slides = [...carousel.querySelectorAll('.quote-slide')];
    const show = (n) => {
      index = (n + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    };
    prev.addEventListener('click', () => show(index - 1));
    next.addEventListener('click', () => show(index + 1));
  }

  block.textContent = '';
  block.append(carousel);
}
