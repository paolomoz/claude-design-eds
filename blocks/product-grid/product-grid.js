/* product-grid — 9 explore-card whole-anchor tiles on a dark canvas.
 *
 * Authored as ONE row / ONE cell holding every element as flat siblings
 * (picture, title, desc, link — repeated per card). We flatten the cell and
 * segment into cards by the repeating title heading; each card becomes a
 * whole-card <a> (NOT a button). The 40px product-icon SVGs live in code and
 * are inlined per-card, keyed by the card title. */

/* Per-product icon SVGs lifted verbatim from the prototype (40px slot). Keyed
   by a normalized title so authors can reorder/relabel cards freely. */
const ICONS = {
  firefly: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 168" fill="none" aria-hidden="true"><path d="M137.871 0H30.129C13.4892 0 0 13.4892 0 30.129V137.871C0 154.511 13.4892 168 30.129 168H137.871C154.511 168 168 154.511 168 137.871V30.129C168 13.4892 154.511 0 137.871 0Z" fill="#EB1000"/><path d="M42.5525 44.5941H99.0745V62.9723H64.0517V76.2648H95.029V94.643H64.0517V122.037H42.5525V44.5941Z" fill="white"/><path d="M106.491 61.701H126.718V122.037H106.491V61.701Z" fill="white"/><path d="M120.162 50.428L127.373 52.0487C130.208 52.6875 132.176 49.2923 130.202 47.1569L125.191 41.7388C124.532 41.0231 124.265 40.0353 124.479 39.0829L126.104 31.8902C126.745 29.0628 123.34 27.099 121.2 29.0687L115.768 34.067C115.05 34.7235 114.059 34.9897 113.105 34.7768L105.894 33.156C103.059 32.5172 101.09 35.9125 103.065 38.0478L108.076 43.466C108.734 44.1817 109.001 45.1695 108.788 46.1218L107.163 53.3145C106.522 56.1419 109.926 58.1057 112.067 56.136L117.499 51.1378C118.217 50.4812 119.207 50.215 120.162 50.428Z" fill="white"/></svg>',
  acrobat: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" aria-hidden="true"><path fill="#b30b00" d="M45.5,3.2h165.1c24.7,0,45.5,19.9,45.5,45.5v158.7c0,24.7-19.9,45.5-45.5,45.5H45.5C20.7,252.8,0,232.9,0,207.4V48.6C0,23.1,19.9,3.2,45.5,3.2z"/><path fill="#fff" d="M204.2,147.5c-12-12.8-44.7-7.2-52.6-6.4c-11.2-11.2-19.1-23.9-22.3-28.7c4-12,7.2-25.5,7.2-38.3c0-12-4.8-23.9-17.5-23.9c-4.8,0-8.8,2.4-11.2,6.4c-5.6,9.6-3.2,28.7,5.6,48.6c-4.8,14.4-12.8,35.9-22.3,52.6c-12.8,4.8-40.7,17.5-43.1,31.9c-0.8,4,0.8,8.8,4,11.2c3.2,3.2,7.2,4,11.2,4c16.7,0,33.5-23.1,45.5-43.9c9.6-3.2,24.7-8,39.9-10.4c17.5,16,33.5,18.3,41.5,18.3c11.2,0,15.2-4.8,16.7-8.8C208.9,156.3,207.4,150.7,204.2,147.5z M193,155.5c-0.8,3.2-4.8,6.4-12,4.8c-8.8-2.4-16.7-6.4-23.1-12c5.6-0.8,19.1-2.4,28.7-0.8C189.8,148.3,193.8,150.7,193,155.5z M115.6,59.8c0.8-1.6,2.4-2.4,4-2.4c4,0,4.8,4.8,4.8,8.8c-0.8,9.6-2.4,19.9-5.6,28.7C112.4,77.4,113.2,64.6,115.6,59.8z M114.8,149.9c4-7.2,8.8-20.7,10.4-25.5c4,7.2,11.2,15.2,14.4,19.1C140.4,142.8,126,145.9,114.8,149.9z M87.7,168.3C76.6,185.8,66.2,197,59.8,197c-0.8,0-2.4,0-3.2-0.8c-0.8-1.6-1.6-3.2-0.8-4.8C56.6,185,69.4,176.2,87.7,168.3z"/></svg>',
  photoshop: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 84" fill="none" aria-hidden="true"><path d="M68.9355 0H15.0645C6.74461 0 0 6.74461 0 15.0645V68.9355C0 77.2554 6.74461 84 15.0645 84H68.9355C77.2554 84 84 77.2554 84 68.9355V15.0645C84 6.74461 77.2554 0 68.9355 0Z" fill="#001E36"/><path d="M29.3321 22.2971C40.3129 22.2971 46.4968 27.4407 46.4968 36.0518C46.4968 46.1079 38.1168 50.1534 30.2569 50.1534H24.9399V61.0185H14.1903V22.2971H29.3321ZM24.9399 31.4861V40.9643H29.679C32.9732 40.9643 35.285 39.635 35.285 36.283C35.285 33.22 33.3199 31.4861 29.9102 31.4861H24.9399Z" fill="#31A8FF"/><path d="M48.6817 59.1114L48.7395 50.1534C51.8025 52.1761 56.0792 53.4476 59.0267 53.4476C61.0495 53.4476 61.9742 52.8696 61.9742 51.8293C61.9742 50.6735 60.7028 50.2112 58.2755 49.4598C53.5941 48.0728 48.4507 46.1657 48.4507 40.0395C48.4507 33.7979 53.5941 30.3303 61.0495 30.3303C64.5749 30.3303 67.4646 30.8505 70.0073 31.9485L69.9495 40.5019C67.9268 39.2883 63.9391 38.1902 61.3383 38.1902C59.4313 38.1902 58.68 38.7681 58.68 39.635C58.68 40.6753 59.6046 40.9642 62.3788 41.8312C67.7536 43.4494 72.2615 45.1831 72.2615 51.4826C72.2615 57.4931 67.349 61.5387 59.6625 61.5387C55.6168 61.5387 51.8025 60.8452 48.6817 59.1114Z" fill="#31A8FF"/></svg>',
  premiere: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none" aria-hidden="true"><path d="M196.959 0H43.0414C19.2703 0 0 19.2703 0 43.0414V196.959C0 220.73 19.2703 240 43.0414 240H196.959C220.73 240 240 220.73 240 196.959V43.0414C240 19.2703 220.73 0 196.959 0Z" fill="#00005B"/><path d="M92.5516 63.7059C123.925 63.7059 141.594 78.4019 141.594 103.005C141.594 131.737 117.65 143.296 95.1933 143.296H80.002V174.339H49.2894V63.7059H92.5516ZM80.002 89.9604V117.041H93.5427C102.955 117.041 109.559 113.243 109.559 103.666C109.559 94.9144 103.945 89.9604 94.2027 89.9604H80.002Z" fill="#9999FF"/><path d="M184.411 86.6581C191.181 86.6581 196.63 87.4837 199.107 88.3093V110.766C197.125 110.271 193.327 109.94 190.19 109.94C184.081 109.94 180.613 110.436 177.475 111.592V174.339H148.579V93.9235C158.981 89.3001 169.385 86.6581 184.411 86.6581Z" fill="#9999FF"/></svg>',
  'creative-cloud': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 234" fill="none" aria-hidden="true"><rect width="240" height="234" rx="48" fill="#DA1F26"/><path fill="#FFFFFF" d="M192.6,70.5c-12.7-13.7-30.6-21.4-49.2-21.3c-18.2,0-36.7,7.8-48.6,20.4c-2.2-0.2-4.4-0.4-6.5-0.4c-35.7,0-57.8,30-57.8,57.8c0.1,15,5.9,29.4,16.2,40.4c10.8,11.5,25.8,18,41.6,18h55.1c37.4,0,67.8-30.7,67.8-68.3C211,99.8,204.4,83.2,192.6,70.5z M87.2,175.6c-26.5,0-47.9-21.5-47.9-48c0-26.3,21.3-47.7,47.7-47.9c11.7,0,23.1,4.3,31.8,12.1L119,92l19.9,20.4c3.3,3.4,3.2,8.8-0.2,12.1c-3.4,3.3-8.8,3.2-12.1-0.2L107,104.1c-12.8-11-32.1-9.6-43.1,3.2c-4.8,5.5-7.4,12.6-7.4,19.9c0,16.8,14.3,31,31.2,31h3.9V158.3c5.6,7.8,21.3,17.3,21.3,17.3H87.2z M185.4,158.4c-10.7,11.2-25.5,17.5-41,17.6c-14.7,0-29.7-6.6-41.2-18L77,131.6c-3.3-3.4-3.2-8.8,0.1-12.1c1.6-1.6,3.7-2.4,6-2.4s4.5,0.9,6.1,2.6l26.1,26.1c8.3,8.3,18.9,13,29.1,13c10.9,0,21.3-4.5,28.8-12.5c7.7-7.9,12-18.5,12-29.5c0-22.6-18.4-40.9-41-41c-8.6,0-15.7,1.7-22.7,6.6c-2.1-1.3-4.5-2.6-6.9-3.6h0.1c10.8-10.1,24.2-15,39-15c32.1,0,58,26,58.1,58.1C202.3,132.3,196.3,147.3,185.4,158.4z"/></svg>',
  illustrator: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none" aria-hidden="true"><path d="M196.959 0H43.0414C19.2703 0 0 19.2703 0 43.0414V196.959C0 220.73 19.2703 240 43.0414 240H196.959C220.73 240 240 220.73 240 196.959V43.0414C240 19.2703 220.73 0 196.959 0Z" fill="#330000"/><path d="M81.232 63.7059H116.568L156.198 174.339H123.833L118.384 157.496H76.9381L71.4894 174.339H40.4462L81.232 63.7059ZM109.798 131.241L97.7439 94.0885L85.6901 131.241H109.798Z" fill="#FF9A00"/><path d="M160.94 70.9713C160.94 63.0454 167.049 57.9267 176.296 57.9267C185.378 57.9267 191.157 63.2107 191.157 70.9713C191.157 78.8973 185.378 84.3465 176.296 84.3465C166.719 84.3465 160.94 79.0625 160.94 70.9713ZM161.765 88.1443H190.662V174.339H161.765V88.1443Z" fill="#FF9A00"/></svg>',
  // generic Adobe "A" mark — shared by GenStudio + Business Products.
  generic: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none" aria-hidden="true"><path d="M16.0909 4H63.7636C67.2909 4 70.7091 5.45455 73.1818 8C75.5454 10.4364 76.8909 13.7091 76.8545 17.0909V62.9091C76.8545 66.5091 75.3636 69.9636 72.7454 72.4364C70.3454 74.7273 67.1091 76 63.8 76H16.0909C12.0545 76 8.23636 74.1091 5.76364 70.9091C3.94545 68.6182 3 65.8182 3 62.9091V17.0909C3 13.6 4.41818 10.2182 6.92727 7.74545C9.36364 5.30909 12.6364 4 16.0909 4Z" fill="#EB1000"/><path d="M60.4177 58.1074H51.6541C50.8905 58.1074 50.1632 57.671 49.8723 56.9438L40.345 34.6892C40.2723 34.471 40.0541 34.3256 39.8359 34.3983C39.6905 34.4347 39.5814 34.5438 39.545 34.6892L33.6177 48.8347C33.5086 49.0892 33.6177 49.3801 33.8723 49.4892C33.945 49.4892 34.0177 49.5256 34.0541 49.5256H40.5632C40.9632 49.5256 41.3268 49.7801 41.4723 50.1438L44.3086 56.5074C44.5632 57.0892 44.3086 57.7801 43.6905 58.0347C43.545 58.1074 43.3996 58.1438 43.2177 58.1438H19.4723C18.8541 58.1438 18.3814 57.6347 18.4177 57.0165C18.4177 56.871 18.4177 56.7256 18.4905 56.6165L33.5814 20.6529C33.9086 19.8892 34.6723 19.3801 35.5086 19.3801H44.2359C45.0723 19.3801 45.8359 19.8892 46.1632 20.6529L61.3632 56.5801C61.5814 57.1256 61.3632 57.7801 60.7814 57.9983C60.6723 58.0347 60.5268 58.071 60.3814 58.071L60.4177 58.1074Z" fill="white"/></svg>',
};

