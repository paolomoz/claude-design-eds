/**
 * loads and decorates the proof block
 * @param {Element} block The proof block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cellOf = (row) => row?.querySelector(':scope > div') || row;

  const captionText = cellOf(rows[0])?.textContent.trim();

  const logos = document.createElement('div');
  logos.className = 'logos';
  rows.slice(1).forEach((row) => {
    const name = cellOf(row)?.textContent.trim();
    if (!name) return;
    const span = document.createElement('span');
    span.textContent = name;
    logos.append(span);
  });

  block.textContent = '';

  if (captionText) {
    const caption = document.createElement('p');
    caption.textContent = captionText;
    block.append(caption);
  }

  block.append(logos);
}
