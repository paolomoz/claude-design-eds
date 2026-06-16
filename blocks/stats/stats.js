/**
 * loads and decorates the stats block
 * @param {Element} block The stats block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cellsOf = (row) => [...(row?.children || [])];

  // row 0: eyebrow + heading
  const headCells = cellsOf(rows[0]);
  const center = document.createElement('div');
  center.className = 'center';

  const eyebrowCell = headCells[0];
  if (eyebrowCell && eyebrowCell.textContent.trim()) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = eyebrowCell.textContent.trim();
    center.append(eyebrow);
  }

  const headingCell = headCells[1];
  if (headingCell) {
    const authored = headingCell.querySelector('h1,h2,h3,h4,h5,h6');
    const heading = document.createElement(authored ? authored.tagName.toLowerCase() : 'h2');
    heading.innerHTML = (authored || headingCell).innerHTML;
    center.append(heading);
  }

  // last row: story quote + link. middle rows: stats.
  const lastRow = rows[rows.length - 1];
  const statRows = rows.slice(1, rows.length - 1);

  const grid = document.createElement('div');
  grid.className = 'stat-grid';

  statRows.forEach((row) => {
    const cells = cellsOf(row);
    const stat = document.createElement('div');
    stat.className = 'stat';

    const n = document.createElement('div');
    n.className = 'n';
    n.textContent = (cells[0]?.textContent || '').trim();
    stat.append(n);

    const label = document.createElement('p');
    label.innerHTML = cells[1]?.innerHTML || '';
    stat.append(label);

    grid.append(stat);
  });

  const story = document.createElement('div');
  story.className = 'story';
  const storyCells = cellsOf(lastRow);
  const quoteCell = storyCells[0];
  if (quoteCell) {
    const quote = quoteCell.querySelector('blockquote') || document.createElement('blockquote');
    if (!quote.parentElement) quote.innerHTML = quoteCell.innerHTML;
    story.append(quote);
  }
  const linkCell = storyCells[1];
  if (linkCell && linkCell.textContent.trim()) {
    const link = document.createElement('div');
    link.className = 'story-link';
    link.append(...linkCell.childNodes);
    story.append(link);
  }

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  wrap.append(center, grid, story);

  block.textContent = '';
  block.append(wrap);

  // Optional count-up: only when motion is allowed; final value already
  // rendered statically above, so this is purely progressive enhancement.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const animate = (el) => {
    const final = el.textContent.trim();
    const match = final.match(/^(\D*)([\d.,]+)(.*)$/);
    if (!match) return;
    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr.replace(/,/g, ''));
    if (Number.isNaN(target)) return;
    const start = performance.now();
    const dur = 1200;
    const step = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - (1 - t) ** 3;
      const val = Math.round(target * eased);
      el.textContent = `${prefix}${val}${suffix}`;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = final;
    };
    requestAnimationFrame(step);
  };

  const numbers = [...grid.querySelectorAll('.n')];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animate(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  numbers.forEach((n) => io.observe(n));
}
