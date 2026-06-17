/**
 * scoops-monitor — live parallel-scoops monitor.
 *
 * Authoring shape (one line per row, delimiters carry structure):
 *   1. Section title row              → "Right now · 3 scoops working in parallel"
 *      (first segment = title, remainder = hint)
 *   2..N. one scoop card per row      → "/about · folding 7 modules… · 62 · 0:42"
 *      segments: page · task · pct · eta
 *
 * Per #62/#68/#71 collect nodes with a CELL-LEVEL cascade (synthesise a <p>
 * from any bare-text cell), then classify BY CONTENT — never by row/cell index.
 */

const AVATARS = ['pink', 'mint', 'orange'];

/** Cell-level cascade collector: push child elements, else synthesise a <p>. */
function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) {
      out.push(...kids);
    } else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      out.push(p);
    }
  });
  return out.length ? out : [...block.children];
}

/** Split a line on the unit delimiter (·), trimming empties. */
function segments(node) {
  return node.textContent
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** A scoop line leads with a route path ("/about"); the title line does not. */
function isScoopLine(node) {
  return /^\//.test(node.textContent.trim());
}

function buildAvatar(index) {
  const avatar = document.createElement('span');
  avatar.className = `scoop-avatar scoop-avatar-${AVATARS[index % AVATARS.length]}`;
  avatar.textContent = String(index + 1).padStart(2, '0');
  return avatar;
}

function buildCard(parts, index) {
  const [page = '', task = '', pct = '', eta = ''] = parts;

  const card = document.createElement('div');
  card.className = 'scoop-card';

  card.append(buildAvatar(index));

  const body = document.createElement('div');
  body.className = 'scoop-body';

  const line = document.createElement('div');
  line.className = 'scoop-line';

  const pageEl = document.createElement('span');
  pageEl.className = 'scoop-page';
  pageEl.textContent = page;
  line.append(pageEl);

  if (task) {
    const taskEl = document.createElement('span');
    taskEl.className = 'scoop-task';
    taskEl.textContent = task;
    line.append(taskEl);
  }
  body.append(line);

  const progress = document.createElement('div');
  progress.className = 'scoop-progress';
  const fill = document.createElement('div');
  fill.className = 'scoop-progress-fill';
  // re-create the prototype's inline width from the authored pct
  const num = parseFloat(String(pct).replace('%', ''));
  fill.style.width = `${Number.isFinite(num) ? Math.max(0, Math.min(100, num)) : 0}%`;
  progress.append(fill);
  body.append(progress);

  card.append(body);

  if (eta) {
    const etaEl = document.createElement('span');
    etaEl.className = 'scoop-eta';
    etaEl.textContent = eta;
    card.append(etaEl);
  }

  return card;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  const scoopNodes = nodes.filter(isScoopLine);
  const headNode = nodes.find((n) => !isScoopLine(n));

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // section title → <h2> "Right now", with an optional hint
  if (headNode) {
    const parts = segments(headNode);
    const sectH = document.createElement('div');
    sectH.className = 'sect-h';

    const heading = document.createElement('h2');
    heading.textContent = parts[0] || headNode.textContent.trim();
    sectH.append(heading);

    if (parts.length > 1) {
      const hint = document.createElement('span');
      hint.className = 'sect-hint';
      hint.textContent = parts.slice(1).join(' · ');
      sectH.append(hint);
    }
    wrap.append(sectH);
  }

  const mon = document.createElement('div');
  mon.className = 'scoops-mon';
  scoopNodes.forEach((node, i) => mon.append(buildCard(segments(node), i)));
  wrap.append(mon);

  block.replaceChildren(wrap);
}
