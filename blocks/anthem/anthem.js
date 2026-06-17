/*
 * Anthem block (section role)
 * Prototype: stardust/prototypes/home.html — .anthem panel.
 * Two-column panel: left = heading + prose + CTA, right = 3/2 image.
 *
 * Authoring contract (#62): ONE row, ONE cell holding all elements as
 * flat siblings — a heading, body paragraphs, a CTA link (authored as
 * <strong><a> → primary button), and an optional <picture>. We flatten
 * and CLASSIFY by content type, never by row/cell index.
 */

/**
 * Re-create the prototype's <em> red emphasis (#39).
 * EDS strips <span>/inline classes from cells, so the heading arrives as
 * plain text. The prototype emphasised the trailing sentence in --red,
 * non-italic. We wrap everything after the first sentence's period in
 * an <em> so the block CSS can colour it.
 * @param {HTMLHeadingElement} heading
 */
function emphasizeHeading(heading) {
  if (heading.querySelector('em')) return;
  const text = heading.textContent.trim();
  const match = text.match(/^(.*?[.?!])\s+(.+)$/);
  if (!match) return;
  const [, lead, rest] = match;
  heading.textContent = '';
  heading.append(document.createTextNode(`${lead} `));
  const em = document.createElement('em');
  em.textContent = rest;
  heading.append(em);
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten: collect every authored element regardless of row/cell nesting.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  const wrap = document.createElement('div');
  wrap.className = 'anthem-wrap';

  const text = document.createElement('div');
  text.className = 'anthem-text';

  const media = document.createElement('div');
  media.className = 'anthem-media';

  // Classify each authored node by content.
  nodes.forEach((node) => {
    const picture = node.matches('picture') ? node : node.querySelector('picture');
    const heading = node.matches('h1,h2,h3,h4,h5,h6')
      ? node
      : node.querySelector('h1,h2,h3,h4,h5,h6');

    if (picture) {
      media.append(picture);
    } else if (heading) {
      emphasizeHeading(heading);
      text.append(heading);
    } else {
      // body paragraph or CTA (<strong><a> → primary button via ak.js).
      text.append(node);
    }
  });

  wrap.append(text, media);
  block.replaceChildren(wrap);
}
