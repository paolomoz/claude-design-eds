/**
 * filter-strip — taxonomy-filter topic rail (data-intent="taxonomy-filter")
 *
 * A panel-background full-width band. Content is a single authored cell holding
 * flat siblings:
 *   - a leading text label  (e.g. "⌖ filter by channel")
 *   - a horizontal row of chip anchors, each authored as a plain <a> whose text
 *     is "Name · count · variant" (variant optional: m | o | on; default = teal)
 *   - a trailing status line (e.g. "↻ live · auto-refresh on new post")
 *
 * Chips are static taxonomy links (they navigate to topic pages) — no JS
 * filtering. We re-create the prototype's color variants and the .count <span>
 * (EDS strips authored <span>s in cells, so the count pill is rebuilt here).
 */

const VARIANTS = new Set(['m', 'o', 'on']);

function flatten(block) {
  // DA-flattened single-cell contract first, then fallbacks (#62/#68).
  let nodes = [...block.querySelectorAll(':scope > div > div > *')];
  if (!nodes.length) nodes = [...block.children].filter((n) => n.tagName !== 'DIV' || n.children.length);
  if (!nodes.length) nodes = [...block.querySelectorAll(':scope > div > *')];
  return nodes;
}

function buildChip(anchor) {
  // Parse "Name · count · variant" from the anchor's text.
  const raw = anchor.textContent.replace(/\s+/g, ' ').trim();
  const parts = raw.split('·').map((s) => s.trim()).filter(Boolean);

  let variant = '';
  if (parts.length && VARIANTS.has(parts[parts.length - 1].toLowerCase())) {
    variant = parts.pop().toLowerCase();
  }

  let count = '';
  if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) {
    count = parts.pop();
  }

  const name = parts.join(' · ').trim();

  const chip = document.createElement('a');
  chip.className = 'chip';
  if (variant) chip.classList.add(variant);
  if (anchor.href) chip.href = anchor.getAttribute('href');

  chip.append(document.createTextNode(name ? `${name} ` : ''));
  if (count !== '') {
    const span = document.createElement('span');
    span.className = 'count';
    span.textContent = count;
    chip.append(span);
  }
  return chip;
}

function buildMeta(text) {
  // Highlight the status keyword (the segment after a leading symbol) in --signal.
  const meta = document.createElement('span');
  meta.className = 'meta';
  const m = text.match(/^(\S+)\s+(\S+)\s*(.*)$/);
  if (m) {
    const [, lead, keyword, rest] = m;
    meta.append(document.createTextNode(`${lead} `));
    const v = document.createElement('span');
    v.className = 'v';
    v.textContent = keyword;
    meta.append(v);
    if (rest) meta.append(document.createTextNode(` ${rest}`));
  } else {
    meta.textContent = text;
  }
  return meta;
}

export default async function decorate(block) {
  const nodes = flatten(block);
  if (!nodes.length) return;

  const anchors = nodes.filter((n) => n.matches('a') || n.querySelector('a'));
  const textNodes = nodes.filter((n) => !n.matches('a') && !n.querySelector('a'));

  const row = document.createElement('div');
  row.className = 'row';

  // Leading label = first text-only node.
  const labelText = textNodes.length ? textNodes[0].textContent.trim() : '';
  if (labelText) {
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = labelText;
    row.append(label);
  }

  // Chips, in authored order.
  anchors.forEach((n) => {
    const a = n.matches('a') ? n : n.querySelector('a');
    row.append(buildChip(a));
  });

  // Trailing status = last text-only node (when distinct from the label).
  if (textNodes.length > 1) {
    row.append(buildMeta(textNodes[textNodes.length - 1].textContent.trim()));
  }

  block.replaceChildren(row);
}
