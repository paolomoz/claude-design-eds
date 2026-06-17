/**
 * canonical-brand block (role: section)
 *
 * Authoring contract (block.children = rows, row.children = cells):
 *   Row 1 — eyebrow:   | 03 · THE AI-FACING BRAND |
 *   Row 2 — head:      | <h2> with <em> sting | lede paragraph |
 *   Row 3..N — stat:   | tag | figure(+unit) | heading | body |
 *
 * Dark "ink" band. Mono eyebrow, display headline + lede, then a 3-col grid
 * of stat cards. Each .figure is split into a static number span + an italic
 * .unit suffix (no count-up JS). EDS strips <span> in cells, so the figure /
 * unit split is re-created here in JS.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // 1. Eyebrow (first row, single cell of plain text)
  const eyebrowCell = rows[0]?.firstElementChild;
  const eyebrow = document.createElement('div');
  eyebrow.className = 'eyebrow';
  if (eyebrowCell) eyebrow.textContent = eyebrowCell.textContent.trim();

  // 2. Head — reuse an authored heading element if present (server-visible,
  //    avoids nesting). DA may author the heading and the lede either as two
  //    cells in one row OR as two consecutive single-cell rows, so classify by
  //    content rather than a fixed cell index: the head holds the heading + the
  //    leading single-cell text row(s); stat cards are the multi-cell rows that
  //    follow (tag | figure | heading | body). This keeps the lede out of the
  //    stat grid (it otherwise renders as a bogus 4th card and breaks the 3-col).
  const head = document.createElement('div');
  head.className = 'head';
  const headRow = rows[1];
  let ledeRowIndex = -1;
  if (headRow) {
    const titleCell = headRow.children[0];
    const heading = titleCell?.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      head.append(heading);
    } else if (titleCell) {
      const h2 = document.createElement('h2');
      h2.innerHTML = titleCell.innerHTML;
      head.append(h2);
    }
    // lede: a second cell in the head row, or the next single-cell text row.
    const inlineLede = headRow.children[1];
    if (inlineLede && inlineLede.textContent.trim()) {
      const lede = document.createElement('p');
      lede.className = 'lede';
      lede.innerHTML = inlineLede.innerHTML;
      head.append(lede);
    } else if (rows[2] && rows[2].children.length === 1 && rows[2].textContent.trim()) {
      const lede = document.createElement('p');
      lede.className = 'lede';
      lede.innerHTML = rows[2].firstElementChild.innerHTML;
      head.append(lede);
      ledeRowIndex = 2;
    }
  }

  // 3. Stat trio — every remaining MULTI-cell row is one stat card (a single-
  //    cell row here is the lede, already consumed above).
  const trio = document.createElement('div');
  trio.className = 'stat-trio';

  const statStart = ledeRowIndex === 2 ? 3 : 2;
  rows.slice(statStart).filter((row) => row.children.length > 1).forEach((row) => {
    const [tagCell, figureCell, headingCell, bodyCell] = row.children;

    const stat = document.createElement('article');
    stat.className = 'stat';

    if (tagCell && tagCell.textContent.trim()) {
      const tag = document.createElement('div');
      tag.className = 'tag';
      tag.textContent = tagCell.textContent.trim();
      stat.append(tag);
    }

    // Figure cell authored as "127 | source-cited" (two cells would be over-
    // structured); instead the figure cell holds the number, and the unit is
    // the next sub-cell. Re-create the .figure > .num + .unit span split here.
    if (figureCell) {
      const figure = document.createElement('div');
      figure.className = 'figure';

      const sub = [...figureCell.children];
      let numText = '';
      let unitText = '';
      if (sub.length >= 2) {
        numText = sub[0].textContent.trim();
        unitText = sub[1].textContent.trim();
      } else {
        // single value: split number from trailing unit words
        const raw = figureCell.textContent.trim();
        const match = raw.match(/^(\S+)\s+([\s\S]+)$/);
        if (match) {
          [, numText, unitText] = match;
        } else {
          numText = raw;
        }
      }

      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = numText;
      figure.append(num);

      if (unitText) {
        const unit = document.createElement('span');
        unit.className = 'unit';
        unit.textContent = unitText;
        figure.append(unit);
      }
      stat.append(figure);
    }

    // Heading — reuse authored heading, else wrap in <h3>.
    if (headingCell) {
      const heading = headingCell.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        stat.append(heading);
      } else if (headingCell.textContent.trim()) {
        const h3 = document.createElement('h3');
        h3.innerHTML = headingCell.innerHTML;
        stat.append(h3);
      }
    }

    if (bodyCell && bodyCell.textContent.trim()) {
      const body = document.createElement('p');
      body.innerHTML = bodyCell.innerHTML;
      stat.append(body);
    }

    trio.append(stat);
  });

  // 4. Wrap content to --maxw (the band background stays full-bleed).
  const wrap = document.createElement('div');
  wrap.className = 'cb-wrap';
  wrap.append(eyebrow, head, trio);

  block.textContent = '';
  block.append(wrap);
}