/* Map a card title to its icon. Exact matches first, then fuzzy keyword. */
function iconFor(title) {
  const t = title.toLowerCase().trim();
  if (t.includes('firefly')) return ICONS.firefly;
  if (t.includes('acrobat')) return ICONS.acrobat;
  if (t.includes('photoshop')) return ICONS.photoshop;
  if (t.includes('premiere')) return ICONS.premiere;
  if (t.includes('creative cloud')) return ICONS['creative-cloud'];
  if (t.includes('illustrator')) return ICONS.illustrator;
  if (t.includes('genstudio')) return ICONS.generic;
  if (t.includes('business')) return ICONS.generic;
  // "All products" and any unknown product render without an icon.
  return null;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Authors place everything as flat siblings in one cell. Flatten and segment
  // into cards by the repeating title heading — not by row/cell index.
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];

  // The card title is the repeating heading. Pick the most-frequent heading
  // level as the card-title boundary.
  const headings = nodes.filter((n) => /^H[1-6]$/.test(n.tagName));
  const counts = {};
  headings.forEach((h) => { counts[h.tagName] = (counts[h.tagName] || 0) + 1; });
  const titleTag = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || 'H3';

  const titleIdxs = [];
  nodes.forEach((n, i) => { if (n.tagName === titleTag) titleIdxs.push(i); });

  const inner = document.createElement('div');
  inner.className = 'pg-inner';

  titleIdxs.forEach((tIdx, ci) => {
    const start = ci === 0 ? 0 : titleIdxs[ci - 1] + 1;
    const end = ci === titleIdxs.length - 1 ? nodes.length : titleIdxs[ci + 1];
    const segment = nodes.slice(start, end);

    // The whole card is a link. Reuse the authored href; default to "#".
    const linkNode = segment.find((n) => n.tagName === 'A' || n.querySelector?.('a'));
    const authoredA = linkNode && (linkNode.tagName === 'A' ? linkNode : linkNode.querySelector('a'));
    const card = document.createElement('a');
    card.className = 'explore-card';
    card.href = authoredA?.getAttribute('href') || '#';

    // art: first picture/img in the segment (may be empty → CSS fallback tint)
    const art = document.createElement('div');
    art.className = 'card-art';
    const picNode = segment.find((n) => n.tagName === 'PICTURE' || n.tagName === 'IMG'
      || n.querySelector?.('picture, img'));
    if (picNode) {
      const media = picNode.tagName === 'PICTURE' || picNode.tagName === 'IMG'
        ? picNode : picNode.querySelector('picture, img');
      if (media) art.append(media);
    }
    card.append(art);

    const body = document.createElement('div');
    body.className = 'card-body';

    // title (reuse the authored heading; the brief wants <h3>)
    const titleNode = nodes[tIdx];
    const titleText = titleNode.textContent.trim();

    // icon — inlined per-card, keyed by title
    const svg = iconFor(titleText);
    if (svg) {
      const icon = document.createElement('div');
      icon.className = 'card-icon';
      icon.innerHTML = svg;
      body.append(icon);
    }

    let title = titleNode;
    if (title.tagName !== 'H3') {
      const h3 = document.createElement('h3');
      h3.innerHTML = title.innerHTML;
      title = h3;
    }
    title.classList.add('card-title');
    body.append(title);

    // desc: the remaining paragraph/text nodes (not the link, not the picture)
    segment.forEach((n) => {
      if (n === titleNode || n === linkNode || n === picNode) return;
      if (!n.textContent.trim()) return;
      if (n.tagName === 'PICTURE' || n.tagName === 'IMG') return;
      const desc = document.createElement('p');
      desc.className = 'card-desc';
      desc.innerHTML = n.innerHTML || n.textContent;
      body.append(desc);
    });

    card.append(body);
    inner.append(card);
  });

  block.replaceChildren(inner);
  block.classList.add('dark');
}
