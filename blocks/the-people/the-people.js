/**
 * the-people — two equal full-bleed photo halves, side by side, each a
 * clickable panel linking to a taproom (prototype data-section="the-people",
 * data-layout="full-bleed-photo-split-2").
 *
 * Each half is a background <img> (object-fit: cover) + a REQUIRED dark scrim +
 * a bottom-anchored overlay (eyebrow, <h2> taproom name, teaser paragraph, CTA
 * text). The whole panel is wrapped in an <a href> so the entire half is the
 * click target. At <=640px the two halves stack vertically.
 *
 * Authoring rows (per half, content-classified — never by index):
 *   - eyebrow text "Visit . taproom 01"      → .the-people-eyebrow
 *   - <h2>Heber Valley</h2>                   (var(--display)) — half boundary
 *   - teaser paragraph                        → .the-people-teaser
 *   - <a href="/taprooms#heber-valley">Find Heber Valley -></a>  panel link + CTA
 *   - <picture><img></picture>                background photo (authored content)
 *
 * Segmentation (#52/#73): collect every cell as a flat sibling list, then split
 * into one group per <h2> heading (one half per heading). Everything between two
 * headings — the eyebrow before it, the teaser/CTA/picture after it — folds into
 * the open half. The authored <h2> is reused; media matches `picture, img` (#72).
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

function asMedia(el) {
  return el.matches('picture, img') ? el : el.querySelector('picture, img');
}

function asHeading(el) {
  return el.matches('h1, h2, h3, h4, h5, h6') ? el : el.querySelector('h1, h2, h3, h4, h5, h6');
}

function asLink(el) {
  return el.matches('a') ? el : el.querySelector('a');
}

/* Segment the flat node list into one group per heading (#52/#73/#76). The
   eyebrow PRECEDES its heading in this layout, so a heading can't be the only
   thing that opens a half — buffer any text seen before a heading as the
   pending eyebrow and attach it to the half that heading opens. After a half's
   body/CTA, the next bare text is the FOLLOWING half's eyebrow, not this one's
   teaser — re-buffer it so it lands on the next heading. */
function segment(nodes) {
  const groups = [];
  let current = null;
  let pendingEyebrow = null;
  nodes.forEach((el) => {
    const h = asHeading(el);
    if (h) {
      current = {
        heading: h,
        eyebrow: pendingEyebrow,
        teaser: null,
        link: null,
        media: null,
      };
      pendingEyebrow = null;
      groups.push(current);
      return;
    }
    const m = asMedia(el);
    if (m) { if (current) current.media = m; return; }
    const a = asLink(el);
    if (a) { if (current) current.link = a; return; }
    if (!el.textContent.trim()) return;
    // Text BEFORE any heading, or AFTER the open half already has its body/CTA,
    // belongs to the NEXT half — buffer it as that half's eyebrow. The first
    // text after a heading (before its CTA) is this half's teaser/body.
    if (!current || current.teaser || current.link) pendingEyebrow = el;
    else current.teaser = el;
  });
  return groups;
}

function buildHalf(group) {
  const href = group.link ? group.link.getAttribute('href') : null;
  const panel = document.createElement('a');
  panel.className = 'the-people-half';
  if (href) panel.href = href;

  // --- background photo layer ---
  if (group.media) {
    const img = group.media.matches('img') ? group.media : group.media.querySelector('img');
    if (img) img.classList.add('the-people-half-bg');
    panel.append(group.media);
  }

  // --- REQUIRED dark contrast scrim ---
  const scrim = document.createElement('div');
  scrim.className = 'the-people-half-scrim';
  scrim.setAttribute('aria-hidden', 'true');
  panel.append(scrim);

  // --- bottom-anchored overlay ---
  const overlay = document.createElement('div');
  overlay.className = 'the-people-overlay';

  if (group.eyebrow) {
    group.eyebrow.classList.add('the-people-eyebrow');
    overlay.append(group.eyebrow);
  }
  if (group.heading) {
    group.heading.classList.add('the-people-h3');
    overlay.append(group.heading);
  }
  if (group.teaser) {
    group.teaser.classList.add('the-people-teaser');
    overlay.append(group.teaser);
  }
  if (group.link) {
    // The whole half is the click target; render the CTA as inert styled text.
    const cta = document.createElement('span');
    cta.className = 'the-people-cta';
    cta.textContent = group.link.textContent.trim();
    overlay.append(cta);
  }

  panel.append(overlay);
  return panel;
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  const groups = segment(nodes);
  if (!groups.length) return;

  block.replaceChildren(...groups.map(buildHalf));
}
