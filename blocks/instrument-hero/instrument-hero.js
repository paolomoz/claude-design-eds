/**
 * instrument-hero — primary-message hero "tuned like a measurement instrument".
 *
 * The page authors this block as ONE row with ONE cell holding all elements as
 * flat siblings (#62). We flatten-first, then classify by content:
 *   - the <h1> (or first heading)            → broadcast headline
 *   - the LABEL eyebrow ('PRIMARY CHANNEL …') → short uppercase line before <h1>
 *   - the lede <p>                            → sentence-length link-free <p>
 *   - link-bearing nodes                      → CTAs (.ctas)
 *   - the top telemetry tape                  → '·'-delimited mono line(s)
 *   - the telemetry tiles                     → illustrative, built from JS data
 *
 * The breathing-dots canvas (#field) background + the page H1 accent spans are
 * recreated in JS because EDS strips block-cell <span>s (#39). The ::after
 * radial vignette stays in CSS. prefers-reduced-motion is honored.
 */

const SVGNS = 'http://www.w3.org/2000/svg';

/* the three illustrative telemetry tiles (PLACEHOLDER — design fixture) */
const TILES = [
  {
    mod: '',
    label: 'POSTS · INDEXED',
    val: '8',
    unit: 'total',
    delta: '▲ +1 this week · 12 yr rolling',
    stroke: '#1ba89f',
    points: '0,18 25,15 50,16 75,13 100,14 125,10 150,11 175,7 200,4',
  },
  {
    mod: 'm',
    label: 'SUBSCRIBERS · 30D',
    val: '+128',
    unit: 'delta',
    delta: '▲ +18% MoM',
    stroke: '#cf2f5a',
    points: '0,20 25,17 50,15 75,16 100,13 125,9 150,11 175,6 200,3',
  },
  {
    mod: 'o',
    label: 'SESSION · NOW',
    val: '12',
    unit: 'readers',
    delta: '▲ peak: 31 @ 14:02',
    stroke: '#f29823',
    points: '0,16 12,14 24,18 36,12 48,20 60,8 72,14 84,10 96,16 108,6 120,12 132,18 144,4 156,12 168,8 180,14 192,10 200,12',
  },
];

/* the top telemetry tape cells (mono key/value row) */
const TAPE = [
  { k: 'station', v: 'AR · 14' },
  { k: 'since', v: '2014' },
  { k: 'channel', v: 'measurement / adobe', c: 't' },
  { k: 'host', v: 'eric matisoff', c: 'm' },
  { k: 'last_signal', v: '2026-05-08 · cja-mcp' },
  {
    k: 'refresh', v: 'auto', c: 'ok', push: true,
  },
];

/** Collect the block's content nodes, flatten-first (#62/#68 cascade). */
function collectNodes(block) {
  let nodes = [...block.querySelectorAll(':scope > div > div > *')];
  if (!nodes.length) nodes = [...block.children].filter((n) => n.nodeType === 1);
  return nodes;
}

/** Rebuild the H1 with .em / .horn accent spans (#39 — spans are stripped). */
function decorateHeadline(h1) {
  const raw = h1.textContent.trim();
  // Expected: "Analytics Rockstar 🤘" → em-wrap "Rockstar", horn-wrap "🤘".
  const m = raw.match(/^(.*?)\s+(Rockstar)\s*(🤘)?\s*$/i);
  if (!m) return;
  const [, lead, word, hornChar] = m;
  h1.textContent = '';
  h1.append(document.createTextNode(`${lead} `));
  const em = document.createElement('span');
  em.className = 'em';
  em.textContent = word;
  h1.append(em);
  if (hornChar) {
    h1.append(document.createTextNode(' '));
    const horn = document.createElement('span');
    horn.className = 'horn';
    horn.textContent = hornChar;
    h1.append(horn);
  }
}

