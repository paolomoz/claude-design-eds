/**
 * Newsletter band — full-bleed red sign-up CTA.
 *
 * Authored as ONE row with ONE cell holding all elements as flat siblings
 * (eyebrow text, an <h2>, a lede paragraph). We flatten and classify by
 * content rather than by row/cell index.
 *
 * CSP in EDS blocks inline on* handlers and <form> submission, so we render a
 * non-submitting control: a <div> wrapper holding an <input type="email"> and a
 * <button type="button"> — never a <form onsubmit>.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten: grab every element authored inside the single cell as flat siblings.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  const frag = document.createElement('div');
  frag.className = 'newsletter-content';

  let heading;
  const paras = [];

  // Classify by content: reuse the authored <h2> if present (server-visible,
  // avoid nesting); everything else is a paragraph of copy.
  nodes.forEach((node) => {
    if (/^h[1-6]$/i.test(node.tagName)) {
      if (!heading) heading = node;
      return;
    }
    paras.push(node);
  });

  // Eyebrow = first paragraph; lede = remaining paragraphs.
  const [eyebrowEl, ...ledeEls] = paras;

  if (eyebrowEl) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'newsletter-eyebrow';
    eyebrow.textContent = eyebrowEl.textContent.trim();
    frag.append(eyebrow);
  }

  if (heading) {
    heading.classList.add('newsletter-heading');
    frag.append(heading);
  }

  ledeEls.forEach((p) => {
    p.classList.add('newsletter-lede');
    frag.append(p);
  });

  // Non-submitting sign-up control (NO <form>, NO inline on* — CSP-safe).
  const control = document.createElement('div');
  control.className = 'newsletter-form';

  const inputId = 'newsletter-email';

  const label = document.createElement('label');
  label.className = 'newsletter-label';
  label.setAttribute('for', inputId);
  label.textContent = 'Email';

  const input = document.createElement('input');
  input.type = 'email';
  input.id = inputId;
  input.name = 'email';
  input.placeholder = 'email@example.com';
  input.autocomplete = 'email';
  input.setAttribute('aria-label', 'Email');

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'newsletter-submit';
  button.textContent = 'Sign Me Up';

  control.append(label, input, button);
  frag.append(control);

  block.replaceChildren(frag);
}
