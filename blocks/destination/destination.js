/**
 * loads and decorates the destination block
 *
 * Authored as ONE row with ONE cell holding all elements as flat siblings:
 *   eyebrow text, an <h2> title, a body paragraph, and two CTA links
 *   (primary authored as <strong><a>, secondary as <em><a>).
 * We flatten the cell and classify each node by content, then rebuild the
 * prototype's sticker structure.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten: collect every authored element regardless of row/cell nesting.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  const isHeading = (el) => /^H[1-6]$/.test(el.tagName);
  const hasButton = (el) => el.querySelector('strong a, em a, a');

  // Classify by content, not by index.
  const heading = nodes.find(isHeading);
  const ctaNodes = nodes.filter((el) => !isHeading(el) && hasButton(el));
  // Text paragraphs that are not the heading and carry no CTA link.
  const textNodes = nodes.filter(
    (el) => !isHeading(el) && !hasButton(el) && el.textContent.trim(),
  );

  const sticker = document.createElement('div');
  sticker.className = 'destination-sticker';

  // Eyebrow = first text node, body = remaining text node(s).
  if (textNodes[0]) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'destination-eyebrow';
    eyebrow.textContent = textNodes[0].textContent.trim();
    sticker.append(eyebrow);
  }

  // Reuse the authored heading element (server-visible, avoid nesting).
  if (heading) {
    heading.classList.add('destination-title');
    sticker.append(heading);
  }

  textNodes.slice(1).forEach((node) => {
    const body = document.createElement('p');
    body.className = 'destination-body';
    body.textContent = node.textContent.trim();
    sticker.append(body);
  });

  // CTAs: clone the authored cells/links as-is so decorateButton() in ak.js
  // applies .btn.btn-primary (<strong><a>) and .btn.btn-secondary (<em><a>).
  if (ctaNodes.length) {
    const ctas = document.createElement('div');
    ctas.className = 'destination-ctas';
    ctaNodes.forEach((node) => {
      [...node.childNodes].forEach((child) => ctas.append(child.cloneNode(true)));
    });
    sticker.append(ctas);
  }

  const inner = document.createElement('div');
  inner.className = 'destination-inner';
  inner.append(sticker);

  block.textContent = '';
  block.append(inner);
}
