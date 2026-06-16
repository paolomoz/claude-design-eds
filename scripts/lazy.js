import ENV from './utils/env.js';

async function loadSidekick() {
  const getSk = () => document.querySelector('aem-sidekick');

  const sk = getSk() || await new Promise((resolve) => {
    document.addEventListener('sidekick-ready', () => resolve(getSk()));
  });
  if (sk) import('../tools/sidekick/sidekick.js').then((mod) => mod.default(sk));
}

(function loadLazy() {
  import('./utils/lazyhash.js');
  import('./utils/favicon.js');
  // Header + footer are static fragments loaded by postlcp.js (snowflake skill).
  // Do NOT also load the block-based footer (utils/footer.js) — it expects a
  // blocks/footer and collides with the static fragment, surfacing an error box.

  // Author facing tools
  if (ENV !== 'prod') loadSidekick();
}());
