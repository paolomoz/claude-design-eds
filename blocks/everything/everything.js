/**
 * everything — centered section headline on a light surface.
 *
 * Authored as ONE row / ONE cell holding the title + lede as flat siblings.
 * We flatten the cell and classify by content: the first heading is the
 * section title (<h2>); everything else (paragraphs) becomes the lede.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten: collect every authored element regardless of row/cell nesting.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // Reuse an authored heading if present (server-visible, avoids nesting);
  // otherwise promote the first text node to a heading.
  let heading = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  const rest = nodes.filter((n) => n !== heading && n.textContent.trim());

  if (!heading) {
    const first = rest.shift();
    if (first) {
      heading = document.createElement('h2');
      heading.textContent = first.textContent.trim();
    }
  }

  const wrap = document.createElement('div');
  wrap.className = 'everything-wrap';

  const headline = document.createElement('div');
  headline.className = 'everything-headline';

  if (heading) {
    if (heading.tagName !== 'H2') {
      const h2 = document.createElement('h2');
      h2.innerHTML = heading.innerHTML;
      heading = h2;
    }
    heading.classList.add('h-title-2');
    headline.append(heading);
  }

  rest.forEach((node) => {
    const p = document.createElement('p');
    p.innerHTML = node.innerHTML || node.textContent;
    headline.append(p);
  });

  wrap.append(headline);
  block.replaceChildren(wrap);
}
