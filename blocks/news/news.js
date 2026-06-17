/**
 * News (calm rhythm) — section block.
 *
 * Authoring shape (flat siblings inside one cell):
 *   <p>kicker eyebrow</p>
 *   <h2>section heading</h2>
 *   then, per news item (in order):
 *     <p>meta (type · date)</p>
 *     <h3>headline</h3>
 *     <p>org</p>
 *     <a href>…</a>   (the item link)
 *
 * We flatten everything and classify by content rather than by row/cell
 * index. Item boundaries are the repeating <h3> headlines; each <h3>'s
 * surrounding meta/org/link belong to that item.
 *
 * @param {Element} block
 */
/**
 * Cascade collector (#68): each authored element may sit in its own row/cell,
 * and text-only cells (the kicker eyebrow, each item's meta and org) hold a
 * bare text node with NO child element — so `:scope > div > div > *` silently
 * drops them. Collect per cell, synthesizing a <p> for bare-text cells; order
 * preserved.
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
  const nodes = collectNodes(block);

  const headings = nodes.filter((n) => n.tagName === 'H3');
  const links = nodes.filter((n) => n.tagName === 'A');
  const paras = nodes.filter((n) => n.tagName === 'P');

  // Head: kicker eyebrow + section <h2>.
  const head = document.createElement('div');
  head.className = 'news-head';

  // First <p> is the kicker eyebrow; reuse the authored heading element.
  const kickerText = paras.length ? paras.shift() : null;
  const kicker = document.createElement('p');
  kicker.className = 'kicker';
  kicker.textContent = kickerText ? kickerText.textContent.trim() : '';
  head.append(kicker);

  const h2 = nodes.find((n) => n.tagName === 'H2');
  if (h2) {
    head.append(h2);
  } else {
    const fallbackH2 = document.createElement('h2');
    fallbackH2.textContent = 'News';
    head.append(fallbackH2);
  }

  // Build the list. One item per repeating <h3>.
  const list = document.createElement('ul');
  list.className = 'news-list';

  headings.forEach((h3, i) => {
    const li = document.createElement('li');
    li.className = 'news-item';

    const a = document.createElement('a');
    if (links[i]) a.href = links[i].getAttribute('href') || '#';
    else a.href = '#';

    // Two paragraphs remain per item, in order: meta then org.
    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = (paras[i * 2] && paras[i * 2].textContent.trim()) || '';

    const headline = document.createElement('h3');
    headline.textContent = h3.textContent.trim();

    const org = document.createElement('p');
    org.className = 'org';
    org.textContent = (paras[i * 2 + 1] && paras[i * 2 + 1].textContent.trim()) || '';

    a.append(meta, headline, org);
    li.append(a);
    list.append(li);
  });

  // Container wrap (full-bleed surface band, wrapped content).
  const container = document.createElement('div');
  container.className = 'news-inner';
  container.append(head, list);

  block.replaceChildren(container);
}
