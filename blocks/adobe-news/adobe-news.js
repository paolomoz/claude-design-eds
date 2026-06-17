/**
 * adobe-news — full-bleed photographic band with dark gradient overlay.
 *
 * Authored as ONE row / ONE cell holding all elements as flat siblings:
 *   eyebrow text, headline (h2), lede (p), ghost link, optional bg image.
 * We flatten and classify by content (heading / picture|img / link / text),
 * NOT by row/cell index, then rebuild into the bg + max-width inner wrap.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // background full-bleed image (optional)
  const bg = document.createElement('div');
  bg.className = 'news-bg';

  // wrapped content
  const inner = document.createElement('div');
  inner.className = 'news-inner';

  let eyebrowDone = false;

  nodes.forEach((node) => {
    const picture = node.tagName === 'PICTURE' ? node : node.querySelector(':scope > picture');
    const img = node.tagName === 'IMG' ? node : node.querySelector(':scope > img');

    if (picture || img) {
      bg.append(picture || img);
      return;
    }

    if (/^H[1-6]$/.test(node.tagName)) {
      // reuse the authored heading; ensure it renders as the band <h2>
      const h2 = document.createElement('h2');
      h2.innerHTML = node.innerHTML;
      inner.append(h2);
      return;
    }

    const link = node.tagName === 'A' ? node : node.querySelector(':scope > a');
    if (link) {
      link.classList.add('news-link');
      inner.append(link);
      return;
    }

    const text = (node.textContent || '').trim();
    if (!text) return;

    // first plain text line = eyebrow span (EDS strips authored <span>);
    // re-create it in JS. Everything after = lede paragraph(s).
    if (!eyebrowDone) {
      const eyebrow = document.createElement('span');
      eyebrow.className = 'news-eyebrow';
      eyebrow.textContent = text;
      inner.append(eyebrow);
      eyebrowDone = true;
      return;
    }

    const p = document.createElement('p');
    p.textContent = text;
    inner.append(p);
  });

  block.textContent = '';
  block.append(bg, inner);
}