function buildTopTape() {
  const tape = document.createElement('div');
  tape.className = 'top-tape';
  const led = document.createElement('span');
  led.className = 'led';
  led.setAttribute('aria-hidden', 'true');
  tape.append(led);
  TAPE.forEach((t) => {
    const cell = document.createElement('span');
    cell.className = 'cell';
    if (t.push) cell.style.marginLeft = 'auto';
    const k = document.createElement('span');
    k.className = 'k';
    k.textContent = t.k;
    const v = document.createElement('span');
    v.className = `v${t.c ? ` ${t.c}` : ''}`;
    v.textContent = t.v;
    cell.append(k, v);
    tape.append(cell);
  });
  return tape;
}

function buildSpark(stroke, points) {
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'spark');
  svg.setAttribute('viewBox', '0 0 200 24');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const line = document.createElementNS(SVGNS, 'polyline');
  line.setAttribute('points', points);
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', stroke);
  line.setAttribute('stroke-width', '2');
  svg.append(line);
  return svg;
}

function buildTelemetryStack() {
  const stack = document.createElement('div');
  stack.className = 'telemetry-stack';
  TILES.forEach((t) => {
    const tile = document.createElement('div');
    tile.className = `telemetry-tile${t.mod ? ` ${t.mod}` : ''}`;

    const top = document.createElement('div');
    top.className = 'top';
    const lbl = document.createElement('span');
    lbl.textContent = t.label;
    const ph = document.createElement('span');
    ph.className = 'ph';
    ph.textContent = 'PLACEHOLDER';
    top.append(lbl, ph);

    const val = document.createElement('div');
    val.className = 'val';
    val.append(document.createTextNode(t.val));
    const unit = document.createElement('span');
    unit.className = 'unit';
    unit.textContent = t.unit;
    val.append(unit);

    const delta = document.createElement('div');
    delta.className = 'delta';
    delta.textContent = t.delta;

    tile.append(top, val, delta, buildSpark(t.stroke, t.points));
    stack.append(tile);
  });
  return stack;
}

/* ─── Breathing dots — Canvas 2D (clean-room adapt of nebula S19) ─── */
function startField(canvas) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  const COLS = 70;
  const ROWS = 70;
  const ZOOM = 14;
  const WAVE_PERIOD = 4.2;
  const WAVE_AMP = 0.4;
  const COLORS = ['#f29823', '#cf2f5a', '#1ba89f'];
  const BG = '#050913';

  const dots = [];
  for (let i = 0; i < COLS * ROWS; i += 1) {
    const x0 = (i % COLS) - COLS / 2;
    const y0 = Math.floor(i / COLS) - ROWS / 2 + (i % 2) * 0.5;
    const x = x0 + (Math.random() - 0.5) * 0.3;
    const y = y0 + (Math.random() - 0.5) * 0.3;
    const len = Math.sqrt(x * x + y * y);
    const ang = Math.atan2(y, x);
    const dist = len + Math.cos(Math.abs(ang) * 8) * 0.5;
    dots.push({ x, y, dist });
  }

  const buffers = [
    document.createElement('canvas'),
    document.createElement('canvas'),
    document.createElement('canvas'),
  ];
  const bufCtxs = buffers.map((b) => b.getContext('2d'));

  let W;
  let H;
  let cx;
  let cy;
  function resize() {
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    W = Math.floor(rect.width * dpr);
    H = Math.floor(rect.height * dpr);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    cx = W / 2;
    cy = H / 2;
    buffers.forEach((b) => {
      b.width = W;
      b.height = H;
    });
  }
  resize();
  window.addEventListener('resize', resize);

  function roundedSquareWave(t, delta, a, f) {
    return ((2 * a) / Math.PI) * Math.atan(Math.sin(2 * Math.PI * t * f) / delta);
  }

  function drawDotsTo(bufCtx, t, color) {
    bufCtx.clearRect(0, 0, W, H);
    bufCtx.fillStyle = color;
    const scale = ZOOM * (W / canvas.getBoundingClientRect().width);
    const dotR = 0.16 * scale;
    for (let i = 0; i < dots.length; i += 1) {
      const d = dots[i];
      const phase = t - d.dist / 25;
      const wave = roundedSquareWave(phase, 0.15 + (0.2 * d.dist) / 72, WAVE_AMP, 1 / WAVE_PERIOD);
      const m = wave + 1.3;
      const sx = cx + d.x * m * scale;
      const sy = cy + d.y * m * scale;
      bufCtx.beginPath();
      bufCtx.arc(sx, sy, dotR, 0, Math.PI * 2);
      bufCtx.fill();
    }
  }

  let frameIdx = 0;
  const startMs = performance.now();
  function tick(now) {
    const t = reduced ? 0 : (now - startMs) / 1000;
    const bufI = frameIdx % 3;
    drawDotsTo(bufCtxs[bufI], t, COLORS[bufI]);
    frameIdx += 1;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    buffers.forEach((b) => ctx.drawImage(b, 0, 0));
    ctx.globalCompositeOperation = 'source-over';
    if (!reduced) requestAnimationFrame(tick);
  }
  // Even under reduced motion, draw one frame so the canvas is not empty.
  requestAnimationFrame(tick);
}

