/**
 * find-strip — full-bleed --red band: section title on the left, a decorative
 * zip-search control on the right.
 *
 * Authored as ONE row / ONE cell holding the title (a heading or plain text).
 * We flatten the cell, classify by content (reuse an authored heading if
 * present), then build a content wrap at --max-content.
 *
 * #20: fragments/forms are inert under CSP, so the search is rendered as a
 * NON-submitting <div> (no <form>) with <button type="button">. It is
 * decorative / non-functional by design.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten: gather all authored elements as flat siblings, classify by content.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // Reuse an authored heading for the title if one exists (server-visible,
  // avoids nesting); otherwise fall back to the first non-empty text node.
  const authoredHeading = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  const titleText = (authoredHeading?.textContent
    || nodes.map((n) => n.textContent).find((t) => t && t.trim())
    || 'Find our beer.').trim();

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  // Section title -> <h2>. Reuse the authored heading element when present.
  let head;
  if (authoredHeading) {
    head = authoredHeading;
    head.classList.add('head');
  } else {
    head = document.createElement('h2');
    head.className = 'head';
    head.textContent = titleText;
  }
  wrap.append(head);

  // Decorative, non-submitting zip control (#20): no <form>, button type=button.
  const zip = document.createElement('div');
  zip.className = 'zip';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Enter your zip';
  input.setAttribute('aria-label', 'Zip code');

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Search';

  zip.append(input, button);
  wrap.append(zip);

  block.replaceChildren(wrap);
}
