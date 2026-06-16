/*
 * Stats block
 * Authoring shape:
 *   Row 1 (intro): [ h2 headline cell ] [ paragraph cell ]
 *     - In the headline cell, wrap the word to highlight in <em> to color it yellow.
 *   Rows 2..n (one per stat): [ number cell ] [ label cell ]
 */

export default function decorate(block) {
  const rows = [...block.children];
  const introRow = rows.shift();

  const stripe = document.createElement('div');
  stripe.className = 'stripe';

  const grid = document.createElement('div');
  grid.className = 'grid';

  // intro
  const intro = document.createElement('div');
  intro.className = 'item intro';
  const introCells = [...introRow.children];

  const h2 = document.createElement('h2');
  h2.className = 'cond';
  if (introCells[0]) {
    // Reuse an authored heading (server-visible, SEO #35); preserve <em>; avoid nesting.
    const headingSrc = introCells[0].querySelector('h1, h2, h3, h4, h5, h6') || introCells[0];
    h2.innerHTML = headingSrc.innerHTML.trim();
  }
  intro.append(h2);

  if (introCells[1]) {
    const p = document.createElement('p');
    p.textContent = introCells[1].textContent.trim();
    intro.append(p);
  }
  grid.append(intro);

  // stat items
  rows.forEach((row) => {
    const cells = [...row.children];
    const item = document.createElement('div');
    item.className = 'item';

    const num = document.createElement('div');
    num.className = 'num';
    num.textContent = cells[0] ? cells[0].textContent.trim() : '';

    const lab = document.createElement('div');
    lab.className = 'lab';
    lab.textContent = cells[1] ? cells[1].textContent.trim() : '';

    item.append(num, lab);
    grid.append(item);
  });

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  wrap.append(grid);

  block.replaceChildren(stripe, wrap);
}
