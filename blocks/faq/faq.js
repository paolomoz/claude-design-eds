/**
 * loads and decorates the faq block
 * @param {Element} block The faq block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cellsOf = (row) => [...(row?.children || [])];

  // row 0: heading
  const center = document.createElement('div');
  center.className = 'center';
  const headingCell = cellsOf(rows[0])[0];
  if (headingCell) {
    const authored = headingCell.querySelector('h1,h2,h3,h4,h5,h6');
    const heading = document.createElement(authored ? authored.tagName.toLowerCase() : 'h2');
    heading.innerHTML = (authored || headingCell).innerHTML;
    center.append(heading);
  }

  // remaining rows: question / answer pairs -> native details/summary
  const faq = document.createElement('div');
  faq.className = 'faq-list';

  rows.slice(1).forEach((row, i) => {
    const cells = cellsOf(row);
    const details = document.createElement('details');
    if (i === 0) details.open = true;

    const summary = document.createElement('summary');
    summary.textContent = (cells[0]?.textContent || '').trim();
    details.append(summary);

    const answer = document.createElement('p');
    answer.innerHTML = cells[1]?.innerHTML || '';
    details.append(answer);

    faq.append(details);
  });

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  wrap.append(center, faq);

  block.textContent = '';
  block.append(wrap);
}
