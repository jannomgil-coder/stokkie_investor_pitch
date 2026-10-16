// ---------- Helpers ----------
const KEY = "stokkie-v2";
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => "R" + Number(n).toLocaleString("en-ZA");
const pad = (n) => String(n).padStart(2, "0");
const monthKey = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1);
const parts = (k) => k.split("-").map(Number);
const addMonths = (k, n) => { const [y, m] = parts(k); return monthKey(new Date(y, m - 1 + n, 1)); };
const diffMonths = (a, b) => { const [y1, m1] = parts(a), [y2, m2] = parts(b); return (y2 - y1) * 12 + (m2 - m1); };
const monthLabel = (k) => { const [y, m] = parts(k); return new Date(y, m - 1, 1).toLocaleDateString("en-ZA", { month: "long", year: "numeric" }); };
const shortMonth = (k) => { const [y, m] = parts(k); return new Date(y, m - 1, 1).toLocaleDateString("en-ZA", { month: "short" }); };
const uid = () => Math.random().toString(36).slice(2, 9);
const todayIso = () => { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
const initial = (n) => (n.trim()[0] || "?").toUpperCase();

// ---------- State ----------
function seed() {
  const now = new Date(), cur = monthKey(now), prev = addMonths(cur, -1);
  const members = ["Jenet", "Sipho", "Thandi", "Lerato", "Bongani", "Zanele", "Mpho", "Kagiso"].map((name) => ({ id: uid(), name, phone: "" }));
  const dateIn = (k, i) => { const [y, m] = parts(k); const d = k === cur ? Math.min(now.getDate(), 1 + i) : 2 + i; return y + "-" + pad(m) + "-" + pad(d); };
  const ledger = [];
  members.forEach((m, i) => ledger.push({ id: uid(), memberId: m.id, month: prev, amount: 500, date: dateIn(prev, i) }));
  [0, 1, 3, 4, 5].forEach((idx, i) => ledger.push({ id: uid(), memberId: members[idx].id, month: cur, amount: 500, date: dateIn(cur, i) }));
  return { group: { name: "Jenet's Monthly Stokvel", amount: 500 }, members, ledger, startMonth: prev, payouts: { [prev]: members[0].id } };
}
let state;
try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
if (!state || !state.group || !Array.isArray(state.members)) state = seed();
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ } }

let tab = "home";
let viewMonth = monthKey(new Date());

// ---------- Derived data ----------
const member = (id) => state.members.find((m) => m.id === id);
const entry = (id, month) => state.ledger.find((l) => l.memberId === id && l.month === month);
const isPaid = (id, month) => !!entry(id, month);
const collected = (month) => state.ledger.filter((l) => l.month === month && member(l.memberId)).reduce((s, l) => s + l.amount, 0);
const pot = () => state.members.length * state.group.amount;
function recipient(month) {
  const stored = state.payouts[month];
  if (stored) return member(stored) || { id: stored, name: "Former member" };
  const n = state.members.length, i = diffMonths(state.startMonth, month);
  return n && i >= 0 ? state.members[i % n] : null;
}

// ---------- WhatsApp ----------
function waLink(text, phone) {
  let num = (phone || "").replace(/\D/g, "");
  if (num.startsWith("0")) num = "27" + num.slice(1);
  return "https://wa.me/" + num + "?text=" + encodeURIComponent(text);
}
const remindText = (m, month) => "Hi " + m.name + ", a friendly reminder: your " + money(state.group.amount) + " contribution to " + state.group.name + " for " + monthLabel(month) + " is still outstanding. Thank you!";
function summaryText(month) {
  const unpaid = state.members.filter((m) => !isPaid(m.id, month));
  const r = recipient(month);
  return state.group.name + " | " + monthLabel(month) + "\n" +
    (state.members.length - unpaid.length) + " of " + state.members.length + " paid (" + money(collected(month)) + " of " + money(pot()) + ")\n" +
    (r ? "Payout this month: " + r.name + "\n" : "") +
    (unpaid.length ? "Still to pay: " + unpaid.map((m) => m.name).join(", ") : "Everyone has paid. Thank you!");
}

// ---------- Toast ----------
const toastEl = $("#toast"); let toastTimer;
function say(msg) { toastEl.textContent = msg; toastEl.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400); }

