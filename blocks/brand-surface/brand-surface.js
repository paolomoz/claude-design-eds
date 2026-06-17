/**
 * brand-surface — extracted-brand strip (role: section).
 *
 * Shows the captured brand: logo monogram, palette swatches, type chips and a
 * "Mode A · pinned" lock pill. Lifted from the prototype's .brand-strip + .sect-h.
 *
 * Authored cells (one value per cell, classified BY CONTENT — never by index):
 *   - section title       → "Brand surface"            (heading text)
 *   - hint                → "extracted + pinned"
 *   - logo monogram       → "AC"                        (1–3 chars)
 *   - palette hex list    → "#0F2A4D · #C4554E · …"     (·-delimited hex codes)
 *   - palette note        → "navy + coral on cream"
 *   - type names          → "Inter · IBM Plex Mono"     (·-delimited family names)
 *   - type note           → "rounded-corner photography"
 *
 * The author may omit/reorder cells; classification tolerates that.
 */

const LOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

const HEX_RE = /#[0-9a-f]{3,8}\b/i;
const SPLIT_RE = /[·,|]/;

/* Cell-level cascade collector (#62/#68/#71): per cell, push child elements if
   any, else synthesise a <p> from the cell's own bare text. */
function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) out.push(...kids);
    else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      out.push(p);
    }
  });
  return out.length ? out : [...block.children];
}

function nodeText(node) {
  return (node.textContent || '').trim();
}

function splitParts(str) {
  return str.split(SPLIT_RE).map((s) => s.trim()).filter(Boolean);
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  const texts = nodes.map(nodeText).filter(Boolean);

  // Classify by content, not position.
  // Title = the heading element if any, else the first text value.
  const heading = nodes.find((n) => n.matches('h1, h2, h3, h4, h5, h6'));
  const titleText = (heading ? nodeText(heading) : texts[0]) || 'Brand surface';

  // Working pool: every text value except the title, in authored order.
  let titleConsumed = false;
  const pool = texts.filter((t) => {
    if (!titleConsumed && t === titleText) { titleConsumed = true; return false; }
    return true;
  });

  // Palette = the ·-delimited value carrying hex codes.
  const paletteIdx = pool.findIndex((t) => HEX_RE.test(t));
  const colors = paletteIdx > -1
    ? splitParts(pool.splice(paletteIdx, 1)[0]).filter((p) => HEX_RE.test(p))
    : [];

  // Logo monogram = a short token (<= 4 chars, no whitespace).
  const logoIdx = pool.findIndex((t) => t.length <= 4 && !/\s/.test(t));
  const logo = logoIdx > -1 ? pool.splice(logoIdx, 1)[0] : '';

  // Type chips = the ·-delimited family list (multiple parts, no hex).
  const typeIdx = pool.findIndex((t) => splitParts(t).length > 1);
  const typeNames = typeIdx > -1 ? splitParts(pool.splice(typeIdx, 1)[0]) : [];

  // Hint = the first remaining single-value text; rest are palette/type notes.
  const hintText = pool.length ? pool.shift() : '';
  const notes = [...pool];

  // ── Build DOM ──────────────────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // section heading → <h2>
  const sectH = document.createElement('h2');
  sectH.className = 'sect-h';
  sectH.append(document.createTextNode(`${titleText} `));
  if (hintText) {
    const hint = document.createElement('span');
    hint.className = 'sect-h__hint';
    hint.textContent = hintText;
    sectH.append(hint);
  }

  const strip = document.createElement('div');
  strip.className = 'brand-strip';

  // logo
  if (logo) {
    const logoEl = document.createElement('div');
    logoEl.className = 'brand-strip__logo';
    logoEl.textContent = logo;
    strip.append(logoEl);
  }

  // meta (palette + type rows)
  const meta = document.createElement('div');
  meta.className = 'brand-strip__meta';

  if (colors.length) {
    const row = document.createElement('div');
    row.className = 'brand-strip__row';
    const label = document.createElement('b');
    label.textContent = 'Palette';
    row.append(label);

    const swatches = document.createElement('span');
    swatches.className = 'brand-strip__swatches';
    colors.forEach((hex) => {
      const sw = document.createElement('span');
      sw.className = 'brand-strip__swatch';
      sw.style.background = hex; // inline backgrounds re-created in JS (#39)
      swatches.append(sw);
    });
    row.append(swatches);

    if (notes.length) {
      const note = document.createElement('span');
      note.className = 'brand-strip__note';
      note.textContent = notes.shift();
      row.append(note);
    }
    meta.append(row);
  }

  if (typeNames.length) {
    const row = document.createElement('div');
    row.className = 'brand-strip__row';
    const label = document.createElement('b');
    label.textContent = 'Type';
    row.append(label);

    typeNames.forEach((name, i) => {
      const chip = document.createElement('span');
      chip.className = 'brand-strip__font';
      // second+ families render as mono chips, matching the prototype
      if (i > 0) chip.classList.add('brand-strip__font--mono');
      chip.textContent = name;
      row.append(chip);
    });

    if (notes.length) {
      const note = document.createElement('span');
      note.className = 'brand-strip__note';
      note.textContent = notes.shift();
      row.append(note);
    }
    meta.append(row);
  }

  strip.append(meta);

  // lock pill
  const lock = document.createElement('span');
  lock.className = 'brand-strip__lock';
  lock.innerHTML = LOCK_SVG;
  lock.append(document.createTextNode(' Mode A · pinned'));
  strip.append(lock);

  wrap.append(sectH, strip);
  block.replaceChildren(wrap);
}
