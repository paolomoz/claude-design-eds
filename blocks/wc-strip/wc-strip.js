/*
 * wc-strip block — JFK World Cup 2026 accent promo strip.
 * Author shape (one cell per row, stacked):
 *   mark | paragraph | cta (plain <a>)
 */

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children].map((row) => row.firstElementChild);
  const [markCell, paraCell, ctaCell] = rows;

  // Rebuild prototype DOM: .wrap > [.wc-mark, p, a.btn]
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  if (markCell) {
    const mark = document.createElement('span');
    mark.className = 'wc-mark';
    mark.textContent = markCell.textContent.trim();
    wrap.append(mark);
  }

  if (paraCell) {
    const p = document.createElement('p');
    p.textContent = paraCell.textContent.trim();
    wrap.append(p);
  }

  // CTA: clone authored plain <a>; .wc-strip a.btn lifts a navy background.
  const link = ctaCell && ctaCell.querySelector('a');
  if (link) {
    const cta = link.cloneNode(true);
    cta.classList.add('btn');
    wrap.append(cta);
  }

  block.replaceChildren(wrap);
}
