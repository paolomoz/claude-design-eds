/**
 * insights — Evergreen Bank "Insights that find you" green band.
 *
 * A deep-green (--eb-primary-deep) rounded band with white text: an .eb-photo
 * "App screen" placeholder on the left, then h2 + paragraph + two app-store
 * buttons (white solid + outline white).
 *
 * Authoring rows (single content row; buttons default in JS):
 *   <headline> | <paragraph> | [app-store label] | [google-play label]
 */

export default async function decorate(block) {
  const cells = [...(block.firstElementChild?.children || [])]
    .map((c) => c.textContent.trim());

  const headline = cells[0] || 'Insights that find you';
  const body = cells[1]
    || 'See your spending summarized by category, retailer, and across accounts — only in the Evergreen Mobile app.';
  const primaryLabel = cells[2] || 'App Store';
  const secondaryLabel = cells[3] || 'Google Play';

  block.textContent = '';

  const wrap = document.createElement('div');
  wrap.className = 'eb-container';

  const band = document.createElement('div');
  band.className = 'insights-band';
  band.innerHTML = `
    <div class="eb-photo insights-photo" data-label="App screen"></div>
    <div class="insights-content">
      <h2>${headline}</h2>
      <p>${body}</p>
      <span class="insights-actions">
        <button type="button" class="eb-btn insights-btn-primary">${primaryLabel}</button>
        <button type="button" class="eb-btn insights-btn-secondary">${secondaryLabel}</button>
      </span>
    </div>`;

  wrap.append(band);
  block.append(wrap);
}
