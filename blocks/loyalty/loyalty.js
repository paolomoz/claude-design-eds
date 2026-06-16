/**
 * loads and decorates the loyalty block
 * @param {Element} block The block element
 *
 * Author shape (single 4-row column):
 *   eyebrow | headline | paragraph | cta (plain <a>)
 */
// eslint-disable-next-line quotes
const MARK = `<svg viewBox="0 0 32 32" width="180" height="180" fill="none"><circle cx="16" cy="16" r="13" stroke="currentColor" stroke-width="2.2"/><path d="M16 3 C 9 10, 9 22, 16 29" stroke="currentColor" stroke-width="2.2"/><path d="M16 3 C 23 10, 23 22, 16 29" stroke="currentColor" stroke-width="2.2"/><line x1="4.5" y1="12" x2="27.5" y2="12" stroke="currentColor" stroke-width="2.2"/></svg>`;

export default async function decorate(block) {
  const rows = [...block.children];
  const [eyebrowRow, headlineRow, paraRow, ctaRow] = rows;

  const cell = (row) => row?.querySelector(':scope > div') || row;

  const card = document.createElement('div');
  card.className = 'md-loyalty';

  // ----- Copy column -----
  const copy = document.createElement('div');
  copy.className = 'md-loyalty-copy';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'md-hero-eyebrow';
  eyebrow.textContent = cell(eyebrowRow)?.textContent.trim() || '';

  const headingSrc = cell(headlineRow)?.querySelector('h1, h2, h3, h4, h5, h6');
  const h2 = document.createElement('h2');
  h2.textContent = headingSrc ? headingSrc.textContent.trim() : (cell(headlineRow)?.textContent.trim() || '');

  const para = document.createElement('p');
  para.textContent = cell(paraRow)?.textContent.trim() || '';

  copy.append(eyebrow, h2, para);

  const ctaAnchor = cell(ctaRow)?.querySelector('a');
  if (ctaAnchor) {
    const btn = document.createElement('button');
    btn.className = 'md-btn md-btn-primary';
    btn.type = 'button';
    btn.textContent = ctaAnchor.textContent.trim();
    copy.append(btn);
  }

  // ----- Logo mark -----
  const art = document.createElement('div');
  art.className = 'md-loyalty-art';
  art.setAttribute('aria-hidden', 'true');
  art.innerHTML = MARK;

  card.append(copy, art);

  block.textContent = '';
  block.classList.add('md-section');
  block.append(card);
}
