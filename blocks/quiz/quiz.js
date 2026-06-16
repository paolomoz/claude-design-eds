/**
 * quiz — Fréscopa Fable coffee quiz (sequential interactive flow).
 *
 * One self-contained stateful block reproducing the prototype's React app: a
 * four-chapter quiz that walks intro → 4 questions → a "brewing" loader →
 * a computed roast result. Block JS runs in EDS, so the state machine, scoring,
 * brewing timeout and retake are all wired here (the inverse of #29: a
 * sequential-from-one-entry flow is ONE block with an internal view state, not
 * multiple pages).
 *
 * Authoring rows (keyed by the first cell):
 *   intro    | eyebrow | headline (may contain <br>) | lede | button label | fineprint
 *   chapter  | chapterId | numeral | title | lede
 *   option   | chapterId | optionId | icon name | label | note | beans (strength only)
 *   opener   | ritual optionId | result opener text
 *   brewtip  | brew optionId | result brew tip
 *   roast    | name | roast label | tone (hex) | beans (1-5) | notes (comma list) | story
 *   brewing  | headline | lede
 *   result   | eyebrow | intensity label | primary CTA | secondary CTA
 *
 * Roast is chosen the way the prototype does: flavor index + strength index,
 * averaged and rounded, clamped into the roast list.
 */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------- icons */
/* Inline SVG, lifted from the prototype's line-icon set (48×48, stroke =
   currentColor). Kept inside the owning block — no shared icon utility. */

function fIcon(paths, size = 48) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none"
    stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${paths}</svg>`;
}

const ICONS = {
  sunrise: '<path d="M10 32h28"/><path d="M16 32a8 8 0 0 1 16 0"/><path d="M24 12v4M11 19l2.8 2.8M37 19l-2.8 2.8M6 38h36"/>',
  rush: '<circle cx="27" cy="24" r="11"/><path d="M27 17v7l5 3"/><path d="M6 19h8M4 25h7M6 31h8"/>',
  company: '<path d="M14 26c0-3 2.4-5 5.5-5"/><circle cx="17" cy="15" r="4.5"/><circle cx="31" cy="15" r="4.5"/><path d="M8 36c0-5 4-8 9-8s9 3 9 8M30 28c5 0 10 3 10 8"/>',
  outdoors: '<path d="M6 38l10-18 7 12 5-8 10 14z"/><circle cx="33" cy="12" r="4"/>',
  citrus: '<circle cx="24" cy="26" r="12"/><path d="M24 14v24M14 20l20 12M14 32l20-12"/><path d="M28 8c-2 2-6 2-8 0"/>',
  nut: '<path d="M24 8c8 0 13 5 13 12 0 9-6 18-13 20-7-2-13-11-13-20 0-7 5-12 13-12z"/><path d="M24 8c0 8-5 10-5 16 0 5 3 9 5 10"/>',
  chocolate: '<rect x="10" y="10" width="28" height="28" rx="2"/><path d="M24 10v28M10 24h28"/><path d="M17 17h0M31 31h0"/>',
  flame: '<path d="M24 6c2 7 11 10 11 20a11 11 0 0 1-22 0c0-6 4-9 6-13 1.4 2.4 3 4 5 5-1-4-1-8 0-12z"/><path d="M24 40a6 6 0 0 1-4-10"/>',
  espresso: '<rect x="10" y="6" width="28" height="8" rx="1.5"/><path d="M14 14v6h20v-6M19 20v3M29 20v3"/><path d="M18 30h12v4a6 6 0 0 1-12 0z"/><path d="M12 42h24"/>',
  pourover: '<path d="M12 12h24l-8 12h-8z"/><path d="M24 24v6"/><path d="M14 36h20v4a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2z"/><path d="M8 12h32"/>',
  frenchpress: '<rect x="13" y="14" width="20" height="26" rx="2"/><path d="M24 14V8M19 8h10"/><path d="M13 26h20"/><path d="M33 20h5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5"/>',
  pod: '<path d="M12 16h24l-3 22H15z"/><ellipse cx="24" cy="16" rx="12" ry="4"/><path d="M17 27h14"/>',
};

function beanSVG(size = 17) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none"
    stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true"><path d="M33 9c7 7 7 19-1 26S13 42 9 38 6 21 14 14 26 2 33 9z"/>
    <path d="M31 11c-7 7-3 13-9 19s-10 5-11 7"/></svg>`;
}

