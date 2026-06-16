/**
 * loads and decorates the hero block
 * @param {Element} block The hero block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cellOf = (row) => row?.querySelector(':scope > div') || row;

  const eyebrowCell = cellOf(rows[0]);
  const headingCell = cellOf(rows[1]);
  const subCell = cellOf(rows[2]);
  const ctaCell = cellOf(rows[3]);
  const trustCell = cellOf(rows[4]);

  // left copy column
  const copy = document.createElement('div');
  copy.className = 'hero-copy';

  if (eyebrowCell) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = eyebrowCell.textContent.trim();
    copy.append(eyebrow);
  }

  if (headingCell) {
    const authored = headingCell.querySelector('h1') || headingCell;
    const h1 = document.createElement('h1');
    h1.innerHTML = authored.innerHTML;
    copy.append(h1);
  }

  if (subCell) {
    const sub = document.createElement('p');
    sub.className = 'sub';
    sub.textContent = subCell.textContent.trim();
    copy.append(sub);
  }

  if (ctaCell) {
    const cta = document.createElement('div');
    cta.className = 'hero-cta';
    [...ctaCell.childNodes].forEach((node) => cta.append(node.cloneNode(true)));
    copy.append(cta);
  }

  if (trustCell) {
    const trust = document.createElement('div');
    trust.className = 'trust';
    trust.innerHTML = trustCell.innerHTML;
    copy.append(trust);
  }

  // right "live app" mock (hardcoded, not authorable)
  const app = document.createElement('div');
  app.className = 'app';
  app.innerHTML = `
    <div class="app-bar">
      <span class="d"></span><span class="d"></span><span class="d"></span>
      <span class="title">Operations · Live App</span>
      <span class="live"><span class="pulse"></span> Live</span>
    </div>
    <div class="app-body">
      <div class="sweep"></div>
      <div class="kpis">
        <div class="kpi"><div class="l">Open work orders</div><div class="v mag">248</div></div>
        <div class="kpi">
          <div class="l">Saved / yr</div><div class="v pink">$250k+</div>
        </div>
        <div class="kpi">
          <div class="l">SLA met</div><div class="v">92%</div>
          <div class="bar"><i style="width:92%"></i></div>
        </div>
      </div>
      <table class="rows">
        <thead><tr><th>Record</th><th>Owner</th><th>Status</th></tr></thead>
        <tbody>
          <tr class="row">
            <td><span class="rowdot"></span>WO-1043 · HVAC</td>
            <td>A. Chen</td><td><span class="pill-s s-live">Live</span></td>
          </tr>
          <tr class="row">
            <td>WO-1044 · Electrical</td>
            <td>R. Diaz</td><td><span class="pill-s s-build">Building</span></td>
          </tr>
          <tr class="row">
            <td>WO-1045 · Plumbing</td>
            <td>M. Osei</td><td><span class="pill-s s-queue">Queued</span></td>
          </tr>
          <tr class="row">
            <td>WO-1046 · Inspection</td>
            <td>J. Park</td><td><span class="pill-s s-live">Live</span></td>
          </tr>
        </tbody>
      </table>
    </div>`;

  const grid = document.createElement('div');
  grid.className = 'hero-grid';
  grid.append(copy, app);

  block.textContent = '';
  block.append(grid);

  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (reduce) return;

  // cascade the status rows in, then run the ambient sweep
  app.classList.add('build-anim');
  [...app.querySelectorAll('.row')].forEach((row, i) => {
    row.animate(
      [
        { opacity: 0, transform: 'translateY(14px) rotateX(8deg)' },
        { opacity: 1, transform: 'none' },
      ],
      {
        duration: 600,
        delay: 300 + i * 120,
        easing: 'cubic-bezier(.25,.46,.45,.94)',
        fill: 'forwards',
      },
    );
  });
}
