/**
 * rewards-banner — full-width rounded "Summit Rewards" promo banner.
 *
 * Lifted from the prototype's rewards section. A rounded `.eb-photo`
 * lifestyle placeholder (height 320) carries a left-aligned white-gradient
 * overlay containing an h2 headline, a paragraph, and a primary button.
 * No real image asset — the `.eb-photo` placeholder renders the gradient
 * + data-label.
 *
 * Authoring rows (one cell each, in order):
 *   <headline>
 *   <paragraph>
 *   <cta>   (a plain <a> — restyled as eb-btn eb-btn-primary)
 */

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const headline = rows[0]?.textContent.trim() || '';
  const body = rows[1]?.textContent.trim() || '';
  const ctaCell = rows[2];
  const ctaLink = ctaCell?.querySelector('a');
  const ctaText = (ctaLink?.textContent || ctaCell?.textContent || '').trim();
  const ctaHref = ctaLink?.getAttribute('href') || '#';

  const frame = document.createElement('div');
  frame.className = 'rewards-banner-frame';

  const photo = document.createElement('div');
  photo.className = 'eb-photo rewards-banner-photo';
  photo.setAttribute('data-label', 'Lifestyle photo');

  const overlay = document.createElement('div');
  overlay.className = 'rewards-banner-overlay';
  overlay.innerHTML = `
    <div class="rewards-banner-content">
      <h2 class="rewards-banner-headline">${headline}</h2>
      <p class="rewards-banner-body">${body}</p>
    </div>`;

  if (ctaText) {
    const cta = document.createElement('a');
    cta.href = ctaHref;
    cta.className = 'eb-btn eb-btn-primary rewards-banner-cta';
    cta.textContent = ctaText;
    overlay.querySelector('.rewards-banner-content').append(cta);
  }

  frame.append(photo, overlay);
  block.replaceChildren(frame);
}
