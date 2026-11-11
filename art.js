"use strict";
/* Static illustrations and icons (constants only, never built from data). */
const LOGO_SVG = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="5" width="19" height="19" rx="6" fill="#ffffff" fill-opacity=".95"/><rect x="11" y="9" width="19" height="19" rx="6" fill="#ff5a36"/><path d="M16 18.5l3.2 3.2 6-6.4" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* POS terminal -> SWIMS stock: the story of the page in one picture */
const HERO_ART = '<svg viewBox="0 0 520 320" role="img" aria-label="A POS terminal sends each sold item to the SWIMS stock system, and SyncCheck confirms it arrived">'
 + '<defs><linearGradient id="gA" x1="0" x2="1"><stop offset="0" stop-color="#ff8a6b"/><stop offset="1" stop-color="#ff5a36"/></linearGradient></defs>'
 + '<circle cx="262" cy="160" r="150" fill="#fff" fill-opacity=".05"/><circle cx="262" cy="160" r="104" fill="#fff" fill-opacity=".05"/>'
 /* POS terminal */
 + '<g transform="translate(18 70)"><rect x="0" y="0" width="150" height="112" rx="14" fill="#fff"/><rect x="12" y="12" width="126" height="64" rx="8" fill="#1f2540"/>'
 + '<rect x="22" y="24" width="60" height="7" rx="3.5" fill="#8fa0ff"/><rect x="22" y="38" width="94" height="7" rx="3.5" fill="#fff" fill-opacity=".55"/><rect x="22" y="52" width="78" height="7" rx="3.5" fill="#fff" fill-opacity=".35"/>'
 + '<rect x="100" y="48" width="30" height="20" rx="5" fill="url(#gA)"/><text x="115" y="62" text-anchor="middle" font-family="Segoe UI,Arial" font-weight="700" font-size="11" fill="#fff">PAY</text>'
 + '<rect x="30" y="112" width="90" height="12" rx="4" fill="#cfd4e2"/><rect x="14" y="124" width="122" height="10" rx="5" fill="#aeb6cc"/>'
 + '<rect x="30" y="86" width="12" height="9" rx="2" fill="#cfd4e2"/><rect x="48" y="86" width="12" height="9" rx="2" fill="#cfd4e2"/><rect x="66" y="86" width="12" height="9" rx="2" fill="#cfd4e2"/><rect x="84" y="86" width="12" height="9" rx="2" fill="#cfd4e2"/></g>'
 + '<g transform="translate(40 18)"><rect x="0" y="0" width="64" height="60" rx="6" fill="#fff"/><rect x="9" y="11" width="46" height="5" rx="2.5" fill="#cfd4e2"/><rect x="9" y="22" width="34" height="5" rx="2.5" fill="#cfd4e2"/><rect x="9" y="33" width="40" height="5" rx="2.5" fill="#cfd4e2"/><rect x="9" y="44" width="24" height="5" rx="2.5" fill="#ff8a6b"/></g>'
 /* flow */
 + '<path class="dash" d="M176 126 C 214 96, 252 96, 292 126" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="3" stroke-linecap="round"/>'
 + '<path class="dash" d="M176 158 C 214 188, 252 188, 292 158" fill="none" stroke="#ffb199" stroke-width="3" stroke-linecap="round"/>'
 + '<g class="pulse"><circle cx="234" cy="142" r="30" fill="#fff"/><circle cx="234" cy="142" r="30" fill="none" stroke="#4ade80" stroke-width="4"/><path d="M220 143l9 9 17-18" fill="none" stroke="#0b7a3b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>'
 /* SWIMS stock */
 + '<g transform="translate(300 52)"><rect x="0" y="0" width="190" height="166" rx="14" fill="#fff" fill-opacity=".96"/>'
 + '<rect x="14" y="14" width="162" height="6" rx="3" fill="#cfd4e2"/><rect x="14" y="82" width="162" height="6" rx="3" fill="#cfd4e2"/><rect x="14" y="148" width="162" height="6" rx="3" fill="#cfd4e2"/>'
 + '<rect x="22" y="40" width="40" height="42" rx="5" fill="#f2b58a"/><rect x="22" y="40" width="40" height="10" rx="3" fill="#e39a69"/><rect x="68" y="30" width="46" height="52" rx="5" fill="#8fb4f2"/><rect x="68" y="30" width="46" height="10" rx="3" fill="#6f98e6"/><rect x="120" y="48" width="42" height="34" rx="5" fill="#f4d27a"/><rect x="120" y="48" width="42" height="9" rx="3" fill="#e8bd51"/>'
 + '<rect x="28" y="104" width="52" height="44" rx="5" fill="#b9d9c4"/><rect x="28" y="104" width="52" height="10" rx="3" fill="#8fc3a1"/><rect x="88" y="116" width="40" height="32" rx="5" fill="#f2b58a"/><rect x="136" y="100" width="34" height="48" rx="5" fill="#c9b8f0"/>'
 + '<text x="95" y="-8" text-anchor="middle" font-family="Segoe UI,Arial" font-weight="700" font-size="14" fill="#fff" fill-opacity=".9">SWIMS</text></g>'
 + '<g transform="translate(402 206)"><rect x="0" y="22" width="26" height="62" rx="9" fill="#1f2540"/><rect x="-4" y="0" width="34" height="34" rx="9" fill="url(#gA)"/><path d="M8 16h14M8 22h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>'
 + '<path d="M388 222c-10 6-10 20 0 26M376 214c-17 10-17 38 0 48" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>'
 + '<g transform="translate(132 240)"><rect width="196" height="58" rx="14" fill="#fff"/><circle cx="29" cy="29" r="16" fill="#fde8e6"/><path d="M29 21v10M29 36.5v.5" stroke="#b42318" stroke-width="3.4" stroke-linecap="round"/><text x="54" y="25" font-family="Segoe UI,Arial" font-weight="700" font-size="14" fill="#0f172a">Not deducted?</text><text x="54" y="43" font-family="Segoe UI,Arial" font-size="12" fill="#64748b">We flag it for the vendor</text></g>'
 + '</svg>';

