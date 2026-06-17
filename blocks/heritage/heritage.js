/**
 * heritage — brand-anchor editorial spread (prototype data-section="heritage").
 *
 * A black 2-column spread: LEFT a B&W archival photo (figure, 16/11), RIGHT a
 * text column holding the eyebrow, a GIANT founding-year numeral, prose, and a
 * ghost CTA. Lifted from the prototype's [data-section="heritage"] / .ds-* rules.
 *
 * Authoring rows (classified by CONTENT, never by index):
 *   eyebrow line ("The early days") · <h2>1996</h2> · prose paragraph(s) ·
 *   a CTA link (<em><a>…→</a></em>) · a <picture>/<img> (archival photo)
 *
 * Decode is a cell-level cascade collector (#71); media matches `picture, img`
 * (#72); the year heading is unwrapped before cloning (#55).
 */

function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) {
      out.push(...kids);
    } else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      out.push(p);
    }
  });
  return out.length ? out : [...block.children];
}

const matchOrFind = (el, sel) => (el.matches(sel) ? el : el.querySelector(sel));

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  const media = nodes.map((n) => matchOrFind(n, 'picture, img')).find(Boolean);
  const link = nodes.map((n) => matchOrFind(n, 'a')).find(Boolean);
  const yearSrc = nodes.find((n) => matchOrFind(n, 'h1, h2, h3, h4, h5, h6'));
  const textRows = nodes.filter((n) => n !== yearSrc && n.textContent.trim()
    && !matchOrFind(n, 'a') && !matchOrFind(n, 'picture, img'));
  const eyebrowNode = textRows[0] || null;
  const proseNodes = textRows.slice(1);

  // LEFT — archival photo.
  const figure = document.createElement('figure');
  figure.className = 'heritage-photo';
  if (media) figure.append(matchOrFind(media, 'picture, img'));

  // RIGHT — text column.
  const text = document.createElement('div');
  text.className = 'heritage-text';

  if (eyebrowNode) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'heritage-eyebrow';
    eyebrow.textContent = eyebrowNode.textContent.trim();
    text.append(eyebrow);
  }
  if (yearSrc) {
    const inner = matchOrFind(yearSrc, 'h1, h2, h3, h4, h5, h6') || yearSrc;
    const year = document.createElement('h2');
    year.className = 'heritage-year';
    year.append(...inner.childNodes);
    text.append(year);
  }
  if (proseNodes.length) {
    const prose = document.createElement('div');
    prose.className = 'heritage-prose';
    proseNodes.forEach((n) => {
      const p = document.createElement('p');
      if (n.matches('p')) p.append(...n.childNodes);
      else p.textContent = n.textContent.trim();
      prose.append(p);
    });
    text.append(prose);
  }
  if (link) {
    // clone as-is; the EDS button decorator turns <em><a> into .btn.btn-secondary.
    const actions = document.createElement('div');
    actions.className = 'heritage-cta';
    actions.append(link.closest('em') || link);
    text.append(actions);
  }

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  if (media) wrap.append(figure);
  wrap.append(text);
  block.replaceChildren(wrap);
}
