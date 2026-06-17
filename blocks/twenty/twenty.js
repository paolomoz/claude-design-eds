/*
 * Twenty block (role: band)
 * Full-bleed red anniversary band: giant decorative numeral + label on the
 * left, supporting prose + ghost CTA on the right.
 *
 * Authoring contract (#62): one row, one cell holding all elements as flat
 * siblings — a leading number/short numeral line, a label line, body
 * paragraphs, and a CTA link (authored as <em><a> → .btn-secondary).
 * We flatten and classify by content, never by row/cell index.
 */

export default async function decorate(block) {
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const left = document.createElement('div');
  left.className = 'col-left';
  const right = document.createElement('div');
  right.className = 'col-right';

  // The big numeral: the first short, mostly-numeric text node (no link).
  const isNumeral = (el) => !el.querySelector('a')
    && /^[\d\s]+$/.test(el.textContent.trim())
    && el.textContent.trim().length <= 4;

  let numCard = null;
  let labelRow = null;

  nodes.forEach((node) => {
    const hasLink = !!node.querySelector('a');
    const text = node.textContent.trim();

    if (!numCard && isNumeral(node)) {
      numCard = document.createElement('div');
      numCard.className = 'num-card';
      numCard.textContent = text;
      return;
    }

    // The label line directly follows the numeral and carries no link.
    if (numCard && !labelRow && !hasLink && node.tagName !== 'P') {
      labelRow = document.createElement('div');
      labelRow.className = 'label-row';
      labelRow.textContent = text;
      return;
    }

    if (hasLink) {
      // Clone the CTA cell as-is; decorateButton turns <em><a> into
      // .btn.btn-secondary. The global :not(.twenty,.featured) rule keeps
      // the outline light (white) on this dark band.
      const actions = document.createElement('div');
      actions.className = 'actions';
      [...node.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
      right.append(actions);
      return;
    }

    // Everything else is body copy.
    const p = document.createElement('p');
    p.textContent = text;
    right.append(p);
  });

  if (numCard) left.append(numCard);
  if (labelRow) left.append(labelRow);

  wrap.append(left, right);
  block.replaceChildren(wrap);
}