// ---------- Views ----------
function viewHome() {
  const n = state.members.length, paid = state.members.filter((m) => isPaid(m.id, viewMonth)), unpaid = state.members.filter((m) => !isPaid(m.id, viewMonth));
  const got = collected(viewMonth), target = pot(), pct = target ? Math.round((got / target) * 100) : 0;
  const r = recipient(viewMonth), out = !!state.payouts[viewMonth];
  if (!n) return '<div class="card"><p class="empty">No members yet. Open the Members tab to add your first member.</p></div>';
  return '<section class="card"><div class="hero"><div class="ring" style="--p:' + pct + '"><div><strong>' + paid.length + "/" + n + "</strong><span>paid</span></div></div>" +
    '<div><p class="muted">Collected</p><p class="money">' + money(got) + '</p><p class="muted">of ' + money(target) + "</p></div></div></section>" +
    (r ? '<section class="card"><h2>' + (out ? "Paid out this month" : "Payout this month") + '</h2><div class="payout"><span class="avatar">' + esc(initial(r.name)) + '</span><div class="who"><strong>' + esc(r.name) + '</strong><span class="muted">receives ' + money(target) + "</span></div>" +
      (out ? '<span class="pill ok">Paid out</span>' : pct === 100 ? '<span class="pill ok">Ready</span>' : '<span class="pill warn">Waiting</span>') + "</div></section>" : "") +
    '<section class="card"><h2>' + (unpaid.length ? "Still to pay (" + unpaid.length + ")" : "Everyone has paid") + "</h2>" +
    (unpaid.length ? '<ul class="list">' + unpaid.map((m) => '<li><span class="avatar">' + esc(initial(m.name)) + '</span><span class="who"><strong>' + esc(m.name) + '</strong><span class="muted">owes ' + money(state.group.amount) + '</span></span><button class="btn small ghost" data-act="remind" data-id="' + m.id + '">Remind</button></li>').join("") + "</ul>" : '<p class="muted">The pot is full. Time to pay out ' + (r ? esc(r.name) : "the recipient") + ".</p>") + "</section>" +
    '<div class="row-btns"><button class="btn gold" data-act="share">Share summary</button>' + (unpaid.length ? '<button class="btn" data-act="remind-all">Remind everyone</button>' : "") + "</div>";
}

function viewMembers() {
  const rows = state.members.map((m, i) => '<li><span class="avatar">' + esc(initial(m.name)) + '</span><span class="who"><strong>' + esc(m.name) + '</strong><span class="muted">' + (m.phone ? esc(m.phone) : "Payout order " + (i + 1)) + "</span></span>" +
    '<label class="paid-toggle"><input type="checkbox" data-act="toggle" data-id="' + m.id + '"' + (isPaid(m.id, viewMonth) ? " checked" : "") + ' aria-label="' + esc(m.name) + ' has paid for ' + monthLabel(viewMonth) + '"> Paid</label>' +
    '<span><button class="iconbtn" data-act="up" data-id="' + m.id + '" aria-label="Move ' + esc(m.name) + ' up"' + (i === 0 ? " disabled" : "") + '>&#9650;</button><button class="iconbtn" data-act="down" data-id="' + m.id + '" aria-label="Move ' + esc(m.name) + ' down"' + (i === state.members.length - 1 ? " disabled" : "") + '>&#9660;</button><button class="iconbtn" data-act="remove" data-id="' + m.id + '" aria-label="Remove ' + esc(m.name) + '">&#10005;</button></span></li>').join("");
  return '<section class="card"><h2>Members (' + state.members.length + ")</h2>" + (rows ? '<ul class="list">' + rows + "</ul>" : '<p class="empty">No members yet.</p>') + '<p class="muted" style="margin-top:.6rem">Order sets who is paid out first. Tick Paid when a member contributes.</p></section>' +
    '<section class="card"><h2>Add a member</h2><form id="add-form" novalidate><label class="field">Name<input id="m-name" type="text" autocomplete="off" placeholder="e.g. Nomsa"></label><label class="field">WhatsApp number (optional)<input id="m-phone" type="tel" inputmode="tel" placeholder="082 123 4567"></label><p class="error" id="add-error" role="alert" hidden></p><button class="btn block" type="submit">Add member</button></form></section>' +
    '<section class="card"><h2>Group settings</h2><form id="group-form" novalidate><label class="field">Group name<input id="g-name" type="text" value="' + esc(state.group.name) + '"></label><label class="field">Monthly contribution (R)<input id="g-amount" type="number" min="1" inputmode="numeric" value="' + state.group.amount + '"></label><p class="error" id="group-error" role="alert" hidden></p><button class="btn block" type="submit">Save settings</button></form></section>' +
    '<button class="btn ghost block" data-act="reset">Reset demo data</button>';
}

function viewPayouts() {
  const cur = monthKey(new Date());
  if (!state.members.length) return '<div class="card"><p class="empty">Add members to see the payout schedule.</p></div>';
  const rows = [];
  for (let i = 0; i < Math.max(12, state.members.length); i++) {
    const k = addMonths(state.startMonth, i), r = recipient(k), out = !!state.payouts[k], isNow = k === cur;
    const status = out ? '<span class="pill ok">Paid out</span>' : diffMonths(k, cur) >= 0 ? '<button class="btn small" data-act="payout" data-month="' + k + '">Mark paid out</button>' : '<span class="pill soft">Upcoming</span>';
    rows.push('<li class="' + (isNow ? "now" : "") + '"><span class="mon">' + shortMonth(k) + " " + String(parts(k)[0]).slice(2) + '</span><span class="who"><strong>' + (r ? esc(r.name) : "Not set") + '</strong><span class="muted amt">' + money(pot()) + "</span></span>" + status + "</li>");
  }
  return '<section class="card"><h2>Payout schedule</h2><p class="muted" style="margin-bottom:.4rem">Everyone gets a turn. The order is clear to all, so there are no disputes.</p><ul class="timeline">' + rows.join("") + "</ul></section>";
}

