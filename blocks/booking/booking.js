/**
 * booking — Meridian Airways hero + the full booking flow as one interactive
 * block: search → results → seat map → confirmation. Reproduces the React app's
 * view state machine + flight/seat logic (ported from meridian-data.js +
 * meridian-pages.jsx) in block JS.
 *
 * Authoring rows (the hero copy; the flow is generated):
 *   1. eyebrow   e.g. "Long-haul, done lightly"
 *   2. title     e.g. "Chase the<br>light." (a <br> is preserved)
 *   3. sub       e.g. "Nonstop from London to the places worth the flight time."
 */

/* eslint-disable no-bitwise, no-use-before-define */
/* the seeded RNG needs bitwise ops; render()/render*() are mutually recursive (hoisted) */

const AIRPORTS = [
  { code: 'LHR', city: 'London' }, { code: 'JFK', city: 'New York' }, { code: 'LAX', city: 'Los Angeles' },
  { code: 'MIA', city: 'Miami' }, { code: 'BOS', city: 'Boston' }, { code: 'SFO', city: 'San Francisco' },
  { code: 'DEL', city: 'Delhi' }, { code: 'JNB', city: 'Johannesburg' }, { code: 'BGI', city: 'Barbados' },
  { code: 'MLE', city: 'Malé' },
];
const DURATIONS = {
  JFK: 475,
  LAX: 660,
  MIA: 565,
  BOS: 445,
  SFO: 655,
  DEL: 525,
  JNB: 680,
  BGI: 520,
  MLE: 615,
  LHR: 480,
};
const AIRCRAFT = ['A350-1000', '787-9', 'A330-900'];
const CABINS = [
  { key: 'economy', label: 'Economy' }, { key: 'premium', label: 'Premium' }, { key: 'one', label: 'Meridian One' },
];
const MARK = '<svg viewBox="0 0 32 32" width="32" height="32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="13" stroke="currentColor" stroke-width="2.2"/><path d="M16 3 C 9 10, 9 22, 16 29" stroke="currentColor" stroke-width="2.2"/><path d="M16 3 C 23 10, 23 22, 16 29" stroke="currentColor" stroke-width="2.2"/><line x1="4.5" y1="12" x2="27.5" y2="12" stroke="currentColor" stroke-width="2.2"/></svg>';

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const city = (c) => (AIRPORTS.find((a) => a.code === c) || { city: c }).city;
const fmtDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const gbp = (n) => `£${n.toLocaleString()}`;

function seeded(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
}

function buildFlights(from, to, dateStr) {
  const rnd = seeded(from + to + dateStr);
  const dur = DURATIONS[to] || 540;
  const count = 4 + Math.floor(rnd() * 3);
  const flights = [];
  let depMin = 7 * 60 + Math.floor(rnd() * 90);
  for (let i = 0; i < count; i += 1) {
    const d = dur + Math.floor(rnd() * 40 - 20);
    const arr = depMin + d;
    const base = 320 + Math.floor(rnd() * 260);
    flights.push({
      id: `${from}${to}${dateStr}-${i}`,
      number: `MD${102 + i * 7}`,
      from,
      to,
      dep: `${pad(Math.floor(depMin / 60) % 24)}:${pad(depMin % 60)}`,
      arrDay: Math.floor(arr / 1440),
      arr: `${pad(Math.floor(arr / 60) % 24)}:${pad(arr % 60)}`,
      duration: `${Math.floor(d / 60)}h ${pad(d % 60)}m`,
      aircraft: AIRCRAFT[Math.floor(rnd() * AIRCRAFT.length)],
      fares: {
        economy: base,
        premium: Math.round(base * 2.1 + 40),
        one: Math.round(base * 4.6 + 120),
      },
    });
    depMin += 90 + Math.floor(rnd() * 180);
  }
  return flights;
}

