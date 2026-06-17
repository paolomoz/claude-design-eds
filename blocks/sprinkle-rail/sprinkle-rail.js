/**
 * sprinkle-rail — right utility rail (sprinkles) (role: band)
 *
 * Lifts the prototype's `aside.sprinkle`: a vertical strip of decorative app
 * utility icon buttons (status dashboard, code, files, agent), with a divider
 * rule after the active item and a flexible spacer that pushes the lower group
 * to the bottom. The active item carries the mint right-edge indicator.
 *
 * Authored content (one element per row; classified BY CONTENT, never by
 * row/cell index). A CELL-LEVEL cascade collector turns each authored cell
 * into a node, synthesizing a <p> from bare-text cells so single-element
 * labels are never dropped (#62/#68/#71). Each collected node's text is the
 * utility key — matched to an inlined SVG. The FIRST item is the active one
 * (mint edge indicator) and the divider rule is inserted after it.
 *
 * Icons are decorative app nav with no real hrefs. SVGs are inlined here.
 */

const RAIL_ICONS = {
  'status dashboard': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  files: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  agent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z"/></svg>',
};

const FALLBACK_ICON = RAIL_ICONS['status dashboard'];

/* Cell-level cascade collector: one node per authored cell, recovering
   bare-text cells as <p> so single-element-per-row content isn't dropped. */
function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) {
      out.push(...kids);
    } else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      out.push(p);
    }
  });
  return out.length ? out : [...block.children];
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  const labels = nodes
    .map((node) => node.textContent.trim().toLowerCase())
    .filter(Boolean);
  if (!labels.length) return;

  const rail = document.createElement('div');
  rail.className = 'sprinkle-rail-inner';

  labels.forEach((label, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sprinkle-rail-item';
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.innerHTML = RAIL_ICONS[label] || FALLBACK_ICON;

    if (i === 0) {
      // first item is active: mint edge indicator + divider + spacer below it
      btn.classList.add('is-active');
      rail.append(btn);

      const rule = document.createElement('div');
      rule.className = 'sprinkle-rail-rule';
      rule.setAttribute('aria-hidden', 'true');
      rail.append(rule);

      const spacer = document.createElement('div');
      spacer.className = 'sprinkle-rail-spacer';
      spacer.setAttribute('aria-hidden', 'true');
      rail.append(spacer);
    } else {
      rail.append(btn);
    }
  });

  block.replaceChildren(rail);
}
