// Inline Acrobat product-chip SVG (lifted verbatim from the prototype).
const ACROBAT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" aria-hidden="true">
<path fill="#b30b00" d="M45.5,3.2h165.1c24.7,0,45.5,19.9,45.5,45.5v158.7c0,24.7-19.9,45.5-45.5,45.5H45.5C20.7,252.8,0,232.9,0,207.4V48.6C0,23.1,19.9,3.2,45.5,3.2z"/>
<path fill="#fff" d="M204.2,147.5c-12-12.8-44.7-7.2-52.6-6.4c-11.2-11.2-19.1-23.9-22.3-28.7c4-12,7.2-25.5,7.2-38.3c0-12-4.8-23.9-17.5-23.9c-4.8,0-8.8,2.4-11.2,6.4c-5.6,9.6-3.2,28.7,5.6,48.6c-4.8,14.4-12.8,35.9-22.3,52.6c-12.8,4.8-40.7,17.5-43.1,31.9c-0.8,4,0.8,8.8,4,11.2c3.2,3.2,7.2,4,11.2,4c16.7,0,33.5-23.1,45.5-43.9c9.6-3.2,24.7-8,39.9-10.4c17.5,16,33.5,18.3,41.5,18.3c11.2,0,15.2-4.8,16.7-8.8C208.9,156.3,207.4,150.7,204.2,147.5z M193,155.5c-0.8,3.2-4.8,6.4-12,4.8c-8.8-2.4-16.7-6.4-23.1-12c5.6-0.8,19.1-2.4,28.7-0.8C189.8,148.3,193.8,150.7,193,155.5z M115.6,59.8c0.8-1.6,2.4-2.4,4-2.4c4,0,4.8,4.8,4.8,8.8c-0.8,9.6-2.4,19.9-5.6,28.7C112.4,77.4,113.2,64.6,115.6,59.8z M114.8,149.9c4-7.2,8.8-20.7,10.4-25.5c4,7.2,11.2,15.2,14.4,19.1C140.4,142.8,126,145.9,114.8,149.9z M87.7,168.3C76.6,185.8,66.2,197,59.8,197c-0.8,0-2.4,0-3.2-0.8c-0.8-1.6-1.6-3.2-0.8-4.8C56.6,185,69.4,176.2,87.7,168.3z"/>
</svg>`;

function chip(size) {
  const span = document.createElement('span');
  span.className = 'product-chip';
  if (size) {
    span.style.width = `${size}px`;
    span.style.height = `${size}px`;
  }
  span.innerHTML = ACROBAT_SVG;
  return span;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Authors place everything as flat siblings in one cell. Flatten and classify
  // by content, not by row/cell index.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // Find the heading boundaries. The section title is the FIRST heading; the
  // card titles are the repeating headings that start each card.
  const headings = nodes.filter((n) => /^H[1-6]$/.test(n.tagName));

  // Most-frequent heading level = the card-title boundary.
  const counts = {};
  headings.forEach((h) => { counts[h.tagName] = (counts[h.tagName] || 0) + 1; });
  const cardTag = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];

  const cardStartIdx = nodes.findIndex((n) => n.tagName === cardTag);
  const headNodes = cardStartIdx === -1 ? nodes : nodes.slice(0, cardStartIdx);
  const cardNodes = cardStartIdx === -1 ? [] : nodes.slice(cardStartIdx);

  // --- Build the centered section headline (hero wrap) ---
  const container = document.createElement('div');
  container.className = 'container';

  const headline = document.createElement('div');
  headline.className = 'section-headline';

  // chip + eyebrow row
  const chipRow = document.createElement('span');
  chipRow.className = 'headline-chip';
  chipRow.append(chip(24));

  const heroTitle = headNodes.find((n) => n.tagName === 'H2')
    || headNodes.find((n) => /^H[1-6]$/.test(n.tagName));

  headNodes.forEach((n) => {
    if (n === heroTitle) return;
    const text = n.textContent.trim();
    if (!text) return;
    if (n.tagName === 'P' && !chipRow.querySelector('.eyebrow') && text.length < 40) {
      // First short paragraph before the title = eyebrow label.
      const eyebrow = document.createElement('span');
      eyebrow.className = 'eyebrow';
      eyebrow.textContent = text;
      chipRow.append(eyebrow);
    } else {
      // lede / supporting paragraph
      const p = document.createElement('p');
      p.textContent = text;
      headline.append(p);
    }
  });

  // Order inside headline: chip row, then reuse authored heading, then lede(s).
  headline.prepend(chipRow);
  if (heroTitle) {
    chipRow.after(heroTitle); // server-visible authored heading, no nesting
  }

  container.append(headline);

  // --- Build the 3-up card grid ---
  const grid = document.createElement('div');
  grid.className = 'cards-3up';

  // Segment cardNodes into cards: each card begins at a cardTag heading.
  // Walk backwards from each heading to grab the preceding picture; forward to
  // grab the following label/body/cta until the next heading.
  const titleIdxs = [];
  cardNodes.forEach((n, i) => { if (n.tagName === cardTag) titleIdxs.push(i); });

  titleIdxs.forEach((tIdx, ci) => {
    const start = ci === 0 ? 0 : titleIdxs[ci - 1] + 1;
    const end = ci === titleIdxs.length - 1 ? cardNodes.length : titleIdxs[ci + 1];
    const segment = cardNodes.slice(start, end);

    const card = document.createElement('article');
    card.className = 'card-3up';

    // art: first picture/img in the segment
    const art = document.createElement('div');
    art.className = 'card-3up-art';
    const pic = segment.find((n) => n.tagName === 'PICTURE' || n.tagName === 'IMG'
      || n.querySelector?.('picture, img'));
    if (pic) {
      const media = pic.tagName === 'PICTURE' || pic.tagName === 'IMG'
        ? pic : pic.querySelector('picture, img');
      art.append(media);
    }
    card.append(art);

    const body = document.createElement('div');
    body.className = 'card-3up-body';

    // eyebrow label: the first short paragraph in the segment (product label)
    const labelNode = segment.find((n) => n.tagName === 'P'
      && n.textContent.trim() && n.textContent.trim().length < 30
      && n !== cardNodes[tIdx]);
    if (labelNode) {
      const eyebrow = document.createElement('span');
      eyebrow.className = 'card-3up-eyebrow';
      eyebrow.append(chip(20));
      eyebrow.append(document.createTextNode(labelNode.textContent.trim()));
      body.append(eyebrow);
    }

    // title (reuse authored h3)
    const title = cardNodes[tIdx];
    title.classList.add('card-3up-title');
    body.append(title);

    // body paragraph(s): remaining paragraphs that are not the label
    segment.forEach((n) => {
      if (n.tagName !== 'P' || n === labelNode) return;
      if (!n.textContent.trim()) return;
      body.append(n);
    });

    // ghost cta: clone the authored anchor (plain <a>)
    const link = segment.find((n) => n.tagName === 'A' || n.querySelector?.('a'));
    if (link) {
      const a = link.tagName === 'A' ? link : link.querySelector('a');
      a.className = 'card-3up-cta';
      body.append(a);
    }

    card.append(body);
    grid.append(card);
  });

  container.append(grid);

  block.replaceChildren(container);
}
