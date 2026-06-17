/**
 * chat-thread — the conversation column (LEAD block).
 *
 * This is the LEAD/hero of the slicc app screen: the chat tab title
 * ("Stardust — acmecorp.com redesign") is the section lead and becomes the
 * page's single <h1>. Below it, each conversation turn is authored as one row
 * and CLASSIFIED BY CONTENT into one of the message primitives lifted from the
 * prototype (slicc-app-v13-proposed.html):
 *
 *   - user bubble        — a plain prose row whose text starts the turn from the
 *                          human; rendered .bubble--user (right-aligned).
 *   - assistant prose    — assistant reply; rendered .assist. Inline `code`
 *                          spans become .chip; `**bold**` becomes <strong>.
 *   - working pill        — a row beginning "working:" → shimmer pill with a verb,
 *                          a muted detail, a typer caret; `working-amber:` tints it.
 *   - delegated scoop     — a row beginning "delegated:" → ↳ + scoop pill(s) +
 *                          trailing meta. Colour via `· mint` / `· orange` token.
 *   - completed pill(s)   — a row beginning "completed:" → one or more mint pills
 *                          (split on `|`).
 *   - terminal block      — a row beginning "term:" → mac-dots terminal whose body
 *                          is the cell's text with `$`/✓/!/dim spans recreated.
 *   - assignment card     — a row beginning "assign:" → avatar/who/when/action +
 *                          message + attached-context list.
 *
 * EDS strips <span>s inside cells, so every chip / term span / scoop pill is
 * RE-CREATED here in JS (skill #39). The composer is non-submitting: a <div>
 * wrapper (no <form>) with <button type="button"> (skill #20). Decoration is
 * driven by content classification, never by row index (skill #48/#62).
 */

const NS = 'http://www.w3.org/2000/svg';
const OK = String.fromCharCode(0x2713); // check mark
const BAD = String.fromCharCode(0x2717); // ballot x

function svg(path, viewBox = '0 0 24 24', extra = {}) {
  const node = document.createElementNS(NS, 'svg');
  node.setAttribute('viewBox', viewBox);
  node.setAttribute('fill', extra.fill || 'none');
  node.setAttribute('stroke', extra.stroke || 'currentColor');
  node.setAttribute('stroke-width', extra.sw || '2');
  if (extra.cap) node.setAttribute('stroke-linecap', extra.cap);
  if (extra.join) node.setAttribute('stroke-linejoin', extra.join);
  node.innerHTML = path;
  return node;
}

const ICONS = {
  tab: '<rect x="3" y="3" width="18" height="18" rx="2"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  chev: '<polyline points="9 18 15 12 9 6"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
};

const CONTEXT_ICONS = ['mint', 'orange', 'pink'];
const CONTEXT_GLYPH = { mint: 'doc', orange: 'image', pink: 'bolt' };

function el(tag, cls, content) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (content != null) node.textContent = content;
  return node;
}

/** trim + collapse a cell to a single plain string */
function text(cell) {
  return cell ? cell.textContent.replace(/\s+/g, ' ').trim() : '';
}

/** raw multi-line text (preserves line breaks) for terminal bodies */
function rawText(cell) {
  if (!cell) return '';
  // <br> → newline, then take textContent so prose pasted with hard breaks survives.
  const clone = cell.cloneNode(true);
  clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  // Each block child (p/div) is its own line.
  const blocks = [...clone.children].filter((c) => /^(P|DIV)$/.test(c.tagName));
  if (blocks.length) return blocks.map((b) => b.textContent.replace(/[ \t]+$/gm, '')).join('\n').replace(/\n{3,}/g, '\n\n');
  return clone.textContent.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Render inline markup into a target element: `code` → .chip span,
 * **bold** → <strong>. Recreated in JS because EDS strips authored spans.
 */
function inline(target, str) {
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) target.append(document.createTextNode(str.slice(last, m.index)));
    const tok = m[0];
    if (tok.startsWith('`')) {
      target.append(el('span', 'chip', tok.slice(1, -1)));
    } else {
      target.append(el('strong', null, tok.slice(2, -2)));
    }
    last = re.lastIndex;
  }
  if (last < str.length) target.append(document.createTextNode(str.slice(last)));
}

