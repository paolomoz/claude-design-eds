/**
 * tools-cta — dark full-bleed CTA band.
 *
 * Authored as ONE row / ONE cell with flat siblings:
 *   <picture> (optional bg) · <h2>/<heading> · <p> lede · CTA links
 *   (white = <strong><a>, translucent = <em><a>).
 *
 * We flatten the cell and classify each child by content (picture / heading /
 * link-bearing / paragraph) rather than by row or cell index. The garage-door
 * parallax reveal from the prototype is dropped — content renders visible.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  let picture = null;
  let heading = null;
  const ctas = [];
  const paragraphs = [];

  nodes.forEach((node) => {
    const pic = node.querySelector?.('picture') || (node.tagName === 'PICTURE' ? node : null);
    if (pic) {
      picture = pic;
      return;
    }
    if (/^H[1-6]$/.test(node.tagName)) {
      heading = node;
      return;
    }
    if (node.querySelector?.('a')) {
      // a CTA cell — keep the emphasis wrapper (strong/em) so the EDS
      // link decorator maps it to .btn-accent / .btn-secondary.
      [...node.querySelectorAll('a')].forEach((a) => {
        ctas.push(a.closest('strong, em') || a);
      });
      return;
    }
    if (node.textContent.trim()) {
      paragraphs.push(node);
    }
  });

  // background picture cell (full-bleed; CSS provides the dark fallback)
  const bg = document.createElement('div');
  bg.className = 'tools-cta-bg';
  if (picture) bg.append(picture);

  // centered content wrap (max-width:900px)
  const inner = document.createElement('div');
  inner.className = 'tools-cta-inner';

  if (heading) {
    heading.classList.add('tools-cta-title');
    inner.append(heading);
  }

  paragraphs.forEach((p) => {
    p.classList.add('tools-cta-lede');
    inner.append(p);
  });

  if (ctas.length) {
    const row = document.createElement('div');
    row.className = 'tools-cta-cta-row';
    ctas.forEach((cta) => row.append(cta));
    inner.append(row);
  }

  block.replaceChildren(bg, inner);
}
