/*
 * Used block
 * Authoring shape:
 *   Row 1 (section head): [ eyebrow ] [ h2 heading ] [ description ] [ "view all" text link ]
 *   Row 2 (footer CTA):   [ <em><strong><a> Browse Full Inventory </a></strong></em> ]
 *   Card rows: image(optional) | badge | title | hours | location | price | finance-note
 *     - Every row after the head/footer is a card. The leading image cell is OPTIONAL.
 */

const ICONS = {
  arrow: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.6-9.2-9A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 9.2 5C19 15.4 12 20 12 20z"/></svg>',
  detail: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};

const CHIPS = ['All', 'Excavators', 'Dozers', 'Wheel Loaders', 'Compact', 'Motor Graders', 'Certified Used'];

function buildCard(cells) {
  // image is optional leading cell holding a <picture>/<img>
  const firstPicture = cells[0].querySelector('picture, img');
  let idx = 0;
  let picture = null;
  if (firstPicture) {
    picture = cells[0].querySelector('picture') || firstPicture;
    idx = 1;
  }
  const text = (n) => (cells[idx + n] ? cells[idx + n].textContent.trim() : '');
  const badge = text(0);
  const title = text(1);
  const hours = text(2);
  const location = text(3);
  const price = text(4);
  const finance = text(5);

  const card = document.createElement('a');
  card.className = 'card';
  card.href = '#';

  const ph = document.createElement('div');
  ph.className = 'ph';
  if (badge) {
    const b = document.createElement('span');
    b.className = 'badge';
    b.textContent = badge;
    ph.append(b);
  }
  const fav = document.createElement('span');
  fav.className = 'fav';
  fav.setAttribute('role', 'button');
  fav.setAttribute('aria-label', 'Save');
  fav.innerHTML = ICONS.heart;
  ph.append(fav);
  if (picture) ph.append(picture);

  const body = document.createElement('div');
  body.className = 'body';

  const h3 = document.createElement('h3');
  h3.textContent = title;

  const specs = document.createElement('div');
  specs.className = 'specs';
  if (hours) {
    const s = document.createElement('span');
    s.innerHTML = `${ICONS.clock} ${hours}`;
    specs.append(s);
  }
  if (location) {
    const s = document.createElement('span');
    s.innerHTML = `${ICONS.pin} ${location}`;
    specs.append(s);
  }

  const foot = document.createElement('div');
  foot.className = 'foot';
  const priceEl = document.createElement('div');
  priceEl.className = 'price';
  priceEl.textContent = price;
  if (finance) {
    const small = document.createElement('small');
    small.textContent = finance;
    priceEl.append(small);
  }
  const view = document.createElement('span');
  view.className = 'view';
  view.innerHTML = `Details ${ICONS.detail}`;
  foot.append(priceEl, view);

  body.append(h3, specs, foot);
  card.append(ph, body);
  return card;
}

export default function decorate(block) {
  const rows = [...block.children];
  const headRow = rows.shift();
  const footRow = rows.pop();

  // --- Section head ---
  const headCells = [...headRow.children];
  const head = document.createElement('div');
  head.className = 'sec-head';

  const headText = document.createElement('div');
  const eyebrow = document.createElement('span');
  eyebrow.className = 'kicker eyebrow';
  eyebrow.textContent = headCells[0] ? headCells[0].textContent.trim() : '';
  const h2 = document.createElement('h2');
  h2.className = 'cond';
  h2.textContent = headCells[1] ? headCells[1].textContent.trim() : '';
  const desc = document.createElement('p');
  desc.textContent = headCells[2] ? headCells[2].textContent.trim() : '';
  headText.append(eyebrow, h2, desc);

  const headLinkCell = headCells[3];
  const headLink = headLinkCell ? headLinkCell.querySelector('a') : null;
  head.append(headText);
  if (headLink) {
    const link = document.createElement('a');
    link.className = 'link';
    link.href = headLink.href;
    link.innerHTML = `${headLink.textContent.trim()} ${ICONS.arrow}`;
    head.append(link);
  }

  // --- Filter chips (static, visual only) ---
  const filters = document.createElement('div');
  filters.className = 'filters';
  CHIPS.forEach((label, i) => {
    const chip = document.createElement('span');
    chip.className = i === 0 ? 'chip active' : 'chip';
    chip.textContent = label;
    filters.append(chip);
  });

  // --- Cards ---
  const cards = document.createElement('div');
  cards.className = 'cards';
  rows.forEach((row) => cards.append(buildCard([...row.children])));

  // --- Footer button: clone authored CTA nodes so decorateButton applies classes ---
  const foot = document.createElement('div');
  foot.className = 'used-foot';
  if (footRow) {
    const ctaCell = footRow.children[0];
    if (ctaCell) {
      [...ctaCell.childNodes].forEach((n) => foot.append(n.cloneNode(true)));
    }
  }

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  wrap.append(head, filters, cards, foot);

  block.replaceChildren(wrap);
}
