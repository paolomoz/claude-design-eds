/*
 * Hero block — full-bleed cinematic hero.
 *
 * Authored content (rows -> cells) is queried, not positionally assumed:
 *   - a <picture> (or <img>)            -> background photo
 *   - the heading (<h1>..<h6>)          -> hero title (reuse the authored element)
 *   - the first link-free <p>           -> deck
 *   - the link-bearing cell/<p>         -> CTAs (cloned as-is; ak.js decorateButton
 *                                          turns <strong>/<em>-wrapped links into buttons)
 *
 * The block keeps its own .hero class so the global on-dark a.btn-secondary rule
 * (light outline) applies. Parallax / scrim-deepen motion from the prototype is
 * dropped; a single static scrim remains.
 */

export default async function decorate(block) {
  const rows = [...block.children];
  const cells = rows.flatMap((row) => [...row.children]);

  // Background photo: reuse an authored <picture>/<img> if present.
  const photo = document.createElement('div');
  photo.className = 'hero-photo';
  photo.setAttribute('aria-hidden', 'true');
  const picture = block.querySelector('picture, img');
  if (picture) {
    const node = picture.closest('picture') || picture;
    photo.append(node);
  }

  // Static scrim.
  const scrim = document.createElement('div');
  scrim.className = 'hero-scrim';
  scrim.setAttribute('aria-hidden', 'true');

  // Content wrapper (recreates the prototype .container + .hero-content).
  const content = document.createElement('div');
  content.className = 'hero-content';
  const text = document.createElement('div');
  text.className = 'hero-text';
  content.append(text);

  // Heading: reuse the authored heading element (server-visible, avoid nesting).
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    text.append(heading);
  }

  // Deck: first <p> with no link.
  const paragraphs = [...block.querySelectorAll('p')];
  const deck = paragraphs.find((p) => !p.querySelector('a'));
  if (deck) {
    deck.classList.add('hero-deck');
    text.append(deck);
  }

  // CTAs: the cell that bears links. Clone its children so ak.js can decorate
  // the anchors into buttons (don't manufacture button anchors here).
  const ctaCell = cells.find((cell) => cell.querySelector('a'));
  if (ctaCell) {
    const ctas = document.createElement('div');
    ctas.className = 'hero-ctas';
    const linkParent = ctaCell.querySelector('p:has(a)') || ctaCell;
    [...linkParent.childNodes].forEach((n) => ctas.append(n.cloneNode(true)));
    text.append(ctas);
  }

  block.replaceChildren(photo, scrim, content);
}
