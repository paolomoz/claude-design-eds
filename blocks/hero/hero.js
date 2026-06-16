/*
 * hero block
 * Rows (positional, one cell each):
 *   0: kicker   — eyebrow text
 *   1: headline — h1 text (may contain <em> for the lime word)
 *   2: lede     — intro paragraph
 *   3: cta      — primary button, authored <strong><a> (decorateButton -> a.btn a.btn-primary)
 *   4: image    — OPTIONAL hero media <picture>/<img>; empty -> dark placeholder fallback
 */

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cellOf = (row) => row?.firstElementChild;

  const kickerCell = cellOf(rows[0]);
  const headlineCell = cellOf(rows[1]);
  const ledeCell = cellOf(rows[2]);
  const ctaCell = cellOf(rows[3]);
  const imageCell = cellOf(rows[4]);

  const wrap = document.createElement('div');
  wrap.className = 'wrap hero-grid';

  // ---- left column ----
  const left = document.createElement('div');

  if (kickerCell?.textContent.trim()) {
    const kicker = document.createElement('span');
    kicker.className = 'kicker';
    kicker.textContent = kickerCell.textContent.trim();
    left.append(kicker);
  }

  if (headlineCell) {
    const h1 = document.createElement('h1');
    // preserve inline markup (e.g. <em> renders lime via the .hero h1 em rule)
    h1.innerHTML = headlineCell.innerHTML;
    left.append(h1);
  }

  if (ledeCell?.textContent.trim()) {
    const lede = document.createElement('p');
    lede.className = 'lede';
    lede.textContent = ledeCell.textContent.trim();
    left.append(lede);
  }

  if (ctaCell) {
    // CTA already decorated to a.btn a.btn-primary by decorateButton(); clone its nodes.
    const ctaWrap = document.createElement('div');
    ctaWrap.className = 'hero-cta';
    ctaWrap.append(...ctaCell.childNodes);
    left.append(ctaWrap);
  }

  // ---- right column (media) ----
  const media = document.createElement('div');
  media.className = 'hero-media';
  const picture = imageCell?.querySelector('picture, img');
  if (picture) {
    media.append(picture);
  } else {
    media.classList.add('is-placeholder');
  }

  wrap.append(left, media);

  block.replaceChildren(wrap);
}