/* Sign-in picture: the same illustration without the "Not deducted?" caption box */
const LOGIN_ART = HERO_ART.replace(/<g transform="translate\(132 240\)">.*?<\/g>/, "").replace(/<text x="95" y="-8"[^>]*>SWIMS<\/text>/, "").replace(/<circle cx="262" cy="160" r="150"[^>]*\/><circle cx="262" cy="160" r="104"[^>]*\/>/, "").replace('viewBox="0 0 520 320"', 'viewBox="14 14 484 290"');

const EMPTY_ART = '<svg viewBox="0 0 160 120" aria-hidden="true"><circle cx="80" cy="60" r="52" fill="#e4f6ea"/><circle cx="80" cy="60" r="38" fill="#fff" stroke="#0b7a3b" stroke-width="4"/><path d="M62 61l12 12 24-26" fill="none" stroke="#0b7a3b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="28" cy="30" r="5" fill="#ffb199"/><circle cx="136" cy="88" r="6" fill="#8fb4f2"/><circle cx="130" cy="24" r="3.5" fill="#f4d27a"/></svg>';

const ICONS = {
 check: '<path d="M20 6L9 17l-5-5"/>',
 alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>',
 swap: '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/>',
 dup: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
 undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-15-6.7L3 13"/>',
 db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
 store: '<path d="M3 9l1-5h16l1 5"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>',
 box: '<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>',
 download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
 edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>',
 user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
 users: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>',
 lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
 search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
 moon: '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>',
 sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 chev: '<path d="M9 18l6-6-6-6"/>',
 x: '<path d="M18 6L6 18M6 6l12 12"/>',
 plus: '<path d="M12 5v14M5 12h14"/>',
 msg: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
 trend: '<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
 globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>',
 clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
 sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
 home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
 list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
 book: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14z"/><path d="M4 19.5A2.5 2.5 0 006.5 22H20v-5"/>',
 eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
 eyeoff: '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><path d="M1 1l22 22"/>',
 logout:'<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
 shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
 gap: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6" stroke-dasharray="3 3"/>',
};
function ico(name, extra) {
 const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
 s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor");
 s.setAttribute("stroke-width", "2"); s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round");
 s.setAttribute("class", "ico" + (extra ? " " + extra : "")); s.setAttribute("aria-hidden", "true");
 s.innerHTML = ICONS[name] || "";   // constants only
 return s;
}
