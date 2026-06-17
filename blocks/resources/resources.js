/*
 * resources block — housing-focused resources section.
 * Authored rows (each a single cell):
 *   1. title    — heading (reuse the authored heading element)
 *   2. intro     — lead paragraph
 *   3. outro     — closing paragraph
 *   4. cta       — secondary outline button (<em><a>)
 * The 3 icon columns (icon + label) are rendered by the block.
 */

const COLUMNS = [
  {
    label: 'EMERGENCY SHELTER',
    svg: '<svg viewBox="0 0 111.867 113.818" aria-hidden="true" focusable="false"><g transform="translate(-426.104 2553.336)"><path d="M480.077-2466.455a16.29,16.29,0,0,1,23.039,0" transform="translate(-9.559 -14.542)" fill="none" stroke="#97f1ff" stroke-linecap="round" stroke-miterlimit="10" stroke-width="4"/><path d="M480.077-2482.856a16.291,16.291,0,0,1,23.039,0" transform="translate(-9.559 -11.637)" fill="none" stroke="#97f1ff" stroke-linecap="round" stroke-miterlimit="10" stroke-width="4"/><g transform="translate(426.104 -2553.336)"><path d="M488.169-2532.521a10.368,10.368,0,0,1,10.356,10.355,10.31,10.31,0,0,1-.179,1.871h15.942l-2.983-14.915H465.814l-2.984,14.915h15.162a10.31,10.31,0,0,1-.178-1.871A10.367,10.367,0,0,1,488.169-2532.521Z" transform="translate(-432.608 2550.125)" fill="none"/><path d="M519.326-2533.2v-10.814a9.321,9.321,0,0,0-9.322-9.322H454.071a9.322,9.322,0,0,0-9.323,9.322v10.814L426.1-2466.08v11.932a9.157,9.157,0,0,0,9.323,8.95h1.864v3.816a1.762,1.762,0,0,0,1.865,1.865,1.762,1.762,0,0,0,1.865-1.865v-3.816h82.035v3.816a1.762,1.762,0,0,0,1.865,1.865,1.761,1.761,0,0,0,1.864-1.865v-3.816h1.865a9.322,9.322,0,0,0,9.323-9.323v-11.559Zm-70.9-10.814a5.61,5.61,0,0,1,5.593-5.594h56.04a5.61,5.61,0,0,1,5.593,5.594v9.322h-6.5l-1.118-5.966c0-.745-1.118-1.492-1.865-1.492H457.693a2.479,2.479,0,0,0-1.865,1.492l-1.118,5.966h-6.286Zm-.2,13.051h5.861l-1.865,8.949a2.244,2.244,0,0,0,.373,1.491,2.824,2.824,0,0,0,1.492.746h18.879a10.286,10.286,0,0,1-1.48-3.729H456.326l2.984-14.915H504.8l2.983,14.915H491.843a10.285,10.285,0,0,1-1.48,3.729h19.66a2.825,2.825,0,0,0,1.491-.746,2.244,2.244,0,0,0,.373-1.491l-1.864-8.949h6.072l4.1,14.915H486.13a10.27,10.27,0,0,1-4.465,1.027,10.27,10.27,0,0,1-4.465-1.027H444.127Zm-5.22,18.644h78.254l12.357,44.746H430.7Zm91.233,57.8a5.609,5.609,0,0,1-5.593,5.593H435.427a5.609,5.609,0,0,1-5.593-5.593v-9.322H534.241Z" transform="translate(-426.104 2553.336)" fill="#97f1ff"/></g></g></svg>',
  },
  {
    label: 'SUPPORTIVE SERVICES',
    svg: '<svg viewBox="0 0 100.845 129.089" aria-hidden="true" focusable="false"><path d="M819.526-2498.375a2.036,2.036,0,0,0-1.784,3.007,1.95,1.95,0,0,0,1.775,1.026h3.961a2.066,2.066,0,0,0,2-1.357,2.023,2.023,0,0,0-1.908-2.676h-4.042Zm-25.213-68.574h29.233a2.037,2.037,0,0,0,1.784-3.008,1.948,1.948,0,0,0-1.775-1.026H794.313a2.037,2.037,0,0,0-1.784,3.008,1.951,1.951,0,0,0,1.775,1.026Zm0-8.068h29.233a2.037,2.037,0,0,0,1.784-3.008,1.951,1.951,0,0,0-1.775-1.026H794.313a2.037,2.037,0,0,0-1.784,3.008,1.948,1.948,0,0,0,1.775,1.026Zm0,16.135h29.233a2.036,2.036,0,0,0,1.784-3.007,1.949,1.949,0,0,0-1.775-1.027H794.313a2.037,2.037,0,0,0-1.784,3.008,1.95,1.95,0,0,0,1.775,1.025Zm54.46,4.034H794.312a2.036,2.036,0,0,0-1.784,3.007,1.948,1.948,0,0,0,1.775,1.027h54.471a2.037,2.037,0,0,0,1.784-3.008,1.949,1.949,0,0,0-1.775-1.026Zm0,8.068H794.312a2.036,2.036,0,0,0-1.784,3.008,1.948,1.948,0,0,0,1.775,1.026h54.471a2.036,2.036,0,0,0,1.784-3.007,1.948,1.948,0,0,0-1.775-1.026Zm0,8.067H794.312a2.037,2.037,0,0,0-1.784,3.008,1.95,1.95,0,0,0,1.775,1.026h54.471a2.036,2.036,0,0,0,1.784-3.007,1.949,1.949,0,0,0-1.775-1.027Zm0,12.1a2.037,2.037,0,0,0,1.784-3.008,1.948,1.948,0,0,0-1.775-1.026H794.312a2.036,2.036,0,0,0-1.784,3.008,1.949,1.949,0,0,0,1.775,1.026h54.471Z" transform="translate(-780.197 2591.16)" fill="#97f1ff"/><path d="M782.224-2470.134a2.01,2.01,0,0,1-2.017-2v-117.013a1.985,1.985,0,0,1,1.966-2h43.414v22.335a5.913,5.913,0,0,0,5.911,5.9h23.333v38.918a7.99,7.99,0,0,1,3.026-.605,7.943,7.943,0,0,1,1.007.075v-39.47a6.042,6.042,0,0,0-1.9-4.392l-26.778-25.153a5.356,5.356,0,0,0-4.149-1.642H782.173a6.023,6.023,0,0,0-6,6.033v117.014a6.05,6.05,0,0,0,6.051,6.034H788.3a10.073,10.073,0,0,1-1.838-4.034Zm47.4-118.4,22.983,21.587H831.5a1.874,1.874,0,0,1-1.877-1.867Z" transform="translate(-776.173 2595.188)" fill="#fff"/></svg>',
  },
  {
    label: 'HOUSING ASSISTANCE',
    svg: '<svg viewBox="0 0 120.512 120.512" aria-hidden="true" focusable="false"><g transform="translate(-43)"><g transform="translate(43)"><path d="M1187.176-2363.22v5.491a1.929,1.929,0,0,0,1.269,1.866,1.889,1.889,0,0,0,2.5-1.786v-5.649a1.89,1.89,0,0,0-2.5-1.787A1.928,1.928,0,0,0,1187.176-2363.22Zm84.213-33.387-55.16-58.306c-.04-.042-.081-.082-.124-.119-2.244-1.974-6.167-2.261-9.325,1.011l-54.861,57.077a1.883,1.883,0,0,0,.049,2.662,1.884,1.884,0,0,0,2.662-.049l0,0,54.859-57.074c1.669-1.73,3.22-1.542,4.07-.844l55.091,58.233a1.941,1.941,0,0,0,2.662.074A1.884,1.884,0,0,0,1271.389-2396.607Z" transform="translate(-1151.391 2456.503)" fill="#97f1ff"/><path d="M1210.373-2349.528a15.068,15.068,0,0,0-16.777,14.969v30.131h-.006v3.766h30.134v-33.5A15.32,15.32,0,0,0,1210.373-2349.528Zm9.585,30.792v14.308h-22.6v-29.813a11.5,11.5,0,0,1,9.444-11.469,11.306,11.306,0,0,1,13.152,11.151Z" transform="translate(-1165.341 2421.173)" fill="#97f1ff"/></g></g></svg>',
  },
];

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Cell extractor — returns the inner cell element for a given row index.
  const cellOf = (i) => rows[i]?.firstElementChild;

  const titleCell = cellOf(0);
  const introCell = cellOf(1);
  const outroCell = cellOf(2);
  const ctaCell = cellOf(3);

  // Reuse an authored heading if present; otherwise wrap the cell text in an h2.
  let heading = titleCell?.querySelector('h1, h2, h3, h4, h5, h6');
  if (!heading && titleCell) {
    heading = document.createElement('h2');
    heading.textContent = titleCell.textContent.trim();
  }

  // Intro / outro paragraphs.
  const intro = document.createElement('p');
  intro.className = 'resources-intro';
  if (introCell) intro.textContent = introCell.textContent.trim();

  const outro = document.createElement('p');
  outro.className = 'resources-outro';
  if (outroCell) outro.textContent = outroCell.textContent.trim();

  // Icon columns grid.
  const grid = document.createElement('div');
  grid.className = 'resources-grid';
  COLUMNS.forEach(({ label, svg }) => {
    const col = document.createElement('div');
    col.className = 'resource-col';
    const iconWrap = document.createElement('span');
    iconWrap.className = 'resource-icon';
    iconWrap.innerHTML = svg;
    const h3 = document.createElement('h3');
    h3.textContent = label;
    col.append(iconWrap, h3);
    grid.append(col);
  });

  // Decorative watermark (full-bleed, behind content).
  const watermark = document.createElement('img');
  watermark.className = 'watermark';
  watermark.src = '/img/theroadhome/housing-focused.png';
  watermark.alt = '';
  watermark.setAttribute('aria-hidden', 'true');
  watermark.loading = 'lazy';

  // Content wrapper (max-width centered by the section scaffold).
  const container = document.createElement('div');
  container.className = 'resources-content';
  if (heading) container.append(heading);
  if (introCell) container.append(intro);
  container.append(grid);
  if (outroCell) container.append(outro);

  // CTA — clone the authored cell's anchor(s) so decorateButton() applies classes.
  if (ctaCell && ctaCell.querySelector('a')) {
    const actions = document.createElement('p');
    actions.className = 'resources-actions';
    [...ctaCell.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
    container.append(actions);
  }

  block.replaceChildren(watermark, container);
}
