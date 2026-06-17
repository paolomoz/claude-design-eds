/**
 * Events block — a stacked schedule list under a kicker + heading.
 *
 * Authored shape (#62): ONE row / ONE cell holding all elements as flat
 * siblings. We flatten and classify by content rather than by row/cell index:
 *   - the heading (<h2>…) marks the end of the head
 *   - the paragraph before the heading is the kicker eyebrow
 *   - everything after is event data, in repeating groups of four cells:
 *       date ("DD Mon") | title | meta ("Location · status") | link href
 *
 * @param {Element} block The block element
 */
/**
 * Cascade collector (#68): each authored element may sit in its own row/cell,
 * and text-only cells (the kicker, each event's date/title/meta) hold a bare
 * text node with NO child element — so `:scope > div > div > *` silently drops
 * them, leaving only the "Details" links. Collect per cell, synthesizing a <p>
 * for bare-text cells; document order preserved.
 * @param {Element} block
 * @returns {Element[]}
 */
function collectNodes(block) {
  const out = [];
  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    const els = [...cell.children];
    if (els.length) {
      out.push(...els);
    } else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      out.push(p);
    }
  });
  return out;
}

export default async function decorate(block) {
  // Flatten: collect every leaf element authored inside the block.
  const nodes = collectNodes(block);

  // Locate the heading — it is the head boundary.
  const headingEl = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  const headingIdx = headingEl ? nodes.indexOf(headingEl) : -1;

  // Kicker = the last text node before the heading (if any).
  let kickerText = '';
  if (headingIdx > 0) {
    const prev = nodes[headingIdx - 1];
    if (prev && prev.tagName !== 'A') kickerText = prev.textContent.trim();
  }

  // Event data = everything after the heading. Pull the text/href of each.
  const rest = headingIdx >= 0 ? nodes.slice(headingIdx + 1) : nodes;
  const fields = rest.map((n) => {
    const link = n.tagName === 'A' ? n : n.querySelector('a');
    return {
      text: n.textContent.trim(),
      href: link ? link.getAttribute('href') : '',
      isLink: !!link,
    };
  }).filter((f) => f.text || f.href);

  // Group into events of four fields: date | title | meta | href.
  const events = [];
  for (let i = 0; i < fields.length; i += 4) {
    const group = fields.slice(i, i + 4);
    if (!group.length) break;
    const linkField = group.find((f) => f.isLink) || group[3] || {};
    events.push({
      date: (group[0] && group[0].text) || '',
      title: (group[1] && group[1].text) || '',
      meta: (group[2] && group[2].text) || '',
      href: linkField.href || (group[3] && group[3].text) || '#',
    });
  }

  // Build the head.
  const wrap = document.createElement('div');
  wrap.className = 'events-wrap';

  const head = document.createElement('div');
  head.className = 'events-head';
  if (kickerText) {
    const kicker = document.createElement('p');
    kicker.className = 'kicker';
    kicker.textContent = kickerText;
    head.append(kicker);
  }
  if (headingEl) {
    head.append(headingEl); // reuse the authored, server-visible heading
  }
  wrap.append(head);

  // Build the list.
  const list = document.createElement('ul');
  list.className = 'events-list';

  events.forEach((ev) => {
    const item = document.createElement('li');
    item.className = 'event';

    // Date chip — split "DD Mon" into day + month (cells stripped spans #39).
    const dateBox = document.createElement('div');
    dateBox.className = 'event-date';
    const parts = ev.date.split(/\s+/);
    const day = document.createElement('div');
    day.className = 'event-day';
    [day.textContent] = parts;
    const month = document.createElement('div');
    month.className = 'event-month';
    month.textContent = parts.slice(1).join(' ');
    dateBox.append(day, month);

    // Body — title + meta.
    const body = document.createElement('div');
    body.className = 'event-body';
    const title = document.createElement('span');
    title.className = 'event-title';
    title.textContent = ev.title;
    const meta = document.createElement('span');
    meta.className = 'event-meta';
    meta.textContent = ev.meta;
    body.append(title, meta);

    // Details — a plain styled text link (NOT a button #12).
    const link = document.createElement('a');
    link.className = 'text-link';
    link.href = ev.href;
    link.textContent = 'Details';

    item.append(dateBox, body, link);
    list.append(item);
  });

  wrap.append(list);

  block.textContent = '';
  block.append(wrap);
}
