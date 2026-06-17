/*
 * Featured block — "Our beers" card strip.
 * Lifted from the surly home prototype `.featured` section.
 *
 * Authoring shape (DA flattens the section into ONE row / ONE cell holding
 * all elements as flat siblings):
 *   <h2>Our beers</h2>
 *   <p><a href="/beer">View all beers</a></p>           ← the "view all" link
 *   <picture>…</picture>  <h3>Outlook Good</h3>  <p>Hoppy Pale · 5.4% ABV</p>
 *   <picture>…</picture>  <h3>Grapefruit Supreme</h3> <p>Citrus IPA · 6.5% ABV</p>
 *   … (N cards, each opened by an <h3>)
 *
 * We DEFAULT to flattening + segmenting by content, NOT by row/cell index:
 *   - first <h2>  → section title (.head h2)
 *   - first link before any <h3> → the "view all" link (.head a)
 *   - every <h3> opens a new card; the card owns the nearest preceding
 *     <picture>/<img> plus the following style line(s).
 */

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten: collect every leaf element authored in the block as flat siblings.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // --- Head: title + "view all" link ---------------------------------------
  const head = document.createElement('div');
  head.className = 'head';

  // Reuse an authored heading if present (server-visible), else synthesise.
  const titleEl = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  if (titleEl) {
    const h2 = document.createElement('h2');
    h2.textContent = titleEl.textContent.trim();
    head.append(h2);
  }

  // The "view all" link is the first anchor that appears before any <h3>.
  const firstH3Index = nodes.findIndex((n) => n.tagName === 'H3');
  const linkOwner = nodes.find((n, i) => {
    if (firstH3Index !== -1 && i >= firstH3Index) return false;
    return n.querySelector && n.querySelector('a');
  });
  const sourceLink = linkOwner && linkOwner.querySelector('a');
  if (sourceLink) {
    const link = document.createElement('a');
    link.href = sourceLink.getAttribute('href') || '#';
    link.textContent = sourceLink.textContent.trim();
    head.append(link);
  }

  // --- Card grid: segment by per-card <h3> boundary ------------------------
  const grid = document.createElement('div');
  grid.className = 'grid';

  let current = null;
  let pendingImage = null;

  nodes.forEach((node) => {
    if (node === titleEl || node === linkOwner) return;

    const pic = node.tagName === 'PICTURE' || node.tagName === 'IMG'
      ? node
      : node.querySelector && node.querySelector('picture, img');

    if (node.tagName === 'H3') {
      // New card starts here.
      current = document.createElement('a');
      current.className = 'card';

      if (pendingImage) {
        current.append(pendingImage);
        pendingImage = null;
      }

      const h3 = document.createElement('h3');
      h3.textContent = node.textContent.trim();
      current.append(h3);

      // Whole-card anchor stays a plain <a> (never a button). If the authored
      // heading wrapped a link, carry its href onto the card; otherwise the
      // card renders without an href (still a valid <a>).
      const cardLink = node.querySelector && node.querySelector('a');
      if (cardLink && cardLink.getAttribute('href')) {
        current.href = cardLink.getAttribute('href');
      }

      grid.append(current);
      return;
    }

    if (pic) {
      // In this layout each card's image PRECEDES its <h3>, so an image always
      // belongs to the card the next <h3> will open. Stash it; the <h3> handler
      // prepends it. (Edge case: an image authored AFTER an <h3> with no image
      // yet — and no pending image queued — is attached to the current card so
      // an image-after-heading variant still renders.)
      if (current && !current.querySelector('img') && !pendingImage) {
        current.insertBefore(pic, current.firstChild);
      } else {
        pendingImage = pic;
      }
      return;
    }

    // Any remaining text is the style line for the current card.
    if (current && node.textContent.trim()) {
      const style = document.createElement('div');
      style.className = 'style';
      style.textContent = node.textContent.trim();
      current.append(style);
    }
  });

  block.textContent = '';
  if (head.childNodes.length) block.append(head);
  block.append(grid);
}
