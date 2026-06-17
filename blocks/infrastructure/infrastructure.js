/**
 * infrastructure — dark "developer credibility" band.
 *
 * Authoring shape (block.children = rows, row.children = cells). Rows are
 * classified by their semantic content, not by position, so authors can
 * add/remove cols and path cards freely:
 *
 *   title row   | <h2 title>          | <intro paragraph>
 *   links row   | <arrow anchors>                              (anchors, no heading)
 *   col rows     | <h3 col title>      | <col body>            (one per infra-col)
 *   stats row   | STATS               | <stat cell> | <stat cell> | …
 *                 each stat cell: a big value line + a <p> label
 *   sub row     | <h3 sub-heading>    | <sub paragraph>
 *   path rows   | <h4 path title>     | <path body> | <path link a>
 *
 * Classification:
 *   - a row whose first cell text is "STATS" → the stats row
 *   - the FIRST h2-bearing row → title; the FIRST anchors-only row → links
 *   - h3 rows BEFORE the stats row → infra-cols
 *   - the FIRST h3 row AFTER the stats row → sub-heading (+ its paragraph)
 *   - h4 rows AFTER the stats row → infra-path cards
 *
 * EDS strips <span> in cells, so the stat-display spans and fill-meters are
 * re-created here.
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];

  const headingIn = (cell, ...tags) => {
    if (!cell) return null;
    return tags.reduce((found, t) => found || cell.querySelector(t), null);
  };
  const firstP = (cell) => cell && cell.querySelector('p');
  const anchorsIn = (el) => (el ? [...el.querySelectorAll('a')] : []);
  const cellText = (cell) => (cell?.textContent || '').trim();
  const markArrow = (a) => { a.classList.add('arrow-link'); return a; };

  // index of the STATS marker row (-1 if absent) splits "before" / "after"
  const statsIndex = rows.findIndex(
    (r) => cellText(r.children[0]).toUpperCase() === 'STATS',
  );
  const before = statsIndex === -1 ? rows : rows.slice(0, statsIndex);
  const after = statsIndex === -1 ? [] : rows.slice(statsIndex + 1);

  const frag = document.createDocumentFragment();

  // ── title + intro (first h2/h3 row before stats) ────────────────────
  const titleRow = before.find((r) => headingIn(r.children[0], 'h2', 'h3', 'h4'));
  if (titleRow) {
    const cells = [...titleRow.children];
    const h2 = headingIn(cells[0], 'h2', 'h3', 'h4');
    h2.classList.add('infra-title');
    frag.append(h2);
    const p = firstP(cells[1]) || firstP(cells[0]);
    if (p) { p.classList.add('infra-intro'); frag.append(p); }
  }

  // ── developer links (anchors-only row before stats) ─────────────────
  const linksRow = before.find(
    (r) => anchorsIn(r).length && !headingIn(r.children[0], 'h2', 'h3', 'h4'),
  );
  if (linksRow) {
    const links = document.createElement('div');
    links.className = 'infra-links';
    anchorsIn(linksRow).forEach((a) => links.append(markArrow(a)));
    frag.append(links);
  }

  // ── infra-cols (h3 rows before stats, excluding the title row) ──────
  const cols = document.createElement('div');
  cols.className = 'infra-cols';
  before
    .filter((r) => r !== titleRow && headingIn(r.children[0], 'h3', 'h4'))
    .forEach((r) => {
      const cells = [...r.children];
      const item = document.createElement('div');
      item.append(headingIn(cells[0], 'h3', 'h4'));
      const p = firstP(cells[1]) || firstP(cells[0]);
      if (p) item.append(p);
      cols.append(item);
    });
  if (cols.children.length) frag.append(cols);

  // ── infra-stats (cells of the STATS row, skipping the marker cell) ──
  if (statsIndex !== -1) {
    const stats = document.createElement('div');
    stats.className = 'infra-stats';
    [...rows[statsIndex].children].slice(1).forEach((cell) => {
      const item = document.createElement('div');
      const ps = [...cell.querySelectorAll('p')];
      const labelP = ps[ps.length - 1] || null;
      // value = first non-empty text node/element that isn't the label
      const valueNode = [...cell.childNodes].find(
        (n) => n !== labelP && (n.textContent || '').trim(),
      );
      let valueText = valueNode ? valueNode.textContent.trim() : '';
      if (!valueText && ps[0]) valueText = ps[0].textContent.trim();

      const stat = document.createElement('span');
      stat.className = 'stat-display';
      stat.textContent = valueText;
      item.append(stat);

      if (labelP && labelP.textContent.trim() !== valueText) {
        item.append(labelP);
      } else if (ps[0] && ps[0].textContent.trim() !== valueText) {
        const label = document.createElement('p');
        label.textContent = ps[0].textContent.trim();
        item.append(label);
      }

      const meter = document.createElement('span');
      meter.className = 'fill-meter';
      const fill = document.createElement('span');
      fill.className = 'fill';
      fill.dataset.fill = '100';
      fill.style.width = '0';
      meter.append(fill);
      item.append(meter);

      stats.append(item);
    });
    if (stats.children.length) frag.append(stats);
  }

  // ── sub-heading + paragraph (first h3 row after stats) ──────────────
  const subRow = after.find((r) => headingIn(r.children[0], 'h3', 'h4'));
  if (subRow) {
    const cells = [...subRow.children];
    const subH = headingIn(cells[0], 'h3', 'h4');
    subH.classList.add('infra-sub-heading');
    frag.append(subH);
    const subP = firstP(cells[1]) || firstP(cells[0]);
    if (subP) { subP.classList.add('infra-sub-intro'); frag.append(subP); }
  }

  // ── infra-paths (h4 rows after stats, excluding the sub-heading row) ─
  const paths = document.createElement('div');
  paths.className = 'infra-paths';
  after
    .filter((r) => r !== subRow && headingIn(r.children[0], 'h4', 'h3'))
    .forEach((r) => {
      const cells = [...r.children];
      const card = document.createElement('div');
      card.className = 'infra-path';
      card.append(headingIn(cells[0], 'h4', 'h3'));
      const p = firstP(cells[1]) || firstP(cells[0]);
      if (p) card.append(p);
      const a = anchorsIn(r)[0];
      if (a) card.append(markArrow(a));
      paths.append(card);
    });
  if (paths.children.length) frag.append(paths);

  // ── wrap content in the prototype's max-width container ─────────────
  const wrap = document.createElement('div');
  wrap.className = 'infra-wrap';
  wrap.append(frag);
  block.textContent = '';
  block.append(wrap);

  // ── animate fill-meters 0 → 100% (honours prefers-reduced-motion) ───
  const fills = [...block.querySelectorAll('.fill-meter .fill')];
  if (!fills.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    fills.forEach((f) => { f.style.width = '100%'; });
    return;
  }
  const run = () => fills.forEach((f) => { f.style.width = '100%'; });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { run(); obs.disconnect(); }
      });
    }, { threshold: 0.25 });
    io.observe(block);
  } else {
    run();
  }
}
