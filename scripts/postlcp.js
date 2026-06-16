import { getMetadata, getConfig } from './ak.js';

/**
 * Loads a static fragment (header or footer) from the code origin.
 * Fragments are raw HTML files with an inline <style> block — no EDS
 * authoring, no block JS. Injected directly via innerHTML.
 *
 * @param {HTMLElement} el - The <header> or <footer> element
 * @param {string} name - Fragment name ('header' or 'footer')
 */
async function loadStaticFragment(el, name) {
  const meta = getMetadata(name);
  if (meta === 'off') {
    document.body.classList.add(`no-${name}`);
    el.remove();
    return;
  }

  const { codeBase } = getConfig();
  const path = `${codeBase}/fragments/${name}.html`;

  try {
    const resp = await fetch(path);
    if (!resp.ok) return;
    const html = await resp.text();
    // Tag the host element so the fragment's `header.header` / `footer.footer`
    // root selectors match. (decorateHeader sets the header class; the footer's
    // was previously set by utils/footer.js, which the static-fragment flow
    // drops — so set it here.)
    el.className = name;
    el.innerHTML = html;
  } catch (e) {
    // Silent fail — page renders without header/footer
  }
}

export default async function loadPostLCP() {
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');

  await Promise.all([
    header ? loadStaticFragment(header, 'header') : null,
    footer ? loadStaticFragment(footer, 'footer') : null,
  ]);
}
