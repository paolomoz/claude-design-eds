/**
 * beer-rail — horizontal scroll-snap rail of beer cans on a loud (#050505) ground.
 *
 * Authored shape (DA flattens everything into ONE row / ONE cell as flat siblings):
 *   section-title heading | eyebrow text | "more" link  (the head, in any order),
 * then ONE delimited <p> line PER beer (#50 — delimiters carry structure):
 *   "Furious · IPA · 6.7% · Year-round"
 *   "Niiice Lime · Light lager · Seasonal · New"   (trailing New|Limited = badge)
 *
 * We classify each node by content: the lone section <h2> + the link + the
 * non-delimited eyebrow <p> form the head; every <p> that carries the "·"
 * delimiter is a beer. Each beer line is split on "·" — first segment = name,
 * a trailing New|Limited segment = badge, the middle = meta. The can image is
 * image-less authored content (#2) → CSS fallback placeholder.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  const isHeading = (el) => /^H[1-6]$/.test(el.tagName);
  const isLink = (el) => el.tagName === 'A'
    || (!!el.querySelector?.('a') && !el.textContent.replace(el.querySelector('a').textContent, '').trim());
  const isBeerLine = (el) => !isHeading(el) && !isLink(el) && el.textContent.includes('·');
  const badgeKind = (text) => {
    const t = text.trim().toLowerCase();
    if (t === 'new') return 'new';
    if (t === 'limited') return 'limited';
    return null;
  };

  const headingEl = nodes.find(isHeading);
  const moreLink = nodes.find(isLink)?.querySelector?.('a') || nodes.find((n) => n.tagName === 'A');
  const isEyebrow = (n) => !isHeading(n) && !isLink(n) && !isBeerLine(n) && n.textContent.trim();
  const eyebrowEl = nodes.find(isEyebrow);
  const beerLines = nodes.filter(isBeerLine);

  // ---- Head row -------------------------------------------------------------
  const head = document.createElement('div');
  head.className = 'beer-rail-head';
  const headText = document.createElement('div');

  if (eyebrowEl) {
    const eyebrow = document.createElement('div');
    eyebrow.className = 'beer-rail-eyebrow';
    eyebrow.textContent = eyebrowEl.textContent.trim();
    headText.append(eyebrow);
  }
  if (headingEl) {
    headingEl.classList.add('beer-rail-title');
    headText.append(headingEl);
  }
  head.append(headText);
  if (moreLink) {
    moreLink.classList.add('beer-rail-more');
    head.append(moreLink);
  }

  // ---- Cans: one delimited line per beer ------------------------------------
  const cans = document.createElement('div');
  cans.className = 'beer-rail-cans';
  cans.setAttribute('role', 'region');
  cans.setAttribute('aria-label', 'Beers currently in rotation');
  cans.setAttribute('tabindex', '0');

  beerLines.forEach((line) => {
    const segments = line.textContent.split('·').map((s) => s.trim()).filter(Boolean);
    if (!segments.length) return;

    const can = document.createElement('article');
    can.className = 'beer-rail-can';

    // image fallback (image-less authored content, #2)
    const ph = document.createElement('div');
    ph.className = 'beer-rail-can-img-empty';
    ph.setAttribute('aria-hidden', 'true');
    can.append(ph);

    // name = first segment
    const [nameText, ...rest] = segments;
    const name = document.createElement('div');
    name.className = 'beer-rail-name';
    name.textContent = nameText;
    can.append(name);

    // trailing New|Limited segment = badge; remainder = meta
    let badge = null;
    if (rest.length) {
      const kind = badgeKind(rest[rest.length - 1]);
      if (kind) badge = { kind, text: rest.pop() };
    }
    if (rest.length) {
      const meta = document.createElement('div');
      meta.className = 'beer-rail-meta';
      meta.textContent = rest.join(' · ');
      can.append(meta);
    }
    if (badge) {
      const el = document.createElement('span');
      el.className = `beer-rail-badge beer-rail-badge-${badge.kind}`;
      el.textContent = badge.text;
      can.append(el);
    }

    cans.append(can);
  });

  block.textContent = '';
  block.append(head, cans);
}
