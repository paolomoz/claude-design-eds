/**
 * newsletter block — email-capture form on a mist band.
 *
 * Authored content (one cell per row):
 *   row 1: title          (reuse the authored heading element if present)
 *   row 2: deck           (subhead copy)
 *   row 3: consent label  (SMS opt-in text)
 *   row 4: button label   (Subscribe CTA text)
 *   row 5: legal          (consent / message-rate disclosure)
 *
 * The four form fields (First Name, Last Name, Email, Mobile Phone) are fixed
 * and built here in JS. There is intentionally NO <form>: under EDS's delivered
 * CSP (strict-dynamic) inline handlers are inert and a real form would submit
 * and reload the page (#20), so the control is a non-submitting
 * <button type="button"> inside a plain <div> wrapper.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cellText = (row) => (row ? row.firstElementChild?.textContent.trim() : '');

  // Fixed form fields built from prototype copy: [id, type, label, autocomplete].
  const fields = [
    ['nl-first', 'text', 'First Name', 'given-name'],
    ['nl-last', 'text', 'Last Name', 'family-name'],
    ['nl-email', 'email', 'Email', 'email'],
    ['nl-phone', 'tel', 'Mobile Phone (Optional)', 'tel'],
  ];

  const wrap = document.createElement('div');

  // --- Title: reuse the authored heading element if the cell holds one. ---
  const titleCell = rows[0]?.firstElementChild;
  const authoredHeading = titleCell?.querySelector('h1, h2, h3, h4, h5, h6');
  if (authoredHeading) {
    wrap.append(authoredHeading);
  } else if (titleCell?.textContent.trim()) {
    const h2 = document.createElement('h2');
    h2.textContent = titleCell.textContent.trim();
    wrap.append(h2);
  }

  // --- Deck ---
  const deckText = cellText(rows[1]);
  if (deckText) {
    const deck = document.createElement('p');
    deck.className = 'newsletter-deck';
    deck.textContent = deckText;
    wrap.append(deck);
  }

  // --- Non-submitting form wrapper (a <div>, never a <form>). ---
  const form = document.createElement('div');
  form.className = 'newsletter-form';

  fields.forEach(([id, type, label, autocomplete]) => {
    const field = document.createElement('div');
    field.className = 'field';

    const lbl = document.createElement('label');
    lbl.setAttribute('for', id);
    lbl.textContent = label;

    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.name = id;
    input.autocomplete = autocomplete;

    field.append(lbl, input);
    form.append(field);
  });

  // --- SMS consent (full-width row). ---
  const consentText = cellText(rows[2]) || 'Sign me up for SMS messages.';
  const consent = document.createElement('div');
  consent.className = 'sms-consent';
  const consentInput = document.createElement('input');
  consentInput.type = 'checkbox';
  consentInput.id = 'nl-sms';
  consentInput.name = 'nl-sms';
  const consentLabel = document.createElement('label');
  consentLabel.setAttribute('for', 'nl-sms');
  consentLabel.textContent = consentText;
  consent.append(consentInput, consentLabel);
  form.append(consent);

  // --- Subscribe: non-submitting button (type="button"). ---
  const actions = document.createElement('div');
  actions.className = 'form-actions';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn-primary';
  button.textContent = cellText(rows[3]) || 'SUBSCRIBE';
  actions.append(button);
  form.append(actions);

  wrap.append(form);

  // --- Legal copy ---
  const legalText = cellText(rows[4]);
  if (legalText) {
    const legal = document.createElement('p');
    legal.className = 'legal';
    legal.textContent = legalText;
    wrap.append(legal);
  }

  block.replaceChildren(wrap);
}
