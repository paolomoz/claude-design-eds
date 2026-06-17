/*
 * Thesis Block — quiet brand-voice pull-quote section.
 * Lifted from stardust prototype surly-mode-a-2 (.ds-section--quiet + .ds-thesis).
 *
 * Authoring contract (#62): ONE row with ONE cell holding all elements as flat
 * siblings — a heading (the display lead), one or more body paragraphs, and a
 * trailing text link ("more"). We flatten and classify by content, not by
 * row/cell index.
 */

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten: collect every authored element regardless of how rows/cells nested.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // Classify by content.
  const heading = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  const links = nodes.filter((n) => n.tagName === 'A' || n.querySelector?.(':scope > a'));
  const paragraphs = nodes.filter(
    (n) => n.tagName === 'P' && !(n.children.length === 1 && n.firstElementChild.tagName === 'A'),
  );

  // The "more" link: the last link in the cell (rendered as a plain styled <a>,
  // NOT a button). Resolve to the actual anchor element.
  let moreLink = null;
  const lastLinkHost = links[links.length - 1];
  if (lastLinkHost) {
    moreLink = lastLinkHost.tagName === 'A' ? lastLinkHost : lastLinkHost.querySelector('a');
  }

  // Build the wrapped inner container (recreates the prototype's max-width wrap).
  const inner = document.createElement('div');
  inner.className = 'thesis-inner';

  const grid = document.createElement('div');
  grid.className = 'thesis-grid';

  // LEFT — display lead. Reuse the authored heading element (server-visible).
  if (heading) {
    heading.classList.add('thesis-lead');
    // EDS strips <span> in cells (#39): recreate the emphasis. The prototype
    // renders the lead word as <em> (rendered --primary, font-style:normal,
    // styled via the CSS below). If an <em> survived, leave it; otherwise the
    // author may have marked the emphasis word with <strong> — normalise it
    // to <em> so the lead emphasis styling applies uniformly.
    heading.querySelectorAll('strong').forEach((s) => {
      const em = document.createElement('em');
      em.innerHTML = s.innerHTML;
      s.replaceWith(em);
    });
    grid.append(heading);
  }

  // RIGHT — body prose + the wavelength-underlined "more" link.
  const body = document.createElement('div');
  body.className = 'thesis-body';
  paragraphs.forEach((p) => body.append(p));

  if (moreLink) {
    moreLink.classList.add('thesis-more');
    body.append(moreLink);
  }

  grid.append(body);
  inner.append(grid);

  block.replaceChildren(inner);
}