/* ── turn classifiers ─────────────────────────────────────────────── */

function userBubble(str) {
  return el('div', 'bubble--user', str);
}

function assist(str) {
  const node = el('div', 'assist');
  str.split('\n').filter((l) => l.trim()).forEach((line) => {
    const p = el('p');
    inline(p, line.trim());
    node.append(p);
  });
  if (!node.children.length) {
    const p = el('p');
    inline(p, str);
    node.append(p);
  }
  return node;
}

function working(str, amber) {
  const node = el('div', amber ? 'working working--amber' : 'working');
  node.append(el('span', 'pulse'));
  // "Verb · detail"
  const [verb, ...rest] = str.split('·');
  const body = el('span');
  body.append(el('span', 'verb', verb.trim()));
  if (rest.length) body.append(el('span', 'detail', rest.join('·').trim()));
  body.append(el('span', 'typer'));
  node.append(body);
  node.append(el('span', 'more', '···'));
  return node;
}

function delegated(str) {
  const node = el('div', 'delegated');
  node.append(el('span', 'delegated__arrow', '↳'));
  // "scoop label || trailing meta", scoop colour via "· mint"/"· orange" suffix.
  const [scoopRaw, ...metas] = str.split('||');
  let scoop = scoopRaw.trim();
  let cls = 'delegated__scoop';
  const cm = scoop.match(/\s*·\s*(mint|orange)\s*$/i);
  if (cm) {
    cls += ` delegated__scoop--${cm[1].toLowerCase()}`;
    scoop = scoop.replace(/\s*·\s*(mint|orange)\s*$/i, '');
  }
  const pill = el('span', cls);
  pill.append(el('span', 'd'));
  pill.append(document.createTextNode(` ${scoop}`));
  node.append(pill);
  metas.forEach((meta) => { if (meta.trim()) node.append(el('span', null, meta.trim())); });
  return node;
}

function completed(str) {
  const items = str.split('|').map((s) => s.trim()).filter(Boolean);
  const row = el('div', 'completed-row');
  items.forEach((label) => {
    const pill = el('span', 'completed');
    pill.append(el('span', 'pulse'));
    pill.append(document.createTextNode(` ${label}`));
    row.append(pill);
  });
  // single pill: return the pill directly (matches prototype bare .completed)
  return items.length === 1 ? row.firstChild : row;
}

/**
 * Terminal block. Body text is rendered verbatim (white-space:pre) with
 * leading-`$` prompts, ✓/✗ ok/bad, !/warn, and indented dim lines re-coloured
 * via recreated spans.
 */
function terminal(title, bodyStr) {
  const node = el('div', 'term');
  const bar = el('div', 'term__bar');
  bar.append(el('span', 'dot dot--r'), el('span', 'dot dot--y'), el('span', 'dot dot--g'));
  bar.append(el('span', 'term__title', title || 'output'));
  node.append(bar);

  const body = el('div', 'term__body');
  const lines = bodyStr.split('\n');
  lines.forEach((line, i) => {
    if (i) body.append(document.createTextNode('\n'));
    if (/^\s*\$\s/.test(line)) {
      // prompt line: "$ command"
      const lead = line.match(/^(\s*)\$\s/)[0];
      body.append(el('span', 'term__prompt', '$'));
      body.append(el('span', 'term__cmd', line.slice(lead.length)));
    } else if (line.includes(OK)) {
      // split so the OK token (and the status word right after it) is mint
      line.split(new RegExp(`(${OK}\\s*\\w+)`)).forEach((seg) => {
        if (!seg) return;
        body.append(seg.startsWith(OK) ? el('span', 'term__ok', seg) : document.createTextNode(seg));
      });
    } else if (line.includes('!') || line.includes(BAD)) {
      line.split(new RegExp(`([!${BAD}][^\\n]*)`)).forEach((seg, j) => {
        if (!seg) return;
        body.append(j % 2 ? el('span', 'term__warn', seg) : document.createTextNode(seg));
      });
    } else {
      body.append(el('span', 'term__dim', line));
    }
  });
  node.append(body);
  return node;
}