export default async function decorate(block) {
  const nodes = collectNodes(block);

  // classify content nodes
  const heading = nodes.find((n) => n.matches('h1, h2, h3, h4, h5, h6')
    || n.querySelector('h1, h2, h3, h4, h5, h6'));
  const headingEl = heading
    && (heading.matches('h1, h2, h3, h4, h5, h6')
      ? heading : heading.querySelector('h1, h2, h3, h4, h5, h6'));

  const paras = nodes.filter((n) => n.tagName === 'P' || n.matches('p'));
  // eyebrow = short uppercase link-free line before the heading; lede = the
  // longer link-free sentence; CTAs live in link-bearing nodes.
  const linkNodes = nodes.filter((n) => n.matches('a') || n.querySelector('a'));
  const textParas = paras.filter((p) => !p.querySelector('a'));
  const headingIdx = heading ? nodes.indexOf(heading) : -1;
  const isLede = (p) => p.textContent.trim().length > 30;
  const lede = textParas.find((p) => nodes.indexOf(p) > headingIdx && isLede(p))
    || textParas.find(isLede);

  // --- build the prototype DOM ---
  const overlay = document.createElement('div');
  overlay.className = 'broadcast-overlay';
  const lowerThird = document.createElement('div');
  lowerThird.className = 'lower-third';

  // top tape (recreated — it's a fixed mono telemetry row, spans stripped #39)
  lowerThird.append(buildTopTape());

  // stack: 2fr headline / 1fr telemetry
  const stack = document.createElement('div');
  stack.className = 'stack';

  const headline = document.createElement('div');
  headline.className = 'broadcast-headline';

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = 'PRIMARY CHANNEL · CH 01';
  headline.append(label);

  if (headingEl) {
    const h1 = document.createElement('h1');
    h1.append(...headingEl.childNodes);
    decorateHeadline(h1);
    headline.append(h1);
  }

  if (lede) {
    const p = document.createElement('p');
    p.append(...lede.childNodes);
    headline.append(p);
  }

  // CTAs — clone authored link cells, let decorateButton apply .btn classes (#4)
  if (linkNodes.length) {
    const ctas = document.createElement('div');
    ctas.className = 'ctas';
    linkNodes.forEach((n) => {
      [...n.childNodes].forEach((child) => ctas.append(child.cloneNode(true)));
    });
    headline.append(ctas);
  }

  stack.append(headline);
  stack.append(buildTelemetryStack());
  lowerThird.append(stack);
  overlay.append(lowerThird);

  // breathing-dots canvas background (full-bleed)
  const canvas = document.createElement('canvas');
  canvas.className = 'field';
  canvas.setAttribute('aria-hidden', 'true');

  block.replaceChildren(canvas, overlay);

  startField(canvas);
}
