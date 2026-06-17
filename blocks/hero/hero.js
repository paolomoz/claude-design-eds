/*
 * hero — primary pitch (Stardust home-A-cinematic header.hero).
 *
 * Authored rows (queried, not hard-indexed — #42):
 *   - pre-eyebrow  : a short mono line, hex codes + tag (link-free <p>, before <h1>)
 *   - headline     : the page <h1> (reused if a heading element is authored)
 *   - lede         : a short Times-italic sentence (link-free <p>, after <h1>)
 *   - hero-body    : the longer body paragraph (link-free <p>)
 *   - cta cell     : <strong><a> primary / <em><a> secondary — cloned into .actions
 *
 * The seed-display panel and the chip row are token/structural UI: EDS strips
 * <span>s from cells, so their inner structure is re-created here in decorate().
 * Date / seed values are static text (no JS clock).
 */

// static seed values lifted from the prototype
const SEED_DATE = '2026-05-25';
const SEED_HEX = 'a3f7c9';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function buildPreEyebrow() {
  const row = el('div', 'pre-eyebrow');
  ['a3f7', 'c92e', 'b1d4', '8a0c'].forEach((hex) => row.append(el('span', 'hex', hex)));
  row.append(el('span', 'sep', '·'));
  row.append(el('span', null, '00'));
  row.append(el('span', 'sep', '·'));
  row.append(el('span', 'tag', 'STARDUST'));
  return row;
}

function buildSeedDisplay() {
  const panel = el('div', 'seed-display-large');

  const label = el('span', 'label');
  label.append(el('span', 'pulse'));
  label.append(document.createTextNode("Today's seed"));
  panel.append(label);

  panel.append(el('span', 'token', 'Stardust'));
  panel.append(el('span', 'arrow', '·'));
  panel.append(el('span', 'token', SEED_DATE));
  panel.append(el('span', 'arrow', '→'));
  panel.append(el('span', 'term', 'md5'));
  panel.append(el('span', 'arrow', '→'));
  panel.append(el('span', 'hex', SEED_HEX));
  panel.append(el('span', 'arrow', '→'));
  panel.append(el('span', 'term', 'palette × decade × craft × register'));
  return panel;
}

function buildChip(className, parts) {
  const chip = el('span', className ? `chip ${className}` : 'chip');
  parts.forEach((part) => {
    if (part.swatches) {
      const wrap = el('span', 'swatches');
      part.swatches.forEach((color) => {
        const i = el('i');
        i.style.background = color;
        wrap.append(i);
      });
      chip.append(wrap);
    } else {
      chip.append(el('span', part.op ? 'op' : null, part.text));
    }
  });
  return chip;
}

function buildChipRow() {
  const row = el('div', 'chip-row');
  row.append(buildChip('solid', [
    { text: 'BRIEF' }, { op: true, text: '+' }, { text: 'SEED' },
    { op: true, text: '=' }, { text: 'STAR' },
  ]));
  row.append(buildChip(null, [{ text: `TODAY · ${SEED_DATE}` }]));
  row.append(buildChip(null, [
    { text: '3 of 127 palettes' },
    { swatches: ['#E8B95E', '#3A4A6B', '#F5F0E6'] },
  ]));
  row.append(buildChip(null, [{ text: 'CURATED' }]));
  row.append(buildChip(null, [{ text: 'DETERMINISTIC' }]));
  row.append(buildChip(null, [{ text: 'OPEN SOURCE' }]));
  row.append(buildChip(null, [{ text: 'APACHE 2.0' }]));
  return row;
}

export default async function decorate(block) {
  // Query content rather than hard-indexing rows (#42).
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  const paras = [...block.querySelectorAll('p')];
  const linkFree = paras.filter((p) => !p.querySelector('a'));
  const ctaCell = paras.find((p) => p.querySelector('a'))?.closest('div')
    || [...block.querySelectorAll('div')].find((d) => d.querySelector('a'));

  // The pre-eyebrow is decorative hex/tag content re-created from static values,
  // so it is NOT read from the authored copy. lede = the short Times-italic line
  // AFTER the heading; hero-body = the longer paragraph after it (#51).
  // Document order is established by walking all candidate elements once.
  let lede = null;
  let body = null;
  if (heading) {
    const ordered = [...block.querySelectorAll('h1, h2, h3, h4, h5, h6, p')];
    const after = ordered
      .slice(ordered.indexOf(heading) + 1)
      .filter((p) => p.tagName === 'P' && !p.querySelector('a'));
    if (after.length) {
      [lede] = after;
      body = after.slice(1).sort((a, b) => b.textContent.length - a.textContent.length)[0] || null;
    }
  } else if (linkFree.length) {
    [lede, body] = [linkFree[0], linkFree[1]];
  }

  const wrap = el('div', 'wrap');

  // pre-eyebrow: prefer authored text, but re-create the styled span structure.
  wrap.append(buildPreEyebrow());

  // headline — reuse the authored heading element (server-visible, avoids nesting).
  if (heading) {
    wrap.append(heading);
  }

  if (lede) {
    lede.classList.add('lede');
    wrap.append(lede);
  }

  if (body) {
    body.classList.add('hero-body');
    wrap.append(body);
  }

  wrap.append(buildSeedDisplay());
  wrap.append(buildChipRow());

  // CTAs — clone the authored cell's children into .actions; the EDS link
  // decorator applies .btn.primary / .btn.secondary from <strong>/<em> wraps.
  if (ctaCell && ctaCell.querySelector('a')) {
    const actions = el('div', 'actions');
    [...ctaCell.childNodes].forEach((n) => actions.append(n.cloneNode(true)));
    wrap.append(actions);
  }

  block.replaceChildren(wrap);
}
