/**
 * Evidence — named customer proof-point strip.
 * Authoring shape: one row per proof point, two cells per row:
 *   cell 1 = customer name (rendered bold, block-level)
 *   cell 2 = short clause
 * EDS strips <span>/inner structure inside cells, so the <strong> name + clause
 * are reconstructed here from the two cells.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const list = document.createElement('ul');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;

    const nameText = (cells[0]?.textContent || '').trim();
    const clauseText = (cells[1]?.textContent || '').trim();
    if (!nameText && !clauseText) return;

    const li = document.createElement('li');

    if (nameText) {
      const strong = document.createElement('strong');
      strong.textContent = nameText;
      li.append(strong);
    }
    if (clauseText) {
      li.append(document.createTextNode(clauseText));
    }
    list.append(li);
  });

  wrap.append(list);
  block.replaceChildren(wrap);
}
