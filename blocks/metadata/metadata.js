/*
 * Metadata Block (role: band) — MANDATORY per-page metadata (#34).
 *
 * Carries Title (from the page's real <h1>) + Description, plus optional
 * header/footer/Robots rows. This is NOT a visual block: the delivery pipeline
 * extracts it to <head> and mirrors Title/Description into og:/twitter:.
 *
 * In the pipeline, the server consumes the block before any JS runs, so this
 * decorate() only fires OFF-pipeline (e.g. the local QA harness). There it acts
 * as a safety net — it reads the rows, applies them to document.title / <meta>
 * (including og:/twitter: so share cards match), then removes the block so the
 * raw key/value rows never paint as stray content.
 */

/**
 * Sets (or creates) a <meta> tag in the document head.
 * @param {string} attr The identifying attribute — 'name' or 'property'
 * @param {string} key The attribute value (e.g. 'description', 'og:title')
 * @param {string} value The meta content
 */
function setMeta(attr, key, value) {
  if (!value) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.append(el);
  }
  el.setAttribute('content', value);
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // block.children = rows; row.children = [keyCell, valueCell]
  const rows = [...block.children];
  const meta = {};

  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const key = cells[0].textContent.trim().toLowerCase();
    const valueCell = cells[1];

    // Reuse an authored heading element if the value cell contains one
    // (server-visible) — read its text, never nest or re-emit it.
    const heading = valueCell.querySelector('h1, h2, h3, h4, h5, h6');
    const value = (heading ? heading.textContent : valueCell.textContent).trim();
    if (key && value) meta[key] = value;
  });

  // Safety net: apply title/description to the live document if the pipeline
  // did not already (the OFF-pipeline / local-harness case). Mirror into
  // og:/twitter: so social + AI share cards match.
  if (meta.title) {
    if (!document.title || document.title === document.body.dataset.title) {
      document.title = meta.title;
    }
    setMeta('property', 'og:title', meta.title);
    setMeta('name', 'twitter:title', meta.title);
  }
  if (meta.description) {
    setMeta('name', 'description', meta.description);
    setMeta('property', 'og:description', meta.description);
    setMeta('name', 'twitter:description', meta.description);
  }

  // Not a visual block — remove it so the key/value rows never paint.
  block.closest('.section')?.remove();
  block.remove();
}
