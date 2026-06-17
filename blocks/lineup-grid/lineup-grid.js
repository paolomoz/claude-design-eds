/**
 * LINEUP GRID — five-across can-tile grid.
 *
 * Authoring contract (#62): the content page authors this block as ONE row with
 * ONE cell holding every element as a flat sibling list:
 *
 *   <p>(red eyebrow)</p>
 *   <h2>(section title)</h2>
 *   <p><a>(see-all text link — the head CTA)</a></p>
 *   <p><picture/img></p> <p>Tile name</p>      ×10   (alternating picture / name)
 *   <p><em><a>(trailing ghost CTA)</a></p>
 *
 * So we DEFAULT to flattening the cell and segment by content (heading / picture /
 * link / name text), never by row or cell index. The rendered tile count MUST
 * equal the authored count (one tile per picture).
 *
 * @param {Element} block
 */
export default async function decorate(block) {
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // Classify the flat siblings.
  const heading = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  const eyebrow = nodes.find((n) => n !== heading
    && !n.querySelector('a, picture, img')
    && n.textContent.trim()
    && !/^H[1-6]$/.test(n.tagName)
    // eyebrow is the first plain text node before the heading
    && (!heading || nodes.indexOf(n) < nodes.indexOf(heading)));

  // Head / trailing CTAs are text links — exclude any link that wraps a tile image.
  const textLinks = nodes.filter((n) => n.querySelector('a') && !n.querySelector('picture, img'));
  const headLink = textLinks[0];
  const trailingLink = textLinks.length > 1 ? textLinks[textLinks.length - 1] : undefined;

  // Tiles: pictures, each paired with the name text that follows it.
  const pictureNodes = nodes.filter((n) => n.querySelector('picture, img'));

  // ---- Build section head -------------------------------------------------
  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const head = document.createElement('header');
  head.className = 'lineup-head';

  const lhs = document.createElement('div');
  lhs.className = 'lhs';

  if (eyebrow) {
    const eb = document.createElement('span');
    eb.className = 'lineup-eyebrow';
    eb.textContent = eyebrow.textContent.trim();
    lhs.append(eb);
  }

  if (heading) {
    // Reuse the authored heading element (server-visible) — re-class, don't nest.
    heading.classList.add('lineup-title');
    lhs.append(heading);
  }
  head.append(lhs);

  if (headLink) {
    const a = headLink.querySelector('a');
    a.className = 'lineup-headlink';
    head.append(a);
  }
  wrap.append(head);

  // ---- Build the grid -----------------------------------------------------
  const grid = document.createElement('div');
  grid.className = 'lineup';

  // Accent pattern reconstructed positionally (the prototype's accent markers do
  // not survive DA). Pattern from the prototype, by index:
  //   0 red · 2 yellow · 4 red · 6 yellow · 8 light · 9 red.
  const accentByIndex = {
    0: 'lineup-tile-accent-red',
    2: 'lineup-tile-accent-yellow',
    4: 'lineup-tile-accent-red',
    6: 'lineup-tile-accent-yellow',
    8: 'lineup-tile-accent-light',
    9: 'lineup-tile-accent-red',
  };

  pictureNodes.forEach((picNode, i) => {
    const tile = document.createElement('a');
    tile.className = 'lineup-tile';
    const accent = accentByIndex[i];
    if (accent) tile.classList.add(accent);

    // Carry the link href if the picture was authored inside/as a link.
    const tileAnchor = picNode.matches('a') ? picNode : picNode.querySelector('a');
    if (tileAnchor && tileAnchor.getAttribute('href')) tile.href = tileAnchor.getAttribute('href');

    const media = document.createElement('div');
    media.className = 'lineup-media';
    const pic = picNode.querySelector('picture') || picNode.querySelector('img');
    if (pic) {
      const img = pic.querySelector('img') || pic;
      img.classList.add('lineup-can');
      media.append(pic);
    }
    tile.append(media);

    // The name is the next non-picture, non-link text node after this picture.
    const start = nodes.indexOf(picNode);
    let nameText = '';
    for (let j = start + 1; j < nodes.length; j += 1) {
      const n = nodes[j];
      if (n.querySelector('picture, img')) break;
      if (n.querySelector('a')) break;
      if (n.textContent.trim()) { nameText = n.textContent.trim(); break; }
    }

    const name = document.createElement('div');
    name.className = 'lineup-name';
    name.textContent = nameText;
    tile.append(name);

    grid.append(tile);
  });

  wrap.append(grid);

  // ---- Trailing centered ghost CTA ---------------------------------------
  if (trailingLink && trailingLink !== headLink) {
    const more = document.createElement('div');
    more.className = 'lineup-more';
    // Clone the authored CTA cell so the button decorator (em/strong → btn) runs.
    [...trailingLink.childNodes].forEach((n) => more.append(n.cloneNode(true)));
    wrap.append(more);
  }

  block.textContent = '';
  block.append(wrap);

  // Mark the section dark so the global ghost (secondary) button renders light.
  const section = block.closest('.section');
  if (section) section.classList.add('dark');
}
