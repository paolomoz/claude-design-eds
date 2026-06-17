/**
 * hero — full-bleed 100vh cinematic hero (JFK monogram + status strip).
 *
 * Authored shape (#62): ONE block, authored as a stack of single-cell rows whose
 * children are flat siblings — a background picture/img cell (often empty), a
 * short link-free eyebrow, the headline, and a set of bare-text status cells.
 * We DEFAULT to a cell-level cascade collector (#71): for each `:scope > div > div`
 * cell push its child ELEMENTS if it has any, ELSE synthesise a <p> from the
 * cell's own text (so eyebrows / counts / meta authored as bare-text cells are
 * not silently dropped by a naive `> *` sweep). Collected nodes are then
 * segmented/classified BY CONTENT, never by row/cell index.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // 1. Cell-level cascade collect ------------------------------------------
  const nodes = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const els = [...cell.children];
    if (els.length) {
      els.forEach((el) => nodes.push(el));
    } else {
      const text = cell.textContent.trim();
      if (text) {
        const p = document.createElement('p');
        p.textContent = text;
        nodes.push(p);
      }
    }
  });

  // 2. Classify by content -------------------------------------------------
  const isMedia = (el) => el.querySelector('picture, img') || el.matches('picture, img');
  const isHeading = (el) => /^H[1-6]$/.test(el.tagName);
  const textOf = (el) => el.textContent.trim();
  const isLinkish = (el) => el.querySelector('a') || el.matches('a');

  let mediaEl = null;
  let headingEl = null;
  let eyebrowEl = null;
  const statusEls = [];

  nodes.forEach((el) => {
    if (!mediaEl && isMedia(el)) {
      mediaEl = el;
      return;
    }
    if (isMedia(el)) return; // ignore extra media
    const text = textOf(el);
    if (!text || isLinkish(el)) return;
    if (!headingEl && isHeading(el)) {
      headingEl = el;
      return;
    }
    // The longest non-heading text becomes the headline candidate when no
    // authored heading exists; the first short link-free line is the eyebrow.
    if (!eyebrowEl && text.length <= 60) {
      eyebrowEl = el;
      return;
    }
    if (!headingEl && text.length > 60) {
      headingEl = el;
      return;
    }
    statusEls.push(el);
  });

  // Fallbacks: if no clear headline emerged, promote the longest collected
  // text; if that leaves the eyebrow empty, demote nothing (eyebrow optional).
  if (!headingEl) {
    let longest = null;
    [eyebrowEl, ...statusEls].forEach((el) => {
      if (el && (!longest || textOf(el).length > textOf(longest).length)) longest = el;
    });
    if (longest) {
      headingEl = longest;
      if (longest === eyebrowEl) eyebrowEl = null;
      else statusEls.splice(statusEls.indexOf(longest), 1);
    }
  }

  const headingText = headingEl ? textOf(headingEl) : 'John F. Kennedy International Airport';
  const eyebrowText = eyebrowEl ? textOf(eyebrowEl) : '';

  // 3. Rebuild the DOM -----------------------------------------------------
  block.textContent = '';

  // Background layer (#72: match picture OR img). Empty/absent media leaves the
  // layer in place for the CSS gradient fallback to fill.
  const bg = document.createElement('div');
  bg.className = 'hero-bg';
  if (mediaEl) {
    const media = mediaEl.matches('picture, img') ? mediaEl : mediaEl.querySelector('picture, img');
    if (media) bg.append(media);
  }
  block.append(bg);

  const scrim = document.createElement('div');
  scrim.className = 'hero-scrim';
  scrim.setAttribute('aria-hidden', 'true');
  block.append(scrim);

  // Content wrap (max-width recreation of the prototype's .hero-marquee__content)
  const content = document.createElement('div');
  content.className = 'hero-content';

  if (eyebrowText) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'hero-eyebrow';
    eyebrow.textContent = eyebrowText;
    content.append(eyebrow);
  }

  // The single page <h1>. The prototype's decorative J/F/K monogram spans carried
  // aria-label="JFK"; we promote to a REAL <h1> holding the full place name as the
  // accessible heading, and render the giant monogram as decorative spans inside.
  const h1 = document.createElement('h1');
  h1.className = 'hero-title';
  const monogram = document.createElement('span');
  monogram.className = 'hero-monogram';
  monogram.setAttribute('aria-hidden', 'true');
  'JFK'.split('').forEach((ch) => {
    const s = document.createElement('span');
    s.textContent = ch;
    monogram.append(s);
  });
  const sr = document.createElement('span');
  sr.className = 'hero-title-text';
  sr.textContent = headingText;
  h1.append(monogram, sr);
  content.append(h1);

  // Terminal / status strip — recreated as styled spans in JS (EDS strips author
  // <span>s in cells, so the class styling is re-applied here, #39).
  if (statusEls.length) {
    const strip = document.createElement('div');
    strip.className = 'hero-status';

    const label = document.createElement('span');
    label.className = 'hero-status-label';
    label.textContent = 'Terminals';
    strip.append(label);

    const codes = document.createElement('div');
    codes.className = 'hero-status-codes';
    statusEls.forEach((el) => {
      const text = textOf(el);
      if (!text) return;
      const span = document.createElement('span');
      // First short token (e.g. "T5", "Terminal 5") stays a code; a "warn"/"bad"
      // marker word flags the amber state.
      if (/\b(warn|bad|delay)\b/i.test(text)) span.classList.add('warn');
      span.textContent = text;
      codes.append(span);
    });
    strip.append(codes);
    content.append(strip);
  }

  block.append(content);
}
