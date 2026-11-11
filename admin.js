"use strict";
/* IORA Group · SyncCheck — settings: profile, users, roles, stores, rules, appearance, activity log */
function sw(on, onclick, disabled) { return h("button", { type: "button", class: "switch" + (on ? " on" : ""), disabled: !!disabled, "aria-pressed": on ? "true" : "false", onclick: (e) => { e.currentTarget.classList.toggle("on"); if (onclick) onclick(e); } }); }
const swOn = (b) => b.classList.contains("on");
const secHead = (title, sub, ...tools) => h("div", { class: "chead" }, h("div", null, h("h2", { text: title }), sub ? h("div", { class: "sub", text: sub }) : null), tools.length ? h("div", { class: "row sp" }, tools) : null);

function settingsTabsList() {
 const tabs = [["profile", "My profile", "user"], ["users", "Users", "users", "manageUsers"], ["roles", "Roles", "shield", "manageUsers"], ["stores", "Stores", "store", "manageStores"], ["rules", "Rules", "sliders", "admin"], ["appearance", "Appearance", "sun"], ["audit", "Activity log", "lock", "owner"]]
  .filter((t) => !t[3] || (t[3] === "owner" ? isOwner(state.user) || !FIREBASE_CONFIG : t[3] === "admin" ? isAdminUser() : perm(t[3])));
 if (!tabs.some((t) => t[0] === state.settingsTab)) state.settingsTab = tabs[0][0];
 return tabs;
}
function settingsNav() {
 return settingsTabsList().map(([id, label, ic]) => h("button", { class: "tab", role: "tab", "aria-selected": id === state.settingsTab ? "true" : "false", onclick: () => { state.settingsTab = id; render(); } }, ico(ic), label));
}
function settingsBody() {
 settingsTabsList();
 const body = h("div", { class: "card", style: "margin-top:18px" });
 ({ profile: settingsProfile, users: settingsUsers, roles: settingsRoles, stores: settingsStores, rules: settingsRules, appearance: settingsAppearance, audit: settingsAudit })[state.settingsTab](body);
 return body;
}

/* ---- profile ---- */
function settingsProfile(body) {
 const u = state.user || {}; const lockedAcc = isOwner(u) && !!FIREBASE_CONFIG; const name = h("input", { class: "inp", type: "text", value: u.name || "" }); const msg = h("span", { class: "muted" });
 let pick = isOwner(u) && (!u.color || u.color === "special") ? "special" : (AV_COLORS.includes(u.color) ? u.color : avatarBg(u));
 const opts = (isOwner(u) ? [["special", AV_SPECIAL]] : []).concat(AV_COLORS.map((c) => [c, c]));
 const prev = h("div", { class: "av big", style: { background: pick === "special" ? AV_SPECIAL : pick, color: pick === "special" ? "#3b2a00" : "#fff" } }, initialsOf(u));
 const sws = h("div", { class: "swatches" }, opts.map(([key, css]) => h("button", { type: "button", class: "sw" + (key === pick ? " on" : ""), "data-k": key, style: { background: css }, "aria-label": "Colour " + key, onclick: () => { pick = key; sws.querySelectorAll(".sw").forEach((b) => b.classList.toggle("on", b.dataset.k === key)); prev.style.background = key === "special" ? AV_SPECIAL : key; prev.style.color = key === "special" ? "#3b2a00" : "#fff"; } })));
 const ro = (v) => h("input", { class: "inp", type: "text", value: v, disabled: true });
 body.append(secHead("My profile", "How you appear to colleagues."), lockedAcc ? h("div", { class: "banner info", style: "margin-bottom:16px;max-width:460px" }, h("div", { class: "ic" }, ico("lock")), h("div", null, h("b", { text: "Owner account. " }), "Your role, access and email are locked and cannot be changed by anyone. You can change your name and colour here.")) : null, h("div", { class: "form", style: "max-width:460px" },
  h("div", { class: "row", style: "gap:18px" }, prev, h("div", null, h("div", { class: "field" }, h("span", null, "Profile colour")), sws)),
  h("label", { class: "field" }, h("span", null, "Name"), name), h("label", { class: "field" }, h("span", null, "Email"), ro(u.email || "")), h("label", { class: "field" }, h("span", null, "Role"), ro(roleName(u.role))),
  h("label", { class: "field" }, h("span", null, "Access"), ro(isAdminUser() ? "All countries, brands and stores" : (u.countries || []).join(" + ") + " · " + (u.allBrands === false ? (u.brands || []).map((b) => brandInfo(b).label).join(", ") : "all brands") + " · " + (u.allStores === false ? (u.stores || []).length + " stores" : "all stores"))),
  h("div", { class: "row" }, h("button", { class: "btn pri", onclick: async () => { try { await DB.updateUser(u.uid, { name: name.value.trim(), color: pick }); u.name = name.value.trim(); u.color = pick; toast("Saved"); render(); } catch (e) { msg.textContent = e.message; } } }, "Save"),
   FIREBASE_CONFIG ? h("button", { class: "btn", onclick: async () => { await DB.sendReset(u.email); toast("Password reset email sent"); } }, "Email me a password reset") : null, msg)));
}

