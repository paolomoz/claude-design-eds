/*
 * community block — lifted from stardust prototype surly-mode-a-2 (home-proposed.html)
 * Source section: .ds-give + .ds-newsletter (GIVES + NEWSLETTER).
 *
 * Authored shape (one row, one cell, flat siblings):
 *   <p>Surly Gives a Damn</p>          ← eyebrow
 *   <h2>SGAD · Our charitable arm.</h2> ← display lead (red middot)
 *   <p>It's our way of giving back…</p>  ← body
 *   <p><strong><a>Sign up</a></strong></p> ← red pill CTA (auto btn-primary)
 *   <p>Stay close</p>                   ← newsletter label (accent)
 *   <h3>Surly News</h3>                 ← newsletter title (boundary)
 * The email input + Subscribe button are reconstructed here (form is INERT in EDS).
 */

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // 1. Flatten: collect every authored element as a flat list of siblings.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // 2. Classify / segment by content. The newsletter card starts at the
  //    repeating-heading boundary (the h3 title); everything before it is the
  //    "give" (left) column.
  const titleIdx = nodes.findIndex((n) => n.tagName === 'H3');
  const giveNodes = titleIdx === -1 ? nodes : nodes.slice(0, titleIdx);
  const newsNodes = titleIdx === -1 ? [] : nodes.slice(titleIdx);

  // The newsletter label is the last plain paragraph in the give group that
  // immediately precedes the title (accent label "Stay close").
  let labelNode = null;
  if (titleIdx !== -1) {
    for (let i = giveNodes.length - 1; i >= 0; i -= 1) {
      const n = giveNodes[i];
      if (n.tagName === 'P' && !n.querySelector('a')) {
        labelNode = n;
        giveNodes.splice(i, 1);
        break;
      }
    }
  }

  // --- Build the GIVE (left) column ---------------------------------------
  const give = document.createElement('div');
  give.className = 'community-give';

  giveNodes.forEach((node, i) => {
    // First plain paragraph is the eyebrow.
    if (i === 0 && node.tagName === 'P' && !node.querySelector('a')) {
      node.classList.add('community-eyebrow');
    } else if (/^H[1-6]$/.test(node.tagName)) {
      node.classList.add('community-lead');
      // Re-create the red middot styling EDS strips from <span>: any <em>
      // inside the heading becomes the non-italic red separator.
      node.querySelectorAll('em').forEach((em) => em.classList.add('community-dot'));
    } else if (node.tagName === 'P' && node.querySelector('a')) {
      // CTA paragraph — leave the <strong><a> intact so decorateButton()
      // applies .btn.btn-primary at page boot.
      node.classList.add('community-cta');
    } else if (node.tagName === 'P') {
      node.classList.add('community-body');
    }
    give.append(node);
  });

  // --- Build the NEWSLETTER (right) card ----------------------------------
  // Per #20/#623 the form is INERT in EDS: render a NON-submitting <div>
  // wrapper (no <form>) with a type="button" button.
  const card = document.createElement('div');
  card.className = 'community-newsletter';
  card.id = 'newsletter';

  if (labelNode) {
    labelNode.classList.add('community-newsletter-label');
    card.append(labelNode);
  }

  newsNodes.forEach((node) => {
    if (/^H[1-6]$/.test(node.tagName)) {
      node.classList.add('community-newsletter-title');
    }
    card.append(node);
  });

  // Reconstruct the input markup (input + Subscribe button), non-submitting.
  const form = document.createElement('div');
  form.className = 'community-form';

  const label = document.createElement('label');
  label.className = 'sr';
  label.setAttribute('for', 'community-email');
  label.textContent = 'Email';

  const input = document.createElement('input');
  input.id = 'community-email';
  input.name = 'email';
  input.type = 'email';
  input.placeholder = 'your@email.com';
  input.autocomplete = 'email';

  const submit = document.createElement('button');
  submit.type = 'button';
  submit.className = 'community-subscribe';
  submit.textContent = 'Subscribe';

  form.append(label, input, submit);
  card.append(form);

  // --- Assemble -----------------------------------------------------------
  const grid = document.createElement('div');
  grid.className = 'community-grid';
  grid.append(give, card);

  const wrap = document.createElement('div');
  wrap.className = 'community-wrap';
  wrap.append(grid);

  block.textContent = '';
  block.append(wrap);
}
