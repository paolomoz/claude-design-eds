/**
 * loads and decorates the story block (band)
 * Full-bleed brewery-interior cinematic band. Authored as ONE row / ONE cell
 * holding flat siblings: eyebrow <p>, <h2> title, body <p>s, closer <p>.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten — author puts every element as a flat sibling in one cell.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  const heading = nodes.find((el) => /^H[1-6]$/.test(el.tagName));
  const paras = nodes.filter((el) => el.tagName === 'P');

  // Classify paragraphs by position: first = eyebrow, last = closer (standalone),
  // the middle paragraphs are the 2-col body. Fall back gracefully.
  let eyebrow;
  let closer;
  const body = [...paras];

  if (body.length) [eyebrow] = body.splice(0, 1);
  if (body.length > 1) closer = body.pop();

  // Background layer (image set in CSS; fully-qualified for the EDS origin).
  const bg = document.createElement('div');
  bg.className = 'story-bg';
  bg.setAttribute('aria-hidden', 'true');

  const inner = document.createElement('div');
  inner.className = 'story-inner';

  if (eyebrow) {
    eyebrow.classList.add('story-eyebrow');
    inner.append(eyebrow);
  }
  if (heading) inner.append(heading);

  if (body.length) {
    const bodyWrap = document.createElement('div');
    bodyWrap.className = 'story-body';
    body.forEach((p) => bodyWrap.append(p));
    inner.append(bodyWrap);
  }

  if (closer) {
    closer.classList.add('story-closer');
    inner.append(closer);
  }

  block.replaceChildren(bg, inner);
}
