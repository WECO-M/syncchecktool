"use strict";
/* IORA Group · SyncCheck — data layer (demo + Firestore), sign-in, gates, boot */
const toSum = (r) => ({ st: r[0], d: r[1], store: r[2], cc: r[3], br: r[4], ch: r[5], n: r[6] });
const toIss = (r) => ({ st: r[0], d: r[1], store: r[2], cc: r[3], br: r[4], ch: r[5], epc: r[6], txn: r[7], item: r[8], swtxn: r[9], swstore: r[10], cnt: r[11] });

/* ---- activity log: every change is written in the same batch as an append-only auditLog entry (owner can read it) ---- */
const AUDIT_HIDE = /pass|pw|token|secret/i;
function auditJson(v) {
 if (v === undefined || v === null) return null;
 const s = JSON.stringify(v, (k, x) => (AUDIT_HIDE.test(k) || k === "updatedAt" || k === "createdAt") ? undefined : (x && typeof x.toDate === "function" ? x.toDate().toISOString() : x));
 return s.length > 15000 ? s.slice(0, 15000) + "…(truncated)" : s;
}
async function snapData(ref) { try { const d = await ref.get(); return d.exists ? d.data() : null; } catch (e) { return null; } }
async function writeLogged(entry, build) {
 const b = fsdb.batch(); if (build) build(b);
 const u = auth.currentUser || {};
 b.set(fsdb.collection("auditLog").doc(), { at: firebase.firestore.FieldValue.serverTimestamp(), actor: u.email || "", uid: u.uid || "", action: entry.action, target: entry.target || "", id: entry.id || "", summary: entry.summary || "", before: auditJson(entry.before), after: auditJson(entry.after) });
 await b.commit();
}
const changedKeys = (before, after) => Object.keys(after || {}).filter((k) => k !== "updatedAt" && JSON.stringify((before || {})[k]) !== JSON.stringify(after[k]));
const cleanObj = (o) => { const r = {}; for (const [k, v] of Object.entries(o)) if (v !== undefined) r[k] = v; return r; };

