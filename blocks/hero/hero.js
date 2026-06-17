/*
 * Hero Block — full-bleed cinematic hero (role: hero).
 *
 * Authoring contract (#62): authors place ALL hero elements as flat
 * siblings inside ONE row / ONE cell. We DEFAULT to flattening and
 * classify each element by its content, never by row/cell index:
 *   - heading        -> the page's single <h1> (reused, server-visible)
 *   - eyebrow        -> first short paragraph before the heading
 *   - lede           -> paragraph after the heading
 *   - monogram       -> a paragraph that looks like the "'96" bug
 *   - bug meta       -> the "Brewing on the east slope · ..." line
 *   - EST/BEERS/...  -> the meta row. EDS strips <span> but keeps <strong>,
 *                       so each "LABEL value" pair is rebuilt in JS.
 *
 * The background image is the section background (CSS); content is wrapped
 * in .ds-hero-inner so the bg bleeds full-width while content stays at
 * --container.
 */

const META_LABELS = ['EST', 'BEERS', 'TAPROOMS', 'RANGE'];

/**
 * Heuristic: does this paragraph carry the oversized monogram bug?
 * The prototype uses "'96" (curly or straight apostrophe).
 */
function isMonogram(text) {
  const t = text.trim();
  return /^['’]\d{2,4}$/.test(t) || (t.length <= 5 && /\d/.test(t) && /^['’]/.test(t));
}

/**
 * Heuristic: does this paragraph look like an EST/BEERS/TAPROOMS/RANGE
 * meta pair? Either it carries a <strong> label, or its leading word is
 * one of the known meta labels.
 */
function isMetaPair(el) {
  if (el.querySelector('strong')) return true;
  const lead = el.textContent.trim().split(/\s+/)[0]?.replace(/[.:]+$/, '').toUpperCase();
  return META_LABELS.includes(lead);
}

/**
 * Build a meta <span> with the label as <strong>, recreating the styling
 * EDS strips when it removes the authored <span> wrappers.
 */
function buildMetaPair(el) {
  const span = document.createElement('span');
  const strong = el.querySelector('strong');
  if (strong) {
    const label = strong.cloneNode(true);
    const rest = el.textContent.slice(strong.textContent.length).trim();
    span.append(label);
    if (rest) span.append(` ${rest}`);
    return span;
  }
  // No <strong> survived — split "LABEL value" and promote the leading label.
  const parts = el.textContent.trim().split(/\s+/);
  const label = document.createElement('strong');
  [label.textContent] = parts;
  span.append(label);
  const rest = parts.slice(1).join(' ');
  if (rest) span.append(` ${rest}`);
  return span;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten: authored elements are flat siblings in one cell.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // Full-bleed background layer (image lives in CSS).
  const bg = document.createElement('div');
  bg.className = 'ds-hero-bg';
  bg.setAttribute('aria-hidden', 'true');

  // Content wrapper — keeps content at --container while bg bleeds.
  const inner = document.createElement('div');
  inner.className = 'ds-hero-inner';

  const bugCol = document.createElement('div');
  bugCol.className = 'ds-hero-bug-col';

  const copy = document.createElement('div');
  copy.className = 'ds-hero-copy';

  // Classify each flat node.
  let heading = null;
  let monogram = null;
  let bugMeta = null;
  const metaPairs = [];
  const paragraphs = [];

  nodes.forEach((node) => {
    const text = node.textContent.trim();
    if (!text) return;

    if (/^H[1-6]$/.test(node.tagName)) {
      heading = node;
    } else if (isMonogram(text)) {
      monogram = node;
    } else if (isMetaPair(node)) {
      metaPairs.push(node);
    } else {
      paragraphs.push(node);
    }
  });

  // Of the remaining paragraphs, the longest is the lede; a short line
  // containing the "·" separator is the bug meta; the first short line is
  // the eyebrow.
  let eyebrow = null;
  let lede = null;
  const leftovers = [...paragraphs];

  // Bug meta: the descriptor line (contains a middot, or is the longest of
  // the short lines tied to the monogram).
  const midDotIdx = leftovers.findIndex((p) => /·/.test(p.textContent));
  if (midDotIdx !== -1) {
    [bugMeta] = leftovers.splice(midDotIdx, 1);
  }

  if (leftovers.length) {
    // Longest remaining paragraph = lede.
    let longest = leftovers[0];
    leftovers.forEach((p) => {
      if (p.textContent.trim().length > longest.textContent.trim().length) longest = p;
    });
    lede = longest;
    eyebrow = leftovers.find((p) => p !== lede) || null;
  }

  // --- Build bug column ---
  if (monogram) {
    monogram.className = 'ds-bug';
    monogram.setAttribute('aria-hidden', 'true');
    bugCol.append(monogram);
  }
  const rule = document.createElement('div');
  rule.className = 'ds-bug-rule';
  rule.setAttribute('aria-hidden', 'true');
  bugCol.append(rule);
  if (bugMeta) {
    bugMeta.className = 'ds-bug-meta';
    bugCol.append(bugMeta);
  }

  // --- Build copy column ---
  if (eyebrow) {
    eyebrow.className = 'ds-hero-eyebrow';
    copy.append(eyebrow);
  }
  if (heading) {
    // Reuse the authored heading as the page's single <h1>.
    if (heading.tagName !== 'H1') {
      const h1 = document.createElement('h1');
      h1.innerHTML = heading.innerHTML;
      heading.replaceWith(h1);
      heading = h1;
    }
    copy.append(heading);
  }
  if (lede) {
    lede.className = 'ds-hero-lede';
    copy.append(lede);
  }
  if (metaPairs.length) {
    const meta = document.createElement('div');
    meta.className = 'ds-hero-meta';
    metaPairs.forEach((p) => meta.append(buildMetaPair(p)));
    copy.append(meta);
  }

  inner.append(bugCol, copy);

  block.textContent = '';
  block.append(bg, inner);
}
