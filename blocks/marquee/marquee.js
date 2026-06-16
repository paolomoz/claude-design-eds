/**
 * loads and decorates the marquee
 * @param {Element} block The block element
 * Author row: a single cell holding the marquee phrase. JS duplicates it for a
 * seamless loop.
 */
export default async function decorate(block) {
  const phrase = block.textContent.trim();

  block.innerHTML = `
    <div class="marquee-track">
      <span class="marquee-text">${phrase}</span>
      <span class="marquee-text" aria-hidden="true">${phrase}</span>
    </div>`;
}
