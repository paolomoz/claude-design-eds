/**
 * Upscale feature — white surface, 2-col (1.2fr / 1fr):
 * left copy (product-chip + eyebrow, headline, lede, ghost link),
 * right 16/10 art. Lifted from the prototype's .feature-wide section.
 *
 * Authoring contract (#62): ONE row / ONE cell holding all elements as flat
 * siblings — heading, lede paragraph, ghost link, and image. We flatten and
 * classify by content type (heading / picture / link / paragraph), never by
 * row or cell index. EDS strips the prototype's <span> wrappers, so the
 * product-chip SVG and the "Photoshop · NEW" eyebrow (#39) are re-created here.
 *
 * @param {Element} block The block element
 */

const PHOTOSHOP_CHIP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 84" fill="none" aria-hidden="true" focusable="false">
<path d="M68.9355 0H15.0645C6.74461 0 0 6.74461 0 15.0645V68.9355C0 77.2554 6.74461 84 15.0645 84H68.9355C77.2554 84 84 77.2554 84 68.9355V15.0645C84 6.74461 77.2554 0 68.9355 0Z" fill="#001E36" />
<path d="M29.3321 22.2971C40.3129 22.2971 46.4968 27.4407 46.4968 36.0518C46.4968 46.1079 38.1168 50.1534 30.2569 50.1534H24.9399V61.0185H14.1903V22.2971H29.3321ZM24.9399 31.4861V40.9643H29.679C32.9732 40.9643 35.285 39.635 35.285 36.283C35.285 33.22 33.3199 31.4861 29.9102 31.4861H24.9399Z" fill="#31A8FF" />
<path d="M48.6817 59.1114L48.7395 50.1534C51.8025 52.1761 56.0792 53.4476 59.0267 53.4476C61.0495 53.4476 61.9742 52.8696 61.9742 51.8293C61.9742 50.6735 60.7028 50.2112 58.2755 49.4598C53.5941 48.0728 48.4507 46.1657 48.4507 40.0395C48.4507 33.7979 53.5941 30.3303 61.0495 30.3303C64.5749 30.3303 67.4646 30.8505 70.0073 31.9485L69.9495 40.5019C67.9268 39.2883 63.9391 38.1902 61.3383 38.1902C59.4313 38.1902 58.68 38.7681 58.68 39.635C58.68 40.6753 59.6046 40.9642 62.3788 41.8312C67.7536 43.4494 72.2615 45.1831 72.2615 51.4826C72.2615 57.4931 67.349 61.5387 59.6625 61.5387C55.6168 61.5387 51.8025 60.8452 48.6817 59.1114Z" fill="#31A8FF" />
</svg>`;

export default async function decorate(block) {
  // Flatten: authors place every element as flat siblings in one cell.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // Classify by content type, not index.
  const heading = nodes.find((el) => /^H[1-6]$/.test(el.tagName));
  const picture = nodes.find((el) => el.tagName === 'PICTURE' || el.querySelector?.('picture, img'));
  const link = nodes.find((el) => el.tagName === 'A' || el.querySelector?.('a'));
  const paragraphs = nodes.filter((el) => el.tagName === 'P' && el !== heading && el !== link);

  // Build the copy column.
  const copy = document.createElement('div');
  copy.className = 'feature-wide-copy';

  // Eyebrow: product-chip SVG + "Photoshop · NEW" (re-created; #39).
  const eyebrow = document.createElement('span');
  eyebrow.className = 'feature-wide-eyebrow';

  const chip = document.createElement('span');
  chip.className = 'product-chip';
  chip.innerHTML = PHOTOSHOP_CHIP;
  eyebrow.append(chip);

  const eyebrowLabel = document.createElement('span');
  eyebrowLabel.className = 'eyebrow';
  eyebrowLabel.textContent = 'Photoshop · NEW';
  eyebrow.append(eyebrowLabel);
  copy.append(eyebrow);

  // Headline — reuse the authored heading element (server-visible).
  if (heading) {
    heading.classList.add('feature-wide-headline');
    copy.append(heading);
  }

  // Lede paragraph(s).
  paragraphs.forEach((p) => copy.append(p));

  // Ghost link — plain <a>.
  const anchor = link?.tagName === 'A' ? link : link?.querySelector('a');
  if (anchor) {
    anchor.className = 'feature-wide-ghost';
    copy.append(anchor);
  }

  // Build the art column.
  const art = document.createElement('div');
  art.className = 'feature-wide-art';
  if (picture) {
    const pic = picture.tagName === 'PICTURE' ? picture : picture.querySelector('picture, img');
    if (pic) art.append(pic);
  }

  // Assemble grid inside a centered container.
  const grid = document.createElement('div');
  grid.className = 'feature-wide';
  grid.append(copy, art);

  const container = document.createElement('div');
  container.className = 'feature-wide-container';
  container.append(grid);

  block.replaceChildren(container);
}
