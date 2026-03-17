/* ============================================================
   LEDGER MODULE  –  HR & Office Management
   Stored in localStorage: hr_ledger_entries, hr_ledger_subscriptions
   ============================================================ */
window.LedgerManager = (() => {

  // ── Storage Keys ────────────────────────────────────────────────────────
  const ENTRIES_KEY = 'hr_ledger_entries';
  const SUBS_KEY = 'hr_ledger_subscriptions';

  // ── Pre-defined Accounts ── (HR / Office / Revenue / Other) ─────────────
  const DEFAULT_ACCOUNTS = [
    // HR
    'Salaries', 'Bonus', 'Staff Loans', 'Employee Benefits', 'Recruitment',
    // Office
    'Office Rent', 'Utilities', 'Office Supplies', 'Maintenance',
    'Petty Cash', 'Internet & Telecom', 'Software Subscriptions',
    'Travel & Transport', 'Printing & Stationery',
    // Revenue
    'Project Fees', 'Consultation Fees', 'Referral Income',
    // Other
    'Bank Charges', 'Miscellaneous', 'Tax & VAT', 'Insurance',
  ];

  // ── Storage Helpers ──────────────────────────────────────────────────────
  const loadEntries = () => JSON.parse(localStorage.getItem(ENTRIES_KEY) || '[]');
  const saveEntries = d => localStorage.setItem(ENTRIES_KEY, JSON.stringify(d));
  const loadSubs = () => JSON.parse(localStorage.getItem(SUBS_KEY) || '[]');
  const saveSubs = d => localStorage.setItem(SUBS_KEY, JSON.stringify(d));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const today = () => new Date().toISOString().split('T')[0];
  const fmt = n => parseFloat(n || 0).toFixed(2);
  const fmtAED = n => 'AED ' + fmt(n);

  // ── Custom accounts (merged with defaults) ───────────────────────────────
  const getAccounts = () => {
    const custom = JSON.parse(localStorage.getItem('hr_ledger_custom_accounts') || '[]');
    return [...new Set([...DEFAULT_ACCOUNTS, ...custom])].sort();
  };
  const addCustomAccount = name => {
    const custom = JSON.parse(localStorage.getItem('hr_ledger_custom_accounts') || '[]');
    if (!custom.includes(name)) { custom.push(name); localStorage.setItem('hr_ledger_custom_accounts', JSON.stringify(custom)); }
  };

  // ── Build account <select> options ──────────────────────────────────────
  const buildAccountOptions = (selected = '') =>
    getAccounts().map(a => `<option value="${a}" ${a === selected ? 'selected' : ''}>${a}</option>`).join('');

  // ── Add Entry ────────────────────────────────────────────────────────────
  const addEntry = ({ date, description, account, debit, credit, note = '' }) => {
    debit = parseFloat(debit || 0);
    credit = parseFloat(credit || 0);
    if (!date || !account || (!debit && !credit)) return false;
    const entries = loadEntries();
    entries.push({ id: uid(), date, description, account, debit, credit, note, createdAt: Date.now() });
    entries.sort((a, b) => a.date.localeCompare(b.date));
    saveEntries(entries);
    return true;
  };

  const deleteEntry = id => {
    saveEntries(loadEntries().filter(e => e.id !== id));
  };

  // ── Filter Entries ───────────────────────────────────────────────────────
  const getFiltered = ({ search = '', account = '', from = '', to = '' } = {}) => {
    const q = search.toLowerCase();
    return loadEntries().filter(e => {
      if (account && e.account !== account) return false;
      if (from && e.date < from) return false;
      if (to && e.date > to) return false;
      if (q && !`${e.date} ${e.description} ${e.account} ${e.note}`.toLowerCase().includes(q)) return false;
      return true;
    });
  };

  // ── Account Summary ──────────────────────────────────────────────────────
  const getAccountSummary = () => {
    const map = {};
    loadEntries().forEach(e => {
      if (!map[e.account]) map[e.account] = { debit: 0, credit: 0 };
      map[e.account].debit += e.debit;
      map[e.account].credit += e.credit;
    });
    return Object.entries(map).map(([account, v]) => ({
      account, debit: v.debit, credit: v.credit, balance: v.debit - v.credit
    })).sort((a, b) => a.account.localeCompare(b.account));
  };

  // ── CSV Export ───────────────────────────────────────────────────────────
  const exportCSV = () => {
    const entries = loadEntries();
    const rows = [['Date', 'Description', 'Account', 'Debit (AED)', 'Credit (AED)', 'Balance', 'Note']];
    let running = 0;
    entries.forEach(e => {
      running += e.debit - e.credit;
      rows.push([e.date, e.description, e.account, fmt(e.debit), fmt(e.credit), fmt(running), e.note || '']);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `ledger_${today()}.csv`; a.click();
  };

  // ── Monthly Subscriptions (Add / Edit / Delete) ──────────────────────────
  const addSubscription = sub => {
    const subs = loadSubs();
    subs.push({ id: uid(), ...sub });
    saveSubs(subs);
  };
  const deleteSubscription = id => saveSubs(loadSubs().filter(s => s.id !== id));

  /* Post all subscriptions as ledger entries for a chosen month.
     If a subscription's subscribeDate is after chosen month, skip it.
     If renewalDate < chosen month start, mark as expired, still add but flag. */
  const importMonthlyExpenses = (yearMonth) => {
    const [y, m] = yearMonth.split('-').map(Number);
    const periodLabel = new Date(y, m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    const monthStart = `${yearMonth}-01`;
    const subs = loadSubs();
    let added = 0;
    subs.forEach(s => {
      if (s.subscribeDate && s.subscribeDate > `${yearMonth}-31`) return; // not yet active
      const note = s.renewalDate && s.renewalDate < monthStart
        ? `⚠ Renewal expired (${s.renewalDate})`
        : (s.renewalDate ? `Renewal: ${s.renewalDate}` : '');
      const ok = addEntry({
        date: monthStart,
        description: `${s.name} — ${periodLabel}`,
        account: s.account || 'Software Subscriptions',
        debit: s.amount || 0,
        credit: 0,
        note,
      });
      if (ok) added++;
    });
    return added;
  };

  // ────────────────────────
  //  RENDER  (HTML is inline in hr_management.html – just wire events & data)
  // ──────────────────────────────────────────────────────────────────
  let _state = { search: '', account: '', from: '', to: '' };
  let _initialized = false;

  const render = () => {
    const tab = document.getElementById('ledger-tab');
    if (!tab) return;
    const dateEl = document.getElementById('led-date');
    if (dateEl && !dateEl.value) dateEl.value = today();
    const monthEl = document.getElementById('sub-month');
    if (monthEl && !monthEl.value) monthEl.value = today().slice(0, 7);
    if (!_initialized) { attachEvents(); _initialized = true; }
    renderTable();
    renderSubscriptions();
    renderSummaryCards();
  };

  // ── Render Table ──────────────────────────────────────────────────────────
  const renderTable = () => {
    const entries = getFiltered(_state);
    const tbody = document.getElementById('led-tbody');
    const tfoot = document.getElementById('led-tfoot');
    if (!tbody) return;

    let runBalance = 0, totalD = 0, totalC = 0;
    if (!entries.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#999; padding:24px;">No entries found.</td></tr>`;
      tfoot.innerHTML = '';
      return;
    }
    tbody.innerHTML = entries.map(e => {
      runBalance += e.debit - e.credit;
      totalD += e.debit; totalC += e.credit;
      const balClass = runBalance >= 0 ? 'balance-positive' : 'balance-negative';
      return `<tr>
              <td style="white-space:nowrap">${e.date}</td>
              <td>${escHtml(e.description)}</td>
              <td><span class="account-badge">${escHtml(e.account)}</span></td>
              <td style="text-align:right; color:#c0392b">${e.debit ? fmt(e.debit) : '—'}</td>
              <td style="text-align:right; color:#27ae60">${e.credit ? fmt(e.credit) : '—'}</td>
              <td style="text-align:right; font-weight:600" class="${balClass}">${fmt(runBalance)}</td>
              <td style="font-size:0.8em; color:#888">${escHtml(e.note || '')}</td>
              <td><button class="danger-button led-del-btn" data-id="${e.id}" style="padding:3px 8px; font-size:0.8em;">✕</button></td>
            </tr>`;
    }).join('');

    tfoot.innerHTML = `<tr style="background:#f0f0f0; font-weight:bold;">
          <td colspan="3">Totals (${entries.length} entries)</td>
          <td style="text-align:right; color:#c0392b">${fmt(totalD)}</td>
          <td style="text-align:right; color:#27ae60">${fmt(totalC)}</td>
          <td style="text-align:right" class="${runBalance >= 0 ? 'balance-positive' : 'balance-negative'}">${fmt(runBalance)}</td>
          <td colspan="2"></td>
        </tr>`;

    // Delete buttons
    tbody.querySelectorAll('.led-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this entry?')) {
          deleteEntry(btn.dataset.id);
          renderTable();
          renderSummaryCards();
        }
      });
    });
  };


  // ── Render Subscriptions List ────────────────────────────────────────────
  const renderSubscriptions = () => {
    const el = document.getElementById('subs-list');
    if (!el) return;
    const subs = loadSubs();
    if (!subs.length) { el.innerHTML = '<p style="color:#999; font-size:0.85em;">No recurring expenses added yet.</p>'; return; }
    const todayStr = today();
    el.innerHTML = `<table class="output-table" style="margin:0; font-size:0.88em;">
          <thead><tr><th>Name</th><th>Account</th><th style="text-align:right">Amount</th><th>Subscribe Date</th><th>Renewal Date</th><th></th></tr></thead>
          <tbody>
          ${subs.map(s => {
      const expired = s.renewalDate && s.renewalDate < todayStr;
      return `<tr style="background:${expired ? '#fff3cd' : ''}">
                <td>${escHtml(s.name)}</td>
                <td>${escHtml(s.account)}</td>
                <td style="text-align:right">${fmtAED(s.amount)}</td>
                <td>${s.subscribeDate || '—'}</td>
                <td style="color:${expired ? '#dc3545' : 'inherit'}">${s.renewalDate || '—'}${expired ? ' ⚠' : ''}</td>
                <td><button class="danger-button sub-del-btn" data-id="${s.id}" style="padding:3px 8px; font-size:0.8em;">✕</button></td>
              </tr>`;
    }).join('')}
          </tbody>
        </table>`;
    el.querySelectorAll('.sub-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Remove this subscription?')) { deleteSubscription(btn.dataset.id); render(); }
      });
    });
  };

  // ── Render Summary Cards ─────────────────────────────────────────────────
  const renderSummaryCards = () => {
    const el = document.getElementById('ledger-summary-cards');
    if (!el) return;
    const all = loadEntries();
    let totalD = 0, totalC = 0;
    all.forEach(e => { totalD += e.debit; totalC += e.credit; });
    const net = totalD - totalC;
    const summary = getAccountSummary().slice(0, 5);
    el.innerHTML = `
          <div class="ledger-card ledger-card-debit">
            <div class="ledger-card-label">Total Debits</div>
            <div class="ledger-card-value">${fmtAED(totalD)}</div>
          </div>
          <div class="ledger-card ledger-card-credit">
            <div class="ledger-card-label">Total Credits</div>
            <div class="ledger-card-value">${fmtAED(totalC)}</div>
          </div>
          <div class="ledger-card ${net >= 0 ? 'ledger-card-net-pos' : 'ledger-card-net-neg'}">
            <div class="ledger-card-label">Net Balance</div>
            <div class="ledger-card-value">${fmtAED(Math.abs(net))} ${net >= 0 ? '▲' : '▼'}</div>
          </div>
          <div class="ledger-card ledger-card-entries">
            <div class="ledger-card-label">Total Entries</div>
            <div class="ledger-card-value">${all.length}</div>
          </div>
        `;
  };

  // ── Escape HTML ──────────────────────────────────────────────────────────
  const escHtml = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ── Attach Events ────────────────────────────────────────────────────────
  const attachEvents = () => {
    // Add entry
    document.getElementById('led-add-btn')?.addEventListener('click', () => {
      const ok = addEntry({
        date: document.getElementById('led-date').value,
        description: document.getElementById('led-desc').value.trim(),
        account: document.getElementById('led-account').value,
        debit: document.getElementById('led-debit').value,
        credit: document.getElementById('led-credit').value,
        note: document.getElementById('led-note').value.trim(),
      });
      if (ok) render();
      else alert('Please fill Date, Account, and at least one of Debit/Credit.');
    });

    // Add custom account
    document.getElementById('led-add-account-btn')?.addEventListener('click', () => {
      const v = document.getElementById('led-new-account').value.trim();
      if (v) { addCustomAccount(v); render(); }
    });

    // Live search
    document.getElementById('led-search')?.addEventListener('input', e => {
      _state.search = e.target.value;
      renderTable();
    });

    // Filters
    document.getElementById('led-filter-account')?.addEventListener('change', e => {
      _state.account = e.target.value; renderTable();
    });
    document.getElementById('led-filter-from')?.addEventListener('change', e => {
      _state.from = e.target.value; renderTable();
    });
    document.getElementById('led-filter-to')?.addEventListener('change', e => {
      _state.to = e.target.value; renderTable();
    });
    document.getElementById('led-clear-filters')?.addEventListener('click', () => {
      _state = { search: '', account: '', from: '', to: '' };
      document.getElementById('led-search').value = '';
      document.getElementById('led-filter-account').value = '';
      document.getElementById('led-filter-from').value = '';
      document.getElementById('led-filter-to').value = '';
      renderTable();
    });

    // Export CSV
    document.getElementById('led-export-csv')?.addEventListener('click', exportCSV);

    // Add subscription
    document.getElementById('sub-add-btn')?.addEventListener('click', () => {
      const name = document.getElementById('sub-name').value.trim();
      const amount = parseFloat(document.getElementById('sub-amount').value) || 0;
      if (!name || !amount) { alert('Please enter subscription name and amount.'); return; }
      addSubscription({
        name,
        account: document.getElementById('sub-account').value || 'Software Subscriptions',
        amount,
        subscribeDate: document.getElementById('sub-subscribe-date').value,
        renewalDate: document.getElementById('sub-renewal-date').value,
      });
      render();
    });

    // Import monthly expenses
    document.getElementById('sub-import-btn')?.addEventListener('click', () => {
      const month = document.getElementById('sub-month').value;
      if (!month) { alert('Please select a month.'); return; }
      const subs = loadSubs();
      if (!subs.length) { alert('No recurring expenses defined. Add some subscriptions first.'); return; }
      const n = importMonthlyExpenses(month);
      document.getElementById('sub-import-msg').textContent = n
        ? `✅ ${n} expense${n > 1 ? 's' : ''} added to ledger.`
        : '⚠ No expenses matched for this month.';
      render();
    });
  };

  // ── Public API ───────────────────────────────────────────────────────────
  return { render, addEntry, exportCSV };

})();