function viewHistory() {
  const items = state.ledger.slice().sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  const total = state.ledger.reduce((s, l) => s + l.amount, 0);
  return '<section class="card"><p class="muted">Total contributed</p><p class="money">' + money(total) + '</p><p class="muted">' + items.length + " payments recorded</p></section>" +
    '<section class="card"><h2>Payment history</h2>' + (items.length ? '<ul class="list">' + items.map((l) => { const m = member(l.memberId); return '<li><span class="avatar">' + esc(initial(m ? m.name : "?")) + '</span><span class="who"><strong>' + esc(m ? m.name : "Former member") + '</strong><span class="muted">' + l.date + " | " + monthLabel(l.month) + '</span></span><span class="amt">' + money(l.amount) + "</span></li>"; }).join("") + "</ul>" : '<p class="empty">No payments yet.</p>') + "</section>" +
    '<button class="btn gold block" data-act="copy">Copy history as text</button>';
}

// ---------- Render ----------
const view = $("#view");
function render() {
  $("#group-name").textContent = state.group.name;
  $("#month-label").textContent = monthLabel(viewMonth);
  document.querySelectorAll(".tabs button").forEach((b) => { if (b.dataset.tab === tab) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  const top = view.scrollTop;
  view.innerHTML = { home: viewHome, members: viewMembers, payouts: viewPayouts, history: viewHistory }[tab]();
  view.scrollTop = top;
}

// ---------- Events ----------
document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; render(); view.scrollTop = 0; }));
$("#prev").addEventListener("click", () => { viewMonth = addMonths(viewMonth, -1); render(); });
$("#next").addEventListener("click", () => { viewMonth = addMonths(viewMonth, 1); render(); });

view.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const act = el.dataset.act, id = el.dataset.id, idx = state.members.findIndex((m) => m.id === id);
  if (act === "remind") { const m = member(id); window.open(waLink(remindText(m, viewMonth), m.phone), "_blank", "noopener"); say("Opening WhatsApp for " + m.name); }
  else if (act === "remind-all") { const names = state.members.filter((m) => !isPaid(m.id, viewMonth)).map((m) => m.name).join(", "); window.open(waLink("Reminder from " + state.group.name + ": contributions of " + money(state.group.amount) + " for " + monthLabel(viewMonth) + " are still due from: " + names + ". Thank you!"), "_blank", "noopener"); }
  else if (act === "share") { window.open(waLink(summaryText(viewMonth)), "_blank", "noopener"); }
  else if (act === "up" && idx > 0) { [state.members[idx - 1], state.members[idx]] = [state.members[idx], state.members[idx - 1]]; save(); render(); }
  else if (act === "down" && idx > -1 && idx < state.members.length - 1) { [state.members[idx + 1], state.members[idx]] = [state.members[idx], state.members[idx + 1]]; save(); render(); }
  else if (act === "remove") { const m = member(id); if (m && confirm("Remove " + m.name + " from the group?")) { state.members.splice(idx, 1); save(); render(); say(m.name + " removed"); } }
  else if (act === "payout") { const k = el.dataset.month, r = recipient(k); if (r) { state.payouts[k] = r.id; save(); render(); say("Marked as paid out to " + r.name); } }
  else if (act === "reset") { if (confirm("Reset to the demo data? Your changes will be lost.")) { state = seed(); viewMonth = monthKey(new Date()); save(); render(); say("Demo data restored"); } }
  else if (act === "copy") {
    const text = state.group.name + " payment history\n" + state.ledger.slice().sort((a, b) => (a.date > b.date ? 1 : -1)).map((l) => { const m = member(l.memberId); return l.date + " | " + (m ? m.name : "Former member") + " | " + monthLabel(l.month) + " | " + money(l.amount); }).join("\n");
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => say("History copied"), () => say("Copy is not available here"));
  }
});

view.addEventListener("change", (e) => {
  const el = e.target.closest('[data-act="toggle"]'); if (!el) return;
  const m = member(el.dataset.id), found = entry(m.id, viewMonth);
  if (el.checked && !found) { state.ledger.push({ id: uid(), memberId: m.id, month: viewMonth, amount: state.group.amount, date: todayIso() }); say(m.name + " marked as paid"); }
  else if (!el.checked && found) { state.ledger = state.ledger.filter((l) => l !== found); say(m.name + " marked as unpaid"); }
  save(); render();
});

view.addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.target.id === "add-form") {
    const name = $("#m-name").value.trim(), err = $("#add-error");
    if (!name) { err.textContent = "Please enter the member's name."; err.hidden = false; return; }
    state.members.push({ id: uid(), name, phone: $("#m-phone").value.trim() }); save(); render(); say(name + " added");
  } else if (e.target.id === "group-form") {
    const name = $("#g-name").value.trim(), amount = Number($("#g-amount").value), err = $("#group-error");
    if (!name || !(amount > 0)) { err.textContent = "Enter a group name and an amount above zero."; err.hidden = false; return; }
    state.group.name = name; state.group.amount = Math.round(amount); save(); render(); say("Settings saved");
  }
});

render();
