/**
 * bio-stack — author-bio "host telemetry" band.
 *
 * Authored as ONE row / ONE cell holding flat siblings (DA single-cell
 * contract #62). Classify by content, segmented around the <h2> boundary:
 *   - everything BEFORE the heading = the left .meta telemetry column.
 *       a leading label line ("host telemetry") + N "key: value · variant"
 *       rows, each re-created as .row > .k / .v (#39 — EDS strips spans).
 *   - the heading itself = the right column H2 (re-create the "ship" .em span).
 *   - paragraphs after the heading = prose.
 *   - links after the heading = the .ctas row (first <strong><a> = primary
 *     button via convention; the rest are plain per-block text links #12).
 *
 * @param {Element} block
 */
export default async function decorate(block) {
  // --- flatten-first cascade (#68): collect the authored siblings ---
  let nodes = [...block.querySelectorAll(':scope > div > div > *')];
  if (!nodes.length) nodes = [...block.children].filter((c) => c.nodeType === 1);

  const heading = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  const headingIdx = heading ? nodes.indexOf(heading) : nodes.length;

  const before = nodes.slice(0, headingIdx);
  const after = nodes.slice(headingIdx + 1);

  // --- variant suffix → value class (orange / magenta / signal) ---
  const variantClass = (v) => {
    const key = v.trim().toLowerCase();
    if (key === 'o' || key === 'orange') return 'o';
    if (key === 'm' || key === 'magenta') return 'm';
    if (key === 's' || key === 'signal' || key === 'live') return 's';
    return '';
  };

  // ---------- left column: meta / telemetry ----------
  const meta = document.createElement('div');
  meta.className = 'meta';

  let labelText = '';
  const rows = [];

  before.forEach((n) => {
    const text = (n.textContent || '').trim();
    if (!text) return;
    const colon = text.indexOf(':');
    if (colon === -1) {
      // a non key:value line before the rows is the column label
      if (!labelText) labelText = text;
      return;
    }
    const k = text.slice(0, colon).trim();
    let rest = text.slice(colon + 1).trim();
    let variant = '';
    const dot = rest.indexOf('·');
    // a trailing "· token" only marks a variant if the token is a known one
    if (dot !== -1) {
      const tail = rest.slice(dot + 1).trim();
      if (variantClass(tail)) {
        variant = variantClass(tail);
        rest = rest.slice(0, dot).trim();
      }
    }
    rows.push({ k, v: rest, variant });
  });

  if (labelText) {
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = labelText;
    meta.append(label);
  }

  rows.forEach(({ k, v, variant }) => {
    const row = document.createElement('div');
    row.className = 'row';
    const ks = document.createElement('span');
    ks.className = 'k';
    ks.textContent = k;
    const vs = document.createElement('span');
    vs.className = variant ? `v ${variant}` : 'v';
    vs.textContent = v;
    row.append(ks, vs);
    meta.append(row);
  });

  // ---------- right column: heading + prose + ctas ----------
  const main = document.createElement('div');

  if (heading) {
    // re-create the "ship" orange accent (#39 — span stripped in cells)
    heading.innerHTML = heading.innerHTML.replace(
      /\b(ship)\b/i,
      '<span class="em">$1</span>',
    );
    main.append(heading);
  }

  const links = [];
  after.forEach((n) => {
    if (n.tagName === 'P' && n.querySelector('a')) {
      links.push(...n.querySelectorAll('a'));
    } else if (n.tagName === 'A') {
      links.push(n);
    } else if (n.tagName === 'P') {
      main.append(n);
    }
  });

  if (links.length) {
    const ctas = document.createElement('div');
    ctas.className = 'ctas';
    links.forEach((a, i) => {
      const link = document.createElement('a');
      link.href = a.getAttribute('href') || '#';
      link.textContent = (a.textContent || '').trim();
      if (i === 0) link.className = 'primary';
      ctas.append(link);
    });
    main.append(ctas);
  }

  // ---------- assemble: .container > .pane(meta, main) ----------
  const pane = document.createElement('div');
  pane.className = 'pane';
  pane.append(meta, main);

  const container = document.createElement('div');
  container.className = 'container';
  container.append(pane);

  block.replaceChildren(container);
}
