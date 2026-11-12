"use strict";
/* IORA Group · SyncCheck — core: helpers, constants, state, data model */
const CFG = window.SC_CONFIG || {};
const FIREBASE_CONFIG = CFG.FIREBASE_CONFIG || null;
const ADMIN_EMAIL = String(CFG.ADMIN_EMAIL || "").toLowerCase();
const $ = (id) => document.getElementById(id);
const PROP_ATTRS = new Set(["checked", "selected", "disabled", "value", "readOnly"]);
function h(tag, attrs, ...kids) {
 const e = document.createElement(tag);
 for (const k in (attrs || {})) {
  const v = attrs[k];
  if (v === undefined || v === null || v === false) continue;
  if (k === "class") e.className = v;
  else if (k === "text") e.textContent = v;
  else if (k === "html") e.innerHTML = v;            // static art constants only
  else if (k === "style") { if (typeof v === "string") e.setAttribute("style", v); else Object.assign(e.style, v); }
  else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v);
  else if (PROP_ATTRS.has(k)) e[k] = v;
  else e.setAttribute(k, v === true ? "" : v);
 }
 for (const c of kids.flat(2)) { if (c === null || c === undefined || c === false) continue; e.append(c.nodeType ? c : document.createTextNode(String(c))); }
 return e;
}
function svgEl(tag, attrs, ...kids) {
 const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
 for (const k in (attrs || {})) e.setAttribute(k, attrs[k]);
 for (const c of kids.flat(2)) { if (c !== null && c !== undefined && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c))); }
 return e;
}
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const nf = (n) => Number(n || 0).toLocaleString("en-SG");
const pct = (a, b) => (b > 0 ? (a / b) * 100 : 0);
const fp = (x) => (x >= 99.95 ? "100" : x.toFixed(1));
const pdate = (s) => new Date(s + "T00:00:00Z");
const iso = (d) => d.toISOString().slice(0, 10);
const fday = (s) => { const d = pdate(s); return d.getUTCDate() + " " + MON[d.getUTCMonth()]; };
const fdayL = (s) => { const d = pdate(s); return d.getUTCDate() + " " + MON[d.getUTCMonth()] + " " + d.getUTCFullYear(); };
const safe = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
function loadScript(src) { return new Promise((ok, bad) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => bad(new Error("Failed to load " + src)); document.head.append(s); }); }
function genPassword() { const a = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (const x of crypto.getRandomValues(new Uint32Array(12))) s += a[x % a.length]; return s; }

/* ---------- what each flag means ---------- */
const STATUS = {
 NOT_DEDUCTED: { label: "Not deducted in SWIMS", short: "Not deducted", who: "swims", v: "--s1", icon: "box", dark: false, desc: "POS sold this EPC, but SWIMS has no sale record for it." },
 TXN_MISMATCH: { label: "Deducted under another transaction", short: "Other transaction", who: "swims", v: "--s2", icon: "swap", dark: false, desc: "SWIMS did deduct this EPC, but under a different transaction number than the POS sale." },
 DUPLICATE: { label: "Deducted more than once", short: "Duplicate", who: "swims", v: "--s3", icon: "dup", dark: false, desc: "SWIMS has two or more sale records for the same EPC and transaction." },
 RETURN_MISSING: { label: "Return not recorded in SWIMS", short: "Return missing", who: "swims", v: "--s4", icon: "undo", dark: true, desc: "POS recorded a return or exchange for this EPC, but SWIMS has no return record." },
 SWIMS_ONLY: { label: "In SWIMS, not in POS", short: "SWIMS only", who: "pos", v: "--s5", icon: "db", dark: false, desc: "SWIMS has a sale or return for this EPC and transaction that the POS data does not show." },
 PENDING: { label: "Pending (latest day)", short: "Pending", who: "", v: "--pend", icon: "clock", dark: true, desc: "Latest POS day. SWIMS may still catch up, so this is not an issue yet." },
};
const ISSUES = ["NOT_DEDUCTED", "TXN_MISMATCH", "DUPLICATE", "RETURN_MISSING", "SWIMS_ONLY"];
const VENDOR = { swims: "SWIMS vendor", pos: "POS vendor" };
const BRANDS = [
 { id: "IORA", label: "iORA", mono: "iO" }, { id: "SANS", label: "SANS & SANS", mono: "SS" }, { id: "TRT", label: "The Restyle Trait", mono: "TRT" },
 { id: "JUBA", label: "JUBA", mono: "JU" }, { id: "MONOLOQ", label: "MONOLOQ", mono: "MQ" },
];
const brandInfo = (id) => BRANDS.find((b) => b.id === id) || { id, label: id, mono: String(id || "?").slice(0, 2) };
const COUNTRIES = [{ id: "SG", name: "Singapore" }, { id: "MY", name: "Malaysia" }];
const PERM_LABEL = { view: "See the dashboard", details: "See EPC lists and export", manageStores: "Edit stores", manageUsers: "Manage users" };
const allPerms = (on) => Object.fromEntries(Object.keys(PERM_LABEL).map((p) => [p, on]));
const BUILTIN_ROLES = {
 admin: { name: "Administrator", builtin: true, perms: allPerms(true) },
 analyst: { name: "Analyst", builtin: true, perms: { view: true, details: true, manageStores: false, manageUsers: false } },
 viewer: { name: "Viewer", builtin: true, perms: { view: true, details: false, manageStores: false, manageUsers: false } },
};
const DEFAULT_SETTINGS = { hiddenBrands: ["MONOLOQ"], gapShare: 0.25, gapMinLines: 300, allowSelfSignup: true };
const STORE_BRAND_BY_LETTER = { A: "IORA", S: "SANS", T: "TRT", M: "MONOLOQ", J: "JUBA" };

