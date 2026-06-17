/**
 * channel-archive — article index ("Latest signal — 8 channels").
 *
 * Authored as ONE row / ONE cell holding all elements as flat siblings
 * (the DA-flattened contract, #62). We DEFAULT to flattening and segment by
 * content, never by row/cell index:
 *   - section title  : the <h2> (server-visible authored heading, reused)
 *   - subtitle       : the first <p> after the title  -> .sub
 *   - featured card  : a rich multi-field line — the <h3> + lede <p> + a
 *                      delimited meta line (tags · date · read-time · link)
 *   - grid cards     : one <h3> per card; each card is a single delimited
 *                      authoring line  CH 0N | pill:LABEL | date | signal | href
 *
 * <span>/class styling and the .pill / .signal spans are stripped by EDS in
 * cells, so we re-create them in JS (#39). Whole-card anchors are NOT buttons
 * (anti-pattern 12) — kept as plain <a>.
 */

/* generic sparkline polyline — one per grid card, colored by variant */
const SPARK_COLOR = {
  m: '#cf2f5a',
  s: '#cf2f5a',
  t: '#1ba89f',
  h: '#7ad7d0',
  o: '#f29823',
};

function sparkline(variant) {
  const stroke = SPARK_COLOR[variant] || '#7ad7d0';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'spark');
  svg.setAttribute('viewBox', '0 0 200 28');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  line.setAttribute('points', '0,20 30,17 60,19 90,13 120,16 150,10 180,12 200,6');
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', stroke);
  line.setAttribute('stroke-width', '1.8');
  svg.append(line);
  return svg;
}

/* split a delimited authoring line into trimmed, non-empty segments */
function parts(str, delim = '·') {
  return str.split(delim).map((s) => s.trim()).filter(Boolean);
}

function span(cls, txt) {
  const s = document.createElement('span');
  if (cls) s.className = cls;
  if (txt !== undefined) s.textContent = txt;
  return s;
}

/* ---- the featured (CH 01) card --------------------------------------- */
function buildFeatured(heading, lede, metaText) {
  const article = document.createElement('article');
  article.className = 'channel feat';

  const text = document.createElement('div');
  text.className = 'text';

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = 'CHANNEL 01 — FEATURED';
  text.append(label);

  const h3 = document.createElement('h3');
  h3.append(...heading.childNodes);
  text.append(h3);

  if (lede) {
    const p = document.createElement('p');
    p.className = 'lede';
    p.append(...lede.childNodes);
    text.append(p);
  }

  // meta line:  CJA | AA(o) · date · read · <a>Open channel</a>
  const meta = document.createElement('div');
  meta.className = 'meta';
  if (metaText) {
    const link = metaText.querySelector('a');
    const raw = metaText.textContent.replace(link ? link.textContent : '', '').trim();
    const segs = parts(raw, '·');
    // first segment carries the tags (space/comma separated); the rest are
    // date/read-time. We tag the first two tokens, the rest are plain spans.
    const [tagSeg, ...rest] = segs;
    if (tagSeg) {
      const tags = parts(tagSeg, ',').length > 1 ? parts(tagSeg, ',') : tagSeg.split(/\s+/);
      tags.forEach((t, i) => meta.append(span(i === 0 ? 'tag' : 'tag o', t)));
    }
    rest.forEach((r) => meta.append(span('', r)));
    if (link) {
      const a = document.createElement('a');
      a.className = 'read';
      a.href = link.href;
      a.textContent = `▶ ${link.textContent.replace(/^▶\s*/, '')}`;
      meta.append(a);
    }
  }
  text.append(meta);

  // illustrative topic-energy viz (lifted from the prototype, 5 rows)
  const viz = document.createElement('div');
  viz.className = 'viz';
  viz.setAttribute('aria-hidden', 'true');
  const vlbl = span('vlbl', '▶ TOPIC ENERGY · LAST 12 MONTHS · ILLUSTRATIVE');
  vlbl.className = 'vlbl';
  viz.append(vlbl);
  const rows = [
    ['m', 'CJA', 78], ['o', 'AA', 56], ['', 'AEP', 42],
    ['m', 'SUMMIT', 88], ['', 'HOW-TO', 64],
  ];
  rows.forEach(([variant, k, v]) => {
    const vrow = document.createElement('div');
    vrow.className = variant ? `vrow ${variant}` : 'vrow';
    vrow.append(span('k', k));
    const bar = span('bar');
    const i = document.createElement('i');
    i.style.width = `${v}%`;
    bar.append(i);
    vrow.append(bar, span('v', String(v)));
    viz.append(vrow);
  });

  article.append(text, viz);
  return article;
}