/* ---- users ---- */
function brandAccess(u) { return u.allBrands === false ? ((u.brands || []).map((b) => brandInfo(b).label).join(", ") || "no brand") : "all brands"; }
function settingsUsers(body) {
 body.append(secHead("Users", "Create accounts for colleagues and choose what they can see.", h("button", { class: "btn pri", onclick: () => openUserEditor(null) }, ico("plus"), "Create account")));
 const tb = h("tbody", null, h("tr", null, h("td", { colspan: 6, class: "muted", text: "Loading…" })));
 body.append(h("div", { class: "tw" }, h("table", null, h("thead", null, h("tr", null, ["Name", "Email", "Role", "Access", "Status", ""].map((x) => h("th", { text: x })))), tb)));
 DB.loadUsers().then((users) => {
  state.users = users.sort((a, b) => (a.role === "pending" ? 0 : 1) - (b.role === "pending" ? 0 : 1) || String(a.name || a.email).localeCompare(String(b.name || b.email)));
  tb.replaceChildren(...users.map((u) => {
   const ri = roleInfo(u.role); const cls = u.role === "admin" ? "admin" : (!u.role || u.role === "pending" || !ri) ? "pending" : (ri.active === false ? "off" : "");
   const access = u.role === "admin" ? "Everything" : [(u.countries || []).join(" + ") || "no country", brandAccess(u), u.allStores === false ? (u.stores || []).length + " stores" : "all stores"].join(" · ");
   return h("tr", null, h("td", { text: u.name || "–" }), h("td", { class: "mono", text: u.email }), h("td", null, h("span", { class: "rolepill " + cls, text: roleName(u.role) })), h("td", { text: access }),
    h("td", null, u.locked ? h("span", { class: "cpill crit", text: "Locked" }) : u.active === false ? h("span", { class: "cpill off", text: "Inactive" }) : h("span", { class: "cpill good", text: "Active" })), h("td", null, isOwner(u) && FIREBASE_CONFIG ? h("span", { class: "cpill off", style: "display:inline-flex;gap:6px;align-items:center" }, ico("lock"), "Locked") : h("button", { class: "btn sm", onclick: () => openUserEditor(u) }, ico("edit"), "Edit")));
  }));
  if (!users.length) tb.append(h("tr", null, h("td", { colspan: 6, class: "muted", text: "No users yet." })));
 }).catch((e) => tb.replaceChildren(h("tr", null, h("td", { colspan: 6, class: "err", text: "Could not load users: " + e.message }))));
}
function roleOptions(current) {
 const opts = [["admin", "Administrator"]];
 for (const [id, r] of Object.entries({ ...BUILTIN_ROLES, ...state.roles })) if (id !== "admin" && r.active !== false) opts.push([id, r.name || id]);
 opts.push(["pending", "Pending approval (no access)"]);
 if (current && !opts.some((o) => o[0] === current)) opts.push([current, roleName(current) + " (inactive role)"]);
 return opts;
}
function storePicker(selected, countries, brands) {
 const set = new Set(selected || []); const wrap = h("div", { class: "pickbox" });
 const draw = () => {
  const bl = brands ? brands() : null;
  const shown = COUNTRIES.filter((c) => countries().includes(c.id)).map((c) => ({ c, list: Object.values(state.stores).filter((s) => s.country === c.id && s.active !== false && (!bl || bl.includes(s.brand))).sort((a, b) => a.code.localeCompare(b.code)) })).filter((x) => x.list.length);
  const all = shown.flatMap((x) => x.list.map((s) => s.code)); const count = h("span", { class: "muted", style: "margin-right:auto" });
  const upd = () => { count.textContent = all.filter((x) => set.has(x)).length + " of " + all.length + " ticked"; }; upd();
  wrap.replaceChildren(h("div", { class: "pickbar" }, count, h("button", { type: "button", class: "btn sm", onclick: () => { all.forEach((x) => set.add(x)); draw(); } }, "Select all"), h("button", { type: "button", class: "btn sm", onclick: () => { all.forEach((x) => set.delete(x)); draw(); } }, "Clear")),
   ...shown.flatMap(({ c, list }) => [h("div", { class: "eyebrow muted", style: "margin:8px 4px 2px", text: c.name }), ...list.map((s) => h("label", { class: "tickrow" }, h("input", { type: "checkbox", checked: set.has(s.code), onchange: (e) => { if (e.target.checked) set.add(s.code); else set.delete(s.code); upd(); } }), h("span", { class: "mono", text: s.code }), h("span", { class: "muted", text: s.name !== s.code ? s.name : "" })))]));
  if (!all.length) wrap.append(h("span", { class: "muted", style: "padding:8px 4px", text: "Tick a country first." }));
 };
 draw(); return { el: wrap, value: () => [...set], redraw: draw };
}
function openUserEditor(u) {
 const isNew = !u; const me = state.user || {}; const isSelf = u && u.uid === me.uid; const ownerRow = !isNew && isOwner(u); const guarded = ownerRow || (!isNew && !isSelf && u.role === "admin" && !isAdminUser());
 const email = h("input", { class: "inp", type: "email", value: u ? u.email : "", disabled: !isNew, placeholder: "name@iora.com.my" }); const name = h("input", { class: "inp", type: "text", value: u ? u.name || "" : "", disabled: ownerRow });
 const pw = h("input", { class: "inp", type: "text", value: isNew ? genPassword() : "", autocomplete: "off" });
 const roleSel = h("select", { disabled: isSelf || guarded }, roleOptions(u ? u.role : null).map(([v, t]) => h("option", { value: v, selected: (u ? u.role : "viewer") === v }, t)));
 const cSet = new Set(u ? u.countries || [] : ["SG"]); const bSet = new Set(u ? u.brands || [] : []);
 const brandBox = h("div", { class: "brandrow" }); const allBrands = sw(!u || u.allBrands !== false, () => { brandBox.style.display = swOn(allBrands) ? "none" : "flex"; picker.redraw(); });
 const picker = storePicker(u ? u.stores : [], () => [...cSet], () => (swOn(allBrands) ? null : [...bSet]));
 BRANDS.forEach((b) => brandBox.append(h("label", { class: "chk" }, h("input", { type: "checkbox", checked: bSet.has(b.id), onchange: (e) => { if (e.target.checked) bSet.add(b.id); else bSet.delete(b.id); picker.redraw(); } }), b.label)));
 brandBox.style.display = swOn(allBrands) ? "none" : "flex";
 const allStores = sw(!u || u.allStores !== false, () => { picker.el.style.display = swOn(allStores) ? "none" : "grid"; }); picker.el.style.display = swOn(allStores) ? "none" : "grid";
 const countries = h("div", { class: "brandrow" }, COUNTRIES.map((c) => h("label", { class: "chk" }, h("input", { type: "checkbox", checked: cSet.has(c.id), disabled: isSelf, onchange: (e) => { if (e.target.checked) cSet.add(c.id); else cSet.delete(c.id); picker.redraw(); } }), c.name)));
 const active = sw(!u || u.active !== false, null, isSelf); const locked = sw(!!(u && u.locked), null, isSelf); const sendReset = h("input", { type: "checkbox", checked: true });
 const err = h("div", { class: "err" }), ok = h("div", { class: "ok" }); let rm = false;
 async function save() {
  err.textContent = ""; ok.textContent = ""; const bOn = swOn(allBrands);
  if (!bOn && !bSet.size && roleSel.value !== "admin") { err.textContent = "Tick at least one brand, or switch on All brands."; return; }
  const profile = { name: name.value.trim(), role: roleSel.value, countries: [...cSet], allBrands: bOn, brands: bOn ? [] : [...bSet], allStores: swOn(allStores), stores: swOn(allStores) ? [] : picker.value(), active: swOn(active), locked: swOn(locked) };
  try {
   if (isNew) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim())) { err.textContent = "Enter a valid email address."; return; }
    if (pw.value.length < 8) { err.textContent = "Temporary password needs at least 8 characters."; return; }
    await DB.createUser(email.value.trim(), pw.value, profile);
    if (sendReset.checked && FIREBASE_CONFIG) { try { await DB.sendReset(email.value.trim()); } catch (e) { console.warn(e); } }
    ok.textContent = "Account created." + (sendReset.checked && FIREBASE_CONFIG ? " A set-your-password email was sent." : " Share the temporary password in person.");
   } else { const toSave = isSelf ? { name: profile.name } : profile; await DB.updateUser(u.uid, toSave); if (isSelf) Object.assign(state.user, toSave); ok.textContent = "Saved."; }
   setTimeout(() => { closeDrawer(); render(); }, 700);
  } catch (e) { err.textContent = (e && e.message) || String(e); }
 }
 openDrawer([h("div", { class: "eyebrow muted", text: isNew ? "New account" : "Edit account" }), h("h3", { text: isNew ? "Create an account" : (u.name || u.email) }),
  h("div", { class: "dsub", text: isNew ? "They sign in with this email and the temporary password, or with the set-password email." : ownerRow ? "This is the owner account. It is always an Administrator with full access." : isSelf ? "This is you. Role, countries and status are protected." : guarded ? "Only an Administrator can change another Administrator." : "Changes apply the next time they open the page." }),
  h("div", { class: "form" }, h("div", { class: "two" }, h("label", { class: "field" }, h("span", null, "Email"), email), h("label", { class: "field" }, h("span", null, "Name"), name)),
   isNew ? h("label", { class: "field" }, h("span", null, "Temporary password"), pw, h("span", { class: "hint" }, "Generated for you; change it if you like. Shown only here.")) : null,
   isNew && FIREBASE_CONFIG ? h("label", { class: "row" }, sendReset, "Also email them a link to set their own password") : null,
   h("label", { class: "field" }, h("span", null, "Role"), roleSel), h("div", { class: "field" }, h("span", null, "Countries"), countries),
   h("div", { class: "field" }, h("span", null, "Brands"), h("div", { class: "row" }, allBrands, "All brands"), brandBox), h("div", { class: "field" }, h("span", null, "Stores"), h("div", { class: "row" }, allStores, "All stores in those countries"), picker.el),
   h("div", { class: "two" }, h("div", { class: "field" }, h("span", null, "Active"), active), h("div", { class: "field" }, h("span", null, "Locked"), locked))),
  h("div", { class: "actions" }, h("button", { class: "btn pri", disabled: guarded, onclick: save }, isNew ? "Create account" : "Save"),
   !isNew && FIREBASE_CONFIG ? h("button", { class: "btn", onclick: async () => { await DB.sendReset(u.email); toast("Reset email sent to " + u.email); } }, "Send password reset") : null,
   !isNew && !isSelf && !guarded ? h("button", { class: "btn danger", onclick: async (e) => { if (!rm) { rm = true; e.currentTarget.textContent = "Click again to remove access"; return; } await DB.deleteUser(u.uid); closeDrawer(); render(); } }, "Remove access") : null, err, ok)]);
}

