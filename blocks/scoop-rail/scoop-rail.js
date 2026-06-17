/**
 * scoop-rail — left app navigation rail (role: band)
 *
 * Lifts the prototype's `aside.rail`: a vertical strip of nav icon buttons,
 * a divider rule, colored "scoop" chips, and a handwritten "your scoops"
 * marker anchored to the first scoop.
 *
 * Authored content (one element per row; classified BY CONTENT, never by
 * row/cell index). A CELL-LEVEL cascade collector turns each authored cell
 * into a node, synthesizing a <p> from bare-text cells so eyebrows/labels are
 * never dropped (#62/#68/#71). Each collected node is then classified:
 *
 *   - Heading (h2..h6) whose text is "your scoops"  → the marker label.
 *   - Number-prefixed text ("01"/"02"/"03")          → a colored scoop chip.
 *     Ground color cascades pink → mint → orange by appearance order; the
 *     FIRST scoop also carries the pulse dot.
 *   - "+" / "new" / "new scoop" text                 → the dashed "+" add chip.
 *   - Any other text (home/conversations/files/skills)→ a nav icon button.
 *     The first nav item is the active one (mint edge indicator).
 *
 * Nav + arrow SVGs are inlined here. Icons are decorative nav with no hrefs.
 */

const NAV_ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></svg>',
  conversations: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  files: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  skills: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
};

const FALLBACK_ICON = NAV_ICONS.home;

const ARROW_SVG = '<svg viewBox="0 0 22 11" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M20 5.5 Q 12 5.5 4 5.5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M7 2 L 3 5.5 L 7 9" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const SCOOP_GROUNDS = ['pink', 'mint', 'orange'];

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

  const rail = document.createElement('div');
  rail.className = 'scoop-rail-inner';

  const navItems = [];
  const scoops = [];
  let plusLabel = '';
  let markerLabel = '';

  nodes.forEach((node) => {
    const txt = node.textContent.trim();
    if (!txt) return;
    const heading = node.matches('h1, h2, h3, h4, h5, h6') || node.querySelector('h1, h2, h3, h4, h5, h6');
    const low = txt.toLowerCase();
    if (heading && /scoop/.test(low) && !/^\d/.test(txt)) {
      markerLabel = txt;
    } else if (/^\d/.test(txt)) {
      scoops.push(txt.match(/^\d+/)[0]);
    } else if (txt === '+' || /^new( scoop)?$/.test(low)) {
      plusLabel = '+';
    } else {
      navItems.push(low);
    }
  });

  let ruleInserted = false;

  navItems.forEach((name, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'scoop-rail-item';
    if (i === 0) btn.classList.add('is-active');
    btn.title = name;
    btn.setAttribute('aria-label', name);
    btn.innerHTML = NAV_ICONS[name] || FALLBACK_ICON;
    rail.append(btn);
  });

  const insertRule = () => {
    if (ruleInserted) return;
    const rule = document.createElement('div');
    rule.className = 'scoop-rail-rule';
    rule.setAttribute('aria-hidden', 'true');
    rail.append(rule);
    ruleInserted = true;
  };

  scoops.forEach((label, i) => {
    insertRule();
    const ground = SCOOP_GROUNDS[i % SCOOP_GROUNDS.length];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `scoop-rail-scoop scoop-rail-scoop-${ground}`;
    btn.title = `scoop ${label}`;
    btn.setAttribute('aria-label', `scoop ${label}`);
    btn.textContent = label;
    if (i === 0) {
      const pulse = document.createElement('span');
      pulse.className = 'scoop-rail-pulse';
      pulse.setAttribute('aria-hidden', 'true');
      btn.append(pulse);
    }
    rail.append(btn);
  });

  if (plusLabel) {
    insertRule();
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'scoop-rail-scoop scoop-rail-scoop-plus';
    btn.title = 'new scoop';
    btn.setAttribute('aria-label', 'new scoop');
    btn.textContent = '+';
    rail.append(btn);
  }

  if (markerLabel) {
    const marker = document.createElement('span');
    marker.className = 'scoop-rail-marker';
    marker.setAttribute('aria-hidden', 'true');
    const arrow = document.createElement('span');
    arrow.className = 'scoop-rail-marker-arrow';
    arrow.innerHTML = ARROW_SVG;
    marker.append(arrow, document.createTextNode(markerLabel));
    rail.append(marker);
  }

  block.replaceChildren(rail);
}
