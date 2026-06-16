/**
 * site-nav — Evergreen Bank marketing header (fixed chrome).
 *
 * This is fixed site chrome — there is no per-page configuration, so the block
 * IGNORES any authored rows and rebuilds the full header in JS:
 *   - a green (--eb-primary-deep) utility bar: logo + Locations / Help /
 *     search icon + a gold "Sign on" pill (links to the dashboard page)
 *   - a white nav bar: primary tabs (Personal[active] / Small Business /
 *     Wealth / About Us) and product nav links.
 *
 * Author shape: NONE. Drop an empty `site-nav` block on the page; everything
 * below is generated. The "Sign on" pill points at /snowflake-blocks/test-5.
 */

const DASHBOARD = '/snowflake-blocks/test-5';

const LOGO_SVG = `
  <svg width="26" height="26" viewBox="0 0 28 28" aria-hidden="true">
    <circle cx="14" cy="14" r="13" fill="var(--eb-primary)"></circle>
    <path d="M14 5 L21 16 H16.5 L20 22 H8 L11.5 16 H7 Z" fill="var(--eb-accent)"></path>
  </svg>`;

const PIN_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true" class="site-nav-icon">
    <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"></path>
    <circle cx="12" cy="10" r="2.5"></circle>
  </svg>`;

const SEARCH_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true" class="site-nav-icon">
    <circle cx="11" cy="11" r="6.5"></circle>
    <path d="M16 16l4.5 4.5"></path>
  </svg>`;

const TABS = ['Personal', 'Small Business', 'Wealth', 'About Us'];
const LINKS = ['Checking', 'Savings & CDs', 'Credit Cards', 'Home Loans', 'Personal Loans', 'Investing'];

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  block.textContent = '';

  block.innerHTML = `
    <div class="site-nav-utility">
      <div class="eb-container site-nav-utility-inner">
        <a class="site-nav-brand" href="/" aria-label="Evergreen Bank home">
          ${LOGO_SVG}
          <span class="site-nav-wordmark">Evergreen<span class="site-nav-wordmark-light"> Bank</span></span>
        </a>
        <div class="site-nav-utility-actions">
          <a class="site-nav-util-link" href="#locations">${PIN_ICON}<span>Locations</span></a>
          <a class="site-nav-util-link" href="#help">Help</a>
          <button type="button" class="site-nav-search" aria-label="Search">${SEARCH_ICON}</button>
          <a class="eb-btn eb-btn-gold site-nav-signon" href="${DASHBOARD}">Sign on</a>
        </div>
      </div>
    </div>
    <nav class="site-nav-bar" aria-label="Primary">
      <div class="eb-container">
        <div class="site-nav-tabs" role="tablist">
          ${TABS.map((t, i) => `<a class="site-nav-tab${i === 0 ? ' is-active' : ''}" href="#${t.toLowerCase().replace(/\s+/g, '-')}"${i === 0 ? ' aria-current="page"' : ''}>${t}</a>`).join('')}
        </div>
        <div class="site-nav-links">
          ${LINKS.map((l) => `<a class="site-nav-link" href="#${l.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '')}">${l}</a>`).join('')}
        </div>
      </div>
    </nav>`;
}