/* ---- roles ---- */
function settingsRoles(body) {
 body.append(secHead("Roles", "What each role may do. Administrator is fixed; the others can be renamed, edited or added to.", h("button", { class: "btn pri", onclick: () => openRoleEditor(null) }, ico("plus"), "New role")));
 const all = [["admin", BUILTIN_ROLES.admin], ...Object.entries({ ...BUILTIN_ROLES, ...state.roles }).filter(([id]) => id !== "admin")];
 body.append(h("div", { class: "tw" }, h("table", null, h("thead", null, h("tr", null, h("th", { text: "Role" }), Object.values(PERM_LABEL).map((l) => h("th", { text: l })), h("th", { text: "Status" }), h("th"))),
  h("tbody", null, all.map(([id, r]) => h("tr", null, h("td", null, h("b", { text: r.name || id }), BUILTIN_ROLES[id] ? h("span", { class: "muted", text: " built-in" }) : null), Object.keys(PERM_LABEL).map((p) => h("td", null, r.perms && r.perms[p] ? h("b", { style: "color:var(--good)", text: "✓" }) : h("span", { class: "muted", text: "·" }))),
   h("td", null, r.active === false ? h("span", { class: "cpill off", text: "Inactive" }) : h("span", { class: "cpill good", text: "Active" })), h("td", null, id === "admin" ? ico("lock") : h("button", { class: "btn sm", onclick: () => openRoleEditor(id, r) }, ico("edit"), "Edit"))))))));
}
function openRoleEditor(id, data) {
 const isNew = !id; const name = h("input", { class: "inp", type: "text", value: data ? data.name || "" : "" }); const perms = {};
 const rows = Object.entries(PERM_LABEL).map(([p, l]) => { perms[p] = sw(data && data.perms ? !!data.perms[p] : (isNew && p === "view")); return h("div", { class: "row" }, perms[p], l); });
 const active = sw(!data || data.active !== false); const err = h("div", { class: "err" });
 async function save() {
  const nm = name.value.trim(); if (!nm) { err.textContent = "Give the role a name."; return; }
  const rid = isNew ? nm.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : id;
  if (isNew && (!rid || ["admin", "pending"].includes(rid) || state.roles[rid] || BUILTIN_ROLES[rid])) { err.textContent = "That name is reserved or already exists."; return; }
  const doc = { name: nm, active: swOn(active), perms: Object.fromEntries(Object.keys(PERM_LABEL).map((p) => [p, swOn(perms[p])])) };
  try { await DB.saveRole(rid, doc); state.roles[rid] = doc; closeDrawer(); render(); } catch (e) { err.textContent = e.message; }
 }
 const del = !isNew && !BUILTIN_ROLES[id] ? h("button", { class: "btn danger", onclick: async () => { await DB.deleteRole(id); delete state.roles[id]; closeDrawer(); render(); } }, "Delete role") : null;
 openDrawer([h("div", { class: "eyebrow muted", text: isNew ? "New role" : "Edit role" }), h("h3", { text: isNew ? "Create a role" : (data.name || id) }), h("div", { class: "dsub", text: "Changes apply the next time people with this role open the page." }),
  h("div", { class: "form" }, h("label", { class: "field" }, h("span", null, "Role name"), name), h("div", { class: "field" }, h("span", null, "Permissions"), rows), h("div", { class: "row" }, active, "Active (inactive roles lose access until re-enabled)")),
  h("div", { class: "actions" }, h("button", { class: "btn pri", onclick: save }, "Save"), del, err)]);
}