function makeFirestoreDB() {
 const col = (n) => fsdb.collection(n); const ts = () => firebase.firestore.FieldValue.serverTimestamp();
 const payload = async (id) => { const d = await col("syncData").doc(id).get(); return d.exists ? JSON.parse(d.data().payload) : null; };
 return {
  demo: false,
  async loadMeta() { return await payload("meta"); },
  async loadSummary(cc) { const p = await payload("sum_" + cc); return (p || []).map(toSum); },
  async loadIssues(cc, days) { const out = []; await Promise.all(days.map(async (d) => { const p = await payload("iss_" + cc + "_" + d); if (p) p.forEach((r) => out.push(toIss(r))); })); return out; },
  async loadStores() { const snap = await col("stores").get(); const o = {}; snap.forEach((d) => { o[d.id] = d.data(); }); return o; },
  async saveStore(s) {
   const ref = col("stores").doc(s.code), before = await snapData(ref);
   const data = cleanObj({ name: s.name, country: s.country, brand: s.brand, channel: s.channel, active: s.active, closedOn: s.closedOn || null, note: s.note || "" });
   const ch = changedKeys(before, data);
   await writeLogged({ action: "store.save", target: "stores", id: s.code, summary: "Store " + s.code + (before ? " edited" + (ch.length ? ": " + ch.join(", ") : "") : " added"), before, after: data }, (b) => b.set(ref, { ...data, updatedAt: ts() }, { merge: true }));
  },
  async loadRoles() { const snap = await col("roles").get(); const r = {}; snap.forEach((d) => { r[d.id] = d.data(); }); return r; },
  async saveRole(id, r) { const ref = col("roles").doc(id), before = await snapData(ref); await writeLogged({ action: "role.save", target: "roles", id, summary: "Role " + (r.name || id) + (before ? " edited" : " added"), before, after: r }, (b) => b.set(ref, r)); },
  async deleteRole(id) { const ref = col("roles").doc(id), before = await snapData(ref); await writeLogged({ action: "role.delete", target: "roles", id, summary: "Role " + ((before && before.name) || id) + " deleted", before }, (b) => b.delete(ref)); },
  async loadAudit(limit) { const snap = await col("auditLog").orderBy("at", "desc").limit(limit || 500).get(); return snap.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, at: x.at && x.at.toDate ? x.at.toDate() : null }; }); },
  async loadUsers() { const snap = await col("users").get(); const u = []; snap.forEach((d) => u.push({ uid: d.id, ...d.data() })); return u; },
  async createUser(email, pw, profile) {
   const second = firebase.apps.find((a) => a.name === "second") || firebase.initializeApp(FIREBASE_CONFIG, "second");   // a 2nd app so the Administrator stays signed in
   const cred = await second.auth().createUserWithEmailAndPassword(email, pw); const uid = cred.user.uid; await second.auth().signOut();
   const doc = cleanObj({ email, ...profile, createdBy: state.user.email });   // the temporary password is never stored or logged
   await writeLogged({ action: "user.create", target: "users", id: uid, summary: "Account created for " + email + " (role " + (profile.role || "?") + ")", after: doc }, (b) => b.set(col("users").doc(uid), { ...doc, createdAt: ts() }));
   return { uid, email, ...profile };
  },
  async updateUser(uid, patch) { const ref = col("users").doc(uid), before = await snapData(ref), data = cleanObj(patch), ch = changedKeys(before, data); await writeLogged({ action: "user.update", target: "users", id: uid, summary: "User " + ((before && before.email) || uid) + " edited" + (ch.length ? ": " + ch.join(", ") : ""), before, after: data }, (b) => b.update(ref, data)); },
  async deleteUser(uid) { const ref = col("users").doc(uid), before = await snapData(ref); await writeLogged({ action: "user.delete", target: "users", id: uid, summary: "Access removed for " + ((before && before.email) || uid), before }, (b) => b.delete(ref)); },
  async sendReset(email) { await auth.sendPasswordResetEmail(email); if (auth.currentUser) { try { await writeLogged({ action: "user.reset_email", target: "users", id: "", summary: "Password reset email sent to " + email }); } catch (e) { console.warn(e); } } },
  async loadSettings() { const d = await col("config").doc("app").get(); return { ...DEFAULT_SETTINGS, ...(d.exists ? d.data() : {}) }; },
  async saveSettings(s) { const ref = col("config").doc("app"), before = await snapData(ref), ch = changedKeys(before, s); await writeLogged({ action: "settings.save", target: "config", id: "app", summary: "Settings saved" + (ch.length ? ": " + ch.join(", ") : ""), before, after: s }, (b) => b.set(ref, s, { merge: true })); },
 };
}

/* Demo / local mode: no login; settings, stores, roles and users are kept in this browser only. */
function makeDemoDB() {
 const get = (k, def) => { try { const v = JSON.parse(safe.get("sc.demo." + k) || "null"); return v === null ? def : v; } catch (e) { return def; } };
 const put = (k, v) => safe.set("sc.demo." + k, JSON.stringify(v));
 const log = (action, target, id, summary, before, after) => { const a = get("audit", []); a.unshift({ id: "a" + Date.now(), at: new Date().toISOString(), actor: ADMIN_EMAIL || "local", action, target, id, summary, before: auditJson(before), after: auditJson(after) }); put("audit", a.slice(0, 500)); };
 const L = () => window.SC_LOCAL_DATA || null;
 return {
  demo: true,
  async loadMeta() { return L() ? L().meta : null; },
  async loadSummary(cc) { return (L() ? L().sum : []).map(toSum).filter((r) => r.cc === cc); },
  async loadIssues(cc, days) { const set = new Set(days); return (L() ? L().iss : []).map(toIss).filter((r) => r.cc === cc && set.has(r.d)); },
  async loadStores() { return get("stores", {}); },
  async saveStore(s) { const all = get("stores", {}); const before = all[s.code]; all[s.code] = cleanObj({ name: s.name, country: s.country, brand: s.brand, channel: s.channel, active: s.active, closedOn: s.closedOn || null, note: s.note || "" }); put("stores", all); log("store.save", "stores", s.code, "Store " + s.code + (before ? " edited" : " added"), before, all[s.code]); },
  async loadRoles() { return get("roles", {}); },
  async saveRole(id, r) { const all = get("roles", {}); const before = all[id]; all[id] = r; put("roles", all); log("role.save", "roles", id, "Role " + (r.name || id) + (before ? " edited" : " added"), before, r); },
  async deleteRole(id) { const all = get("roles", {}); const before = all[id]; delete all[id]; put("roles", all); log("role.delete", "roles", id, "Role " + id + " deleted", before); },
  async loadAudit() { return get("audit", []).map((x) => ({ ...x, at: x.at ? new Date(x.at) : null })); },
  async loadUsers() { return get("users", [{ uid: "owner", email: ADMIN_EMAIL || "owner@local", name: "Owner", role: "admin", countries: ["SG", "MY"], allBrands: true, allStores: true, active: true, locked: false }]); },
  async createUser(email, pw, profile) { const u = get("users", []); const rec = { uid: "u" + Date.now(), email, ...profile }; u.push(rec); put("users", u); log("user.create", "users", rec.uid, "Account created for " + email, null, rec); return rec; },
  async updateUser(uid, patch) { const u = get("users", []); const i = u.findIndex((x) => x.uid === uid); if (i >= 0) { const before = { ...u[i] }; Object.assign(u[i], cleanObj(patch)); put("users", u); log("user.update", "users", uid, "User " + u[i].email + " edited", before, patch); } },
  async deleteUser(uid) { put("users", get("users", []).filter((x) => x.uid !== uid)); log("user.delete", "users", uid, "Access removed for " + uid); },
  async sendReset() {},
  async loadSettings() { return { ...DEFAULT_SETTINGS, ...get("settings", {}) }; },
  async saveSettings(s) { const before = get("settings", {}); put("settings", s); log("settings.save", "config", "app", "Settings saved", before, s); },
 };
}

