/**
 * loads and decorates the events block
 * @param {Element} block The block element
 *
 * Authored as ONE row / ONE cell holding all elements as flat siblings:
 *   - an eyebrow line (first short text, e.g. "What's on")
 *   - the section title as a heading (h2)
 *   - a "Full calendar" link (the outline pill)
 *   - then, per event, a mono day label, a repeating boundary heading (h3),
 *     a body paragraph, and a details link.
 *
 * We FLATTEN the authored nodes and segment/classify by content, never by
 * row/cell index. Card boundaries are the repeating <h3> headings; the mono
 * day label is the text node immediately preceding each card heading.
 */
export default async function decorate(block) {
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  const isHeading = (n, tag) => (tag ? n.tagName === tag : /^H[1-6]$/.test(n.tagName));
  const linkOf = (n) => (n.tagName === 'A' ? n : n.querySelector?.('a'));
  const isText = (n) => (n.tagName === 'P' || n.tagName === 'DIV') && !linkOf(n)
    && n.textContent.trim();

  // First card heading marks the boundary between the head and the grid.
  const firstH3 = nodes.find((n) => n.tagName === 'H3');
  const splitIndex = firstH3 ? nodes.indexOf(firstH3) : nodes.length;
  const headNodes = nodes.slice(0, splitIndex);
  const cardNodes = nodes.slice(splitIndex);

  // The day label for the FIRST card may be authored just before its heading,
  // i.e. as the last head node. Pull it out of the head stream if so.
  let leadingDay = null;
  if (firstH3 && headNodes.length) {
    const last = headNodes[headNodes.length - 1];
    if (isText(last)) {
      leadingDay = last;
      headNodes.pop();
    }
  }

  // Build the constrained content wrapper.
  const inner = document.createElement('div');
  inner.className = 'events-inner';

  // --- Head row: eyebrow + section title (h2) + outline pill link ---
  const head = document.createElement('div');
  head.className = 'events-head';
  const headText = document.createElement('div');

  const sectionHeading = headNodes.find((n) => isHeading(n));
  if (headNodes.find((n) => isText(n))) {
    const eyebrow = document.createElement('div');
    eyebrow.className = 'events-eyebrow';
    eyebrow.textContent = headNodes.find((n) => isText(n)).textContent.trim();
    headText.append(eyebrow);
  }
  if (sectionHeading) {
    sectionHeading.classList.add('events-title');
    headText.append(sectionHeading);
  }
  head.append(headText);

  const calendarSrc = headNodes.find((n) => linkOf(n));
  if (calendarSrc) {
    const link = linkOf(calendarSrc);
    link.classList.add('events-more');
    head.append(link);
  }
  inner.append(head);

  // --- Card grid: segment flat siblings by repeating <h3> boundaries ---
  const grid = document.createElement('div');
  grid.className = 'events-grid';

  let current = null;
  let pendingDay = leadingDay;
  cardNodes.forEach((node) => {
    if (node.tagName === 'H3') {
      current = document.createElement('article');
      current.className = 'event';
      grid.append(current);
      if (pendingDay) {
        const day = document.createElement('div');
        day.className = 'event-day';
        day.textContent = pendingDay.textContent.trim();
        current.append(day);
        pendingDay = null;
      }
      node.classList.add('event-title');
      current.append(node);
      return;
    }
    if (!current) return;

    const link = linkOf(node);
    if (link) {
      link.classList.add('event-link');
      current.append(link);
    } else if (isText(node)) {
      // A text node that is NOT followed by content in this card, but instead
      // precedes the next card heading, is the next card's day label.
      const idx = cardNodes.indexOf(node);
      const next = cardNodes[idx + 1];
      if (next && next.tagName === 'H3') {
        pendingDay = node;
      } else {
        const p = document.createElement('p');
        p.className = 'event-body';
        p.textContent = node.textContent.trim();
        current.append(p);
      }
    }
  });

  inner.append(grid);
  block.replaceChildren(inner);
}