/* ---- stores (brand is per store) ---- */
function settingsStores(body) {
 const ui = (state.stUi = state.stUi || { cc: "", br: "", sort: "brand", dir: 1, q: "" });
 body.append(secHead("Stores", "Name, brand, country and whether a store is open. Filter by country or brand, and click a heading to sort.", h("button", { class: "btn pri", onclick: () => openStoreEditor(null) }, ico("plus"), "Add store")));
 const all = Object.values(state.stores); const bIdx = (b) => { const i = BRANDS.findIndex((x) => x.id === b); return i < 0 ? 99 : i; };
 const statusOf = (s) => (s.active === false ? 2 : (state.settings.hiddenBrands || []).includes(s.brand) ? 1 : 0);
 let list = all.filter((s) => (!ui.cc || s.country === ui.cc) && (!ui.br || s.brand === ui.br) && (!ui.q || (s.code + " " + s.name).toLowerCase().includes(ui.q.toLowerCase())));
 const cmpCode = (a, b) => a.code.localeCompare(b.code);
 const cIdx = (s) => { const i = COUNTRIES.findIndex((c) => c.id === s.country); return i < 0 ? 99 : i; };
 const keys = { brand: (a, b) => bIdx(a.brand) - bIdx(b.brand) || cIdx(a) - cIdx(b) || cmpCode(a, b), country: (a, b) => cIdx(a) - cIdx(b) || bIdx(a.brand) - bIdx(b.brand) || cmpCode(a, b), code: cmpCode, name: (a, b) => String(a.name).localeCompare(String(b.name)) || cmpCode(a, b), channel: (a, b) => String(a.channel).localeCompare(String(b.channel)) || cmpCode(a, b), status: (a, b) => statusOf(a) - statusOf(b) || cmpCode(a, b) };
 list.sort((a, b) => keys[ui.sort](a, b) * ui.dir);
 const chip = (label, on, click, n) => h("button", { class: "bchip", "aria-pressed": on ? "true" : "false", onclick: click }, label, n !== undefined ? h("em", { text: String(n) }) : null);
 const cnt = (f) => all.filter(f).length;
 body.append(h("div", { class: "filterrow", style: "border:0;margin:0 0 14px;padding:0" },
  h("div", { class: "brandrow" }, chip("All countries", ui.cc === "", () => { ui.cc = ""; render(); }, cnt((s) => (!ui.br || s.brand === ui.br))), COUNTRIES.map((c) => chip(c.name, ui.cc === c.id, () => { ui.cc = c.id; render(); }, cnt((s) => s.country === c.id && (!ui.br || s.brand === ui.br))))),
  h("div", { class: "brandrow", style: "flex-basis:100%" }, chip("All brands", ui.br === "", () => { ui.br = ""; render(); }, cnt((s) => !ui.cc || s.country === ui.cc)), BRANDS.filter((b) => all.some((s) => s.brand === b.id)).map((b) => chip(b.label, ui.br === b.id, () => { ui.br = b.id; render(); }, cnt((s) => s.brand === b.id && (!ui.cc || s.country === ui.cc))))),
  h("input", { class: "inp", type: "search", placeholder: "Search code or name", value: ui.q, style: "width:min(300px,100%)", "aria-label": "Search stores", oninput: (e) => { ui.q = e.target.value; const p = e.target.selectionStart; render(); const n = document.querySelector('input[aria-label="Search stores"]'); if (n) { n.focus(); n.setSelectionRange(p, p); } } })));
 const cols = [["code", "Code"], ["name", "Name"], ["brand", "Brand"], ["country", "Country"], ["channel", "Channel"], ["status", "Status"]];
 const th = cols.map(([k, t]) => h("th", { class: "sortable", tabindex: 0, text: t + (ui.sort === k ? (ui.dir < 0 ? " ▾" : " ▴") : ""), onclick: () => { if (ui.sort === k) ui.dir = -ui.dir; else { ui.sort = k; ui.dir = 1; } render(); }, onkeydown: (e) => { if (e.key === "Enter") e.target.click(); } }));
 const row = (s) => h("tr", null, h("td", null, h("b", { text: s.code })), h("td", { text: s.name !== s.code ? s.name : "" }), h("td", { text: brandInfo(s.brand).label }), h("td", { text: s.country }), h("td", { text: s.channel || "Store" }),
  h("td", null, s.active === false ? h("span", { class: "cpill off", text: s.closedOn ? "Closed " + s.closedOn : "Closed" }) : (state.settings.hiddenBrands || []).includes(s.brand) ? h("span", { class: "cpill off", text: "Brand hidden" }) : h("span", { class: "cpill good", text: "Open" })),
  h("td", null, h("button", { class: "btn sm", onclick: () => openStoreEditor(s) }, ico("edit"), "Edit")));
 const rows = []; let last = null;
 for (const s of list) {
  if (ui.sort === "brand" && s.brand !== last) { last = s.brand; const n = list.filter((x) => x.brand === s.brand).length; rows.push(h("tr", { class: "grouprow" }, h("td", { colspan: 7 }, brandInfo(s.brand).label + " · " + n + " store" + (n === 1 ? "" : "s") + (ui.cc ? "" : " (" + ["SG", "MY"].map((c) => c + " " + list.filter((x) => x.brand === s.brand && x.country === c).length).join(", ") + ")")))); }
  rows.push(row(s));
 }
 body.append(h("div", { class: "tw" }, h("table", null, h("thead", null, h("tr", null, th, h("th"))), h("tbody", null, rows.length ? rows : h("tr", null, h("td", { colspan: 7, class: "muted", text: "No stores match." }))))));
}
function openStoreEditor(s) {
 if (!perm("manageStores")) return;
 const isNew = !s; const code = h("input", { class: "inp", type: "text", value: s ? s.code : "", disabled: !isNew, maxlength: "10", placeholder: "e.g. AWA", style: "text-transform:uppercase" });
 const name = h("input", { class: "inp", type: "text", value: s && s.name !== s.code ? s.name : "", placeholder: "Store name, e.g. Wisma Atria" });
 const country = h("select", null, COUNTRIES.map((c) => h("option", { value: c.id, selected: (s ? s.country : "SG") === c.id }, c.name)));
 const brand = h("select", null, BRANDS.map((b) => h("option", { value: b.id, selected: (s ? s.brand : "IORA") === b.id }, b.label)));
 const channel = h("select", null, ["Store", "ECM"].map((c) => h("option", { value: c, selected: (s ? s.channel || "Store" : "Store") === c }, c === "ECM" ? "ECM (e-commerce)" : "Store")));
 const open = sw(!s || s.active !== false); const closedOn = h("input", { class: "inp", type: "date", value: (s && s.closedOn) || "" }); const note = h("input", { class: "inp", type: "text", value: (s && s.note) || "", placeholder: "Optional note" });
 const err = h("div", { class: "err" });
 async function save() {
  const c = code.value.trim().toUpperCase(); if (!/^[A-Z0-9]{2,10}$/.test(c)) { err.textContent = "Store code: 2 to 10 letters or digits."; return; }
  if (isNew && state.stores[c] && Object.keys(state.storeDocs).includes(c)) { err.textContent = "That store already exists. Edit it from the list."; return; }
  const doc = { code: c, name: name.value.trim() || c, country: country.value, brand: brand.value, channel: channel.value, active: swOn(open), closedOn: swOn(open) ? null : (closedOn.value || null), note: note.value.trim() };
  try { await DB.saveStore(doc); state.storeDocs[c] = doc; buildStoreIndex(); GAPSET = new Set(gapDays().map((x) => x.d)); closeDrawer(); toast("Store " + c + " saved"); render(); } catch (e) { err.textContent = (e && e.message) || String(e); }
 }
 openDrawer([h("div", { class: "eyebrow muted", text: isNew ? "New store" : "Edit store" }), h("h3", { text: isNew ? "Add a store" : s.code + (s.name !== s.code ? " · " + s.name : "") }), h("div", { class: "dsub", text: "Changes are saved to the shared store list and written to the activity log." }),
  h("div", { class: "form" }, h("div", { class: "two" }, h("label", { class: "field" }, h("span", null, "Store code"), code), h("label", { class: "field" }, h("span", null, "Name"), name)),
   h("div", { class: "two" }, h("label", { class: "field" }, h("span", null, "Brand"), brand), h("label", { class: "field" }, h("span", null, "Country"), country)), h("label", { class: "field" }, h("span", null, "Channel"), channel),
   h("div", { class: "field" }, h("span", null, "Open"), h("div", { class: "row" }, open, "Open (closed stores are left out of every number)")), h("label", { class: "field" }, h("span", null, "Closed on (optional)"), closedOn), h("label", { class: "field" }, h("span", null, "Note"), note)),
  h("div", { class: "actions" }, h("button", { class: "btn pri", onclick: save }, "Save"), err)]);
}

