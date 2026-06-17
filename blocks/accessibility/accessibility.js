/**
 * accessibility — two-column section: media image + body (eyebrow, headline, copy, CTAs).
 *
 * Authored as ONE row with ONE cell holding all elements as flat siblings, OR as
 * several rows/cells. Default to a CELL-LEVEL cascade collector: walk every cell,
 * push its child elements when it has any, else synthesize a <p> from its bare text.
 * Then classify the collected nodes by CONTENT (picture/img → media; heading → title;
 * link → CTA; the rest → body prose), never by row/cell index.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // 1. Cell-level cascade collector — flatten every cell into a node list.
  const nodes = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) {
      kids.forEach((k) => nodes.push(k));
    } else {
      const text = cell.textContent.trim();
      if (text) {
        const p = document.createElement('p');
        p.textContent = text;
        nodes.push(p);
      }
    }
  });

  // 2. Classify by content.
  let media = null;
  let heading = null;
  const links = [];
  const body = [];

  nodes.forEach((node) => {
    const pic = node.matches('picture, img') ? node : node.querySelector('picture, img');
    const link = node.matches('a') ? node : node.querySelector('a');
    if (pic && !media) {
      media = pic;
    } else if (/^H[1-6]$/.test(node.tagName) && !heading) {
      heading = node;
    } else if (link) {
      links.push(link);
    } else {
      body.push(node);
    }
  });

  // 3. Build the structure: .wrap.access > .access__media + .access__body
  const wrap = document.createElement('div');
  wrap.className = 'wrap access';

  const mediaCol = document.createElement('div');
  mediaCol.className = 'access-media';
  if (media) {
    mediaCol.append(media.closest('picture') || media);
  }
  // Empty media cell → CSS --primary-deep fallback (mediaCol stays empty).
  wrap.append(mediaCol);

  const bodyCol = document.createElement('div');
  bodyCol.className = 'access-body';

  // Eyebrow: first body paragraph becomes the eyebrow span (EDS strips spans in cells).
  if (body.length) {
    const first = body.shift();
    const eyebrow = document.createElement('span');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = first.textContent.trim();
    bodyCol.append(eyebrow);
  }

  // Reuse the authored heading element (server-visible) if present.
  if (heading) {
    bodyCol.append(heading);
  }

  // Remaining body nodes = prose paragraphs.
  body.forEach((node) => bodyCol.append(node));

  // CTAs: clone the authored anchors; first → primary, rest → secondary.
  if (links.length) {
    const ctas = document.createElement('div');
    ctas.className = 'access-ctas btn-group';
    links.forEach((link, i) => {
      const a = link.cloneNode(true);
      a.classList.add('btn', i === 0 ? 'btn-primary' : 'btn-secondary');
      ctas.append(a);
    });
    bodyCol.append(ctas);
  }

  wrap.append(bodyCol);
  block.replaceChildren(wrap);
}