/* ---------- state ---------- */
const state = {
 user: null, settings: { ...DEFAULT_SETTINGS }, roles: {}, users: [], storeDocs: {}, stores: {},
 meta: null, sum: [], iss: [], issLoaded: new Set(), maxD: null,
 period: 14, cc: "", br: "", ch: "", store: "", view: "overview", cat: "", vendor: "", q: "", page: 0, exGap: true, fopen: false, bOpen: false,
 sort: "issues", dir: -1, settingsTab: "profile", menu: false, chartTable: false, loading: false, audit: null, auditUntil: 0,
};
let DB = null, auth = null, fsdb = null, GAPSET = new Set();

/* ---------- roles & scope ---------- */
function roleInfo(id) { if (id === "admin") return BUILTIN_ROLES.admin; return state.roles[id] || BUILTIN_ROLES[id] || null; }
function roleName(id) { const r = roleInfo(id); return r ? r.name : (!id || id === "pending" ? "Pending approval" : id); }
function perm(p) {
 if (!FIREBASE_CONFIG) return true;
 const u = state.user; if (!u || u.locked || u.active === false) return false;
 if (u.role === "admin" || isOwner(u)) return true;
 const r = roleInfo(u.role); return !!(r && r.active !== false && r.perms && r.perms[p]);
}
const isOwner = (u) => !!u && ADMIN_EMAIL && String(u.email || "").toLowerCase() === ADMIN_EMAIL;
const isAdminUser = () => !FIREBASE_CONFIG || (state.user && (state.user.role === "admin" || isOwner(state.user)));
function canSeeCountry(c) { const u = state.user; if (!FIREBASE_CONFIG || !u || isAdminUser()) return true; return (u.countries || []).includes(c); }
function canSeeBrand(b) { const u = state.user; if (!FIREBASE_CONFIG || !u || isAdminUser()) return true; return u.allBrands !== false || (u.brands || []).includes(b); }
function canSeeStore(code) { const u = state.user; if (!FIREBASE_CONFIG || !u || isAdminUser()) return true; return u.allStores !== false || (u.stores || []).includes(code); }
const visibleCountries = () => COUNTRIES.filter((c) => canSeeCountry(c.id));
const initialsOf = (u) => {
 const pick = (s) => { const w = String(s || "").split(/[^\p{L}\p{N}]+/u).filter(Boolean); return (w.length > 1 ? w.slice(0, 2).map((x) => Array.from(x)[0]) : Array.from(w[0] || "").slice(0, 2)).join("").toUpperCase(); };
 return pick(u && u.name) || pick(u && u.email) || "?";
};
const AV_COLORS = ["#2563eb", "#0e9f9a", "#16a34a", "#e4572e", "#c026d3"];
const AV_SPECIAL = "linear-gradient(135deg,#f59e0b,#fde047 55%,#f59e0b)";
function avatarBg(u) {
 if (isOwner(u) && (!u.color || u.color === "special")) return AV_SPECIAL;
 if (u && AV_COLORS.includes(u.color)) return u.color;   // only known values reach an inline style
 const s = (u && (u.email || u.name)) || "?"; let n = 0; for (const ch of s) n = (n * 31 + ch.charCodeAt(0)) >>> 0; return AV_COLORS[n % AV_COLORS.length];
}
function avatarEl(u, cls) { const bg = avatarBg(u); return h("div", { class: "av " + (cls || ""), style: { background: bg, color: bg === AV_SPECIAL ? "#3b2a00" : "#fff" }, "aria-hidden": "true" }, initialsOf(u)); }