/* ---- rules ---- */
function settingsRules(body) {
 const s = state.settings; const hid = new Set(s.hiddenBrands || []);
 const gap = h("input", { class: "inp", type: "number", min: "5", max: "90", value: Math.round((s.gapShare || 0.25) * 100), style: "width:120px" });
 const minl = h("input", { class: "inp", type: "number", min: "50", max: "5000", value: s.gapMinLines || 300, style: "width:120px" });
 const signup = sw(s.allowSelfSignup !== false); const msg = h("span", { class: "muted" });
 body.append(secHead("Rules", "What counts as a data gap, and which brands are hidden."), h("div", { class: "form", style: "max-width:560px" },
  h("div", { class: "field" }, h("span", null, "Hide these brands everywhere"), h("div", { class: "brandrow" }, BRANDS.map((b) => h("label", { class: "chk" }, h("input", { type: "checkbox", checked: hid.has(b.id), onchange: (e) => { if (e.target.checked) hid.add(b.id); else hid.delete(b.id); } }), b.label))), h("span", { class: "hint", text: "Hidden brands stay in the data, so they can be shown again at any time." })),
  h("div", { class: "two" }, h("label", { class: "field" }, h("span", null, "Data gap when this % of a day is missing"), gap), h("label", { class: "field" }, h("span", null, "…and the day has at least this many POS EPC sales"), minl)),
  h("div", { class: "row" }, signup, "Let people create their own account (they wait for approval)"),
  h("div", { class: "row" }, h("button", { class: "btn pri", onclick: async () => { const ns = { ...state.settings, hiddenBrands: [...hid], gapShare: Math.min(0.9, Math.max(0.05, (+gap.value || 25) / 100)), gapMinLines: Math.max(50, +minl.value || 300), allowSelfSignup: swOn(signup) }; try { await DB.saveSettings(ns); state.settings = ns; GAPSET = new Set(gapDays().map((x) => x.d)); toast("Rules saved"); render(); } catch (e) { msg.textContent = e.message; } } }, "Save rules"), msg)));
}

