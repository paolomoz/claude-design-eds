/**
 * hero — emotional hook + primary action (split-media)
 *
 * Authoring shape (rows -> cells), read by QUERYING not by fixed index (#42):
 *   - a mono dataline label  (first link-free <p> that is NOT the sub, or the
 *     cell preceding the heading) -> rendered as .dataline with a gradient chip
 *   - the headline           -> the page's single <h1>
 *   - a sub paragraph        -> first link-free <p> after the heading
 *   - CTA links              -> link-bearing <p>; cloned into .hero-ctas
 *   - the wave image         -> <picture>/<img> from anywhere -> .wave-plate
 *
 * EDS strips <span> inside cells, so the dataline chip + the figcaption span run
 * are re-created here in JS.
 */

const IMG_ORIGIN = 'http://localhost:3000/img/stripe/wave.webp';

function makeDataline(label) {
  const p = document.createElement('p');
  p.className = 'dataline';
  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.setAttribute('aria-hidden', 'true');
  p.append(chip, document.createTextNode(label));
  return p;
}

export default async function decorate(block) {
  // 1. Read content by querying — tolerant of rich multi-row and consolidated shapes.
  const heading = block.querySelector('h1, h2, h3');
  const paras = [...block.querySelectorAll('p')];
  const linkP = paras.find((p) => p.querySelector('a'));
  const textParas = paras.filter((p) => !p.querySelector('a'));

  // The dataline is the first link-free paragraph that precedes the heading in
  // document order; the sub is the remaining link-free paragraph.
  let datalineText = '';
  let subPara = null;
  if (heading) {
    // ordered list of every element so we can split paragraphs by their
    // position relative to the heading without bitwise compareDocumentPosition.
    const order = [...block.querySelectorAll('*')];
    const headingIdx = order.indexOf(heading);
    const beforeHeading = textParas.filter((p) => order.indexOf(p) < headingIdx);
    const afterHeading = textParas.filter((p) => order.indexOf(p) > headingIdx);
    datalineText = beforeHeading[0] ? beforeHeading[0].textContent.trim() : '';
    subPara = afterHeading[0] || beforeHeading[1] || null;
  } else {
    [, subPara] = textParas;
    datalineText = textParas[0] ? textParas[0].textContent.trim() : '';
  }

  const pic = block.querySelector('picture, img');

  // 2. Build the prototype DOM.
  const grid = document.createElement('div');
  grid.className = 'hero-grid';

  const copy = document.createElement('div');
  copy.className = 'hero-copy';

  if (datalineText) copy.append(makeDataline(datalineText));

  if (heading) {
    heading.remove();
    copy.append(heading);
  }

  if (subPara) {
    subPara.remove();
    subPara.classList.add('hero-sub');
    copy.append(subPara);
  }

  // 3. CTAs: clone the cell's child nodes into .hero-ctas — never manufacture anchors.
  if (linkP && linkP.querySelector('a')) {
    const ctas = document.createElement('div');
    ctas.className = 'hero-ctas';
    [...linkP.childNodes].forEach((n) => ctas.append(n.cloneNode(true)));
    copy.append(ctas);
  }

  // wave plate
  const plate = document.createElement('div');
  plate.className = 'wave-plate';
  const figure = document.createElement('figure');
  const frame = document.createElement('div');
  frame.className = 'frame';

  if (pic) {
    const img = pic.tagName === 'IMG' ? pic : pic.querySelector('img');
    if (img && !img.getAttribute('src')) img.src = IMG_ORIGIN;
    frame.append(pic.tagName === 'PICTURE' ? pic : img || pic);
  } else {
    const img = document.createElement('img');
    img.src = IMG_ORIGIN;
    img.alt = "The wave: Stripe's multi-hue gradient brand asset, yellow through coral, magenta, blurple and cyan";
    img.width = 2784;
    img.height = 1949;
    img.loading = 'eager';
    img.fetchPriority = 'high';
    frame.append(img);
  }

  const figcaption = document.createElement('figcaption');
  const left = document.createElement('span');
  left.textContent = 'The wave · brand asset';
  const right = document.createElement('span');
  right.textContent = 'fig. 1';
  figcaption.append(left, right);

  figure.append(frame, figcaption);
  plate.append(figure);

  grid.append(copy, plate);
  block.replaceChildren(grid);
}
