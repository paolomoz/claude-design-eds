/**
 * loads and decorates the ai-banner block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Row 0, cell 0: the title. Reuse an authored heading if present.
  const titleCell = rows[0]?.firstElementChild;
  let heading = titleCell?.querySelector('h1, h2, h3, h4, h5, h6');
  if (!heading && titleCell) {
    heading = document.createElement('h2');
    heading.textContent = titleCell.textContent.trim();
  }

  // Row 1, cell 0: the CTA. Clone the authored anchor(s) as-is so the
  // EDS link decorator (em > a -> btn-secondary) can do its work.
  const ctaCell = rows[1]?.firstElementChild;
  let actions = null;
  if (ctaCell && ctaCell.querySelector('a')) {
    actions = document.createElement('div');
    actions.className = 'actions';
    [...ctaCell.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
    // re-create the chevron stripped by EDS span handling
    actions.querySelectorAll('a').forEach((a) => {
      if (!a.querySelector('.chev')) {
        const chev = document.createElement('span');
        chev.className = 'chev';
        chev.setAttribute('aria-hidden', 'true');
        chev.textContent = '›';
        a.append(' ', chev);
      }
    });
  }

  const inner = document.createElement('div');
  inner.className = 'ai-inner';
  if (heading) inner.append(heading);
  if (actions) inner.append(actions);

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  wrap.append(inner);

  block.textContent = '';
  block.append(wrap);
}
