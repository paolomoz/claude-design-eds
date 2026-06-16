/**
 * dashboard — Evergreen Bank signed-in dashboard (interactive).
 *
 * Reproduces the prototype's React DashboardPage as a single self-contained
 * block: selectable account cards, a transaction list with a filter, and a
 * Quick Transfer form with validation, a live balance update, and a
 * confirmation. State lives in the block; rebuilding the cards/total/selects
 * on transfer mirrors the React re-render.
 *
 * Authoring rows are keyed by the first cell:
 *   user    | <display name>
 *   account | id | name | number | balance | type(deposit|credit) | limit
 *   txn     | date | desc | category | amount | acctId
 *   insight | <title> | <text>
 */

const ICONS = {
  coin: '<g><circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M9.5 10c0-1 1-1.7 2.5-1.7s2.5.7 2.5 1.7-1 1.5-2.5 1.7-2.5.7-2.5 1.7 1 1.7 2.5 1.7 2.5-.7 2.5-1.7"/></g>',
  card: '<g><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M6.5 15h4"/></g>',
  swap: '<g><path d="M7 8h12M15 4l4 4-4 4"/><path d="M17 16H5M9 12l-4 4 4 4"/></g>',
  shield: '<g><path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6z"/><path d="M9 12l2.2 2.2L15.5 9.5"/></g>',
  leaf: '<g><path d="M5 19C5 9 11 5 20 5c0 9-4 14-13 14"/><path d="M5 19c3-5 7-8 11-9.5"/></g>',
};

