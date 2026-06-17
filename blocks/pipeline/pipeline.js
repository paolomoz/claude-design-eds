/**
 * pipeline block
 *
 * Merges the prototype's loop-section intro (head) with the pipeline-scene
 * (body) into one product-flow section on --ink-deep.
 *
 * Authoring contract (block.children = rows, row.children = cells):
 *   row 0: eyebrow            | optional right-aligned meta
 *   row 1: heading (an <h2>)
 *   row 2: lede paragraph
 *   row 3: pipeline pills (one cell, items separated by commas or newlines)
 *   row 4..n: cards — each row is [ tag | heading | body ]
 *
 * EDS strips <span> inside cells, so the eyebrow and pipeline-row span/class
 * structure is re-created here. No JS ignite animation — pills render lit/static.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // The prototype renders the loop intro (eyebrow + head) on a light "dust"
  // band and the pipeline scene (pills + cards) on the dark "ink" band. Keep
  // those two full-bleed grounds distinct instead of flattening to one ink slab.
  const headBand = document.createElement('div');
  headBand.className = 'loop-head';
  const headInner = document.createElement('div');
  headInner.className = 'pipeline-inner';
  headBand.append(headInner);

  const inner = document.createElement('div');
  inner.className = 'pipeline-inner';

  // --- row 0: eyebrow ("02 · THE LOOP" + optional right meta) ---
  const eyebrowRow = rows[0];
  if (eyebrowRow) {
    const cells = [...eyebrowRow.children];
    const eyebrow = document.createElement('div');
    eyebrow.className = 'eyebrow';

    const main = (cells[0]?.textContent || '').trim();
    // split a leading numeric token ("02") from the label, joined with a sep dot
    const match = main.match(/^(\d+)\s*[·.\-:]?\s*(.*)$/);
    if (match) {
      const [, numText, labelText] = match;
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = numText;
      const sep = document.createElement('span');
      sep.className = 'sep';
      sep.textContent = '·';
      const label = document.createElement('span');
      label.textContent = labelText;
      eyebrow.append(num, sep, label);
    } else if (main) {
      const label = document.createElement('span');
      label.textContent = main;
      eyebrow.append(label);
    }

    const meta = (cells[1]?.textContent || '').trim();
    if (meta) {
      const right = document.createElement('span');
      right.className = 'right';
      right.textContent = meta;
      eyebrow.append(right);
    }

    headInner.append(eyebrow);
  }

  // --- rows 1 + 2: head (heading + lede) ---
  const head = document.createElement('div');
  head.className = 'head';

  const headingCell = rows[1]?.firstElementChild;
  if (headingCell) {
    // reuse an authored heading element if present (server-visible, avoid nesting)
    const authored = headingCell.querySelector('h1, h2, h3, h4, h5, h6');
    if (authored) {
      head.append(authored);
    } else if (headingCell.textContent.trim()) {
      const h2 = document.createElement('h2');
      h2.textContent = headingCell.textContent.trim();
      head.append(h2);
    }
  }

  const ledeCell = rows[2]?.firstElementChild;
  if (ledeCell && ledeCell.textContent.trim()) {
    const lede = document.createElement('p');
    lede.className = 'lede';
    lede.textContent = ledeCell.textContent.trim();
    head.append(lede);
  }

  if (head.children.length) headInner.append(head);

  // --- row 3: pipeline row of mono pills (re-created in JS, rendered static) ---
  const pillCell = rows[3]?.firstElementChild;
  if (pillCell) {
    const raw = (pillCell.textContent || '').trim();
    const pills = raw.split(/[,\n›>·]+/).map((s) => s.trim()).filter(Boolean)
      // the "stardust" lead is rendered as the static .lead label below, so
      // drop it from the pill list to avoid a duplicate "STARDUST" pill.
      .filter((s) => s.toLowerCase() !== 'stardust');
    if (pills.length) {
      const pipelineRow = document.createElement('div');
      pipelineRow.className = 'pipeline-row';

      const lead = document.createElement('span');
      lead.className = 'lead';
      lead.textContent = 'stardust';
      pipelineRow.append(lead);

      pills.forEach((text, i) => {
        const pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = text;
        pipelineRow.append(pill);
        if (i < pills.length - 1) {
          const arrow = document.createElement('span');
          arrow.className = 'arrow';
          arrow.textContent = '›';
          pipelineRow.append(arrow);
        }
      });

      inner.append(pipelineRow);
    }
  }

  // --- rows 4..n: 3-card grid ---
  const cardRows = rows.slice(4);
  if (cardRows.length) {
    const three = document.createElement('div');
    three.className = 'three';

    cardRows.forEach((row) => {
      const cells = [...row.children];
      const card = document.createElement('div');
      card.className = 'card';

      const tagText = (cells[0]?.textContent || '').trim();
      if (tagText) {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.textContent = tagText;
        card.append(tag);
      }

      const headingCellCard = cells[1];
      if (headingCellCard) {
        const authored = headingCellCard.querySelector('h1, h2, h3, h4, h5, h6');
        if (authored) {
          card.append(authored);
        } else if (headingCellCard.textContent.trim()) {
          const h3 = document.createElement('h3');
          h3.textContent = headingCellCard.textContent.trim();
          card.append(h3);
        }
      }

      const bodyCell = cells[2];
      if (bodyCell && bodyCell.textContent.trim()) {
        const p = document.createElement('p');
        p.innerHTML = bodyCell.innerHTML;
        card.append(p);
      }

      three.append(card);
    });

    inner.append(three);
  }

  block.textContent = '';
  if (headInner.children.length) block.append(headBand);
  block.append(inner);
}