/* ---------- stores (brand by store, editable) ---------- */
const brandFromCode = (code) => STORE_BRAND_BY_LETTER[String(code || "")[0]] || "IORA";
function buildStoreIndex() {
 const idx = {};
 for (const r of state.sum) if (!idx[r.store]) idx[r.store] = { code: r.store, name: r.store, country: r.cc, brand: brandFromCode(r.store), channel: r.ch, active: true };
 for (const [code, d] of Object.entries(state.storeDocs)) idx[code] = { ...(idx[code] || { code, name: code, country: "SG", brand: brandFromCode(code), channel: /ECM$/.test(code) ? "ECM" : "Store", active: true }), ...d, code };
 state.stores = idx;
}
const storeInfo = (code) => state.stores[code] || { code, name: code, country: "?", brand: brandFromCode(code), channel: "Store", active: true };
const storeLabel = (code) => { const s = storeInfo(code); return s.name && s.name !== code ? s.name : code; };
function rowVisible(r) {
 const s = storeInfo(r.store);
 return s.active !== false && !(state.settings.hiddenBrands || []).includes(s.brand) && canSeeCountry(r.cc) && canSeeBrand(s.brand) && canSeeStore(r.store);
}

/* ---------- periods, aggregation ---------- */
function periodDays(n) { const out = []; const end = pdate(state.maxD); for (let i = n - 1; i >= 0; i--) { const d = new Date(end); d.setUTCDate(d.getUTCDate() - i); out.push(iso(d)); } return out; }
function makePred(force, incGap) {
 const days = new Set(periodDays((force && force.days) || state.period));
 const f = Object.assign({ cc: state.cc, br: state.br, ch: state.ch, store: state.store }, force || {});
 const skip = state.exGap && !incGap;
 return (r) => days.has(r.d) && !(skip && GAPSET.has(r.d)) && rowVisible(r) && (!f.cc || r.cc === f.cc) && (!f.ch || r.ch === f.ch) && (!f.store || r.store === f.store) && (!f.br || storeInfo(r.store).brand === f.br);
}
const g = (o, k) => (o && o[k]) || 0;
function aggregate(force, incGap) {
 const p = makePred(force, incGap); const by = {}, day = {}, store = {};
 for (const r of state.sum) {
  if (!p(r)) continue;
  by[r.st] = (by[r.st] || 0) + r.n;
  const d = (day[r.d] = day[r.d] || {}); d[r.st] = (d[r.st] || 0) + r.n;
  const s = (store[r.store] = store[r.store] || { st: {}, days: {} });
  s.st[r.st] = (s.st[r.st] || 0) + r.n;
  if (ISSUES.includes(r.st)) s.days[r.d] = (s.days[r.d] || 0) + r.n;
 }
 return { by, day, store };
}
function metrics(by) {
 const sales = g(by, "OK") + g(by, "DUPLICATE") + g(by, "NOT_DEDUCTED") + g(by, "TXN_MISMATCH") + g(by, "PENDING");
 const resolved = sales - g(by, "PENDING"); const deducted = g(by, "OK") + g(by, "DUPLICATE");
 return { sales, resolved, deducted, rate: resolved ? pct(deducted, resolved) : 100, issues: ISSUES.reduce((a, k) => a + g(by, k), 0) };
}
/* a "gap day": every store together has a big share of POS EPC sales missing in SWIMS (feed problem, not a store problem) */
function gapDays(n) {
 const days = new Set(periodDays(n || state.period)); const per = {};
 for (const r of state.sum) { if (!days.has(r.d) || !rowVisible(r)) continue; const x = (per[r.d] = per[r.d] || {}); x[r.st] = (x[r.st] || 0) + r.n; }
 const min = +state.settings.gapMinLines || 300, share = +state.settings.gapShare || 0.25; const out = [];
 for (const d of Object.keys(per)) { const x = per[d]; const lines = g(x, "OK") + g(x, "DUPLICATE") + g(x, "NOT_DEDUCTED") + g(x, "TXN_MISMATCH"); const miss = g(x, "NOT_DEDUCTED") + g(x, "TXN_MISMATCH"); if (lines >= min && miss / lines >= share) out.push({ d, lines, miss, share: miss / lines }); }
 return out.sort((a, b) => (a.d < b.d ? -1 : 1));
}
function missingPosStores() {
 const days = new Set(periodDays(state.period)); const per = {};
 for (const r of state.sum) { if (!days.has(r.d) || !rowVisible(r)) continue; const x = (per[r.store] = per[r.store] || { pos: 0, sw: 0 }); if (r.st === "SWIMS_ONLY") x.sw += r.n; else x.pos += r.n; }
 return Object.keys(per).filter((k) => per[k].pos === 0 && per[k].sw >= 20).sort().map((k) => ({ store: k, cc: storeInfo(k).country, sw: per[k].sw }));
}
function issueRows() {
 const p = makePred(); const q = state.q.trim().toUpperCase();
 return state.iss.filter((r) => p(r) && (state.cat ? r.st === state.cat : r.st !== "PENDING") && (!q || r.epc.toUpperCase().includes(q) || r.txn.toUpperCase().includes(q) || (r.item || "").toUpperCase().includes(q) || (r.swtxn || "").toUpperCase().includes(q)));
}

