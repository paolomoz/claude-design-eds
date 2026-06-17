/**
 * Features & Releases — banner-promo
 * Light surface, 2-col grid: left copy (eyebrow / headline / lede / ghost text
 * link), right 4/3 art.
 *
 * Authoring contract (#62): authors place ONE row / ONE cell holding all the
 * elements as flat siblings. We flatten the cell and classify each node by
 * content (heading / picture / link / paragraph), never by row/cell index.
 *
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten: grab every leaf element the author dropped into the block.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // Classify by content.
  let heading = null;
  let picture = null;
  let link = null;
  const paras = [];
  const texts = []; // bare text fragments (eyebrow etc.) that aren't headings/paras

  nodes.forEach((node) => {
    if (!heading && /^H[1-6]$/.test(node.tagName)) {
      heading = node;
    } else if (!picture && (node.tagName === 'PICTURE' || node.querySelector?.('picture, img'))) {
      picture = node.tagName === 'PICTURE' ? node : node.querySelector('picture, img');
    } else if (!link && node.tagName === 'A') {
      link = node;
    } else if (!link && node.querySelector?.('a')) {
      link = node.querySelector('a');
    } else if (node.tagName === 'P') {
      // First <p> with no heading yet and short text → treat as eyebrow.
      paras.push(node);
    } else {
      texts.push(node);
    }
  });

  // EDS strips <span> in cells, so the eyebrow may arrive as a leading <p> or a
  // bare text node. Heuristic: the first paragraph before the headline is the
  // eyebrow; the remainder is the lede. If the author used a heading, anything
  // textual that precedes it is the eyebrow.
  let eyebrowText = '';
  let ledeText = '';
  if (paras.length >= 2) {
    [eyebrowText, ledeText] = [paras[0].textContent.trim(), paras[1].textContent.trim()];
  } else if (paras.length === 1) {
    ledeText = paras[0].textContent.trim();
  }
  if (!eyebrowText && texts.length) {
    eyebrowText = texts[0].textContent.trim();
  }

  // Build the copy column.
  const copy = document.createElement('div');
  copy.className = 'banner-promo-copy';

  // Eyebrow — re-created in JS (#39); EDS strips the authored <span>.
  if (eyebrowText) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = eyebrowText;
    copy.append(eyebrow);
  }

  // Headline — reuse the authored heading element if present (server-visible),
  // else synthesize an <h2>.
  if (heading) {
    heading.classList.add('h-title-2');
    copy.append(heading);
  }

  if (ledeText) {
    const lede = document.createElement('p');
    lede.className = 'banner-promo-lede';
    lede.textContent = ledeText;
    copy.append(lede);
  }

  // Ghost TEXT link (#12) — plain <a>, styled per-block, NOT a button. Clone the
  // authored anchor so its href/text survive; ensure the trailing arrow.
  if (link) {
    const ghost = document.createElement('a');
    ghost.className = 'banner-promo-link';
    ghost.href = link.getAttribute('href') || '#';
    let label = link.textContent.trim();
    if (!/→\s*$/.test(label)) label = `${label} →`;
    ghost.textContent = label;
    copy.append(ghost);
  }

  // Build the art column. Empty cell falls back to the CSS gray surface.
  const art = document.createElement('div');
  art.className = 'banner-promo-art';
  if (picture) art.append(picture);

  // Assemble the banner-promo grid inside a max-width container.
  const promo = document.createElement('div');
  promo.className = 'banner-promo';
  promo.append(copy, art);

  const container = document.createElement('div');
  container.className = 'banner-promo-inner';
  container.append(promo);

  block.replaceChildren(container);
}
