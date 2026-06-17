/**
 * taprooms — photographic two-panel diptych preceded by a section head.
 *
 * Authoring shape (#62): ONE row with ONE cell holding all elements as flat
 * siblings. We flatten and classify by content, not by row/cell index:
 *   - eyebrow paragraph + <h2> "Come Drink Where We Brew" + a "more" link
 *     form the section head;
 *   - each <h3> starts a new panel; the elements that follow it (eyebrow,
 *     est line, blurb, cta link, picture) belong to that panel until the
 *     next <h3>.
 * Rendered panel count MUST equal the number of authored <h3> headings.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // Section-head pieces (before the first h3): eyebrow, h2, more-link.
  const firstPanelIdx = nodes.findIndex((n) => n.tagName === 'H3');
  const headNodes = firstPanelIdx === -1 ? nodes : nodes.slice(0, firstPanelIdx);
  const panelNodes = firstPanelIdx === -1 ? [] : nodes.slice(firstPanelIdx);

  // ---- section head ----
  const head = document.createElement('div');
  head.className = 'taprooms-head-wrap';

  const headInner = document.createElement('div');
  headInner.className = 'ds-section-head';

  const headLeft = document.createElement('div');
  let moreLink;
  headNodes.forEach((n) => {
    const link = n.tagName === 'A' ? n : n.querySelector('a');
    if (link) {
      moreLink = link;
      return;
    }
    if (n.tagName === 'H2') {
      n.style.fontSize = 'var(--t-37)';
      headLeft.append(n);
    } else if (n.textContent.trim()) {
      const eyebrow = document.createElement('p');
      eyebrow.className = 'ds-eyebrow';
      eyebrow.textContent = n.textContent.trim();
      headLeft.append(eyebrow);
    }
  });
  headInner.append(headLeft);
  if (moreLink) {
    moreLink.className = 'ds-more';
    headInner.append(moreLink);
  }
  head.append(headInner);

  // ---- panels ----
  const diptych = document.createElement('div');
  diptych.className = 'ds-taprooms-diptych';

  // Slug → background image (root-relative; served from the page origin).
  const BASE = '/img/wbb';
  const IMAGES = [`${BASE}/taproom-heber-valley.jpg`, `${BASE}/taproom-park-city.jpg`];

  // Segment panelNodes into one group per <h3> (the repeating-heading
  // boundary). The eyebrow paragraph authored immediately before an <h3>
  // belongs to the panel that <h3> opens, so when an <h3> arrives we hand its
  // group the trailing node of the previous group if that group hasn't seen
  // its own <h3> yet.
  const panels = [];
  let buffer = []; // nodes seen since the last <h3> boundary
  panelNodes.forEach((n) => {
    if (n.tagName === 'H3') {
      // Close the previous panel: everything in the buffer except the final
      // lead-in node (the eyebrow that belongs to THIS panel) stays with it.
      const leadIn = buffer.length ? buffer.pop() : null;
      if (panels.length) panels[panels.length - 1].push(...buffer);
      buffer = [];
      panels.push(leadIn ? [leadIn, n] : [n]);
    } else {
      buffer.push(n);
    }
  });
  if (panels.length) panels[panels.length - 1].push(...buffer);

  panels.forEach((items, i) => {
    const panel = document.createElement('a');
    panel.className = 'ds-tap-panel';

    const bg = document.createElement('span');
    bg.className = 'ds-tap-panel-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.style.backgroundImage = `url("${IMAGES[i % IMAGES.length]}")`;
    panel.append(bg);

    const content = document.createElement('div');
    content.className = 'ds-tap-content';

    // Classify within the panel by role, then emit in fixed visual order so the
    // result is independent of authored sibling order.
    let title;
    const paras = [];
    let cta;
    items.forEach((n) => {
      const link = n.tagName === 'A' ? n : n.querySelector('a');
      if (link) {
        if (link.getAttribute('href')) panel.href = link.getAttribute('href');
        cta = document.createElement('span');
        cta.className = 'ds-tap-cta';
        cta.textContent = link.textContent.trim();
        return;
      }
      if (n.tagName === 'H3') {
        title = n;
        return;
      }
      const text = n.textContent.trim();
      if (text) paras.push(text);
    });

    // paras in authored order: eyebrow, est, blurb.
    const [eyebrowText, estText, ...blurbParts] = paras;
    if (eyebrowText) {
      const eb = document.createElement('p');
      eb.className = 'ds-eyebrow';
      eb.textContent = eyebrowText;
      content.append(eb);
    }
    if (title) content.append(title);
    if (estText) {
      const est = document.createElement('p');
      est.className = 'ds-tap-est';
      est.textContent = estText;
      content.append(est);
    }
    if (blurbParts.length) {
      const blurb = document.createElement('p');
      blurb.className = 'ds-tap-blurb';
      blurb.textContent = blurbParts.join(' ');
      content.append(blurb);
    }
    if (cta) content.append(cta);

    panel.append(content);
    diptych.append(panel);
  });

  block.textContent = '';
  block.append(head, diptych);
}
