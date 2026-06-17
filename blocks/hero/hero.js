/**
 * hero — full-bleed cinematic photo with a dark contrast scrim and a
 * bottom-left type overlay (prototype data-section="hero",
 * data-layout="full-bleed-photo-with-overlay").
 *
 * Authoring rows (one cell each, content-classified — never by index):
 *   - eyebrow text          → .hero-eyebrow
 *   - <h1>Made for thin air.</h1>  (stays the single page <h1>, var(--hero))
 *   - subhead text          → .hero-subhead
 *   - CTA <strong><a></a></strong> (cloned; decorateButton applies .btn.btn-primary)
 *   - <picture><img></picture> the full-bleed background photo (authored content)
 *
 * The photo becomes a full-bleed background layer, a REQUIRED dark scrim layer
 * sits on top (mandatory for legibility — not decorative), and the eyebrow /
 * h1 / subhead / CTA render in a constrained bottom-left overlay.
 */

/* Cell-level cascade collector (#71): iterate every :scope>div>div cell, push
   its child elements; when a cell is text-only, synthesize a <p> from its text.
   Recovers the one-cell-per-row DA shape AND the rich multi-row shape. */
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

function hasLink(el) {
  return el.matches('a') ? el : el.querySelector('a');
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  let media = null;
  let heading = null;
  const links = [];
  const texts = [];

  nodes.forEach((el) => {
    const m = isMedia(el);
    if (m && !media) { media = m; return; }
    const h = isHeading(el);
    if (h && !heading) { heading = h; return; }
    if (hasLink(el)) { links.push(el); return; }
    if (el.textContent.trim()) texts.push(el);
  });

  // Order is eyebrow → (heading) → subhead: the short line before the heading
  // is the eyebrow, the line after is the subhead (#51).
  const [eyebrow, subhead] = texts;

  // --- background photo layer ---
  const photoWrap = document.createElement('div');
  photoWrap.className = 'hero-photo-wrap';
  if (media) {
    const img = media.matches('img') ? media : media.querySelector('img');
    if (img) img.classList.add('hero-photo');
    photoWrap.append(media);
  }

  // --- REQUIRED dark contrast scrim (legibility, not decorative) ---
  const scrim = document.createElement('div');
  scrim.className = 'hero-scrim';
  scrim.setAttribute('aria-hidden', 'true');

  // --- bottom-left overlay content ---
  const overlay = document.createElement('div');
  overlay.className = 'hero-overlay';

  if (eyebrow) {
    eyebrow.className = 'hero-eyebrow';
    overlay.append(eyebrow);
  }
  if (heading) {
    heading.classList.add('hero-h1');
    overlay.append(heading);
  }
  if (subhead) {
    subhead.className = 'hero-subhead';
    overlay.append(subhead);
  }
  if (links.length) {
    const actions = document.createElement('div');
    actions.className = 'hero-cta-row';
    links.forEach((l) => actions.append(l));
    overlay.append(actions);
  }

  block.replaceChildren(photoWrap, scrim, overlay);
}
