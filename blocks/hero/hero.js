/**
 * Hero (role: hero) — scroll-grow marquee, rendered in its reduced-motion
 * static layout for EDS (no 300vh scroll choreography).
 *
 * Lifted from the stardust prototype's .ds-hero-scroll / .ds-hero-sticky /
 * .ds-hero-text section. The text column is a centered max-width wrap; the
 * dark media surface with the warm-gradient placeholder and the
 * "Acrobat Studio" overlay product card is full-bleed.
 *
 * Authoring shape — ONE row, ONE cell holding a flat sequence (DA flattens
 * authored content into a single cell, #48/#50). Classified by content, not
 * by row index (#42):
 *   <h1>            title  -> rendered as the single page <h1>
 *   <p>             eyebrow (first link-free paragraph BEFORE the lede)
 *   <p>             lede    (second link-free paragraph)
 *   <p><a>…</a></p> CTA pair (<strong><a> primary + <em><a> secondary)
 *   <p>             overlay title (Acrobat Studio — eyebrow of the 2nd group)
 *   <p>             overlay body
 *   <p><a>…</a></p> overlay actions (<strong><a> buy + <em><a> learn more)
 *
 * The flat children are split into two groups on the link-bearing paragraph:
 * everything up to & including the first CTA paragraph is the text column; the
 * remainder is the overlay product card. Any field may be omitted.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten: gather the leaf content elements from the single authored cell.
  const cell = block.querySelector(':scope > div > div') || block;
  const nodes = [...cell.children];

  // Split the flat sequence into [text-column group, overlay group] on the
  // first CTA paragraph (a paragraph that contains a link).
  const textNodes = [];
  const overlayNodes = [];
  let inOverlay = false;
  nodes.forEach((node) => {
    if (inOverlay) {
      overlayNodes.push(node);
      return;
    }
    textNodes.push(node);
    if (node.tagName === 'P' && node.querySelector('a')) inOverlay = true;
  });

  const isCta = (node) => node.tagName === 'P' && node.querySelector('a');
  const isHeading = (node) => /^H[1-6]$/.test(node.tagName);

  // --- Text column (centered, max-width wrapped) ---
  const text = document.createElement('div');
  text.className = 'hero-text';

  // title -> single page <h1>. Reuse an authored heading if present.
  let h1 = textNodes.find(isHeading);
  if (h1) {
    if (h1.tagName !== 'H1') {
      const replacement = document.createElement('h1');
      replacement.innerHTML = h1.innerHTML;
      h1 = replacement;
    }
    h1.classList.add('title-1', 'hero-title');
  }

  // eyebrow = first non-heading, link-free paragraph; lede = the second.
  const plainParas = textNodes.filter(
    (n) => n.tagName === 'P' && !n.querySelector('a'),
  );
  const eyebrowNode = plainParas[0];
  const ledeNode = plainParas[1];

  if (eyebrowNode) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow hero-eyebrow';
    eyebrow.textContent = eyebrowNode.textContent.trim();
    text.append(eyebrow);
  }
  if (h1) text.append(h1);
  if (ledeNode) {
    const lede = document.createElement('p');
    lede.className = 'body-lg hero-lede';
    lede.textContent = ledeNode.textContent.trim();
    text.append(lede);
  }

  const ctaNode = textNodes.find(isCta);
  if (ctaNode) {
    const ctas = document.createElement('div');
    ctas.className = 'hero-ctas';
    [...ctaNode.childNodes].forEach((n) => ctas.append(n.cloneNode(true)));
    text.append(ctas);
  }

  // --- Full-bleed media surface with warm-gradient placeholder ---
  const media = document.createElement('div');
  media.className = 'hero-media';
  media.setAttribute('aria-hidden', 'true');

  const video = document.createElement('div');
  video.className = 'hero-video';
  media.append(video);

  const scrim = document.createElement('div');
  scrim.className = 'hero-scrim';
  media.append(scrim);

  // overlay product card (Acrobat Studio) — the remainder group: title + body
  // (plain paragraphs) and an actions paragraph (link-bearing).
  const overlayPlain = overlayNodes.filter(
    (n) => n.tagName === 'P' && !n.querySelector('a'),
  );
  const overlayActionsCell = overlayNodes.find(isCta);
  const overlayTitle = overlayPlain[0] ? overlayPlain[0].textContent.trim() : '';
  const overlayBody = overlayPlain[1] ? overlayPlain[1].textContent.trim() : '';
  const hasOverlayActions = overlayActionsCell && overlayActionsCell.querySelector('a');

  if (overlayTitle || overlayBody || hasOverlayActions) {
    media.setAttribute('aria-hidden', 'false');
    const overlay = document.createElement('div');
    overlay.className = 'hero-overlay';

    const row = document.createElement('div');
    row.className = 'hero-overlay-row';

    const product = document.createElement('div');
    product.className = 'hero-overlay-product';
    if (overlayTitle) {
      const t = document.createElement('p');
      t.className = 'hero-overlay-title';
      t.textContent = overlayTitle;
      product.append(t);
    }
    if (overlayBody) {
      const b = document.createElement('p');
      b.className = 'hero-overlay-body';
      b.textContent = overlayBody;
      product.append(b);
    }
    row.append(product);

    if (hasOverlayActions) {
      const actions = document.createElement('div');
      actions.className = 'hero-overlay-actions';
      [...overlayActionsCell.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
      row.append(actions);
    }

    overlay.append(row);
    media.append(overlay);
  }

  block.textContent = '';
  block.append(text, media);
}
