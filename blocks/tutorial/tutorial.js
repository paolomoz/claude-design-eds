/*
 * Tutorial carousel block.
 *
 * Authoring contract: ONE row with ONE cell holding a flat sequence of
 * per-slide content, each slide group started by an <h2> heading:
 *   <p class="eyebrow">Eyebrow</p>  (optional)
 *   <h2>Slide title</h2>
 *   <p>Body copy</p>
 *   <em><a href="…">CTA label</a></em>   (cloned verbatim -> btn-secondary)
 *
 * The flat content is segmented into one group per <h2> (#52). Each group
 * becomes a wide media slide with a warm-gradient background and overlaid copy.
 * The block builds the slide track plus prev/next arrows and dot controls (#28).
 *
 * Authors may lay the content out as one row with one multi-element cell, OR as
 * one element per row (the canonical EDS table shape). Either way the block
 * flattens every row's cells into a single node sequence before segmenting.
 */

const PREV_SVG = '<svg viewBox="0 0 11 11" fill="none" aria-hidden="true"><path d="M7 1L2 5.5 7 10" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const NEXT_SVG = '<svg viewBox="0 0 11 11" fill="none" aria-hidden="true"><path d="M4 1l5 4.5L4 10" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/**
 * Flatten every row's cells into one ordered list of content elements.
 * @param {Element} block the block element
 * @returns {Element[]} flat list of authored elements
 */
function flattenRows(block) {
  const out = [];
  [...block.children].forEach((rowEl) => {
    [...rowEl.children].forEach((cellEl) => {
      out.push(...cellEl.children);
    });
  });
  return out;
}

/**
 * Split a flat list of nodes into slide groups. Each <h2> starts a new slide;
 * a loose paragraph immediately preceding an <h2> (the eyebrow) is pulled into
 * the slide it introduces rather than left on the previous one.
 * @param {Element[]} children the flat content elements
 * @returns {Element[][]} array of slide groups (arrays of nodes)
 */
function segmentByHeading(children) {
  const groups = [];
  let current = null;
  const hasHeading = (group) => group.some((n) => n.tagName === 'H2');
  children.forEach((node, i) => {
    const next = children[i + 1];
    // A paragraph immediately before an <h2> is that slide's eyebrow: it opens
    // the new group rather than closing the previous one.
    if (node.tagName === 'P' && next && next.tagName === 'H2') {
      current = [node];
      groups.push(current);
      return;
    }
    if (node.tagName === 'H2') {
      // Reuse the group only if its eyebrow just opened it (no heading yet).
      if (!current || hasHeading(current)) {
        current = [];
        groups.push(current);
      }
      current.push(node);
      return;
    }
    if (current) current.push(node);
  });
  return groups;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const groups = segmentByHeading(flattenRows(block));
  if (!groups.length) return;

  // Build the slide track.
  const viewport = document.createElement('div');
  viewport.className = 'tutorial-viewport';
  const track = document.createElement('div');
  track.className = 'tutorial-track';
  viewport.append(track);

  groups.forEach((nodes) => {
    const slide = document.createElement('div');
    slide.className = 'tutorial-slide';

    const bg = document.createElement('div');
    bg.className = 'tutorial-slide-bg';
    bg.setAttribute('aria-hidden', 'true');
    slide.append(bg);

    const copy = document.createElement('div');
    copy.className = 'tutorial-slide-copy';
    nodes.forEach((node) => copy.append(node.cloneNode(true)));

    // Re-create eyebrow styling: EDS strips span/class wrappers in cells, so a
    // leading paragraph that precedes the <h2> is promoted to the eyebrow class.
    const firstChild = copy.firstElementChild;
    if (firstChild && firstChild.tagName === 'P') {
      firstChild.classList.add('eyebrow');
    }
    slide.append(copy);

    track.append(slide);
  });

  // Content wrap recreates the prototype's grid-margin inset / max-width.
  const wrap = document.createElement('div');
  wrap.className = 'tutorial-wrap';
  wrap.append(viewport);

  // Controls overlay (arrows + dots).
  const controls = document.createElement('div');
  controls.className = 'tutorial-controls';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'tutorial-arrow tutorial-arrow-prev';
  prev.setAttribute('aria-label', 'Previous slide');
  prev.innerHTML = PREV_SVG;

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'tutorial-arrow tutorial-arrow-next';
  next.setAttribute('aria-label', 'Next slide');
  next.innerHTML = NEXT_SVG;

  const dots = document.createElement('div');
  dots.className = 'tutorial-dots';
  const dotEls = groups.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'tutorial-dot';
    if (i === 0) dot.classList.add('tutorial-dot-active');
    dot.dataset.index = String(i);
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dots.append(dot);
    return dot;
  });

  controls.append(prev, next, dots);
  wrap.append(controls);

  block.replaceChildren(wrap);

  // Choreography.
  let index = 0;
  const total = groups.length;

  const goTo = (i) => {
    index = (i + total) % total;
    track.style.transform = `translateX(calc(${-index * 100}% - ${index} * var(--grid-gap, 8px)))`;
    dotEls.forEach((d, di) => d.classList.toggle('tutorial-dot-active', di === index));
  };

  prev.addEventListener('click', () => goTo(index - 1));
  next.addEventListener('click', () => goTo(index + 1));
  dotEls.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  if (total <= 1) {
    controls.remove();
  }
}
