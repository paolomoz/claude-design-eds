/**
 * story — light "Our Story" band: eyebrow + headline + two paragraphs on the
 * left, a 2×2 grid of count-up stat cards on the right, with a slowly
 * counter-spinning decorative hex (pure CSS) behind it.
 *
 * Author rows (positional):
 *   row 0: eyebrow          e.g. "02 — Our Story"
 *   row 1: headline         e.g. "A COLONY OF BREWERS"
 *   row 2: paragraph 1
 *   row 3: paragraph 2
 *   row 4..n: one stat per row → [ number | label ]   (repeated-row shape)
 *
 * @param {Element} block The block element
 */

/* Decorative counter-spinning hex lifted from the prototype (kept inline). */
const HEX_SPIN_SVG = `
  <svg class="story-hex" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
    <path d="M100 30 L135 50 V90 L100 110 L65 90 V50 Z" fill="none" stroke="#0B0B0B" stroke-opacity=".1" stroke-width="2"/>
    <path d="M135 90 L170 110 V150 L135 170 L100 150 V110 Z" fill="none" stroke="#0B0B0B" stroke-opacity=".07" stroke-width="2"/>
  </svg>`;

const fmt = (n) => Math.round(n).toLocaleString('en-US');

function countUp(el, target) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = fmt(target);
    return;
  }
  const duration = 1600;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - t) ** 3; // ease-out cubic
    el.textContent = fmt(target * eased);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = fmt(target);
  };
  requestAnimationFrame(tick);
}

export default async function decorate(block) {
  const rows = [...block.children];
  const text = (row) => (row ? row.textContent.trim() : '');

  const eyebrow = text(rows[0]);
  const headline = text(rows[1]);
  const para1 = text(rows[2]);
  const para2 = text(rows[3]);

  // Each remaining row is a stat: [ number | label ]. Cards alternate
  // ink/accent backgrounds via :nth-child in CSS.
  const stats = rows.slice(4).map((row) => {
    const cells = [...row.children];
    return {
      number: (cells[0]?.textContent || '').replace(/[^\d]/g, ''),
      label: cells[1]?.textContent.trim() || '',
    };
  });

  const cards = stats.map((s) => `
    <div class="story-stat">
      <div class="story-stat-number"><span data-count="${s.number}">0</span></div>
      <div class="story-stat-label">${s.label}</div>
    </div>`).join('');

  block.innerHTML = `
    ${HEX_SPIN_SVG}
    <div class="story-inner">
      <div class="story-intro">
        <div class="story-eyebrow">
          <span class="story-diamond"></span>
          <span class="story-eyebrow-text">${eyebrow}</span>
        </div>
        <h2 class="story-headline">${headline}</h2>
        <p class="story-para">${para1}</p>
        <p class="story-para">${para2}</p>
      </div>
      <div class="story-stats">${cards}</div>
    </div>`;

  // Count-up when the stats grid scrolls into view.
  const counters = [...block.querySelectorAll('[data-count]')];
  const run = () => counters.forEach((el) => countUp(el, Number(el.dataset.count)));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run();
        obs.disconnect();
      });
    }, { threshold: 0.3 });
    io.observe(block.querySelector('.story-stats'));
  } else {
    run();
  }
}