/**
 * Assignment card. Cell holds (in authored order): who line, when line,
 * action label, message paragraph, "Attached context · N items" head, then
 * one context line per `·`-delimited entry: "title · meta".
 */
function assignCard(cell) {
  const node = el('article', 'assign');
  const lines = [...cell.querySelectorAll('p, div, li')]
    .map((p) => p.textContent.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  // Fall back to splitting the whole cell on newlines when authored flat.
  // Use rawText (newline-preserving) — text() collapses \n and loses the rows.
  const seq = lines.length ? lines : rawText(cell).split('\n').map((s) => s.trim()).filter(Boolean);

  const who = seq.shift() || '';
  const when = seq.shift() || '';
  const action = seq.shift() || 'Review';
  const msg = seq.shift() || '';
  // remaining lines: a context-head ("... · N items") then context entries.
  let ctxHead = '';
  const ctxEntries = [];
  seq.forEach((line) => {
    if (!ctxHead && /context/i.test(line)) ctxHead = line;
    else ctxEntries.push(line);
  });

  const head = el('div', 'assign__head');
  head.append(el('div', 'assign__avatar'));
  const meta = el('div');
  const whoLine = el('div', 'assign__who');
  // "name — note" → name plain, note as .meta
  const [whoName, ...whoNote] = who.split('—');
  whoLine.append(document.createTextNode(whoName.trim()));
  if (whoNote.length) whoLine.append(el('span', 'meta', whoNote.join('—').trim()));
  meta.append(whoLine);
  meta.append(el('div', 'assign__when', when));
  head.append(meta);
  const btn = el('button', 'assign__action', action);
  btn.type = 'button';
  head.append(btn);
  node.append(head);

  if (msg) {
    const p = el('p', 'assign__msg');
    inline(p, msg);
    node.append(p);
  }

  if (ctxEntries.length) {
    node.append(el('div', 'context-head', ctxHead || `Attached context · ${ctxEntries.length} items`));
    const list = el('div', 'context-list');
    ctxEntries.forEach((entry, i) => {
      const tone = CONTEXT_ICONS[i % CONTEXT_ICONS.length];
      const a = el('a', 'context');
      a.href = '#';
      const icon = el('span', `context__icon context__icon--${tone}`);
      icon.append(svg(ICONS[CONTEXT_GLYPH[tone]], '0 0 24 24', { cap: 'round' }));
      a.append(icon);
      const body = el('div', 'context__body');
      const [title, ...m] = entry.split('·');
      body.append(el('div', 'context__title', title.trim()));
      if (m.length) body.append(el('div', 'context__meta', m.join('·').trim()));
      a.append(body);
      const chev = el('span', 'context__chev');
      chev.append(svg(ICONS.chev, '0 0 24 24', { cap: 'round' }));
      a.append(chev);
      list.append(a);
    });
    node.append(list);
  }
  return node;
}

/* ── collectors ───────────────────────────────────────────────────── */

/**
 * Cell-level cascade collector (skill #62/#68/#71): iterate every cell and
 * keep it whole — we classify by the cell's leading keyword, so we need the
 * cell node, not its scattered children.
 */
function collectCells(block) {
  return [...block.querySelectorAll(':scope > div > div')];
}

export default async function decorate(block) {
  const cells = collectCells(block);
  if (!cells.length) return;

  /* Row 1 = the chat tab lead (the page <h1>). Query for a heading; tolerate
     the title authored as plain text. Reuse the authored heading element if it
     is already an <h1>; otherwise build one and unwrap (skill #55). */
  const leadCell = cells.shift();
  const leadHeading = leadCell.querySelector('h1, h2, h3, h4, h5, h6');
  const tab = el('div', 'chat__tab');
  const icon = el('span', 'chat__tab-icon');
  icon.append(svg(ICONS.tab));
  tab.append(icon);

  let h1;
  if (leadHeading && leadHeading.tagName === 'H1') {
    h1 = leadHeading;
    h1.classList.add('chat__tab-title');
  } else {
    h1 = el('h1', 'chat__tab-title');
    const inner = leadHeading || leadCell;
    [...inner.childNodes].forEach((n) => h1.append(n.cloneNode(true)));
    if (!h1.textContent.trim()) h1.textContent = text(leadCell);
  }
  tab.append(h1);

  const breadcrumb = el('span', 'chat__tab-breadcrumb');
  breadcrumb.append(el('span', 'pulse'));
  breadcrumb.append(document.createTextNode(' 3 scoops migrating'));
  tab.append(breadcrumb);

  /* Conversation turns — one cell per row, classified by leading keyword. */
  const inner = el('div', 'chat__inner');
  cells.forEach((cell) => {
    const t = text(cell);
    if (!t) return;
    const lower = t.toLowerCase();
    let node;
    if (lower.startsWith('user:')) {
      node = userBubble(t.slice(5).trim());
    } else if (lower.startsWith('assist:')) {
      node = assist(rawText(cell).replace(/^assist:\s*/i, ''));
    } else if (lower.startsWith('working-amber:')) {
      node = working(t.slice(14).trim(), true);
    } else if (lower.startsWith('working:')) {
      node = working(t.slice(8).trim(), false);
    } else if (lower.startsWith('delegated:')) {
      node = delegated(t.slice(10).trim());
    } else if (lower.startsWith('completed:')) {
      node = completed(t.slice(10).trim());
    } else if (lower.startsWith('term:')) {
      const raw = rawText(cell).replace(/^term:\s*/i, '');
      const nl = raw.indexOf('\n');
      const title = nl === -1 ? raw.trim() : raw.slice(0, nl).trim();
      const bodyStr = nl === -1 ? '' : raw.slice(nl + 1);
      node = terminal(title, bodyStr);
    } else if (lower.startsWith('assign:')) {
      // strip the keyword off the first line then build from the cell
      const clean = cell.cloneNode(true);
      const first = clean.querySelector('p, div, li') || clean;
      first.textContent = first.textContent.replace(/^assign:\s*/i, '');
      node = assignCard(clean);
    } else {
      // default: assistant prose
      node = assist(rawText(cell));
    }
    if (node) inner.append(node);
  });

  const scroll = el('div', 'chat__scroll');
  scroll.append(inner);

  /* Composer — NON-submitting: a <div> (no <form>), button type=button (#20). */
  const composer = el('div', 'composer');
  const cInner = el('div', 'composer__inner');
  cInner.append(el('div', 'composer__field', 'Ask anything · or pause migration'));
  const bar = el('div', 'composer__bar');
  const plus = el('button', 'composer__mini');
  plus.type = 'button';
  plus.setAttribute('aria-label', 'Add');
  plus.append(svg(ICONS.plus, '0 0 24 24', { cap: 'round' }));
  const send = el('button', 'composer__send');
  send.type = 'button';
  send.setAttribute('aria-label', 'Send');
  send.append(svg(ICONS.send, '0 0 24 24', { sw: '2.4', cap: 'round', join: 'round' }));
  bar.append(plus, send);
  cInner.append(bar);
  composer.append(cInner);

  const disclaimer = el('div', 'disclaimer');
  disclaimer.append(document.createTextNode('Responses are generated using AI, and may be inaccurate. Check before using. '));
  const guidelines = el('a', null, 'AI guidelines');
  guidelines.href = '#';
  disclaimer.append(guidelines);

  const wrap = el('div', 'wrap');
  wrap.append(tab, scroll, composer, disclaimer);
  block.replaceChildren(wrap);
}
