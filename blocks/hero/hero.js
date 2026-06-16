import { getConfig, decorateLink } from '../../scripts/ak.js';

/* Decorative inline SVGs lifted from the prototype (kept inline — no image cells). */
const HEX_CLUSTER_SVG = `
  <svg class="hero-hexes" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
    <g fill="none" stroke="var(--accent)" stroke-width="1.4" stroke-opacity=".5">
      <path d="M100 30 L135 50 V90 L100 110 L65 90 V50 Z"/>
      <path d="M135 50 L170 70 V110 L135 130 L100 110 V90 L135 70 Z" stroke-opacity=".3"/>
      <path d="M65 90 L100 110 V150 L65 170 L30 150 V110 Z" stroke-opacity=".25"/>
      <path d="M135 130 L170 150 V190" stroke-opacity=".2"/>
    </g>
  </svg>`;

const BEE_1_SVG = `
  <div class="hero-bee hero-bee-1" aria-hidden="true">
    <div class="hero-bee-float">
      <svg width="64" height="58" viewBox="0 0 72 64" focusable="false">
        <ellipse class="hero-bee-wing" cx="30" cy="28" rx="9" ry="14" fill="#fff" fill-opacity=".5"/>
        <ellipse cx="42" cy="38" rx="20" ry="15" fill="var(--accent)" stroke="#0B0B0B" stroke-width="2.4"/>
        <path d="M40 25 Q49 30 47 50" stroke="#0B0B0B" stroke-width="4" fill="none"/>
        <path d="M48 27 Q56 33 53 48" stroke="#0B0B0B" stroke-width="4" fill="none"/>
        <circle cx="23" cy="35" r="7.5" fill="#0B0B0B"/>
        <path d="M19 28 L13 21 M24 27 L21 18" stroke="#0B0B0B" stroke-width="2" stroke-linecap="round"/>
        <path d="M60 38 L70 34 M60 42 L70 46" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
      </svg>
    </div>
  </div>`;

const BEE_2_SVG = `
  <div class="hero-bee hero-bee-2" aria-hidden="true">
    <div class="hero-bee-float">
      <svg width="44" height="40" viewBox="0 0 72 64" opacity=".85" focusable="false">
        <ellipse cx="42" cy="38" rx="20" ry="15" fill="var(--accent)" stroke="#0B0B0B" stroke-width="2.4"/>
        <path d="M40 25 Q49 30 47 50" stroke="#0B0B0B" stroke-width="4" fill="none"/>
        <path d="M48 27 Q56 33 53 48" stroke="#0B0B0B" stroke-width="4" fill="none"/>
        <circle cx="23" cy="35" r="7.5" fill="#0B0B0B"/>
      </svg>
    </div>
  </div>`;

/**
 * loads and decorates the hero
 * @param {Element} block The block element
 * Author rows: eyebrow | headline-line-1 | headline-line-2 (stroked) | lede | CTAs
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const text = (row) => (row ? row.textContent.trim() : '');

  const eyebrow = text(rows[0]);
  const line1 = text(rows[1]);
  const line2 = text(rows[2]);
  const lede = text(rows[3]);
  const ctaCell = rows[4]?.firstElementChild;

  // CTAs: clone the authored cell so decorateButton() can apply pill classes.
  let ctas = '';
  if (ctaCell) {
    const config = getConfig();
    const clone = ctaCell.cloneNode(true);
    clone.querySelectorAll('a').forEach((a) => decorateLink(config, a));
    ctas = `<div class="hero-ctas btn-group">${clone.innerHTML}</div>`;
  }

  block.innerHTML = `
    <div class="hero-bg" aria-hidden="true"></div>
    <div class="hero-glow" aria-hidden="true"></div>
    ${HEX_CLUSTER_SVG}
    ${BEE_1_SVG}
    ${BEE_2_SVG}
    <div class="hero-content">
      <div class="hero-eyebrow">
        <span class="hero-rule"></span>
        <span class="hero-eyebrow-text">${eyebrow}</span>
      </div>
      <h1 class="hero-headline">
        <span class="hero-line">${line1}</span>
        <span class="hero-line hero-line-stroke">${line2}</span>
      </h1>
      <p class="hero-lede">${lede}</p>
      ${ctas}
    </div>
    <span class="hero-scroll" aria-hidden="true">
      <span class="hero-scroll-label">Scroll</span>
      <span class="hero-scroll-arrow">&darr;</span>
    </span>`;
}