/* ---- a grid (whole-card) tile ---------------------------------------- */
function buildCard(heading) {
  // each card is one delimited authoring line held in (or near) the heading:
  //   "CH 02 | pill:SUMMIT | 2026 · 05 · 05 | fresh | <a href>"
  // The authored markup keeps a link wrapping/near the heading for the href,
  // and the structured fields as a sibling delimited <p>.
  const a = document.createElement('a');
  a.className = 'channel';

  // locate this card's authoring metadata: the heading element holds the
  // title; a following/owning data line carries CH-NN, pill, date, signal.
  const link = heading.querySelector('a') || heading.closest('a');
  const dataSource = heading.nextElementSibling
    && heading.nextElementSibling.tagName === 'P'
    ? heading.nextElementSibling : heading;
  const fields = parts(dataSource.textContent.replace(heading.textContent, ''), '|');

  let chNo = '';
  let pillLabel = '';
  let pillVariant = '';
  let when = '';
  let signal = '';
  fields.forEach((f) => {
    if (/^CH\s*\d/i.test(f)) chNo = f.toUpperCase();
    else if (/^pill:/i.test(f)) {
      const body = f.replace(/^pill:/i, '').trim();
      const m = body.match(/^([mstho])\s+(.*)$/i);
      if (m) {
        [, pillVariant, pillLabel] = m;
        pillVariant = pillVariant.toLowerCase();
      } else {
        pillLabel = body;
      }
    } else if (/\d{4}/.test(f) && !when) when = f;
    else signal = f;
  });

  if (chNo) {
    const n = span('ch-no', chNo);
    a.append(n);
  }

  const label = document.createElement('div');
  label.className = 'label';
  const pill = span(`pill ${pillVariant}`.trim(), pillLabel || 'SIGNAL');
  label.append(pill);
  a.append(label);

  const h3 = document.createElement('h3');
  h3.append(...heading.cloneNode(true).childNodes);
  // strip any nested link wrapper text duplication
  [...h3.querySelectorAll('a')].forEach((el) => el.replaceWith(...el.childNodes));
  a.append(h3);

  a.append(sparkline(pillVariant));

  const whenEl = document.createElement('div');
  whenEl.className = 'when';
  whenEl.append(span('', when || ''));
  const sig = span('signal');
  sig.append(span('led'), document.createTextNode(signal || 'archive'));
  whenEl.append(sig);
  a.append(whenEl);

  if (link) a.href = link.href;
  return a;
}

export default async function decorate(block) {
  // CASCADE node collector (#68): flatten the DA single-cell shape first.
  let nodes = [...block.querySelectorAll(':scope > div > div > *')];
  if (!nodes.length) nodes = [...block.children].filter((n) => n.nodeType === 1);
  if (!nodes.length) return;

  // section title = the authored <h2> (reuse it, server-visible).
  const titleEl = nodes.find((n) => n.tagName === 'H2')
    || nodes.find((n) => /^H[1-6]$/.test(n.tagName));

  // subtitle = the first <p> that appears before the first card heading.
  const headings = nodes.filter((n) => n.tagName === 'H3');
  const firstCardIdx = headings.length ? nodes.indexOf(headings[0]) : nodes.length;
  const subEl = nodes
    .slice(0, firstCardIdx)
    .find((n) => n.tagName === 'P' && n !== titleEl);

  // The featured card owns the FIRST h3 plus its lede + meta line; the
  // remaining h3s each open one grid card (#52 heading-boundary segmentation).
  const featHeading = headings[0];
  const cardHeadings = headings.slice(1);

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  if (titleEl) {
    const h2 = document.createElement('h2');
    h2.append(span('em', '▶'), document.createTextNode(' '));
    // reuse authored heading text (unwrap any nested heading, #55)
    const inner = (titleEl.querySelector('h1,h2,h3,h4,h5,h6') || titleEl).cloneNode(true);
    // strip a leading ▶ the author may already have typed, so the injected
    // marker isn't doubled (▶ ▶ …)
    const firstText = inner.childNodes[0];
    if (firstText && firstText.nodeType === Node.TEXT_NODE) {
      firstText.textContent = firstText.textContent.replace(/^\s*▶\s*/, '');
    }
    h2.append(...inner.childNodes);
    wrap.append(h2);
  }

  if (subEl) {
    const sub = document.createElement('p');
    sub.className = 'sub';
    sub.append(...subEl.cloneNode(true).childNodes);
    wrap.append(sub);
  }

  if (featHeading) {
    // featured lede = first <p> after the featured heading and before card 1
    const featStart = nodes.indexOf(featHeading);
    const featEnd = cardHeadings.length
      ? nodes.indexOf(cardHeadings[0]) : nodes.length;
    const between = nodes.slice(featStart + 1, featEnd)
      .filter((n) => n.tagName === 'P');
    const lede = between[0];
    const metaText = between.find((p) => p.querySelector('a')) || between[1];
    wrap.append(buildFeatured(featHeading, lede, metaText));
  }

  if (cardHeadings.length) {
    const channels = document.createElement('div');
    channels.className = 'channels';
    cardHeadings.forEach((h) => channels.append(buildCard(h)));
    wrap.append(channels);
  }

  block.replaceChildren(wrap);
}
