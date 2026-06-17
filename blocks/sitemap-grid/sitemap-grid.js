/**
 * sitemap-grid — visual page-status grid (6-col) of every page in a build.
 *
 * Authoring shape (one line per row, delimiters carry structure, #50):
 *   Row 1:  Sitemap                         (section title → <h2>)
 *   Row 1b: (optional) a hint line, e.g.    12 pages · 1 done · 3 running …
 *   Row N:  /slug · status                  (one page per delimited line)
 *
 * `status` is one of: done | running | queued | blocked (case-insensitive).
 * JS sets the per-cell status class from the authored token; the running
 * cell additionally receives the diagonal shimmer overlay (CSS ::before).
 */

const STATUSES = ['done', 'running', 'queued', 'blocked'];

/* Cell-level cascade collector (#62/#68/#71): iterate cells, push child
   elements when present, else synthesize a <p> from the cell's own text so
   bare-text page lines are never silently dropped. */
function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) out.push(...kids);
    else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      out.push(p);
    }
  });
  return out.length ? out : [...block.children];
}

function statusOf(text) {
  const lower = text.toLowerCase();
  return STATUSES.find((s) => new RegExp(`\\b${s}\\b`).test(lower)) || 'queued';
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  // Classify by content: a heading element (or the first node) is the title;
  // a line containing a status token is a page cell; anything else before the
  // first page line is the section hint.
  let heading = null;
  let hint = '';
  const pages = [];

  nodes.forEach((node) => {
    const inner = node.matches('h1,h2,h3,h4,h5,h6') ? node : node.querySelector('h1,h2,h3,h4,h5,h6');
    const txt = node.textContent.trim();
    if (!txt) return;

    if (!heading) {
      // First meaningful node is the section title (strip a leading status word
      // from the hint detection by treating the title separately).
      heading = inner ? inner.textContent.trim() : txt;
      return;
    }

    // Page line: "slug · status" — exactly two ·-delimited segments whose
    // second segment is a bare status token. The summary hint also carries
    // ·-delimiters and status words ("1 done · 3 running …") but has >2
    // segments, so the strict 2-segment test keeps them apart (#50).
    const parts = txt.split('·').map((p) => p.trim()).filter(Boolean);
    const isPage = parts.length === 2
      && STATUSES.includes(parts[1].toLowerCase());
    if (isPage) {
      pages.push({ slug: parts[0], status: statusOf(parts[1]) });
    } else if (!pages.length && !hint) {
      // A pre-grid descriptive line becomes the hint.
      hint = txt;
    }
  });

  // Build DOM.
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const head = document.createElement('div');
  head.className = 'sect-h';
  const h2 = document.createElement('h2');
  h2.textContent = heading || 'Sitemap';
  head.append(h2);
  if (hint) {
    const span = document.createElement('span');
    span.className = 'sect-h__hint';
    span.textContent = hint;
    head.append(span);
  }
  wrap.append(head);

  const grid = document.createElement('div');
  grid.className = 'sitemap';
  pages.forEach(({ slug, status }) => {
    const cell = document.createElement('div');
    cell.className = `sitemap__cell sitemap__cell--${status}`;
    const slugEl = document.createElement('span');
    slugEl.className = 'sitemap__cell__slug';
    slugEl.textContent = slug;
    cell.append(slugEl);
    grid.append(cell);
  });
  wrap.append(grid);

  block.replaceChildren(wrap);
}
