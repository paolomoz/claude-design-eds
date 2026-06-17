/**
 * the-place — full-bleed cinematic photo with a dark scrim, an "Est 1996" tag,
 * and a bottom-anchored type overlay (prototype data-section="the-place",
 * data-layout="full-bleed-photo-with-overlay").
 *
 * Authoring rows (one cell each, content-classified — never by index):
 *   - tag text "Est 1996"   → .the-place-tag (top-right pill)
 *   - <h2>The Wasatch Back.</h2>  (var(--display))
 *   - body paragraph        → .the-place-body
 *   - <picture><img></picture> the full-bleed background photo (authored content)
 *
 * The photo becomes a full-bleed background layer, a REQUIRED dark scrim layer
 * sits on top, and the heading + body render in a constrained overlay.
 */

/* Cell-level cascade collector (#71): iterate every :scope>div>div cell, push
   its child elements; when a cell is text-only, synthesize a <p> from its text. */
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

function isMedia(el) {
  return el.matches('picture, img') ? el : el.querySelector('picture, img');
}

function isHeading(el) {
  return el.matches('h1, h2, h3, h4, h5, h6') ? el : el.querySelector('h1, h2, h3, h4, h5, h6');
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  let media = null;
  let heading = null;
  const texts = [];

  nodes.forEach((el) => {
    const m = isMedia(el);
    if (m && !media) { media = m; return; }
    const h = isHeading(el);
    if (h && !heading) { heading = h; return; }
    if (el.textContent.trim()) texts.push(el);
  });

  // Order is tag → (heading) → body: the short line before the heading is the
  // "Est 1996" tag; the sentence-length line after it is the body.
  const [tag, ...rest] = texts;

  // --- background photo layer ---
  if (media) {
    const img = media.matches('img') ? media : media.querySelector('img');
    if (img) img.classList.add('the-place-bg');
    block.prepend(media);
  }

  // --- REQUIRED dark contrast scrim ---
  const scrim = document.createElement('div');
  scrim.className = 'the-place-scrim';
  scrim.setAttribute('aria-hidden', 'true');

  // --- corner tag ---
  let tagEl = null;
  if (tag) {
    tagEl = document.createElement('span');
    tagEl.className = 'the-place-tag';
    tagEl.textContent = tag.textContent.trim();
  }

  // --- bottom-anchored overlay ---
  const overlay = document.createElement('div');
  overlay.className = 'the-place-overlay';
  if (heading) {
    heading.classList.add('the-place-h2');
    overlay.append(heading);
  }
  rest.forEach((p) => {
    p.classList.add('the-place-body');
    overlay.append(p);
  });

  const children = [];
  if (media) children.push(media);
  children.push(scrim);
  if (tagEl) children.push(tagEl);
  children.push(overlay);
  block.replaceChildren(...children);
}
