/**
 * Newsletter block — full-bleed photo band with email capture (proto .nl section).
 *
 * Authored as ONE row with ONE cell holding all elements as flat siblings
 * (picture, eyebrow text, heading, body text). A cell-level cascade collector
 * gathers every element across all cells — and for any cell that carries only
 * bare text (eyebrow / body copy with no wrapping element), it synthesises a
 * <p> from the cell's own text so nothing is silently dropped. Collected nodes
 * are then classified by CONTENT, not by row/cell index:
 *   - picture/img      -> band background (full-bleed)
 *   - heading (h1..h6) -> section title (reused as <h2>)
 *   - first text/p     -> eyebrow
 *   - remaining text/p -> body copy
 *
 * The email form is NON-submitting: rendered as a <div> wrapper (no <form>,
 * which would reload) with <input type="email"> + <button type="button">.
 *
 * @param {Element} block
 */
export default async function decorate(block) {
  // --- Cell-level cascade collector ---------------------------------------
  // For each cell: push its child ELEMENTS if any, ELSE synthesise a <p> from
  // the cell's own bare text (one-element-per-row content puts eyebrows/body
  // as bare-text cells that `> *` silently drops).
  const collected = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const els = [...cell.children];
    if (els.length) {
      els.forEach((el) => collected.push(el));
    } else {
      const text = cell.textContent.trim();
      if (text) {
        const p = document.createElement('p');
        p.textContent = text;
        collected.push(p);
      }
    }
  });

  // --- Classify by content -------------------------------------------------
  const picture = collected.find((el) => el.matches('picture, img'));
  const heading = collected.find((el) => el.matches('h1, h2, h3, h4, h5, h6'));
  const texts = collected.filter(
    (el) => !el.matches('picture, img, h1, h2, h3, h4, h5, h6'),
  );

  // The rounded photo band (proto .nl), wrapped inside the container.
  const band = document.createElement('div');
  band.className = 'nl-band';

  // Background image (full-bleed). Empty image cell falls back to CSS bg.
  const bg = document.createElement('div');
  bg.className = 'nl-bg';
  if (picture) {
    bg.append(picture.closest('picture') || picture);
  }
  band.append(bg);

  // Left-to-right forest scrim.
  const scrim = document.createElement('div');
  scrim.className = 'nl-scrim';
  band.append(scrim);

  // White copy panel (max-width capped in CSS).
  const inner = document.createElement('div');
  inner.className = 'nl-inner';

  // Eyebrow — first text node. EDS strips <span> in cells, so re-create it here.
  const [eyebrowText, ...bodyTexts] = texts;
  if (eyebrowText) {
    const eyebrow = document.createElement('span');
    eyebrow.className = 'nl-eyebrow';
    eyebrow.textContent = eyebrowText.textContent.trim();
    inner.append(eyebrow);
  }

  // Title — reuse the authored heading element if present (server-visible),
  // otherwise nothing. Normalise to <h2>.
  if (heading) {
    if (heading.tagName === 'H2') {
      inner.append(heading);
    } else {
      const h2 = document.createElement('h2');
      h2.innerHTML = heading.innerHTML;
      inner.append(h2);
    }
  }

  // Body copy — remaining text nodes.
  bodyTexts.forEach((node) => {
    const p = document.createElement('p');
    p.textContent = node.textContent.trim();
    if (p.textContent) inner.append(p);
  });

  // Non-submitting email capture: a <div> wrapper (NOT a <form>), input + button.
  const form = document.createElement('div');
  form.className = 'nl-form';

  const input = document.createElement('input');
  input.type = 'email';
  input.placeholder = 'Your email address';
  input.setAttribute('aria-label', 'Email address');

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-primary';
  button.textContent = 'Sign Up';

  form.append(input, button);
  inner.append(form);

  band.append(inner);
  block.replaceChildren(band);
}
