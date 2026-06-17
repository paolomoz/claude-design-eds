/**
 * migration-progress — big-number progress bar band.
 *
 * Authoring (one line per row; classify by CONTENT, never by row index):
 *   - a percent line, e.g. "27%" or "27"        → the lead big number (→ <h2>)
 *   - a count + label, e.g. "3 of 11 pages migrated"  (the <b> count is the
 *     leading "N of M" run; the rest is the label)
 *   - a meta line, e.g. "applying variant B canon · DESIGN.json · 7 modules"
 *   - an ETA line, e.g. "~ 4 min remaining"
 *   - a bare fill-percent cell, e.g. "27" or "27%" → drives the bar fill width
 *
 * Any of these may be authored as a bare-text cell (no child element), so we
 * collect via a CELL-LEVEL cascade and synthesize a <p> when a cell has no
 * children, then segment/classify the collected nodes by their text content.
 */

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

// First integer/decimal in a string, clamped 0..100, or null.
function parsePct(str) {
  const m = str.match(/(\d+(?:\.\d+)?)\s*%?/);
  if (!m) return null;
  const n = Math.max(0, Math.min(100, parseFloat(m[1])));
  return Number.isFinite(n) ? n : null;
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  const lines = nodes
    .map((n) => n.textContent.trim())
    .filter(Boolean);

  // Classify lines by content.
  const pctLine = lines.find((l) => /%/.test(l) || /^\s*\d+(\.\d+)?\s*$/.test(l));
  const etaLine = lines.find((l) => /(remaining|left|eta|min|sec|hour)/i.test(l));
  const countLine = lines.find((l) => /\b\d+\s+of\s+\d+\b/i.test(l));
  // Meta = a leftover line that isn't pct / eta / count.
  const metaLine = lines.find(
    (l) => l !== pctLine && l !== etaLine && l !== countLine,
  );

  const pctValue = pctLine != null ? parsePct(pctLine) : null;
  const fillPct = pctValue != null ? pctValue : 27;
  const numText = pctValue != null ? String(Math.round(pctValue)) : '27';

  // ── Build prototype DOM ──────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const card = document.createElement('div');
  card.className = 'progress';

  const rowEl = document.createElement('div');
  rowEl.className = 'progress-row';

  // Big number → heading (the lead) as <h2>, with the % as a sub-span.
  const num = document.createElement('h2');
  num.className = 'progress-num';
  num.append(document.createTextNode(numText));
  const pctSpan = document.createElement('span');
  pctSpan.className = 'progress-pct';
  pctSpan.textContent = '%';
  num.append(pctSpan);
  rowEl.append(num);

  // Labels column (count + meta).
  const labels = document.createElement('div');
  if (countLine) {
    const label = document.createElement('div');
    label.className = 'progress-label';
    const m = countLine.match(/^(\s*\d+\s+of\s+\d+)\s*(.*)$/i);
    if (m) {
      const b = document.createElement('b');
      b.className = 'num';
      b.textContent = m[1].trim();
      label.append(b);
      if (m[2]) label.append(document.createTextNode(` ${m[2]}`));
    } else {
      label.textContent = countLine;
    }
    labels.append(label);
  }
  if (metaLine) {
    const meta = document.createElement('div');
    meta.className = 'progress-label is-meta';
    meta.textContent = metaLine;
    labels.append(meta);
  }
  if (labels.childElementCount) rowEl.append(labels);

  // ETA, right-aligned.
  if (etaLine) {
    const eta = document.createElement('span');
    eta.className = 'progress-eta';
    eta.textContent = etaLine;
    rowEl.append(eta);
  }

  card.append(rowEl);

  // Bar + fill (shimmer), driven by the authored pct.
  const bar = document.createElement('div');
  bar.className = 'progress-bar';
  const fill = document.createElement('span');
  fill.className = 'progress-fill';
  fill.style.width = `${fillPct}%`;
  bar.append(fill);
  card.append(bar);

  wrap.append(card);
  block.replaceChildren(wrap);
}