/* ---------- tooltip, toast, drawer ---------- */
const tipEl = () => $("tip");
function showTip(ev, head, rows, note) {
 const tip = tipEl(); tip.replaceChildren();
 if (head) tip.append(h("div", { class: "th", text: head }));
 for (const r of rows) tip.append(h("div", { class: "tr" }, r.color ? h("i", { style: "background:" + r.color }) : null, h("span", { text: r.label }), h("b", { text: r.value })));
 if (note) tip.append(h("div", { class: "tn", text: note }));
 tip.style.display = "block";
 const pad = 14, w = tip.offsetWidth, hh = tip.offsetHeight; let x = ev.clientX + pad, y = ev.clientY + pad;
 if (x + w > innerWidth - 8) x = ev.clientX - w - pad; if (y + hh > innerHeight - 8) y = ev.clientY - hh - pad;
 tip.style.left = Math.max(8, x) + "px"; tip.style.top = Math.max(8, y) + "px";
}
const hideTip = () => { const t = tipEl(); if (t) t.style.display = "none"; };
function hover(el, fn) {
 el.addEventListener("pointermove", fn); el.addEventListener("pointerdown", fn); el.addEventListener("pointerleave", hideTip);
 el.addEventListener("focus", () => { const r = el.getBoundingClientRect(); fn({ clientX: r.left + r.width / 2, clientY: r.top }); }); el.addEventListener("blur", hideTip);
}
document.addEventListener("scroll", hideTip, true);
function toast(msg) { const t = $("toast"); t.textContent = msg; t.style.display = "block"; clearTimeout(toast._t); toast._t = setTimeout(() => { t.style.display = "none"; }, 2800); }
function openDrawer(nodes) {
 const d = $("drawer"); d.replaceChildren(h("button", { class: "btn sm x", "aria-label": "Close", onclick: closeDrawer }, ico("x")), ...nodes);
 d.classList.add("on"); $("scrim").classList.add("on"); d.scrollTop = 0;
}
function closeDrawer() { $("drawer").classList.remove("on"); $("scrim").classList.remove("on"); }
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
function download(name, text) { const a = h("a", { href: URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" })), download: name }); document.body.append(a); a.click(); a.remove(); }
function csvOf(rows) {
 const head = ["issue", "date", "store", "country", "brand", "channel", "epc", "pos_txn", "sku", "swims_txn", "swims_store", "swims_rows"];
 const esc = (v) => { v = v === null || v === undefined ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
 return [head.join(",")].concat(rows.map((r) => [STATUS[r.st] ? STATUS[r.st].short : r.st, r.d, r.store, r.cc, storeInfo(r.store).brand, r.ch, r.epc, r.txn, r.item, r.swtxn, r.swstore, r.cnt].map(esc).join(","))).join("\r\n");
}
