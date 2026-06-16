/**
 * guidance — Evergreen Bank "Financial guidance and support" section.
 *
 * A centered heading (small gold accent rule + h2) above a 3-column grid of
 * .eb-card photo cards. Each card = an .eb-photo placeholder + h3 + body copy
 * + an .eb-btn.eb-btn-secondary button.
 *
 * Authoring rows (first row = head, remaining rows = one card each):
 *   head | <headline>
 *   <photo-label> | <title> | <body> | <button-text>
 */

export default async function decorate(block) {
  const rows = [...block.children];
  const cards = [];
  let headline = 'Financial guidance and support';

  rows.forEach((row) => {
    const cells = [...row.children].map((c) => c.textContent.trim());
    if ((cells[0] || '').toLowerCase() === 'head') {
      headline = cells[1] || headline;
    } else if (cells.some(Boolean)) {
      cards.push({
        label: cells[0] || '',
        title: cells[1] || '',
        body: cells[2] || '',
        cta: cells[3] || '',
      });
    }
  });

  block.textContent = '';

  const wrap = document.createElement('div');
  wrap.className = 'eb-container';

  const head = document.createElement('div');
  head.className = 'guidance-head';
  head.innerHTML = `
    <div class="guidance-rule" aria-hidden="true"></div>
    <h2>${headline}</h2>`;

  const grid = document.createElement('div');
  grid.className = 'guidance-grid';

  cards.forEach((card) => {
    const el = document.createElement('div');
    el.className = 'eb-card guidance-card';
    el.innerHTML = `
      <div class="eb-photo guidance-photo" data-label="${card.label}"></div>
      <div class="guidance-body">
        <h3>${card.title}</h3>
        <p>${card.body}</p>
        <span class="guidance-cta">
          <button type="button" class="eb-btn eb-btn-secondary">${card.cta}</button>
        </span>
      </div>`;
    grid.append(el);
  });

  wrap.append(head, grid);
  block.append(wrap);
}