/* ---- loading ---- */
async function loadAll() {
 document.body.classList.add("loading");
 try {
  const [meta, docs, roles, settings] = await Promise.all([DB.loadMeta(), DB.loadStores().catch(() => ({})), DB.loadRoles().catch(() => ({})), DB.loadSettings().catch(() => ({ ...DEFAULT_SETTINGS }))]);
  state.roles = roles; state.storeDocs = docs; state.settings = { ...DEFAULT_SETTINGS, ...settings };
  state.meta = meta; state.sum = []; state.iss = []; state.issLoaded = new Set();
  if (!meta) { state.maxD = null; render(); hideBoot(); return; }
  state.maxD = meta.posMaxDate;
  for (const c of visibleCountries()) state.sum.push(...(await DB.loadSummary(c.id)));
  buildStoreIndex(); GAPSET = new Set(gapDays().map((x) => x.d));
 } catch (e) { console.error(e); state.error = (e && e.message) || String(e); }
 document.body.classList.remove("loading");
 render(); hideBoot();
 if (state.view === "list" || state.view === "ecm") ensureIssues();
}
async function ensureIssues() {
 if (!state.maxD || !perm("details")) return;
 const days = periodDays(30).filter((d) => !state.issLoaded.has(d)); if (!days.length) return;
 state.loadingIss = true; render();
 try { for (const c of visibleCountries()) state.iss.push(...(await DB.loadIssues(c.id, days))); days.forEach((d) => state.issLoaded.add(d)); }
 catch (e) { console.error(e); state.error = (e && e.message) || String(e); }
 state.loadingIss = false; render();
}

/* ---- boot screen ---- */
const BOOT_MSGS = ["Checking POS sales…", "Matching EPCs with SWIMS…", "Looking for gaps…", "Almost there…"];
function bootScreen() {
 const p = h("p", { text: BOOT_MSGS[0] }); let i = 0; const t = setInterval(() => { i = (i + 1) % BOOT_MSGS.length; p.textContent = BOOT_MSGS[i]; }, 1400); p.dataset.t = String(t);
 return h("div", { id: "boot", class: "boot", role: "status" }, h("div", { class: "ring" }, h("div", { html: LOGO_SVG, style: "width:46px;height:46px;display:grid;place-items:center" })), h("div", { style: "font:600 26px var(--fnum)" }, "SyncCheck"), p);
}
function hideBoot() { const b = $("boot"); if (!b) return; const wait = Math.max(0, 800 - (performance.now())); setTimeout(() => { b.classList.add("out"); clearInterval(+((b.querySelector("p") || {}).dataset || {}).t); setTimeout(() => b.remove(), 500); }, wait); }

