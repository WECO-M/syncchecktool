"use strict";
/* IORA Group · SyncCheck — page shell and views */
const TABS = [["overview", "Overview", "home"], ["list", "Issue list", "list"], ["stores", "Stores", "store"], ["ecm", "ECM", "globe"], ["guide", "How it works", "book"]];
const rateClass = (x) => (x >= 99 ? "g" : x >= 97 ? "w" : "b");
const scopeText = (n) => { const d = periodDays(n || state.period); return fday(d[0]) + " – " + fday(d[d.length - 1]); };
function vendorOf(k) { return VENDOR[(STATUS[k] || {}).who] || ""; }

/* ---------- shell ---------- */
function render() {
 const root = $("root"); hideTip();
 if (!state.user) return;
 if (state.view === "settings") { root.replaceChildren(shell(settingsBody())); return; }
 if (!state.maxD) { root.replaceChildren(shell(h("div", { class: "card" }, h("div", { class: "empty" }, h("div", { html: EMPTY_ART }), h("h3", { text: "No data yet" }), h("p", { text: DB && DB.demo ? "Run feed\\build_synccheck.ps1 to create the local data file." : "The daily job has not published any data yet. Ask the owner to run the SyncCheck feed." }))))); return; }
 const a = aggregate();
 const body = ({ overview: viewOverview, list: viewList, stores: viewStores, ecm: viewECM, guide: viewGuide }[state.view] || viewOverview)(a);
 root.replaceChildren(shell(body, a));
 const tt = $("totop"); if (tt) tt.classList.toggle("on", scrollY > 500);
}
function shell(body, a) {
 const m = a ? metrics(a.by) : null;
 const gd = state.maxD ? gapDays() : [];
 const healthy = m && m.issues === 0;
 const tone = !m ? "good" : healthy || m.rate >= 99 ? "good" : m.rate >= 97 ? "warn" : "bad";
 const headline = state.view === "settings" ? "Settings" : !m ? "SyncCheck" : healthy ? "Everything is in sync" : nf(m.issues) + " EPCs need attention";
 const lead = state.view === "settings" ? "People, roles, stores and the activity log." : !m ? "" : nf(m.sales) + " POS EPC sales between " + scopeText() + ". " + fp(m.rate) + "% were deducted in SWIMS" + (state.exGap && gd.length ? ", leaving out " + gd.length + " possible SWIMS data gap day" + (gd.length > 1 ? "s" : "") : "") + ".";
 const stale = state.maxD && (new Date() - pdate(state.maxD)) / 864e5 > 2.5;
 const me = state.user || {};
 const menu = h("div", { class: "menu" + (state.menu ? " on" : ""), role: "menu" },
  h("div", { class: "who" }, h("b", { text: me.name || me.email }), h("span", { text: roleName(me.role) + (me.email ? " · " + me.email : "") })),
  h("button", { onclick: () => go("settings", "profile") }, ico("user"), "My profile"),
  (perm("manageUsers") || perm("manageStores") || isAdminUser()) ? h("button", { onclick: () => go("settings", perm("manageUsers") ? "users" : "stores") }, ico("sliders"), "Settings") : null,
  h("button", { onclick: () => { state.menu = false; toggleTheme(); } }, ico(document.documentElement.dataset.theme === "dark" ? "sun" : "moon"), document.documentElement.dataset.theme === "dark" ? "Light mode" : "Dark mode"),
  FIREBASE_CONFIG ? h("button", { onclick: () => auth.signOut() }, ico("logout"), "Sign out") : null);
 const hero = h("div", { class: "hero" + (state.view === "settings" ? " compact" : "") }, h("div", { class: "wrap" },
  h("div", { class: "util" },
   h("a", { class: "logo", href: "#", onclick: (e) => { e.preventDefault(); go("overview"); } }, h("div", { html: LOGO_SVG, style: "width:42px;height:42px" }), h("div", null, h("b", { text: "SyncCheck" }), h("span", { text: "IORA Group · POS vs SWIMS" }))),
   state.maxD ? h("div", { class: "chips" }, h("span", { class: "chip" + (stale ? " stale" : "") }, h("i"), "POS data to ", h("b", { text: fday(state.maxD) })), h("span", { class: "chip" }, "SWIMS to ", h("b", { text: String((state.meta && state.meta.swimsMaxOn) || "").slice(0, 16) })), h("span", { class: "chip" }, "Refreshed ", h("b", { text: (state.meta && state.meta.generated) || "" }))) : null,
   h("div", { class: "me" }, h("button", { class: "avbtn", "aria-haspopup": "menu", "aria-expanded": state.menu ? "true" : "false", onclick: (e) => { e.stopPropagation(); state.menu = !state.menu; render(); } }, avatarEl(me, "sm"), h("span", { text: me.name || me.email || "" })), menu)),
  h("div", { class: "herogrid" },
   h("div", null, h("h1", { text: headline }), h("p", { class: "lead", text: lead }),
    m ? h("span", { class: "pillstat " + tone }, ico(tone === "good" ? "check" : "alert"), tone === "good" ? "In good shape" : tone === "warn" ? "A few things to chase" : "Needs a closer look") : null))));
 const nav = h("div", { class: "wrap floater" }, h("div", { class: "navcard" },
  state.view === "settings" ? h("div", { class: "tabs" }, h("button", { class: "tab", style: "background:var(--card2)", onclick: () => go("overview") }, ico("chev", "flip"), "Back"), settingsNav()) :
  h("div", { class: "tabs", role: "tablist" }, TABS.map(([id, label, ic]) => h("button", { class: "tab", role: "tab", "aria-selected": state.view === id ? "true" : "false", onclick: () => go(id) }, ico(ic), label, id === "list" && m && m.issues ? h("span", { class: "badge", text: nf(m.issues) }) : null))),
  state.view !== "settings" && state.maxD ? filterRow() : null));
 const banners = state.view === "settings" || !state.maxD ? null : h("div", { class: "wrap banners" }, bannerEls(gd));
 return h("div", { onclick: () => { if (state.menu) { state.menu = false; render(); } } }, hero, nav, banners, h("main", null, h("div", { class: "wrap" }, body, h("div", { class: "foot" }, "IORA Group · Internal use only · Confidential. Source: BigQuery (POS sales with serial · SWIMS POS sale records). EPCs, transaction numbers, store codes and SKUs only; no customer data."))));
}
function go(view, tab) { state.view = view; state.menu = false; if (tab) state.settingsTab = tab; state.page = 0; if (view === "list") ensureIssues(); closeDrawer(); render(); scrollTo(0, 0); }
function toggleTheme() { const nx = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = nx; safe.set("sc.theme", nx); render(); }
window.addEventListener("scroll", () => { const t = $("totop"); if (t) t.classList.toggle("on", scrollY > 500); }, { passive: true });