const SEAT_LETTERS = ['A', 'B', 'C', '', 'D', 'E', 'F'];
const SEAT_START = { one: 1, premium: 6, economy: 20 };
const seatRows = (cabin) => {
  const start = SEAT_START[cabin] ?? 20;
  return Array.from({ length: 7 }, (_, i) => start + i);
};
const isTaken = (row, letter) => ((row * 7 + letter.charCodeAt(0)) % 5) === 0;

export default async function decorate(block) {
  const rows = [...block.children];
  const cellHtml = (r) => (r?.firstElementChild ? r.firstElementChild.innerHTML.trim() : '');
  const hero = {
    eyebrow: rows[0]?.textContent.trim() || 'Long-haul, done lightly',
    title: cellHtml(rows[1]) || 'Chase the<br>light.',
    sub: rows[2]?.textContent.trim() || 'Nonstop from London to the places worth the flight time.',
  };

  const state = {
    view: 'search', query: null, picked: null, seat: null,
  };
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  // The booking block IS the home hero; the marketing sections below it
  // (destinations/cabins/loyalty) belong to the home view only. Hide them while
  // the flow is active so results/seats/confirm own the page — mirroring the
  // SPA's single-view swap. The header/footer fragments stay as persistent chrome.
  let homeSection = block;
  while (homeSection.parentElement && homeSection.parentElement.tagName !== 'MAIN') {
    homeSection = homeSection.parentElement;
  }
  const inMain = homeSection.parentElement && homeSection.parentElement.tagName === 'MAIN';
  const toggleHomeChrome = (flowActive) => {
    if (!inMain) return;
    let n = homeSection.nextElementSibling;
    while (n) { n.style.display = flowActive ? 'none' : ''; n = n.nextElementSibling; }
  };

  function render() {
    toggleHomeChrome(state.view !== 'search');
    if (state.view === 'search') renderSearch();
    else if (state.view === 'results') renderResults();
    else if (state.view === 'seats') renderSeats();
    else renderConfirm();
    block.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  // ---------- SEARCH (hero) ----------
  function renderSearch() {
    const today = new Date();
    const iso = (d) => d.toISOString().slice(0, 10);
    const plus = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };
    const q = state.query || {
      from: 'LHR', to: '', trip: 'return', depart: iso(plus(14)), ret: iso(plus(21)), pax: 1,
    };

    const sec = el('section', 'md-hero hero-dusk');
    sec.innerHTML = `
      <div class="md-hero-art" aria-hidden="true">
        <svg class="md-hero-arcs" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMax slice">
          <g fill="none" stroke="currentColor" stroke-width="1">
            <path d="M-100 560 C 250 280, 950 280, 1300 560" opacity="0.35"/>
            <path d="M-100 620 C 250 320, 950 320, 1300 620" opacity="0.25"/>
            <path d="M-100 680 C 250 360, 950 360, 1300 680" opacity="0.18"/>
            <path d="M-100 740 C 250 400, 950 400, 1300 740" opacity="0.12"/>
          </g>
          <circle cx="600" cy="425" r="4" fill="currentColor" opacity="0.9"/>
          <path d="M150 540 C 320 380, 520 390, 600 425" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 7" opacity="0.8"/>
        </svg>
      </div>
      <div class="md-hero-inner">
        <p class="md-hero-eyebrow">${hero.eyebrow}</p>
        <h1 class="md-hero-title">${hero.title}</h1>
        <p class="md-hero-sub">${hero.sub}</p>
      </div>`;

    const search = el('div', 'md-hero-search');
    const form = el('form', 'md-search');
    const opts = (exclude) => AIRPORTS.filter((a) => a.code !== exclude).map((a) => `<option value="${a.code}">${a.city} (${a.code})</option>`).join('');
    form.innerHTML = `
      <div class="md-search-toprow">
        <div class="md-segmented" role="radiogroup" aria-label="Trip type">
          <button type="button" data-trip="return"${q.trip === 'return' ? ' class="active"' : ''}>Return</button>
          <button type="button" data-trip="oneway"${q.trip === 'oneway' ? ' class="active"' : ''}>One way</button>
        </div>
        <div class="md-search-pax">
          <span class="md-field-label">Travellers</span>
          <div class="md-stepper" role="group" aria-label="Travellers">
            <button type="button" data-pax="-1" aria-label="Fewer">−</button><span class="pax">${q.pax}</span><button type="button" data-pax="1" aria-label="More">+</button>
          </div>
        </div>
      </div>
      <div class="md-search-grid">
        <label class="md-field"><span class="md-field-label">From</span><select name="from"><option value="">Choose airport</option>${opts(q.to)}</select></label>
        <button type="button" class="md-swap" aria-label="Swap airports">⇄</button>
        <label class="md-field"><span class="md-field-label">To</span><select name="to"><option value="">Choose airport</option>${opts(q.from)}</select></label>
        <label class="md-field"><span class="md-field-label">Depart</span><input type="date" name="depart" value="${q.depart}" min="${iso(today)}"></label>
        <label class="md-field ret-field"><span class="md-field-label">Return</span><input type="date" name="ret" value="${q.ret}" min="${q.depart}"></label>
        <button type="submit" class="md-btn md-btn-primary md-search-submit">Find flights</button>
      </div>
      <p class="md-search-error" hidden>Choose two different airports to search.</p>`;

    const fromSel = form.querySelector('[name=from]');
    const toSel = form.querySelector('[name=to]');
    fromSel.value = q.from; toSel.value = q.to;
    const retField = form.querySelector('.ret-field');
    const setTrip = (t) => { q.trip = t; form.querySelectorAll('[data-trip]').forEach((b) => b.classList.toggle('active', b.dataset.trip === t)); retField.hidden = t !== 'return'; };
    setTrip(q.trip);
    form.querySelectorAll('[data-trip]').forEach((b) => b.addEventListener('click', () => setTrip(b.dataset.trip)));
    form.querySelectorAll('[data-pax]').forEach((b) => b.addEventListener('click', () => {
      q.pax = Math.max(1, Math.min(9, q.pax + Number(b.dataset.pax)));
      form.querySelector('.pax').textContent = q.pax;
    }));
    form.querySelector('.md-swap').addEventListener('click', () => { const f = fromSel.value; fromSel.value = toSel.value; toSel.value = f; });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const from = fromSel.value; const to = toSel.value;
      const err = form.querySelector('.md-search-error');
      const bad = !from || !to || from === to;
      err.hidden = !bad;
      [fromSel, toSel].forEach((s) => s.closest('.md-field').classList.toggle('has-error', bad && (s === fromSel ? !from : (!to || from === to))));
      if (bad) return;
      state.query = {
        from, to, trip: q.trip, depart: form.querySelector('[name=depart]').value, ret: form.querySelector('[name=ret]').value, pax: q.pax,
      };
      state.view = 'results';
      render();
    });
    search.append(form);
    // search panel is a sibling of the hero (not a child) so the hero's
    // overflow:hidden art clip doesn't crop it; CSS pulls it up to overlap.
    block.replaceChildren(sec, search);
  }

  // ---------- shared flow bar ----------
  function flowBar(routeStrong, routeSpan, rightNode) {
    const bar = el('div', 'md-flow-bar');
    const back = el('button', 'md-btn md-btn-ghost-sm', routeStrong.back);
    back.addEventListener('click', routeStrong.onBack);
    const route = el('div', 'md-flow-route', `<strong>${routeStrong.text}</strong><span>${routeSpan}</span>`);
    bar.append(back, route, rightNode || el('span'));
    return bar;
  }

  // ---------- RESULTS ----------
  function renderResults() {
    const q = state.query;
    let cabin = 'economy';
    const flights = buildFlights(q.from, q.to, q.depart);
    const page = el('section', 'md-flow-page');

    const toggle = el('div', 'md-segmented md-cabin-toggle');
    toggle.setAttribute('role', 'radiogroup');
    CABINS.forEach((c) => { const b = el('button', c.key === cabin ? 'active' : '', c.label); b.type = 'button'; b.dataset.cabin = c.key; toggle.append(b); });

    const bar = flowBar(
      { back: '← Edit search', text: `${city(q.from)} → ${city(q.to)}`, onBack: () => { state.view = 'search'; render(); } },
      `${fmtDate(q.depart)} · ${q.pax} ${q.pax > 1 ? 'travellers' : 'traveller'} · ${q.trip === 'return' ? 'return' : 'one way'}`,
      toggle,
    );

    const list = el('div', 'md-results');
    const title = el('h2', 'md-results-title', `${flights.length} nonstop flights on ${fmtDate(q.depart)}`);
    list.append(title);
    function paint() {
      [...list.querySelectorAll('.md-flight-card')].forEach((c) => c.remove());
      const { label } = CABINS.find((c) => c.key === cabin);
      flights.forEach((f) => {
        const card = el('article', 'md-flight-card');
        card.innerHTML = `
          <div class="md-flight-times">
            <div class="md-flight-time"><strong>${f.dep}</strong><span>${f.from}</span></div>
            <div class="md-flight-path" aria-hidden="true"><span class="md-flight-dur">${f.duration}</span><span class="md-flight-line"><i></i></span><span class="md-flight-stops">Nonstop</span></div>
            <div class="md-flight-time"><strong>${f.arr}${f.arrDay > 0 ? '<sup>+1</sup>' : ''}</strong><span>${f.to}</span></div>
          </div>
          <div class="md-flight-meta"><span>${f.number}</span><span>·</span><span>${f.aircraft}</span></div>
          <div class="md-flight-fare"><span class="md-fare-price">${gbp(f.fares[cabin] * q.pax)}</span><span class="md-fare-note">${label}${q.pax > 1 ? `, ${q.pax} travellers` : ''}</span></div>`;
        const sel = el('button', 'md-btn md-btn-primary', 'Select'); sel.type = 'button';
        sel.addEventListener('click', () => { state.picked = { flight: f, cabin }; state.view = 'seats'; render(); });
        card.querySelector('.md-flight-fare').append(sel);
        list.append(card);
      });
    }
    toggle.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      cabin = b.dataset.cabin;
      toggle.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
      paint();
    }));
    paint();
    page.append(bar, list);
    block.replaceChildren(page);
  }

  // ---------- SEATS ----------
  function renderSeats() {
    const q = state.query; const { flight, cabin } = state.picked;
    let seat = null;
    const { label } = CABINS.find((c) => c.key === cabin);
    const page = el('section', 'md-flow-page');
    page.append(flowBar(
      { back: '← Back to flights', text: 'Choose your seat', onBack: () => { state.view = 'results'; render(); } },
      `${flight.number} · ${label} · ${flight.dep} departure`,
    ));

    const wrap = el('div', 'md-seatmap-wrap');
    const map = el('div', 'md-seatmap');

    // summary + confirm button first — the seat-click handlers reference them.
    const summary = el('aside', 'md-seat-summary');
    summary.innerHTML = `
      <h3>Your trip</h3>
      <dl>
        <div><dt>Flight</dt><dd>${flight.number} · ${flight.from} → ${flight.to}</dd></div>
        <div><dt>Departs</dt><dd>${fmtDate(q.depart)} at ${flight.dep}</dd></div>
        <div><dt>Cabin</dt><dd>${label}</dd></div>
        <div><dt>Seat</dt><dd class="seat-dd">—</dd></div>
        <div class="md-summary-total"><dt>Total</dt><dd>${gbp(flight.fares[cabin] * q.pax)}</dd></div>
      </dl>`;
    const summaryDd = summary.querySelector('.seat-dd');
    const confirmBtn = el('button', 'md-btn md-btn-primary md-btn-block', 'Pick a seat to continue');
    confirmBtn.type = 'button'; confirmBtn.disabled = true;
    confirmBtn.addEventListener('click', () => { if (!seat) return; state.seat = seat; state.view = 'confirm'; render(); });
    summary.append(confirmBtn);

    const head = el('div', 'md-seat-row md-seat-header', `<span class="md-seat-rownum"></span>${SEAT_LETTERS.map((l) => `<span class="${l ? 'md-seat-col' : 'md-seat-aisle'}">${l}</span>`).join('')}`);
    map.append(head);
    seatRows(cabin).forEach((r) => {
      const rowEl = el('div', 'md-seat-row', `<span class="md-seat-rownum">${r}</span>`);
      SEAT_LETTERS.forEach((l) => {
        if (!l) { rowEl.append(el('span', 'md-seat-aisle')); return; }
        const id = r + l; const taken = isTaken(r, l);
        const b = el('button', `md-seat${taken ? ' taken' : ''}`); b.type = 'button'; b.disabled = taken;
        b.setAttribute('aria-label', `Seat ${id}${taken ? ' unavailable' : ''}`);
        b.addEventListener('click', () => {
          seat = seat === id ? null : id;
          map.querySelectorAll('.md-seat.picked').forEach((s) => { s.classList.remove('picked'); s.textContent = ''; });
          if (seat === id) { b.classList.add('picked'); b.textContent = '✓'; }
          summaryDd.textContent = seat || '—';
          confirmBtn.disabled = !seat;
          confirmBtn.textContent = seat ? `Confirm seat ${seat}` : 'Pick a seat to continue';
        });
        rowEl.append(b);
      });
      map.append(rowEl);
    });
    map.append(el('div', 'md-seat-legend', '<span><i class="md-seat demo"></i> Available</span><span><i class="md-seat demo taken"></i> Taken</span><span><i class="md-seat demo picked"></i> Yours</span>'));

    wrap.append(map, summary);
    page.append(wrap);
    block.replaceChildren(page);
  }

  // ---------- CONFIRM ----------
  function renderConfirm() {
    const q = state.query; const { flight, cabin } = state.picked; const { seat } = state;
    const { label } = CABINS.find((c) => c.key === cabin);
    const conf = 10000 + [...flight.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 90000, 7);
    const page = el('section', 'md-flow-page md-confirm-page');
    page.innerHTML = `
      <div class="md-boarding-pass">
        <div class="md-bp-head"><span class="md-wordmark inverted">${MARK}<span class="md-wordmark-text">meridian</span></span><span class="md-bp-status">Booked ✓</span></div>
        <div class="md-bp-route"><div><strong>${flight.from}</strong><span>${city(flight.from)}</span></div>${MARK}<div><strong>${flight.to}</strong><span>${city(flight.to)}</span></div></div>
        <div class="md-bp-grid">
          <div><dt>Flight</dt><dd>${flight.number}</dd></div><div><dt>Date</dt><dd>${fmtDate(q.depart)}</dd></div><div><dt>Departs</dt><dd>${flight.dep}</dd></div>
          <div><dt>Seat</dt><dd>${seat}</dd></div><div><dt>Cabin</dt><dd>${label}</dd></div><div><dt>Travellers</dt><dd>${q.pax}</dd></div>
        </div>
        <div class="md-bp-tear" aria-hidden="true"></div>
        <div class="md-bp-foot"><span>Confirmation MD-${conf}</span><span>Paid ${gbp(flight.fares[cabin] * q.pax)}</span></div>
      </div>
      <p class="md-confirm-note">See you at the gate. Boarding details land in your inbox 24 hours before departure.</p>`;
    const home = el('button', 'md-btn md-btn-ghost', 'Back to home'); home.type = 'button';
    home.addEventListener('click', () => { state.view = 'search'; render(); });
    page.append(home);
    block.replaceChildren(page);
  }

  render();
}