function brewCupSVG() {
  return `<svg width="170" height="170" viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <g stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M30 52h56v14a28 28 0 0 1-56 0z"/><path d="M86 56h7a8 8 0 0 1 0 16h-8"/><path d="M24 102h68"/>
    </g>
    <g class="steam" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none">
      <path class="steam-1" d="M46 38c0-6 6-6 6-12"/><path class="steam-2" d="M58 40c0-7 6-7 6-14"/>
      <path class="steam-3" d="M70 38c0-6 6-6 6-12"/>
    </g></svg>`;
}

function roastBagSVG(tone) {
  return `<svg width="190" height="230" viewBox="0 0 120 145" fill="none" aria-hidden="true">
    <path d="M34 30h52v94a8 8 0 0 1-8 8H42a8 8 0 0 1-8-8z" fill="#FFFCF7" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <path d="M34 30l6-16h40l6 16" fill="#FFFCF7" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <path d="M40 14h40M34 30h52" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <rect x="34" y="58" width="52" height="34" fill="${tone}"/>
    <rect x="34" y="58" width="52" height="34" stroke="currentColor" stroke-width="3"/>
    <g transform="translate(48 63) scale(0.5)" stroke="#FFFCF7" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M33 9c7 7 7 19-1 26S13 42 9 38 6 21 14 14 26 2 33 9z"/><path d="M31 11c-7 7-3 13-9 19s-10 5-11 7"/>
    </g>
    <path d="M44 104h32M44 112h22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
}

function beanRating(filled, total) {
  const beans = Array.from({ length: total }, (_, i) => `<span class="bean${i < filled ? ' on' : ''}">${beanSVG(17)}</span>`).join('');
  return `<div class="bean-rating" aria-label="Intensity ${filled} of ${total}">${beans}</div>`;
}

/* ---------------------------------------------------------------- parsing */

function text(cell) { return cell ? cell.textContent.trim() : ''; }

function parse(block) {
  const data = {
    chapters: [],
    optionsByChapter: {},
    openers: {},
    brewtips: {},
    roasts: [],
    intro: {},
    brewing: {},
    result: {},
  };
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const key = text(cells[0]).toLowerCase();
    const c = (i) => text(cells[i]);
    if (key === 'intro') {
      data.intro = {
        eyebrow: c(1),
        headline: cells[2] ? cells[2].innerHTML.trim() : '',
        lede: c(3),
        button: c(4),
        fineprint: c(5),
      };
    } else if (key === 'chapter') {
      data.chapters.push({
        id: c(1),
        numeral: c(2),
        title: c(3),
        lede: c(4),
      });
    } else if (key === 'option') {
      const id = c(1);
      const opt = {
        id: c(2),
        icon: c(3).toLowerCase(),
        label: c(4),
        note: c(5),
        beans: c(6),
      };
      (data.optionsByChapter[id] = data.optionsByChapter[id] || []).push(opt);
    } else if (key === 'opener') {
      data.openers[c(1)] = c(2);
    } else if (key === 'brewtip') {
      data.brewtips[c(1)] = c(2);
    } else if (key === 'roast') {
      data.roasts.push({
        name: c(1),
        roast: c(2),
        tone: c(3),
        beans: parseInt(c(4), 10) || 0,
        notes: c(5).split(',').map((n) => n.trim()).filter(Boolean),
        story: c(6),
      });
    } else if (key === 'brewing') {
      data.brewing = { headline: c(1), lede: c(2) };
    } else if (key === 'result') {
      data.result = {
        eyebrow: c(1),
        intensity: c(2),
        primary: c(3),
        secondary: c(4),
      };
    }
  });
  return data;
}

function pickRoast(data, answers) {
  const flavorCh = data.chapters.find((ch) => ch.id === 'flavor');
  const strengthCh = data.chapters.find((ch) => ch.id === 'strength');
  const idxIn = (ch) => {
    if (!ch) return 1;
    const opts = data.optionsByChapter[ch.id] || [];
    const i = opts.findIndex((o) => o.id === answers[ch.id]);
    return i < 0 ? 1 : i;
  };
  const f = idxIn(flavorCh);
  const s = idxIn(strengthCh);
  const i = Math.max(0, Math.min(data.roasts.length - 1, Math.round((f + s) / 2)));
  return data.roasts[i];
}

/* ---------------------------------------------------------------- views */

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

function dotClass(i, stepIndex) {
  if (i < stepIndex) return 'progress-dot done';
  if (i === stepIndex) return 'progress-dot here';
  return 'progress-dot';
}

function progress(stepIndex, total) {
  const dots = Array.from({ length: total }, (_, i) => `<span class="${dotClass(i, stepIndex)}">${beanSVG(15)}</span>`).join('');
  return `<div class="progress" aria-label="Question ${Math.min(stepIndex + 1, total)} of ${total}">${dots}</div>`;
}

function introView(data, on) {
  const card = el('div', 'stage-card intro');
  card.dataset.screenLabel = 'Intro';
  const copy = el('div', 'intro-copy');
  copy.innerHTML = `
    <p class="eyebrow">${data.intro.eyebrow}</p>
    <h1>${data.intro.headline}</h1>
    <p class="lede">${data.intro.lede}</p>`;
  const btn = el('button', 'btn btn-primary', data.intro.button);
  btn.type = 'button';
  btn.addEventListener('click', on.start);
  copy.append(btn);
  copy.insertAdjacentHTML('beforeend', `<p class="fineprint">${data.intro.fineprint}</p>`);
  const art = el('div', 'intro-art', `<div class="art-circle">${brewCupSVG()}</div>`);
  card.append(copy, art);
  return card;
}

function questionView(data, stepIndex, answers, on) {
  const ch = data.chapters[stepIndex];
  const opts = data.optionsByChapter[ch.id] || [];
  const card = el('div', 'stage-card question');
  card.dataset.screenLabel = ch.numeral;
  card.innerHTML = `
    <div class="question-head">
      ${progress(stepIndex, data.chapters.length)}
      <p class="eyebrow">${ch.numeral}</p>
      <h1>${ch.title}</h1>
      <p class="lede">${ch.lede}</p>
    </div>`;
  const optionsEl = el('div', 'options');
  opts.forEach((o) => {
    const picked = answers[ch.id] === o.id ? ' picked' : '';
    const btn = el('button', `option-card${picked}`);
    btn.type = 'button';
    const visual = o.beans
      ? `<span class="option-beans">${beanRating(parseInt(o.beans, 10) || 0, 4)}</span>`
      : `<span class="option-icon">${fIcon(ICONS[o.icon] || '', 48)}</span>`;
    btn.innerHTML = `${visual}<span class="option-label">${o.label}</span><span class="option-note">${o.note}</span>`;
    btn.addEventListener('click', () => on.pick(ch.id, o.id, stepIndex));
    optionsEl.append(btn);
  });
  card.append(optionsEl);
  const foot = el('div', 'question-foot');
  const back = el('button', 'btn btn-ghost', '← Back');
  back.type = 'button';
  back.addEventListener('click', on.back);
  foot.append(back);
  card.append(foot);
  return card;
}

function brewingView(data) {
  const card = el('div', 'stage-card brewing');
  card.dataset.screenLabel = 'Brewing';
  card.innerHTML = `
    <div class="brew-art">${brewCupSVG()}</div>
    <h1>${data.brewing.headline}</h1>
    <p class="lede">${data.brewing.lede}</p>`;
  return card;
}

function resultView(data, answers, on) {
  const roast = pickRoast(data, answers);
  const opener = data.openers[answers.ritual] || 'For your mornings';
  const tip = data.brewtips[answers.brew];
  const card = el('div', 'stage-card result');
  card.dataset.screenLabel = 'Result';
  const art = el('div', 'result-art', roastBagSVG(roast.tone));
  art.style.color = 'var(--maroon)';
  const copy = el('div', 'result-copy');
  copy.innerHTML = `
    <p class="eyebrow">${data.result.eyebrow}</p>
    <h1>${roast.name}</h1>
    <p class="roast-kind" style="color:${roast.tone}">${roast.roast}</p>
    <p class="lede">${opener}, we prescribe ${roast.story}</p>
    <div class="notes-row">${roast.notes.map((n) => `<span class="note-chip">${n}</span>`).join('')}</div>
    <div class="intensity-row">
      <span class="intensity-label">${data.result.intensity}</span>
      ${beanRating(roast.beans, 5)}
    </div>
    ${tip ? `<p class="brew-tip"><strong>Brew it your way · </strong>${tip}</p>` : ''}`;
  const ctas = el('div', 'cta-row');
  const add = el('button', 'btn btn-primary', data.result.primary);
  add.type = 'button';
  const retake = el('button', 'btn btn-ghost', data.result.secondary);
  retake.type = 'button';
  retake.addEventListener('click', on.retake);
  ctas.append(add, retake);
  copy.append(ctas);
  card.append(art, copy);
  return card;
}

/* ---------------------------------------------------------------- decorate */

export default async function decorate(block) {
  const data = parse(block);
  if (!data.chapters.length) return;

  const state = { view: 'intro', step: 0, answers: {} };
  let brewTimer = null;

  // Scoped under the block element (never a <main> or bare main>div) so the
  // section reset can't hide the swapped views (#32).
  const stage = el('div', 'stage');
  block.replaceChildren(stage);

  function render() {
    if (brewTimer) { clearTimeout(brewTimer); brewTimer = null; }

    // Handlers are built per render so they can recurse into render() without a
    // forward reference; each mutates state then re-renders the active view.
    const on = {
      start: () => { state.view = 'question'; state.step = 0; render(); },
      pick: (chapterId, optionId, stepIndex) => {
        state.answers = { ...state.answers, [chapterId]: optionId };
        // reflect the pick immediately, then advance after a beat
        const cards = [...stage.querySelectorAll('.option-card')];
        cards.forEach((c) => c.classList.remove('picked'));
        const opts = data.optionsByChapter[chapterId] || [];
        const i = opts.findIndex((o) => o.id === optionId);
        if (cards[i]) cards[i].classList.add('picked');
        setTimeout(() => {
          if (stepIndex + 1 < data.chapters.length) {
            state.step = stepIndex + 1;
            state.view = 'question';
          } else {
            state.view = 'brewing';
          }
          render();
        }, 220);
      },
      back: () => {
        if (state.step <= 0) state.view = 'intro';
        else state.step -= 1;
        render();
      },
      retake: () => {
        state.answers = {};
        state.step = 0;
        state.view = 'intro';
        render();
      },
    };

    let card;
    if (state.view === 'intro') card = introView(data, on);
    else if (state.view === 'question') card = questionView(data, state.step, state.answers, on);
    else if (state.view === 'brewing') card = brewingView(data);
    else card = resultView(data, state.answers, on);

    // fresh .stage-anim each render → replays the entry animation (React key)
    const anim = el('div', 'stage-anim');
    anim.append(card);
    stage.replaceChildren(anim);

    if (state.view === 'brewing') {
      brewTimer = setTimeout(() => { state.view = 'result'; render(); }, REDUCED ? 600 : 2300);
    }
  }

  render();
}
