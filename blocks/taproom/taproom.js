/**
 * taproom — a 1px-bordered tabular taproom card.
 *
 * Authored shape (one block instance per taproom). Rows are queried by their
 * content rather than fixed indices, so the block is robust to how the section
 * was authored:
 *   - tag row:     a single cell whose text starts with a number ("01 — …")
 *   - title:       a cell containing a heading (or promotable to <h2>)
 *   - caption:     a short single-cell line before the image
 *   - image:       a cell containing a <picture>/<img>
 *   - data rows:   two-cell "term | value" rows (Address | …, Hours | …).
 *                  A value whose text starts with a dash becomes a yellow ribbon.
 *   - tap row:     a "On tap …" label cell + a pours cell ("Name | Style // …")
 *   - foot row:    a label cell + a cell containing a link (Directions →)
 *
 * EDS strips <span> from authored cells, so the num chip, ribbon, tap num and
 * tap style spans are all re-created here in JS.
 */

const PLACEHOLDER_RE = /^\s*[—–-]/; // leading dash marks a ribbon/placeholder value
const TAG_RE = /^\s*(\d+)\s*[—–-]?\s*(.*)$/; // "01 — THE ORIGINAL · OPENED 1996"

function text(el) {
  return el ? el.textContent.trim() : '';
}

function cellsOf(row) {
  return [...row.children];
}

function buildTagFromText(raw) {
  const tag = document.createElement('div');
  tag.className = 'taproom-tag';
  const m = raw.match(TAG_RE);
  if (m && m[1]) {
    const [, numText, labelText] = m;
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = numText;
    tag.append(num);
    const label = document.createElement('span');
    label.textContent = labelText.trim();
    tag.append(label);
  } else {
    const label = document.createElement('span');
    label.textContent = raw;
    tag.append(label);
  }
  return tag;
}

function ribbonOrText(dd, value) {
  const link = value.querySelector('a');
  if (link) {
    dd.append(link.cloneNode(true));
  } else if (PLACEHOLDER_RE.test(value.textContent)) {
    const ribbon = document.createElement('span');
    ribbon.className = 'ribbon';
    ribbon.textContent = text(value);
    dd.append(ribbon);
  } else {
    dd.textContent = text(value);
  }
}

function buildTap(labelText, poursCell) {
  const tap = document.createElement('div');
  tap.className = 'taproom-tap';

  if (labelText) {
    const h4 = document.createElement('h4');
    h4.textContent = labelText;
    tap.append(h4);
  }

  const ol = document.createElement('ol');
  ol.className = 'tap-list';

  // Authored as an explicit list, or a single string "Name | Style // Name | Style".
  const authoredList = poursCell.querySelector('ol, ul');
  const items = authoredList
    ? [...authoredList.children].map((li) => text(li))
    : text(poursCell).split('//').map((s) => s.trim()).filter(Boolean);

  items.forEach((item, i) => {
    const parts = item.split('|').map((s) => s.trim());
    let numText;
    let nameText;
    let styleText;
    if (parts.length >= 3) {
      [numText, nameText, styleText] = parts;
    } else {
      numText = String(i + 1).padStart(2, '0');
      [nameText, styleText] = parts.length === 2 ? parts : [parts[0], ''];
    }
    const li = document.createElement('li');
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = numText || String(i + 1).padStart(2, '0');
    const name = document.createElement('span');
    name.textContent = nameText || '';
    const style = document.createElement('span');
    style.className = 'style';
    style.textContent = styleText || '';
    li.append(num, name, style);
    ol.append(li);
  });

  if (ol.children.length) tap.append(ol);
  return tap;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  const head = document.createElement('div');
  head.className = 'taproom-head';
  const thumb = document.createElement('div');
  thumb.className = 'taproom-thumb';
  thumb.setAttribute('role', 'img');
  const dl = document.createElement('dl');
  dl.className = 'taproom-data';
  const foot = document.createElement('div');
  foot.className = 'taproom-foot';

  let tap = null;
  let captionDone = false;

  const lastIndex = rows.length - 1;

  rows.forEach((row, rowIndex) => {
    const cells = cellsOf(row);
    const first = cells[0];
    const second = cells[1];
    const heading = first?.querySelector('h1, h2, h3, h4, h5, h6');
    const picture = first?.querySelector('picture, img');
    const firstText = text(first);

    if (heading) {
      // title — normalise to <h2>
      let h = heading;
      if (h.tagName !== 'H2') {
        const h2 = document.createElement('h2');
        h2.innerHTML = h.innerHTML;
        h = h2;
      }
      head.append(h);
      return;
    }
    if (picture) {
      thumb.append(picture.closest('picture') || picture);
      const img = picture.tagName === 'IMG' ? picture : picture.querySelector('img');
      if (img?.alt) thumb.setAttribute('aria-label', img.alt);
      return;
    }
    if (cells.length >= 2) {
      // two-cell row: data pair, tap row, or foot row
      if (/on tap/i.test(firstText)) {
        tap = buildTap(firstText, second);
        return;
      }
      // The foot is the LAST row (location label + Directions link). A data
      // row may also carry a link (e.g. Email) — keep that in the data grid.
      if (rowIndex === lastIndex && second.querySelector('a')) {
        const label = document.createElement('span');
        label.textContent = firstText;
        foot.append(label);
        foot.append(second.querySelector('a').cloneNode(true));
        return;
      }
      const dt = document.createElement('dt');
      dt.textContent = firstText;
      const dd = document.createElement('dd');
      ribbonOrText(dd, second);
      dl.append(dt, dd);
      return;
    }
    // single-cell row: tag (starts with a number) or caption
    if (TAG_RE.test(firstText) && /^\s*\d/.test(firstText)) {
      head.prepend(buildTagFromText(firstText));
    } else if (firstText && !captionDone) {
      const caption = document.createElement('div');
      caption.className = 'taproom-caption';
      caption.textContent = firstText;
      head.append(caption);
      captionDone = true;
    }
  });

  const card = document.createElement('article');
  card.className = 'taproom-card';
  card.append(head, thumb, dl);
  if (tap) card.append(tap);
  card.append(foot);

  block.textContent = '';
  block.append(card);
}
