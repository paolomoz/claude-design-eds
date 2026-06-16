/**
 * Hero block — background image-slot + scrim + promo ribbon + headline + lede + CTA row.
 *
 * Authoring rows (in order):
 *   1. image    — optional <picture>/<img>; empty falls back to --ink background
 *   2. tag      — short ribbon tag text (e.g. "Demo Days '26")
 *   3. ribbon   — ribbon body; a link whose text becomes the "Details" go-link
 *   4. headline — h1 text; wrap one word in <em> to color it yellow
 *   5. lede     — supporting paragraph
 *   6. cta      — authored CTAs: <strong><a> primary, <em><a> secondary
 *
 * @param {Element} block
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cell = (row) => row?.firstElementChild;

  const [imageRow, tagRow, ribbonRow, headlineRow, ledeRow, ctaRow] = rows;

  const frag = document.createDocumentFragment();

  // Background image (optional) — falls back to CSS --ink background when absent.
  const pic = imageRow ? cell(imageRow)?.querySelector('picture, img') : null;
  if (pic) {
    const bg = document.createElement('div');
    bg.className = 'hero-bg';
    bg.append(pic.closest('picture') || pic);
    frag.append(bg);
  }

  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  frag.append(scrim);

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // Promo ribbon: yellow tag + white body with a "Details" go-link.
  const tagText = cell(tagRow)?.textContent.trim();
  const ribbonLink = cell(ribbonRow)?.querySelector('a');
  if (tagText && ribbonLink) {
    const ribbon = document.createElement('div');
    ribbon.className = 'promo-ribbon';

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = tagText;

    const body = document.createElement('a');
    body.className = 'body';
    body.href = ribbonLink.getAttribute('href') || '#';
    // Move the ribbon body's child nodes (keeps inline <b> markup) ahead of the go-link.
    const ribbonCell = cell(ribbonRow);
    [...ribbonCell.childNodes].forEach((node) => {
      if (node.nodeName === 'A') return;
      body.append(node.cloneNode(true));
    });

    const go = document.createElement('span');
    go.className = 'go';
    go.append(ribbonLink.textContent.trim());
    go.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>');
    body.append(go);

    ribbon.append(tag, body);
    wrap.append(ribbon);
  }

  // Headline — any <em> becomes the yellow highlighted word.
  const headlineCell = cell(headlineRow);
  if (headlineCell) {
    // Reuse an authored heading so the <h1> is server-visible (SEO #35); avoid nesting.
    const headingSrc = headlineCell.querySelector('h1, h2, h3, h4, h5, h6') || headlineCell;
    const h1 = document.createElement('h1');
    h1.className = 'cond';
    h1.innerHTML = headingSrc.innerHTML;
    h1.querySelectorAll('em').forEach((em) => {
      const hl = document.createElement('span');
      hl.className = 'hl';
      hl.innerHTML = em.innerHTML;
      em.replaceWith(hl);
    });
    wrap.append(h1);
  }

  // Lede paragraph.
  const ledeText = cell(ledeRow)?.textContent.trim();
  if (ledeText) {
    const lede = document.createElement('p');
    lede.className = 'lede';
    lede.textContent = ledeText;
    wrap.append(lede);
  }

  // CTA row — clone authored CTA nodes; decorateButton() applies .btn classes at boot.
  const ctaCell = cell(ctaRow);
  if (ctaCell) {
    const cta = document.createElement('div');
    cta.className = 'cta-row';
    [...ctaCell.childNodes].forEach((node) => cta.append(node.cloneNode(true)));
    wrap.append(cta);
  }

  frag.append(wrap);
  block.replaceChildren(frag);
}
