/*
 * Colophon block — pre-footer brand seal on the one light (--dust) band.
 * Lifted from the prototype section.colophon (home-A-cinematic.html).
 *
 * Authored shape (block.children = rows, row.children = cells):
 *   row 1 — equation eyebrow text   e.g. "BRIEF + SEED = STAR"
 *   row 2 — manifesto line (heading) e.g. "Math, not mysticism."
 *   row 3 — equation foot line       e.g. "2026 · STARDUST · APACHE 2.0"
 *
 * The cinematic char-split / data-cin reveal JS is intentionally dropped —
 * the content renders visible. The .ink-mark spans around the + and = in the
 * eyebrow are re-created here in JS (EDS strips <span> in authored cells).
 */

/**
 * Wrap the + and = operators of the eyebrow line in .ink-mark spans so they
 * pick up the dark ink colour against the amber-deep text.
 * @param {string} text The raw eyebrow text
 * @returns {DocumentFragment}
 */
function markEyebrow(text) {
  const frag = document.createDocumentFragment();
  // Split on the + / = operators, keeping them as separate tokens.
  text.split(/([+=])/).forEach((part) => {
    if (part === '+' || part === '=') {
      const mark = document.createElement('span');
      mark.className = 'ink-mark';
      mark.textContent = part;
      frag.append(mark);
    } else if (part) {
      frag.append(document.createTextNode(part));
    }
  });
  return frag;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const [eyebrowRow, manifestoRow, equationRow] = rows;

  const wrap = document.createElement('div');
  wrap.className = 'colophon-inner';

  // 1. Equation eyebrow — mono, amber-deep, ink-mark operators.
  const eyebrowCell = eyebrowRow?.firstElementChild;
  if (eyebrowCell) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'equation-eyebrow';
    eyebrow.append(markEyebrow(eyebrowCell.textContent.trim()));
    wrap.append(eyebrow);
  }

  // 2. Manifesto — huge Times-italic amber-deep line. Reuse an authored
  //    heading element if present (server-visible, avoid nesting); else h2.
  const manifestoCell = manifestoRow?.firstElementChild;
  if (manifestoCell) {
    const authored = manifestoCell.querySelector('h1, h2, h3, h4, h5, h6');
    let manifesto;
    if (authored) {
      manifesto = authored;
    } else {
      manifesto = document.createElement('h2');
      manifesto.textContent = manifestoCell.textContent.trim();
    }
    manifesto.classList.add('manifesto');
    wrap.append(manifesto);
  }

  // 3. Equation foot — mono, muted ink.
  const equationCell = equationRow?.firstElementChild;
  if (equationCell) {
    const equation = document.createElement('p');
    equation.className = 'equation';
    equation.textContent = equationCell.textContent.trim();
    wrap.append(equation);
  }

  block.textContent = '';
  block.append(wrap);
}