function icon(name, size = 20) {
  return `<svg class="eb-icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

function money(n) {
  const sign = n < 0 ? '−' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseRows(block) {
  const accounts = [];
  const txns = [];
  let user = '';
  let insight = null;
  [...block.children].forEach((row) => {
    const c = [...row.children].map((cell) => cell.textContent.trim());
    const key = (c[0] || '').toLowerCase();
    if (key === 'user') user = c[1] || '';
    else if (key === 'account') {
      accounts.push({
        id: c[1], name: c[2], number: c[3], balance: parseFloat(c[4]) || 0, type: c[5] || 'deposit', limit: parseFloat(c[6]) || 0,
      });
    } else if (key === 'txn') {
      txns.push({
        date: c[1], desc: c[2], cat: c[3], amount: parseFloat(c[4]) || 0, acct: c[5],
      });
    } else if (key === 'insight') insight = { title: c[1], text: c[2] };
  });
  return {
    accounts, txns, user, insight,
  };
}

export default async function decorate(block) {
  const {
    accounts, txns, user, insight,
  } = parseRows(block);
  if (!accounts.length) return;

  const state = { selected: accounts.find((a) => a.type === 'deposit')?.id, filter: 'all' };
  const acctById = (id) => accounts.find((a) => a.id === id);
  const total = () => accounts.filter((a) => a.type === 'deposit').reduce((s, a) => s + a.balance, 0);

  block.replaceChildren();

  // --- greeting band ---
  const greet = document.createElement('div');
  greet.className = 'greeting';
  greet.innerHTML = `
    <div class="eb-container">
      <div class="greet-left"><span class="hi">Good morning,</span><h1>${user}</h1></div>
      <div class="greet-right"><span class="lbl">Total deposits</span><span class="total">${money(total())}</span></div>
    </div>`;

  const body = document.createElement('div');
  body.className = 'eb-container dash-body';

  // --- account cards ---
  const cards = document.createElement('div');
  cards.className = 'accounts-grid';
  function renderCards() {
    cards.replaceChildren(...accounts.map((a) => {
      const credit = a.type === 'credit';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `eb-card account-card${state.selected === a.id ? ' selected' : ''}`;
      btn.innerHTML = `
        <span class="ac-top"><span class="ac-name">${a.name}</span>${icon(credit ? 'card' : 'coin', 18)}</span>
        <span class="ac-num">${a.number}</span>
        <span class="ac-bal${credit && a.balance < 0 ? ' neg' : ''}">${money(credit ? Math.abs(a.balance) : a.balance)}</span>
        <span class="ac-sub">${credit ? `Current balance · ${money(a.limit + a.balance)} available credit` : 'Available balance'}</span>`;
      btn.addEventListener('click', () => { state.selected = a.id; renderCards(); });
      return btn;
    }));
  }
  renderCards();

  // --- columns ---
  const cols = document.createElement('div');
  cols.className = 'dash-cols';

  // activity (filterable)
  const activity = document.createElement('div');
  activity.className = 'eb-card activity';
  const FILTERS = [['all', 'All'], ['chk', 'Checking'], ['cc', 'Credit card']];
  const list = document.createElement('div');
  list.className = 'tx-list';
  function renderList() {
    const rows = txns.filter((t) => state.filter === 'all' || t.acct === state.filter);
    list.replaceChildren(...rows.map((t) => {
      const r = document.createElement('div');
      r.className = 'tx-row';
      r.innerHTML = `
        <span class="tx-date">${t.date}</span>
        <span class="tx-main"><span class="tx-desc">${t.desc}</span><span class="tx-meta">${t.cat} · ${acctById(t.acct)?.name || ''}</span></span>
        <span class="tx-amt${t.amount > 0 ? ' pos' : ''}">${t.amount > 0 ? '+' : ''}${money(t.amount)}</span>`;
      return r;
    }));
  }
  const tabs = document.createElement('div');
  tabs.className = 'tx-tabs';
  FILTERS.forEach(([id, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = state.filter === id ? 'active' : '';
    b.textContent = label;
    b.addEventListener('click', () => {
      state.filter = id;
      tabs.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
      renderList();
    });
    tabs.append(b);
  });
  const actHead = document.createElement('div');
  actHead.className = 'tx-head';
  actHead.innerHTML = '<h3>Recent activity</h3>';
  actHead.append(tabs);
  renderList();
  activity.append(actHead, list);

  // side: transfer + insight
  const side = document.createElement('div');
  side.className = 'dash-side';

  const deposits = accounts.filter((a) => a.type === 'deposit');
  const form = document.createElement('form');
  form.className = 'eb-card transfer';
  const opts = () => deposits.map((a) => `<option value="${a.id}">${a.name} (${money(a.balance)})</option>`).join('');
  form.innerHTML = `
    <span class="tr-title">${icon('swap', 20)}<h3>Quick transfer</h3></span>
    <div class="eb-field"><label>From</label><select class="eb-input" name="from">${opts()}</select></div>
    <div class="eb-field"><label>To</label><select class="eb-input" name="to">${opts()}</select></div>
    <div class="eb-field"><label>Amount</label><input class="eb-input" name="amount" inputmode="decimal" placeholder="$0.00" value=""></div>
    <span class="eb-error-text" hidden></span>
    <span class="tr-ok" hidden></span>
    <button type="submit" class="eb-btn eb-btn-primary">Transfer</button>`;
  const fromSel = form.querySelector('[name=from]');
  const toSel = form.querySelector('[name=to]');
  if (deposits[1]) toSel.value = deposits[1].id;
  const amtInput = form.querySelector('[name=amount]');
  const err = form.querySelector('.eb-error-text');
  const ok = form.querySelector('.tr-ok');
  amtInput.addEventListener('input', () => { amtInput.value = amtInput.value.replace(/[^0-9.]/g, ''); });

  function refreshAfterTransfer() {
    greet.querySelector('.total').textContent = money(total());
    renderCards();
    [fromSel, toSel].forEach((sel) => {
      const keep = sel.value;
      sel.innerHTML = opts();
      sel.value = keep;
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    ok.hidden = true;
    const amt = parseFloat(amtInput.value);
    const src = acctById(fromSel.value);
    if (!amt || amt <= 0) { err.textContent = 'Enter an amount greater than $0.'; err.hidden = false; return; }
    if (fromSel.value === toSel.value) { err.textContent = 'Choose two different accounts.'; err.hidden = false; return; }
    if (amt > src.balance) { err.textContent = 'Amount exceeds available balance.'; err.hidden = false; return; }
    err.hidden = true;
    src.balance -= amt;
    acctById(toSel.value).balance += amt;
    refreshAfterTransfer();
    ok.innerHTML = `${icon('shield', 16)} Moved ${money(amt)} from ${src.name} to ${acctById(toSel.value).name}.`;
    ok.hidden = false;
    amtInput.value = '';
  });

  side.append(form);
  if (insight) {
    const ins = document.createElement('div');
    ins.className = 'eb-card insight';
    ins.innerHTML = `${icon('leaf', 22)}<div class="ins-body"><span class="ins-title">${insight.title}</span><p>${insight.text}</p></div>`;
    side.append(ins);
  }

  cols.append(activity, side);
  body.append(cards, cols);
  block.append(greet, body);
}