function filterRow() {
 const brandsShown = BRANDS.filter((b) => !(state.settings.hiddenBrands || []).includes(b.id) && canSeeBrand(b.id));
 const ba = aggregate({ br: "" }); const per = {}; for (const [code, s] of Object.entries(ba.store)) { const b = storeInfo(code).brand; per[b] = (per[b] || 0) + ISSUES.reduce((t, k) => t + g(s.st, k), 0); }
 const sel = (label, value, opts, on) => h("label", { class: "fl" }, label, h("select", { "aria-label": label, onchange: (e) => on(e.target.value) }, opts.map((o) => h("option", { value: o[0], selected: o[0] === value }, o[1]))));
 const stores = Object.values(state.stores).filter((s) => s.active !== false && !(state.settings.hiddenBrands || []).includes(s.brand) && (!state.cc || s.country === state.cc) && (!state.br || s.brand === state.br)).sort((x, y) => x.code.localeCompare(y.code));
 return h("div", { class: "filterrow" },
  h("div", { class: "seg", role: "group", "aria-label": "Period" }, [7, 14, 30].map((n) => h("button", { "aria-pressed": state.period === n ? "true" : "false", text: n + " days", onclick: () => { state.period = n; safe.set("sc.period", n); state.page = 0; if (state.view === "list") ensureIssues(); render(); } }))),
  visibleCountries().length > 1 ? sel("Country", state.cc, [["", "SG + MY"]].concat(visibleCountries().map((c) => [c.id, c.name])), (v) => { state.cc = v; state.store = ""; state.page = 0; render(); }) : null,
  sel("Channel", state.ch, [["", "Stores + ECM"], ["Store", "Stores only"], ["ECM", "ECM only"]], (v) => { state.ch = v; state.page = 0; render(); }),
  sel("Store", state.store, [["", "All stores"]].concat(stores.map((s) => [s.code, s.code + (s.name !== s.code ? " · " + s.name : "")])), (v) => { state.store = v; state.page = 0; render(); }),
  h("button", { class: "btn sm sp", onclick: () => { Object.assign(state, { cc: "", br: "", ch: "", store: "", cat: "", vendor: "", q: "", page: 0 }); render(); } }, "Reset"),
  h("div", { class: "brandrow", style: "flex-basis:100%", role: "group", "aria-label": "Brand" },
   h("button", { class: "bchip", "aria-pressed": state.br === "" ? "true" : "false", onclick: () => { state.br = ""; state.page = 0; render(); } }, "All brands", h("em", { text: nf(Object.values(per).reduce((a, b) => a + b, 0)) })),
   brandsShown.map((b) => h("button", { class: "bchip", "aria-pressed": state.br === b.id ? "true" : "false", onclick: () => { state.br = b.id; state.page = 0; render(); } }, b.label, h("em", { text: nf(per[b.id] || 0) })))));
}
function bannerEls(gd) {
 const out = [];
 const mp = missingPosStores();
 if (mp.length) out.push(h("div", { class: "banner bad", role: "alert" }, h("div", { class: "ic" }, ico("db")), h("div", { style: "flex:1" }, h("b", { text: "No POS data for " + mp.length + " store" + (mp.length > 1 ? "s" : "") + ": " }), mp.map((x) => x.store + " (" + x.cc + ", " + nf(x.sw) + " EPCs in SWIMS)").join(", ") + ". SWIMS records sales for these stores but the POS data has none, so the POS feed may be missing. Ask the POS vendor first.")));
 if (gd.length) out.push(h("div", { class: "banner warn", role: "alert" }, h("div", { class: "ic" }, ico("gap")),
  h("div", { style: "flex:1" }, h("b", { text: "Possible SWIMS data gap: " }), gd.map((x) => fday(x.d) + " (" + Math.round(x.share * 100) + "% missing)").join(", ") + ". Across all stores, a large share of POS sales on these days has no SWIMS record at all. That looks like missing SWIMS data, not store errors, so ask the SWIMS vendor to check these days first. " + (state.exGap ? "These days are left out of the numbers so they do not hide the real issues." : "These days are included in the numbers.")),
  h("button", { class: "btn sm", onclick: () => { state.exGap = !state.exGap; safe.set("sc.exgap", state.exGap ? "1" : "0"); state.page = 0; render(); } }, state.exGap ? "Include these days" : "Leave these days out")));
 if (state.error) out.push(h("div", { class: "banner bad", role: "alert" }, h("div", { class: "ic" }, ico("alert")), h("div", null, h("b", { text: "Could not load some data: " }), state.error)));
 return out;
}