/* ---- appearance ---- */
function settingsAppearance(body) {
 const cur = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
 body.append(secHead("Appearance", "Pick what is easiest on your eyes."), h("div", { class: "brandrow" }, [["light", "Light", "sun"], ["dark", "Dark", "moon"]].map(([v, t, ic]) => h("button", { class: "bchip", "aria-pressed": cur === v ? "true" : "false", onclick: () => { document.documentElement.dataset.theme = v; safe.set("sc.theme", v); render(); } }, ico(ic), t))));
}

/* ---- activity log (owner only, password again to open) ---- */
const AUDIT_GROUPS = [["", "Everything"], ["user.", "Users"], ["role.", "Roles"], ["store.", "Stores"], ["settings.", "Rules"], ["account.", "Sign-ups"], ["feed.", "Daily job"]];
const AUDIT_OPEN_MS = 4 * 60 * 1000;
const auditPretty = (s) => { if (!s) return "–"; try { return JSON.stringify(JSON.parse(s), null, 2); } catch (e) { return String(s); } };
function settingsAudit(body) {
 body.append(secHead("Activity log", "Who changed what. Only the owner can open this page."));
 if (!isOwner(state.user) && FIREBASE_CONFIG) { body.append(h("div", { class: "muted", text: "Not available." })); return; }
 if (Date.now() >= (state.auditUntil || 0)) {
  const pw = h("input", { class: "inp", type: "password", autocomplete: "current-password", placeholder: "Enter your password", style: "max-width:320px" }); const err = h("div", { class: "err" });
  const goOpen = async () => {
   err.textContent = ""; if (FIREBASE_CONFIG && !pw.value) { err.textContent = "Enter your password."; return; }
   try {
    if (!DB.demo) { const u = auth.currentUser; await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, pw.value)); await u.getIdToken(true); }
    pw.value = ""; state.audit = await DB.loadAudit(500); state.auditUntil = Date.now() + AUDIT_OPEN_MS;
    clearTimeout(state._auditT); state._auditT = setTimeout(() => { if (state.view === "settings" && state.settingsTab === "audit") render(); }, AUDIT_OPEN_MS + 500); render();
   } catch (e) { pw.value = ""; err.textContent = /wrong-password|invalid-credential|invalid-login/.test((e && (e.code || e.message)) || "") ? "That password is not right." : /too-many/.test((e && e.code) || "") ? "Too many attempts. Wait a few minutes." : ((e && e.message) || String(e)); }
  };
  pw.addEventListener("keydown", (e) => { if (e.key === "Enter") goOpen(); });
  body.append(h("div", { class: "form", style: "max-width:460px" }, h("p", { class: "muted", text: DB.demo ? "Local mode: no password needed. In the live version you type your password again to open this page, and it locks after 4 minutes." : "This page is locked. Type your password again to open it. It locks after 4 minutes or when you leave the page." }), DB.demo ? null : h("label", { class: "field" }, h("span", null, "Password"), pw), h("div", { class: "row" }, h("button", { class: "btn pri", onclick: goOpen }, ico("lock"), "Unlock"), err))); return;
 }
 const rows = state.audit || []; let group = "", q = ""; const tb = h("tbody"); const count = h("span", { class: "muted", style: "margin-right:auto" });
 const draw = () => {
  const f = rows.filter((r) => (!group || (r.action || "").startsWith(group)) && (!q || [r.actor, r.action, r.target, r.id, r.summary].join(" ").toLowerCase().includes(q)));
  tb.replaceChildren(...f.flatMap((r) => {
   const detail = h("tr", { style: "display:none" }, h("td", { colspan: 5 }, h("div", { class: "two" }, h("div", null, h("div", { class: "eyebrow muted", text: "Before" }), h("pre", { class: "mono", style: "white-space:pre-wrap;margin:4px 0", text: auditPretty(r.before) })), h("div", null, h("div", { class: "eyebrow muted", text: "After" }), h("pre", { class: "mono", style: "white-space:pre-wrap;margin:4px 0", text: auditPretty(r.after) })))));
   const main = h("tr", { style: "cursor:pointer", onclick: () => { detail.style.display = detail.style.display === "none" ? "" : "none"; } }, h("td", { class: "mono", text: r.at ? r.at.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "–" }), h("td", { text: r.actor || "–" }), h("td", null, h("span", { class: "tag", text: r.action || "" })), h("td", { class: "mono", text: (r.target || "") + (r.id ? "/" + r.id : "") }), h("td", { text: r.summary || "" }));
   return [main, detail];
  }));
  if (!f.length) tb.append(h("tr", null, h("td", { colspan: 5, class: "muted", text: rows.length ? "No entries match." : "No activity recorded yet." })));
  count.textContent = f.length + " of " + rows.length + " entries (latest 500)";
 };
 body.append(h("div", { class: "row", style: "flex-wrap:wrap;margin-bottom:12px" }, count, h("select", { onchange: (e) => { group = e.target.value; draw(); } }, AUDIT_GROUPS.map(([v, t]) => h("option", { value: v }, t))), h("input", { class: "inp", type: "search", placeholder: "Search who, what, store…", oninput: (e) => { q = e.target.value.trim().toLowerCase(); draw(); } }), h("button", { class: "btn sm", onclick: () => { state.auditUntil = 0; state.audit = null; render(); } }, ico("lock"), "Lock now")),
  h("div", { class: "tw" }, h("table", null, h("thead", null, h("tr", null, ["When", "Who", "Action", "Item", "What changed"].map((x) => h("th", { text: x })))), tb)));
 draw();
}