/* ---- sign-in ---- */
function authSide() {
 return h("div", { class: "side" },
  h("div", { class: "lockup" }, h("div", { html: LOGO_SVG, style: "width:48px;height:48px;flex:none" }), h("div", null, h("b", { text: "SyncCheck" }), h("span", { text: "IORA Group" }))),
  h("div", { class: "art" }, h("div", { html: LOGIN_ART })));
}
function friendlyAuthError(ex) {
 const c = (ex && ex.code) || "";
 if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found")) return "Email or password is incorrect.";
 if (c.includes("email-already-in-use")) return "That email already has an account. Sign in instead.";
 if (c.includes("weak-password")) return "Password needs at least 6 characters.";
 if (c.includes("too-many-requests")) return "Too many attempts. Wait a few minutes.";
 if (c.includes("invalid-email")) return "That email address does not look right.";
 return (ex && ex.message) || String(ex);
}
function showLogin(mode) {
 mode = mode || "signin"; hideBoot();
 const nameIn = h("input", { class: "inp", type: "text", placeholder: "Your full name", autocomplete: "name", maxlength: "80" });
 const email = h("input", { class: "inp", type: "email", placeholder: "you@iora.com.my", autocomplete: "username" });
 const pass = h("input", { class: "inp", type: "password", placeholder: "••••••••", autocomplete: mode === "signup" ? "new-password" : "current-password" });
 const err = h("div", { class: "err" }), ok = h("div", { class: "ok" });
 async function submit(e) {
  e.preventDefault(); err.textContent = ""; ok.textContent = "";
  try {
   if (mode === "signin") await auth.signInWithEmailAndPassword(email.value.trim(), pass.value);
   else if (mode === "signup") {
    const nm = nameIn.value.trim(); if (!nm) { err.textContent = "Please enter your name."; return; }
    window.__pendingName = nm;
    const cred = await auth.createUserWithEmailAndPassword(email.value.trim(), pass.value);
    try { await cred.user.updateProfile({ displayName: nm }); await writeLogged({ action: "account.signup", target: "users", id: cred.user.uid, summary: "Name set at sign-up", after: { name: nm } }, (b) => b.set(fsdb.collection("users").doc(cred.user.uid), { name: nm }, { merge: true })); } catch (x) { /* name is saved on first load */ }
   } else { await auth.sendPasswordResetEmail(email.value.trim()); ok.textContent = "Reset link sent. Check your inbox."; }
  } catch (ex) { err.textContent = friendlyAuthError(ex); }
 }
 const link = (t, m) => h("a", { href: "#", onclick: (e) => { e.preventDefault(); showLogin(m); } }, t);
 const form = h("form", { onsubmit: submit },
  h("div", { class: "mlogo", html: LOGO_SVG.replace(/#ffffff/g, "#0f172a"), style: "width:44px;height:44px" }),
  h("div", null, h("h2", null, mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"),
   h("div", { class: "muted", style: "margin-top:6px" }, mode === "signin" ? "Sign in to SyncCheck with the account your Administrator created for you." : mode === "signup" ? "An Administrator approves new accounts before they can see anything." : "We will email you a link to choose a new password.")),
  mode === "signup" ? h("label", { class: "field" }, h("span", null, "Name"), nameIn) : null,
  h("label", { class: "field" }, h("span", null, "Email"), email),
  mode !== "reset" ? h("label", { class: "field" }, h("span", null, "Password"), pass) : null,
  h("button", { class: "btn pri", type: "submit", style: "justify-content:center;height:46px" }, mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"), err, ok,
  h("div", { class: "links" }, mode === "signin" ? (state.settings.allowSelfSignup !== false ? link("Create account", "signup") : h("span")) : link("Back to sign in", "signin"), mode === "signin" ? link("Forgot password?", "reset") : null));
 $("root").replaceChildren(h("div", { class: "auth" }, authSide(), h("div", { class: "box" }, form)));
 (mode === "signup" ? nameIn : email).focus();
}
function showGate(title, text, extra) {
 hideBoot();
 $("root").replaceChildren(h("div", { class: "gate" }, h("div", { class: "inner" }, h("div", { html: LOGO_SVG.replace(/#ffffff/g, "#0f172a"), style: "width:56px;height:56px;margin:0 auto 12px" }), h("h2", { style: "font:600 26px var(--fnum);margin:0 0 8px" }, title), h("p", { class: "muted", text: text }),
  h("div", { style: "display:flex;gap:8px;justify-content:center;margin-top:16px" }, extra, h("button", { class: "btn", onclick: () => auth.signOut() }, "Sign out")))));
}

/* ---- boot ---- */
function applyTheme() { const t = safe.get("sc.theme"); document.documentElement.setAttribute("data-theme", t === "dark" ? "dark" : "light"); }
async function boot() {
 applyTheme();
 const t = safe.get("sc.period"); if (t === "7" || t === "14" || t === "30") state.period = +t;
 if (safe.get("sc.exgap") === "0") state.exGap = false;
 const hp = new URLSearchParams(location.hash.slice(1));
 if (["overview", "list", "stores", "ecm", "guide", "settings"].includes(hp.get("view"))) state.view = hp.get("view");
 if (["7", "14", "30"].includes(hp.get("period"))) state.period = +hp.get("period");
 for (const k of ["cat", "ch", "br", "cc"]) if (hp.get(k)) state[k] = hp.get(k);
 if (hp.get("exgap") === "0") state.exGap = false;
 if (hp.get("theme") === "light" || hp.get("theme") === "dark") document.documentElement.setAttribute("data-theme", hp.get("theme"));
 if (hp.get("tab")) state.settingsTab = hp.get("tab");
 document.body.prepend(bootScreen());
 if (!FIREBASE_CONFIG && hp.get("preview") === "login") { showLogin(hp.get("mode") || "signin"); return; }   // design preview only
 if (!FIREBASE_CONFIG) {
  DB = makeDemoDB();
  try { await loadScript(CFG.LOCAL_DATA || "../local/data.local.js"); } catch (e) { /* no local data file yet */ }
  state.user = { uid: "owner", email: ADMIN_EMAIL || "owner@local", name: "Thian Wei", role: "admin", countries: ["SG", "MY"], allBrands: true, allStores: true, active: true };
  await loadAll(); return;
 }
 const v = "10.14.1";
 await loadScript("https://www.gstatic.com/firebasejs/" + v + "/firebase-app-compat.js");
 await Promise.all([loadScript("https://www.gstatic.com/firebasejs/" + v + "/firebase-auth-compat.js"), loadScript("https://www.gstatic.com/firebasejs/" + v + "/firebase-firestore-compat.js")]);
 firebase.initializeApp(FIREBASE_CONFIG); auth = firebase.auth(); fsdb = firebase.firestore(); DB = makeFirestoreDB();
 try { const d = await fsdb.collection("config").doc("app").get(); if (d.exists) state.settings = { ...DEFAULT_SETTINGS, ...d.data() }; } catch (e) { /* public read before sign-in is optional */ }
 auth.onAuthStateChanged(async (fbUser) => {
  if (!fbUser) { state.user = null; showLogin("signin"); return; }
  try {
   const ref = fsdb.collection("users").doc(fbUser.uid); let snap = await ref.get();
   if (!snap.exists) {
    const owner = (fbUser.email || "").toLowerCase() === ADMIN_EMAIL;
    const first = { email: fbUser.email, name: fbUser.displayName || window.__pendingName || "", role: owner ? "admin" : "pending", countries: owner ? COUNTRIES.map((c) => c.id) : [], allBrands: true, brands: [], allStores: true, stores: [], active: true, locked: false };
    await writeLogged({ action: "account.signup", target: "users", id: fbUser.uid, summary: "New account " + fbUser.email + " (" + first.role + ")", after: first }, (b) => b.set(ref, { ...first, createdAt: firebase.firestore.FieldValue.serverTimestamp() }));
    snap = await ref.get();
   }
   state.user = { uid: fbUser.uid, ...snap.data() }; const u = state.user;
   if (u.locked) return showGate("Account locked", "An Administrator has locked this account. Contact them if that is a mistake.");
   if (u.active === false) return showGate("Account inactive", "This account is switched off. An Administrator can reactivate it under Settings → Users.");
   if (!u.role || u.role === "pending" || (u.role !== "admin" && !roleInfo(u.role))) {
    try { state.roles = await DB.loadRoles(); } catch (e) { /* ignore */ }
    if (!u.role || u.role === "pending" || (u.role !== "admin" && !roleInfo(u.role))) return showGate("Waiting for approval", "You are signed in as " + u.email + ". An Administrator needs to give you a role before you can see SyncCheck.");
   }
   if (!isOwner(u) && u.role !== "admin" && !visibleCountries().length) return showGate("No country access yet", "Ask an Administrator to tick Singapore and/or Malaysia for your account.");
   if (!$("boot")) document.body.prepend(bootScreen());
   await loadAll();
  } catch (e) { console.error(e); showGate("Something went wrong", (e && e.message) || String(e)); }
 });
}