/* ---------- charts ---------- */
function donut(by) {
 const parts = [["OK", "Deducted correctly", "var(--good)"], ["NOT_DEDUCTED", STATUS.NOT_DEDUCTED.short, "var(--s1)"], ["TXN_MISMATCH", STATUS.TXN_MISMATCH.short, "var(--s2)"], ["DUPLICATE", STATUS.DUPLICATE.short, "var(--s3)"], ["PENDING", "Pending", "var(--pend)"]];
 const tot = parts.reduce((s, p) => s + g(by, p[0]), 0) || 1; const R = 82, C = 2 * Math.PI * R; let off = 0;
 const svg = svgEl("svg", { viewBox: "0 0 210 210", role: "img", "aria-label": "POS EPC sales by SWIMS result" }, svgEl("circle", { cx: 105, cy: 105, r: R, fill: "none", stroke: "var(--card2)", "stroke-width": 26 }));
 for (const p of parts) {
  const v = g(by, p[0]); if (!v) continue; const len = Math.max(0, (v / tot) * C - 2.5);
  const c = svgEl("circle", { cx: 105, cy: 105, r: R, fill: "none", "stroke-width": 26, "stroke-dasharray": len + " " + (C - len), "stroke-dashoffset": -off, transform: "rotate(-90 105 105)", style: "stroke:" + p[2], tabindex: 0, "aria-label": p[1] + " " + v });
  hover(c, (e) => showTip(e, p[1], [{ color: p[2], label: "EPC sales", value: nf(v) }, { label: "Share", value: ((v / tot) * 100).toFixed(2) + "%" }])); svg.append(c); off += (v / tot) * C;
 }
 return svg;
}
function niceStep(x) { const e = Math.pow(10, Math.floor(Math.log10(x || 1))); const f = x / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e; }
function xLabels(svg, days, L, band, H) { days.forEach((d, i) => { if (days.length <= 16 || i % Math.ceil(days.length / 10) === 0 || i === days.length - 1) svg.append(svgEl("text", { x: L + band * i + band / 2, y: H - 8, "text-anchor": "middle" }, fday(d))); }); }
function rateChart(a, days, gset) {
 const W = 760, H = 270, L = 46, R = 14, T = 26, B = 30, iw = W - L - R, ih = H - T - B; const band = iw / days.length;
 const rates = days.map((d) => { const x = a.day[d] || {}; const res = g(x, "OK") + g(x, "DUPLICATE") + g(x, "NOT_DEDUCTED") + g(x, "TXN_MISMATCH"); return res ? pct(g(x, "OK") + g(x, "DUPLICATE"), res) : null; });
 const valid = rates.filter((r) => r !== null); const span = valid.length ? 100 - Math.min(...valid) : 5; const step = span <= 8 ? 2 : span <= 20 ? 5 : 10;
 const lo = valid.length ? Math.max(0, 100 - Math.ceil((span + 1) / step) * step) : 90; const top = 100;
 const y = (v) => T + ih - ((v - lo) / (top - lo)) * ih;
 const svg = svgEl("svg", { class: "chart", viewBox: "0 0 " + W + " " + H, width: "100%", role: "img", "aria-label": "Share of POS EPC sales deducted in SWIMS, by day" });
 for (let v = lo; v <= top + 1e-6; v += step) svg.append(svgEl("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), class: v === lo ? "axis" : "gl" }), svgEl("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end" }, v + "%"));
 days.forEach((d, i) => { if (gset.has(d)) svg.append(svgEl("rect", { x: L + band * i, y: T, width: band, height: ih, style: "fill:var(--wash)" })); });
 let path = "", area = "", first = null, last = null;
 rates.forEach((r, i) => { if (r === null) return; const x = L + band * i + band / 2; path += (path ? "L" : "M") + x + "," + y(r); if (first === null) first = x; last = x; });
 if (path) { svg.append(svgEl("path", { d: path + "L" + last + "," + y(lo) + "L" + first + "," + y(lo) + "Z", style: "fill:var(--s1);fill-opacity:.1" }), svgEl("path", { d: path, fill: "none", "stroke-width": 2.5, "stroke-linecap": "round", "stroke-linejoin": "round", style: "stroke:var(--s1)" })); }
 xLabels(svg, days, L, band, H);
 days.forEach((d, i) => {
  const x = L + band * i + band / 2; const r = rates[i]; const hit = svgEl("rect", { x: L + band * i, y: T, width: band, height: ih, fill: "transparent", tabindex: 0, "aria-label": fday(d) + ": " + (r === null ? "no data" : r.toFixed(1) + "%") });
  if (r !== null) svg.append(svgEl("circle", { cx: x, cy: y(r), r: 4.5, style: "fill:var(--s1);stroke:var(--card)", "stroke-width": 2 }));
  if (r !== null && i === days.length - 1) svg.append(svgEl("text", { x: x - 4, y: y(r) - 11, "text-anchor": "end", style: "fill:var(--ink);font-weight:700;font-size:13px" }, r.toFixed(1) + "%"));
  const x2 = a.day[d] || {}; hover(hit, (e) => showTip(e, fday(d), [{ color: "var(--s1)", label: "Deducted in SWIMS", value: r === null ? "–" : r.toFixed(1) + "%" }, { label: "POS EPC sales", value: nf(g(x2, "OK") + g(x2, "DUPLICATE") + g(x2, "NOT_DEDUCTED") + g(x2, "TXN_MISMATCH")) }, { label: "Issues", value: nf(ISSUES.reduce((s, k) => s + g(x2, k), 0)) }], gset.has(d) ? "Possible SWIMS data gap on this day" : ""));
  svg.append(hit);
 });
 return svg;
}
function stackChart(a, days, gset) {
 const W = 760, H = 270, L = 50, R = 8, T = 12, B = 30, iw = W - L - R, ih = H - T - B;
 const tot = days.map((d) => ISSUES.reduce((s, k) => s + g(a.day[d], k), 0)); const mx = Math.max(4, ...tot); const step = niceStep(mx / 4); const top = step * Math.ceil(mx / step);
 const y = (v) => T + ih - (v / top) * ih; const band = iw / days.length; const bw = Math.min(26, band * 0.7);
 const svg = svgEl("svg", { class: "chart", viewBox: "0 0 " + W + " " + H, width: "100%", role: "img", "aria-label": "Issues per day, stacked by type" });
 for (let v = 0; v <= top + 1e-6; v += step) svg.append(svgEl("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), class: v === 0 ? "axis" : "gl" }), svgEl("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end" }, nf(v)));
 days.forEach((d, i) => {
  const cx = L + band * i + band / 2; if (gset.has(d)) svg.append(svgEl("rect", { x: L + band * i, y: T, width: band, height: ih, style: "fill:var(--wash)" }));
  let acc = 0; const segs = ISSUES.filter((k) => g(a.day[d], k) > 0); const x0 = cx - bw / 2;
  segs.forEach((k, j) => {
   const v = g(a.day[d], k); const y1 = y(acc + v), y0 = y(acc); const hgt = Math.max(1, y0 - y1 - (j < segs.length - 1 ? 2 : 0)); acc += v;
   const topSeg = j === segs.length - 1 && hgt > 6;
   const dPath = topSeg ? "M" + x0 + "," + (y1 + hgt) + "V" + (y1 + 4) + "Q" + x0 + "," + y1 + " " + (x0 + 4) + "," + y1 + "H" + (x0 + bw - 4) + "Q" + (x0 + bw) + "," + y1 + " " + (x0 + bw) + "," + (y1 + 4) + "V" + (y1 + hgt) + "Z" : "M" + x0 + "," + y1 + "h" + bw + "v" + hgt + "h" + (-bw) + "Z";
   svg.append(svgEl("path", { d: dPath, style: "fill:var(" + STATUS[k].v + ")" }));
  });
  const hit = svgEl("rect", { x: L + band * i, y: T, width: band, height: ih, fill: "transparent", tabindex: 0, "aria-label": fday(d) + ": " + tot[i] + " issues" });
  hover(hit, (e) => showTip(e, fday(d), ISSUES.map((k) => ({ color: "var(" + STATUS[k].v + ")", label: STATUS[k].short, value: nf(g(a.day[d], k)) })).concat([{ label: "Total", value: nf(tot[i]) }]), gset.has(d) ? "Possible SWIMS data gap on this day" : "")); svg.append(hit);
 });
 xLabels(svg, days, L, band, H);
 return svg;
}
const legendOf = (keys) => h("div", { class: "legend" }, keys.map((k) => h("span", null, h("i", { style: "background:var(" + STATUS[k].v + ")" }), STATUS[k].short)));
function tableView(head, rows) {
 return h("div", { class: "tw" }, h("table", null,
  h("thead", null, h("tr", null, head.map((x, i) => h("th", { class: i ? "n" : "", text: x })))),
  h("tbody", null, rows.map((r) => h("tr", null, r.map((c, i) => h("td", { class: i ? "n" : "", text: c })))))));
}
/* per-box filters: each box on the Overview can narrow itself by country, channel, brand and period */
const CF = {};
function cf(key) { return CF[key] || (CF[key] = { cc: "", ch: "", br: "", days: 0 }); }
function cfForce(key, opts) { const f = cf(key); const o = {}; if (f.cc) o.cc = f.cc; if (f.ch) o.ch = f.ch; if (f.br && !(opts && opts.noBrand)) o.br = f.br; if (f.days) o.days = f.days; return o; }
const cfDays = (key) => cf(key).days || state.period;
function cardFilter(key, opts) {
 const f = cf(key); const any = f.cc || f.ch || f.br || f.days;
 const sel = (label, val, options, on) => h("select", { "aria-label": label, onchange: (e) => { on(e.target.value); render(); } }, options.map((o) => h("option", { value: o[0], selected: String(o[0]) === String(val) }, o[1])));
 const brandsShown = BRANDS.filter((b) => !(state.settings.hiddenBrands || []).includes(b.id) && canSeeBrand(b.id));
 return h("div", { class: "cardfilter" },
  visibleCountries().length > 1 ? sel("Country", f.cc, [["", "All countries"]].concat(visibleCountries().map((c) => [c.id, c.name])), (v) => { f.cc = v; }) : null,
  sel("Channel", f.ch, [["", "All channels"], ["Store", "Stores"], ["ECM", "ECM"]], (v) => { f.ch = v; }),
  opts && opts.noBrand ? null : sel("Brand", f.br, [["", "All brands"]].concat(brandsShown.map((b) => [b.id, b.label])), (v) => { f.br = v; }),
  sel("Period", f.days, [[0, "Same period as above"], [7, "7 days"], [14, "14 days"], [30, "30 days"]], (v) => { f.days = +v; }),
  any ? h("button", { class: "linkbtn", onclick: () => { CF[key] = { cc: "", ch: "", br: "", days: 0 }; render(); } }, "Reset this box") : null);
}
function chartCard(title, sub, makeChart, tableHead, tableRows, key, filter) {
 const showTable = state.chartTable;
 return h("div", { class: "card" }, h("div", { class: "chead" }, h("div", null, h("h2", { text: title }), h("div", { class: "sub", text: sub })), h("button", { class: "btn sm sp", onclick: () => { state.chartTable = !state.chartTable; render(); } }, showTable ? "Show chart" : "Show table")), filter || null, showTable ? tableView(tableHead, tableRows) : makeChart());
}
function storeBarsCard(a, n, filterKey) {
 const rows = Object.keys(a.store).map((k) => ({ k, t: ISSUES.reduce((s, i) => s + g(a.store[k].st, i), 0), st: a.store[k].st })).filter((r) => r.t > 0).sort((p, q) => q.t - p.t).slice(0, n);
 const mx = Math.max(1, ...rows.map((r) => r.t));
 const card = h("div", { class: "card" }, h("div", { class: "chead" }, h("div", null, h("h2", { text: "Stores with the most issues" }), h("div", { class: "sub", text: "Top " + rows.length + " in this view" })), h("button", { class: "btn sm sp", onclick: () => go("stores") }, "All stores")), filterKey ? cardFilter(filterKey) : null);
 if (!rows.length) { card.append(h("div", { class: "empty" }, h("div", { html: EMPTY_ART }), h("div", { text: "No issues in this view." }))); return card; }
 const box = h("div", { class: "sbars" });
 for (const r of rows) {
  const trk = h("div", { class: "trk", style: "width:" + Math.max(4, (r.t / mx) * 100) + "%" });
  for (const k of ISSUES) { const v = g(r.st, k); if (!v) continue; const sp = h("span", { style: "flex:" + v + " 1 0;background:var(" + STATUS[k].v + ")", tabindex: 0, "aria-label": r.k + " " + STATUS[k].short + " " + v }); hover(sp, (e) => showTip(e, r.k + " · " + brandInfo(storeInfo(r.k).brand).label, [{ color: "var(" + STATUS[k].v + ")", label: STATUS[k].label, value: nf(v) }, { label: "All issues", value: nf(r.t) }])); trk.append(sp); }
  box.append(h("div", { class: "sb" }, h("div", { class: "nm", text: r.k }), h("div", null, trk), h("div", { class: "tot", text: nf(r.t) })));
 }
 card.append(box, legendOf(ISSUES)); return card;
}

/* ---------- Overview ---------- */
function healthCards(a, fkey) {
 const ah = fkey ? aggregate(cfForce(fkey)) : a; const hdays = fkey ? cfDays(fkey) : state.period;
 const m = metrics(ah.by); const gd = gapDays(); const mp = missingPosStores();
 const sw = g(a.by, "NOT_DEDUCTED") + g(a.by, "TXN_MISMATCH") + g(a.by, "DUPLICATE") + g(a.by, "RETURN_MISSING"), po = g(a.by, "SWIMS_ONLY");
 const parts = [["OK", "Deducted correctly", "var(--good)"], ["NOT_DEDUCTED", "Not deducted", "var(--s1)"], ["TXN_MISMATCH", "Other transaction", "var(--s2)"], ["DUPLICATE", "Duplicate", "var(--s3)"], ["PENDING", "Pending", "var(--pend)"]];
 const tot = parts.reduce((s, p) => s + g(ah.by, p[0]), 0) || 1;
 const health = h("div", { class: "card" }, h("div", { class: "chead" }, h("div", null, h("h2", { text: "How POS sales ended up in SWIMS" }), h("div", { class: "sub", text: nf(m.sales) + " POS EPC sales · " + scopeText(hdays) }))), fkey ? cardFilter(fkey) : null,
  h("div", { class: "health" }, h("div", { class: "donut" }, donut(ah.by), h("div", { class: "mid" }, h("b", { text: fp(m.rate) + "%" }), h("span", { text: "deducted" }))),
   h("div", { class: "lg" }, parts.filter((p) => g(ah.by, p[0])).map((p) => h("div", { class: "row" }, h("i", { style: "background:" + p[2] }), p[1], h("b", { text: nf(g(ah.by, p[0])) }), h("small", { text: ((g(ah.by, p[0]) / tot) * 100).toFixed(1) + "%" }))))));
 const ask = (icon, color, n, label, sub, click) => h("button", { class: "ask" + (n ? "" : " zero"), style: "text-align:left", onclick: click }, h("div", { class: "ib", style: "background:" + color }, ico(icon)), h("div", null, h("b", { text: nf(n) }), h("span", { text: label })), ico("chev"));
 const asks = h("div", { class: "card" }, h("div", { class: "chead" }, h("div", null, h("h2", { text: "Who to ask" }), h("div", { class: "sub", text: "Open the list for each vendor, export it and send the note" }))),
  h("div", { class: "asks" },
   ask("box", "var(--s1)", sw, "EPCs to ask the SWIMS vendor about", "", () => { state.vendor = "swims"; state.cat = ""; go("list"); }),
   ask("db", "var(--s5)", po, "EPCs to ask the POS vendor about", "", () => { state.vendor = "pos"; state.cat = ""; go("list"); }),
   ask("gap", "#c98500", gd.length + mp.length, gd.length + mp.length === 1 ? "data gap flagged above" : "data gaps flagged above", "", () => scrollTo({ top: 0, behavior: "smooth" }))));
 return h("div", { class: "gridhero" }, health, asks);
}
function kpiRow(a) {
 const m = metrics(a.by);
 return h("div", { class: "kpis" }, ISSUES.map((k) => h("button", { class: "kpi" + (STATUS[k].dark ? " ink4" : ""), style: "--c:var(" + STATUS[k].v + ")", onclick: () => { state.cat = k; state.vendor = ""; go("list"); } },
  h("div", { class: "ib" }, ico(STATUS[k].icon)), h("div", { class: "l", text: STATUS[k].short }), h("div", { class: "v", text: nf(g(a.by, k)) }),
  h("div", { class: "d", text: k === "SWIMS_ONLY" ? "no matching POS record" : k === "RETURN_MISSING" ? "of " + nf(g(a.by, "RETURN_OK") + g(a.by, "RETURN_MISSING")) + " returns" : pct(g(a.by, k), m.resolved).toFixed(2) + "% of POS EPC sales" }))));
}
function brandCards(a) {
 const shown = BRANDS.filter((b) => !(state.settings.hiddenBrands || []).includes(b.id) && canSeeBrand(b.id));
 const per = {}; for (const [code, s] of Object.entries(a.store)) { const b = storeInfo(code).brand; const o = (per[b] = per[b] || { by: {}, stores: {} }); for (const k in s.st) o.by[k] = (o.by[k] || 0) + s.st[k]; o.stores[code] = ISSUES.reduce((t, k) => t + g(s.st, k), 0); }
 const cards = shown.filter((b) => per[b.id]).map((b) => {
  const o = per[b.id]; const m = metrics(o.by); const worst = Object.entries(o.stores).sort((x, y) => y[1] - x[1])[0];
  const tot = (m.sales || 1);
  const meter = h("div", { class: "meter", "aria-hidden": "true" }, h("i", { style: "width:" + pct(g(o.by, "OK") + g(o.by, "DUPLICATE"), tot) + "%;background:var(--good)" }), ISSUES.map((k) => g(o.by, k) ? h("i", { style: "width:" + Math.max(0.6, pct(g(o.by, k), tot)) + "%;background:var(" + STATUS[k].v + ")" }) : null));
  return h("button", { class: "bcard", onclick: () => { state.br = b.id; go("stores"); } },
   h("div", { class: "bhead" }, h("div", { class: "mono-badge", text: b.mono }), h("div", null, h("b", { text: b.label }), h("div", { class: "muted", style: "font-size:13px", text: Object.keys(o.stores).length + (Object.keys(o.stores).length === 1 ? " store" : " stores") }))),
   h("div", { class: "big" }, fp(m.rate), h("small", { text: "% deducted" })), meter,
   h("div", { class: "bstats" }, h("span", null, h("b", { text: nf(m.issues) }), " issues"), h("span", null, h("b", { text: nf(m.sales) }), " POS EPC sales"), worst && worst[1] ? h("span", null, "Most issues: ", h("b", { text: worst[0] })) : null));
 });
 if (!cards.length) return null;
 return h("div", { class: "card" }, h("div", { class: "chead" }, h("div", null, h("h2", { text: "By brand" }), h("div", { class: "sub", text: "Each store counts under its own brand. Click a brand to see its stores." }))), cardFilter("brands", { noBrand: true }), h("div", { style: "display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px" }, cards));
}
function viewOverview(a) {
 const rDays = periodDays(cfDays("rate")), iDays = periodDays(cfDays("issues"));
 const rFull = aggregate(cfForce("rate"), true), iFull = aggregate(cfForce("issues"), true);
 const rGap = new Set(gapDays(cfDays("rate")).map((x) => x.d)), iGap = new Set(gapDays(cfDays("issues")).map((x) => x.d));
 const mrate = (d) => { const x = rFull.day[d] || {}; const r = g(x, "OK") + g(x, "DUPLICATE") + g(x, "NOT_DEDUCTED") + g(x, "TXN_MISMATCH"); return r ? (pct(g(x, "OK") + g(x, "DUPLICATE"), r)).toFixed(1) + "%" : "–"; };
 return [healthCards(a, "health"), kpiRow(a),
  h("div", { class: "grid2" },
   chartCard("Deduction rate by day", "Share of POS EPC sales that SWIMS deducted. Shaded days are possible SWIMS data gaps.", () => h("div", null, rateChart(rFull, rDays, rGap)), ["Day", "Deducted"], rDays.map((d) => [fday(d), mrate(d)]), "rate", cardFilter("rate")),
   chartCard("Issues per day", "Flagged EPCs by the day of the POS sale", () => h("div", null, stackChart(iFull, iDays, iGap), legendOf(ISSUES)), ["Day"].concat(ISSUES.map((k) => STATUS[k].short)), iDays.map((d) => [fday(d)].concat(ISSUES.map((k) => nf(g(iFull.day[d], k))))), "issues", cardFilter("issues"))),
  brandCards(aggregate(cfForce("brands", { noBrand: true }))), storeBarsCard(aggregate(cfForce("stores")), 10, "stores")];
}
function viewECM() {
 const a = aggregate({ ch: "ECM", store: "" }); const full = aggregate({ ch: "ECM", store: "" }, true); const days = periodDays(state.period); const gset = new Set(gapDays().map((x) => x.d));
 const intro = h("div", { class: "card" }, h("div", { class: "row" }, h("div", { class: "ib mono-badge" }, ico("globe")), h("div", null, h("h2", { text: "ECM · e-commerce scanning through POS" }), h("div", { class: "sub", text: "Country and brand filters apply. Channel and store are fixed to ECM here." }))));
 if (!Object.keys(a.by).length) return [intro, h("div", { class: "card" }, h("div", { class: "empty" }, h("div", { html: EMPTY_ART }), h("div", { text: "No ECM sales in this view." })))];
 const m = metrics(a.by);
 return [intro, healthCards(a), kpiRow(a), h("div", { class: "grid2" },
  chartCard("ECM deduction rate by day", "Share of ECM EPC sales deducted in SWIMS", () => h("div", null, rateChart(full, days, gset)), ["Day"], days.map((d) => [fday(d)])),
  chartCard("ECM issues per day", "Flagged ECM EPCs by day", () => h("div", null, stackChart(full, days, gset), legendOf(ISSUES)), ["Day"], days.map((d) => [fday(d)]))),
  h("div", { class: "card" }, h("div", { class: "chead" }, h("div", null, h("h2", { text: "See the ECM EPCs" }), h("div", { class: "sub", text: nf(m.issues) + " flagged in this view" })), h("button", { class: "btn pri sp", onclick: () => { state.ch = "ECM"; state.cat = ""; state.vendor = ""; go("list"); } }, "Open ECM issue list")))];
}

/* ---------- Issue list ---------- */
function vendorNote(rows) {
 const days = periodDays(state.period); const counts = {}; rows.forEach((r) => { counts[r.st] = (counts[r.st] || 0) + 1; }); const byStore = {}; rows.forEach((r) => { byStore[r.store] = (byStore[r.store] || 0) + 1; });
 const top = Object.keys(byStore).sort((p, q) => byStore[q] - byStore[p]).slice(0, 5).map((s) => s + " (" + byStore[s] + ")").join(", ");
 const sample = rows.slice(0, 3).map((r) => "  - " + r.d + " " + r.store + " EPC " + r.epc + " POS txn " + r.txn + (r.swtxn ? " / SWIMS txn " + r.swtxn : "")).join("\n");
 const posSide = rows.length && rows.every((r) => r.st === "SWIMS_ONLY");
 return "Hi team,\n\nIORA Group SyncCheck compared POS sales with SWIMS stock deductions for " + fday(days[0]) + " to " + fday(days[days.length - 1]) + ".\n\n" + (posSide ? "SWIMS has records that the POS data does not show (" + nf(rows.length) + " EPCs):\n" : "These POS sales are not matched correctly in SWIMS (" + nf(rows.length) + " EPCs):\n") + Object.keys(counts).map((k) => "  - " + STATUS[k].label + ": " + nf(counts[k])).join("\n") + "\n\nMost affected stores: " + (top || "n/a") + ".\n\nExamples:\n" + sample + "\n\nThe full list is in the attached CSV. Please check why these were not recorded and let us know the cause and the fix date.\n\nThanks.";
}
function openVendorNote(rows) {
 const t = h("textarea", { class: "inp area", rows: 14 }); t.value = vendorNote(rows);
 const who = rows.length && rows.every((r) => r.st === "SWIMS_ONLY") ? "POS vendor" : "SWIMS vendor";
 openDrawer([h("div", { class: "eyebrow muted", text: "Message draft" }), h("h3", { text: "Note for the " + who }), h("div", { class: "dsub", text: "Edit if you like, copy it, and attach the CSV from Export CSV." }), t,
  h("div", { class: "actions" }, h("button", { class: "btn pri", onclick: () => { t.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (e) { /* ignore */ } if (!ok && navigator.clipboard) navigator.clipboard.writeText(t.value).catch(() => {}); toast("Copied"); } }, "Copy text"), h("button", { class: "btn", onclick: () => download("SyncCheck_" + (state.cat || state.vendor || "all_issues") + "_" + state.maxD + ".csv", csvOf(rows)) }, ico("download"), "Export CSV"))]);
}
function openIssue(r) {
 const s = STATUS[r.st]; const si = storeInfo(r.store);
 const ask = r.st === "SWIMS_ONLY" ? "Why does SWIMS show this EPC under this transaction when the POS data does not?" : r.st === "NOT_DEDUCTED" ? "Why did SWIMS not record a sale for this EPC after the POS sold it?" : r.st === "TXN_MISMATCH" ? "Why was this EPC deducted under a different transaction number?" : r.st === "DUPLICATE" ? "Why does SWIMS have more than one sale record for this EPC and transaction?" : r.st === "RETURN_MISSING" ? "Why is there no return record in SWIMS for this returned or exchanged EPC?" : "";
 const kv = (k, v, mono) => h("div", { class: "row", style: "padding:9px 0;border-bottom:1px solid var(--line)" }, h("span", { class: "muted", style: "width:140px", text: k }), h("span", { class: mono ? "mono" : "", text: v || "–" }));
 openDrawer([h("div", { class: "eyebrow muted", text: "EPC detail" }), h("h3", { text: s.label }), h("div", { class: "dsub", text: s.desc }),
  kv("Date (POS)", fdayL(r.d)), kv("Store", r.store + (si.name !== r.store ? " · " + si.name : "")), kv("Brand", brandInfo(si.brand).label), kv("Channel", r.ch), kv("EPC", r.epc, true), kv("POS transaction", r.txn, true), kv("SKU", r.item, true),
  kv("SWIMS shows", r.st === "NOT_DEDUCTED" ? "Nothing for this EPC" : r.st === "DUPLICATE" ? r.cnt + " sale records" : r.st === "RETURN_MISSING" ? "No return record" : (r.swtxn || "") + (r.swstore ? " · " + r.swstore : ""), true),
  h("div", { class: "banner info", style: "margin-top:18px" }, h("div", { class: "ic" }, ico("msg")), h("div", null, h("b", { text: "Ask the " + VENDOR[s.who] + ": " }), ask))]);
}
function viewList() {
 if (!perm("details")) return [h("div", { class: "card" }, h("div", { class: "empty" }, h("div", { html: EMPTY_ART }), h("h3", { text: "EPC lists are not part of your role" }), h("p", { text: "Ask an Administrator for the “See EPC lists and export” permission." })))];
 if (state.loadingIss && !state.iss.length) return [h("div", { class: "card" }, h("div", { class: "skel", style: "width:40%;margin-bottom:16px" }), [1, 2, 3, 4, 5, 6].map(() => h("div", { class: "skel", style: "margin:14px 0" })))];
 let rows = issueRows(); if (state.vendor) rows = rows.filter((r) => (STATUS[r.st] || {}).who === state.vendor);
 const per = 50, pages = Math.max(1, Math.ceil(rows.length / per)); if (state.page >= pages) state.page = pages - 1; const slice = rows.slice(state.page * per, (state.page + 1) * per);
 const title = state.cat ? STATUS[state.cat].label : state.vendor ? "Ask the " + VENDOR[state.vendor] : "All issues";
 const chips = h("div", { class: "brandrow", style: "margin-bottom:12px" }, h("button", { class: "bchip", "aria-pressed": !state.cat && !state.vendor ? "true" : "false", onclick: () => { state.cat = ""; state.vendor = ""; state.page = 0; render(); } }, "All issues"),
  ISSUES.map((k) => h("button", { class: "bchip", "aria-pressed": state.cat === k ? "true" : "false", onclick: () => { state.cat = state.cat === k ? "" : k; state.vendor = ""; state.page = 0; render(); } }, h("i", { style: "width:10px;height:10px;border-radius:3px;background:var(" + STATUS[k].v + ")" }), STATUS[k].short)));
 const card = h("div", { class: "card" }, h("div", { class: "chead" }, h("div", null, h("h2", { text: title }), h("div", { class: "sub", text: (state.cat ? STATUS[state.cat].desc + " " : "") + nf(rows.length) + " EPCs in this view." })),
  h("button", { class: "btn sp", onclick: () => download("SyncCheck_" + (state.cat || state.vendor || "all_issues") + "_" + state.maxD + ".csv", csvOf(rows)) }, ico("download"), "Export CSV"), h("button", { class: "btn pri", onclick: () => openVendorNote(rows) }, ico("msg"), "Note for vendor")), chips,
  h("div", { style: "margin-bottom:12px" }, h("input", { class: "inp", type: "search", placeholder: "Search EPC, transaction or SKU", value: state.q, style: "width:min(420px,100%)", "aria-label": "Search", oninput: (e) => { state.q = e.target.value; state.page = 0; const p = e.target.selectionStart; render(); const n = document.querySelector('input[type="search"]'); if (n) { n.focus(); n.setSelectionRange(p, p); } } })));
 if (!rows.length) { card.append(h("div", { class: "empty" }, h("div", { html: EMPTY_ART }), h("div", { text: "Nothing to show for these filters." }))); return [card]; }
 const th = ["Issue", "Date", "Store", "Brand", "EPC", "POS txn", "SKU", "SWIMS shows"];
 card.append(h("div", { class: "tw" }, h("table", null, h("thead", null, h("tr", null, th.map((x) => h("th", { text: x })))), h("tbody", null, slice.map((r) => h("tr", { style: "cursor:pointer", onclick: () => openIssue(r) },
  h("td", null, h("span", { class: "tag" }, h("i", { style: "background:var(" + STATUS[r.st].v + ")" }), STATUS[r.st].short)), h("td", { text: fday(r.d) }), h("td", { text: r.store }), h("td", { text: brandInfo(storeInfo(r.store).brand).label }), h("td", { class: "mono", text: r.epc }), h("td", { class: "mono", text: r.txn }), h("td", { class: "mono", text: r.item || "" }),
  h("td", { class: "mono", text: r.st === "SWIMS_ONLY" ? r.swtxn + " · " + r.swstore : r.st === "NOT_DEDUCTED" ? "nothing" : r.st === "TXN_MISMATCH" ? (r.swtxn || "") + " · " + (r.swstore || "") : r.st === "DUPLICATE" ? r.cnt + " sale records" : r.st === "RETURN_MISSING" ? "no return record" : "" })))))),
  h("div", { class: "pager" }, h("span", { text: "Page " + (state.page + 1) + " of " + pages }), h("button", { class: "btn sm", disabled: state.page === 0, onclick: () => { state.page--; render(); } }, "Prev"), h("button", { class: "btn sm", disabled: state.page >= pages - 1, onclick: () => { state.page++; render(); } }, "Next")));
 return [card];
}

/* ---------- Stores, separated by brand ---------- */
function viewStores(a) {
 const days = periodDays(Math.min(state.period, 14)); const ramp = ["var(--h0)", "var(--h1)", "var(--h2)", "var(--h3)", "var(--h4)", "var(--h5)", "var(--h6)"];
 const mxCell = Math.max(1, ...Object.values(a.store).flatMap((s) => Object.values(s.days)));
 const rows = Object.keys(a.store).map((k) => { const s = a.store[k]; const m = metrics(s.st); const si = storeInfo(k); return { k, si, sales: m.sales, rate: m.rate, nd: g(s.st, "NOT_DEDUCTED"), mm: g(s.st, "TXN_MISMATCH"), dup: g(s.st, "DUPLICATE"), rm: g(s.st, "RETURN_MISSING"), so: g(s.st, "SWIMS_ONLY"), issues: m.issues, days: s.days, by: s.st }; });
 const brandsShown = BRANDS.filter((b) => !(state.settings.hiddenBrands || []).includes(b.id) && canSeeBrand(b.id) && (!state.br || state.br === b.id));
 const canEdit = perm("manageStores");
 const sortFn = (p, q) => { if (state.sort === "issues" && state.dir === -1 && !state.sortTouched) return (p.si.country === q.si.country ? 0 : p.si.country === "SG" ? -1 : 1) || (q.issues - p.issues); const v = state.sort === "k" ? (p.k < q.k ? -1 : 1) : state.sort === "cc" ? String(p.si.country).localeCompare(q.si.country) : state.sort === "name" ? String(p.si.name).localeCompare(q.si.name) : (p[state.sort] - q[state.sort]); return v * state.dir; };
 const cols = [["k", "Store", ""], ["name", "Name", ""], ["cc", "Country", ""], ["sales", "POS EPC sales", "n"], ["rate", "Deducted", "n"], ["nd", "Not deducted", "n"], ["mm", "Other txn", "n"], ["dup", "Duplicate", "n"], ["rm", "Return missing", "n"], ["so", "SWIMS only", "n"], ["issues", "All issues", "n"]];
 const out = [h("div", { class: "card" }, h("div", { class: "chead" }, h("div", null, h("h2", { text: "Stores by brand" }), h("div", { class: "sub", text: "Each brand has its own table. Click a column to sort, click a store to see its EPCs." + (canEdit ? " Use the pencil to edit a store." : "") })),
  canEdit ? h("button", { class: "btn pri sp", onclick: () => openStoreEditor(null) }, ico("plus"), "Add store") : null))];
 for (const b of brandsShown) {
  const list = rows.filter((r) => r.si.brand === b.id).sort(sortFn); if (!list.length) continue;
  const bm = metrics(list.reduce((o, r) => { for (const k in r.by) o[k] = (o[k] || 0) + r.by[k]; return o; }, {}));
  const head = h("tr", null, cols.map((c) => h("th", { class: "sortable " + c[2], text: c[1] + (state.sort === c[0] ? (state.dir < 0 ? " ▾" : " ▴") : ""), tabindex: 0, onclick: () => { state.sortTouched = true; if (state.sort === c[0]) state.dir = -state.dir; else { state.sort = c[0]; state.dir = c[0] === "k" || c[0] === "name" || c[0] === "cc" ? 1 : -1; } render(); }, onkeydown: (e) => { if (e.key === "Enter") e.target.click(); } })), h("th", { text: "Issues, last " + days.length + " days" }), canEdit ? h("th") : null);
  const tbody = list.map((r) => { const heat = h("span", { class: "heat" }); days.forEach((d) => { const v = r.days[d] || 0; const idx = v ? Math.min(6, 1 + Math.floor(Math.sqrt(v / mxCell) * 6)) : 0; const c = h("i", { style: "background:" + ramp[idx], tabindex: 0, "aria-label": r.k + " " + fday(d) + " " + v }); hover(c, (e) => showTip(e, r.k + " · " + fday(d), [{ label: "Issues", value: nf(v) }])); heat.append(c); });
   return h("tr", { style: "cursor:pointer", onclick: () => { state.store = r.k; state.cat = ""; state.vendor = ""; go("list"); } }, h("td", null, h("b", { text: r.k })), h("td", { text: r.si.name !== r.k ? r.si.name : "" }), h("td", { text: r.si.country }), h("td", { class: "n", text: nf(r.sales) }),
    h("td", { class: "n" }, r.sales ? h("span", { class: "rate " + rateClass(r.rate), text: fp(r.rate) + "%" }) : h("span", { class: "muted", text: "no POS data" })), h("td", { class: "n", text: nf(r.nd) }), h("td", { class: "n", text: nf(r.mm) }), h("td", { class: "n", text: nf(r.dup) }), h("td", { class: "n", text: nf(r.rm) }), h("td", { class: "n", text: nf(r.so) }), h("td", { class: "n" }, h("b", { text: nf(r.issues) })), h("td", null, heat),
    canEdit ? h("td", null, h("button", { class: "btn sm", "aria-label": "Edit " + r.k, onclick: (e) => { e.stopPropagation(); openStoreEditor(r.si); } }, ico("edit"))) : null); });
  out.push(h("div", { class: "card bsec" }, h("div", { class: "bh" }, h("div", { class: "mono-badge", text: b.mono }), h("div", null, h("h2", { text: b.label }), h("div", { class: "sub", text: list.length + " stores" })),
   h("div", { class: "stats" }, h("div", null, h("b", { text: nf(bm.sales) }), "POS EPC sales"), h("div", null, h("b", { class: "rate " + rateClass(bm.rate), text: fp(bm.rate) + "%" }), "deducted"), h("div", null, h("b", { text: nf(bm.issues) }), "issues"))),
   h("div", { class: "tw" }, h("table", null, h("thead", null, head), h("tbody", null, tbody)))));
 }
 if (out.length === 1) out.push(h("div", { class: "card" }, h("div", { class: "empty" }, h("div", { html: EMPTY_ART }), h("div", { text: "No stores in this view." }))));
 const off = Object.values(state.stores).filter((s) => s.active === false || (state.settings.hiddenBrands || []).includes(s.brand)).sort((x, y) => x.code.localeCompare(y.code));
 if (canEdit && off.length) out.push(h("div", { class: "card" }, h("div", { class: "chead" }, h("div", null, h("h3", { text: "Closed or hidden stores" }), h("div", { class: "sub", text: "These are left out of every number. Edit one to bring it back." }))),
  h("div", { class: "brandrow" }, off.map((s) => h("button", { class: "bchip", onclick: () => openStoreEditor(s) }, s.code, h("em", { text: s.active === false ? "closed" : brandInfo(s.brand).label }))))));
 return out;
}

/* ---------- Guide ---------- */
function viewGuide() {
 const step = (n, t, p) => h("div", { class: "step" }, h("div", { class: "n", text: n }), h("h3", { text: t }), h("p", { class: "muted", text: p }));
 return [h("div", { class: "card how" }, h("div", { class: "chead" }, h("div", null, h("h2", { text: "How SyncCheck works" }), h("div", { class: "sub", text: "In plain words, so anyone can read the page." }))),
  h("div", { class: "steps" }, step("1", "POS sells an EPC", "Each tagged item sold at a store or through ECM is recorded by POS with its EPC and a transaction number."), step("2", "SWIMS should deduct it", "SWIMS should record a matching sale for the same EPC and transaction, and take it out of stock."), step("3", "SyncCheck compares", "Every day the two lists are matched. Anything missing, doubled or filed under another transaction is flagged.")),
  h("h3", { style: "margin:24px 0 10px", text: "What each flag means" }), h("div", { class: "grid2" }, ISSUES.concat(["PENDING"]).map((k) => h("div", { class: "step" }, h("span", { class: "tag" }, h("i", { style: "background:var(" + STATUS[k].v + ")" }), STATUS[k].label), h("p", { class: "muted", style: "margin:10px 0 0", text: STATUS[k].desc + (STATUS[k].who ? " Ask the " + VENDOR[STATUS[k].who] + "." : "") })))),
  h("h3", { style: "margin:24px 0 8px", text: "Good to know" }),
  h("p", null, "BigQuery loads once a day, so the latest POS day shows as pending, not as an issue. Returns and exchanges are matched to the SWIMS return record (transaction number with -REF). Voided POS lines are ignored."),
  h("p", null, "A banner appears when a large share of a day's sales is missing from SWIMS across all stores, because that usually points to a data gap and not to one store. Brand follows the store: each store is listed under its own brand, which an editor can change under Stores."),
  h("p", { class: "muted", text: "Scanned this run: about " + ((state.meta && state.meta.scannedMB) || "?") + " MB of BigQuery. POS table loaded " + String((state.meta && state.meta.posLoaded) || "").slice(0, 16) + " UTC, SWIMS table loaded " + String((state.meta && state.meta.swimsLoaded) || "").slice(0, 16) + " UTC." }))];
}
