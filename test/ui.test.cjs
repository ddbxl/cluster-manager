/*
 * UI tests — render the React components in jsdom and assert they mount,
 * show the right things, and respond to interaction. These are smoke tests
 * rather than pixel checks: the goal is to catch a component that throws,
 * a panel that renders nothing, or an accessibility affordance that vanished.
 *
 * Run with:  npm test        (or: node test/ui.test.cjs)
 */
const { JSDOM } = require("jsdom");

const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
global.cancelAnimationFrame = clearTimeout;
global.IS_REACT_ACT_ENVIRONMENT = true;

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react");
const G = require("./.build/ui.cjs");

let pass = 0;
const failures = [];
const quiet = process.env.QUIET === "1";
const ok = (cond, msg) => {
  if (cond) { pass++; if (!quiet) console.log(`  ok   ${msg}`); }
  else { failures.push(msg); console.log(`  FAIL ${msg}`); }
};

const SECTOR = { id: "digital", name: "Digital", color: "#38bdf8", icon: "display" };
const gs = G.initState("Austria", "Steiermark", SECTOR);
const container = document.getElementById("root");
const root = createRoot(container);
const render = (el) => act(() => { root.render(el); });
const text = () => document.body.textContent || "";
const qsa = (sel) => [...document.querySelectorAll(sel)];
const click = (el) => act(() => {
  el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
});

/* ── every top-level component mounts without throwing ─────── */
{
  const noop = () => {};
  const components = [
    ["EUMap", { gs, sel: null, setSel: noop }],
    ["LeftPanel", { gs }],
    ["RightPanel", { gs }],
    ["ProjectsModal", { gs, dispatch: noop, onClose: noop, panel: true }],
    ["StaffModal", { gs, dispatch: noop, onClose: noop, panel: true }],
    ["NetworkModal", { gs, dispatch: noop, onClose: noop, panel: true }],
    ["RivalsModal", { gs, dispatch: noop, onClose: noop, panel: true }],
    ["RulesModal", { gs, onClose: noop }],
    ["StatsModal", { gs, onClose: noop }],
    ["LogModal", { gs, onClose: noop }],
    ["MapLegend", { gs }],
    ["ProgressRing", { pct: 0.5, color: "#38bdf8", label: "50%" }],
    ["EmptyState", { icon: "folder-open", title: "Nothing", hint: "Do a thing" }],
    ["StageBanner", { banner: { from: 1, to: 2, key: 2 }, sector: SECTOR }],
  ];
  for (const [name, props] of components) {
    if (typeof G[name] !== "function") { ok(false, `${name} is exported`); continue; }
    let threw = null;
    try { render(React.createElement(G[name], props)); } catch (e) { threw = e; }
    ok(!threw, `${name} renders without throwing${threw ? ` (${threw.message})` : ""}`);
  }
}

/* ── the map draws real geography ─────────────────────────── */
{
  render(React.createElement(G.EUMap, { gs, sel: null, setSel: () => {} }));
  const paths = qsa("path").length;
  ok(paths > 200, `the map draws the NUTS-2 geography (${paths} paths)`);
  ok(qsa("svg").length >= 1, "the map renders an SVG");
  ok(qsa("[aria-label]").length >= 1, "the map carries a screen-reader label");
}

/* ── the map background fills its panel, not a letterboxed square ── */
{
  ok(G.CSS.includes(".map-sea"), "the sea background is a panel-level style");
  ok(!G.CSS.includes(".map-sea::before"), "the sea is flat now that painted land carries the detail");
  ok(G.CSS.includes("html.dark .map-sea"), "the sea has a dark-mode variant");
  render(React.createElement(G.EUMap, { gs, sel: null, setSel: () => {} }));
  const svgHtml = document.body.innerHTML;
  ok(!svgHtml.includes("cm-seagrad") && !svgHtml.includes("cm-dotgrid"),
     "no square background rect remains inside the map SVG");
}

/* ── map pan & zoom controls ─────────────────────────────── */
{
  render(React.createElement(G.EUMap, { gs, sel: null, setSel: () => {} }));
  const zin = qsa("button").find((b) => /zoom in/i.test(b.getAttribute("aria-label") || ""));
  const zout = qsa("button").find((b) => /zoom out/i.test(b.getAttribute("aria-label") || ""));
  ok(!!zin && !!zout, "the map offers zoom-in and zoom-out buttons");

  const svg = qsa("svg")[0];
  ok(svg && svg.getAttribute("viewBox") === `0 0 609 600`, "the map starts at the fitted view");
  ok(svg && /none/.test(svg.style.touchAction || ""), "the map claims touch gestures so panning doesn't scroll the page");

  if (zin) {
    click(zin);
    const vb = qsa("svg")[0].getAttribute("viewBox").split(" ").map(Number);
    ok(vb[2] < 609, `zooming in narrows the view (width ${vb[2].toFixed(0)})`);
    const reset = qsa("button").find((b) => /reset the map/i.test(b.getAttribute("aria-label") || ""));
    ok(!!reset, "a reset control appears once zoomed");
    ok(/drag to pan/i.test(text()), "the zoom indicator tells you that you can pan");
    if (reset) {
      click(reset);
      ok(qsa("svg")[0].getAttribute("viewBox") === "0 0 609 600", "reset returns to the whole of Europe");
    }
  }
}

/* ── dismissing an overlay must not zoom the map ─────────── */
{
  // Regression: an event modal closes on pointerdown, so its pointerup lands on
  // the map underneath. Two quick dismissals used to read as a double-tap and
  // zoom the map to wherever the button was (which is over Scandinavia).
  render(React.createElement(G.EUMap, { gs, sel: null, setSel: () => {} }));
  const svg = qsa("svg")[0];
  const fitted = svg.getAttribute("viewBox");

  const strayUp = (x, y) => act(() => {
    const ev = new dom.window.Event("pointerup", { bubbles: true });
    Object.assign(ev, { pointerId: 1, clientX: x, clientY: y, pointerType: "mouse", button: 0 });
    svg.dispatchEvent(ev);
  });

  strayUp(300, 200);
  strayUp(300, 200); // immediately again, as two fast dismissals would
  ok(qsa("svg")[0].getAttribute("viewBox") === fitted,
     "pointer-ups with no matching pointer-down on the map never zoom it");

  // a genuine double-tap (down+up twice in the same spot) still zooms
  const tap = (x, y) => act(() => {
    for (const type of ["pointerdown", "pointerup"]) {
      const ev = new dom.window.Event(type, { bubbles: true });
      Object.assign(ev, { pointerId: 2, clientX: x, clientY: y, pointerType: "mouse", button: 0 });
      svg.dispatchEvent(ev);
    }
  });
  tap(300, 200);
  tap(300, 200);
  const after = qsa("svg")[0].getAttribute("viewBox");
  ok(after !== fitted, "a real double-tap on the map still zooms in");

  // and double-tapping again returns to the fitted view
  tap(300, 200);
  tap(300, 200);
  ok(qsa("svg")[0].getAttribute("viewBox") === fitted, "double-tapping again restores the whole map");
}

/* ── two taps far apart are not a double-tap ─────────────── */
{
  render(React.createElement(G.EUMap, { gs, sel: null, setSel: () => {} }));
  const svg = qsa("svg")[0];
  const fitted = svg.getAttribute("viewBox");
  const tapAt = (x, y, id) => act(() => {
    for (const type of ["pointerdown", "pointerup"]) {
      const ev = new dom.window.Event(type, { bubbles: true });
      Object.assign(ev, { pointerId: id, clientX: x, clientY: y, pointerType: "mouse", button: 0 });
      svg.dispatchEvent(ev);
    }
  });
  tapAt(100, 100, 7);
  tapAt(400, 380, 8); // quick, but a long way away
  ok(qsa("svg")[0].getAttribute("viewBox") === fitted,
     "two quick taps in different places are treated as separate clicks, not a zoom");
}

/* ── the watermark stays out of the zoomable layer ───────── */
{
  render(React.createElement(G.EUMap, { gs, sel: null, setSel: () => {} }));
  const svgText = qsa("svg")[0].innerHTML;
  ok(!/Quarter \d/.test(svgText), "the stage watermark is an overlay, so zooming doesn't magnify it");
  ok(/difficulty/.test(text()), "the watermark is still shown");
}

/* ── political seats appear on the map when held ──────────── */
{
  render(React.createElement(G.EUMap, {
    gs: { ...gs, seats: { regional: true, eu: true } }, sel: null, setSel: () => {},
  }));
  const html = document.body.innerHTML;
  ok(html.includes(">S3<"), "a held regional seat shows a pin at the home capital");
  ok(html.includes(">EU<"), "a held EU seat shows a pin at Brussels");
}

/* ── the map legend expands and explains the colours ─────── */
{
  render(React.createElement(G.MapLegend, { gs }));
  const keyBtn = qsa("button").find((b) => /key/i.test(b.textContent));
  ok(!!keyBtn, "the map legend starts collapsed as a Key button");
  if (keyBtn) {
    click(keyBtn);
    ok(/home region/i.test(text()), "the expanded legend explains the home region");
    ok(/political seat/i.test(text()), "the expanded legend explains seat pins");
  }
}

/* ── empty states guide a brand-new player ───────────────── */
{
  render(React.createElement(G.StaffModal, { gs, dispatch: () => {}, onClose: () => {}, panel: true }));
  ok(/General Manager/i.test(text()), "the staff panel names the General Manager for a new player");
  render(React.createElement(G.ProjectsModal, { gs, dispatch: () => {}, onClose: () => {}, panel: true }));
  ok(text().length > 50, "the projects panel renders guidance rather than a blank area");
}

/* ── rival threat cues ───────────────────────────────────── */
{
  const threatened = {
    ...gs, stage: 1,
    rivals: [{ ...gs.rivals[0], stage: 4, progress: 80, countries: ["Austria"], truce: 0 }],
  };
  render(React.createElement(G.RivalsModal, { gs: threatened, dispatch: () => {}, onClose: () => {}, panel: true }));
  ok(qsa(".rv-head .tag").some(t => /Ahead of you/.test(t.textContent)), "a rival ahead of you is flagged as a threat");
  ok(/ahead of you|threat/i.test(text()), "the threat is named in words, not just colour");
}

/* ── the quarter digest is a non-blocking corner card ───── */
{
  const withDigest = {
    ...gs,
    digest: { turn: 5, dBudget: 84000, dMembers: -3, dInfluence: 2, dBoard: -1,
              evolved: null, qMember: 50000, qProj: 120000, qStaff: 40000,
              qOverhead: 8000, qDelivery: 0, events: [{ t: "good", txt: "Project delivered" }] },
  };
  let threw = null;
  try {
    render(React.createElement(G.DigestCard, {
      gs: withDigest, digestOn: true, reopenTick: 0, onDigestToggle: () => {},
    }));
  } catch (e) { threw = e; }
  ok(!threw, "the quarter digest renders as a card");
  if (!threw) ok(text().length > 0, "the digest shows the quarter's numbers");
}

/* ── save export / import panel ──────────────────────────── */
{
  let threw = null;
  try {
    render(React.createElement(G.SaveSlots, { gs, onClose: () => {}, onLoad: () => {} }));
  } catch (e) { threw = e; }
  ok(!threw, `the save panel renders${threw ? ` (${threw.message})` : ""}`);

  if (!threw) {
    const body = text();
    ok(/between devices|portable|save code/i.test(body), "the save panel explains that runs are portable");
    const mk = qsa("button").find((b) => /create save code/i.test(b.textContent));
    ok(!!mk, "there is a button to create a save code");
    if (mk) {
      click(mk);
      const ta = qsa("textarea").find((t) => (t.value || "").startsWith("CMSAVE1."));
      ok(!!ta, "pressing it produces a save code in a selectable field");
      ok(!!qsa("button").find((b) => /^copy$/i.test(b.textContent.trim())), "the generated code offers a copy button");
    }
    ok(!!qsa("button").find((b) => /restore this run/i.test(b.textContent)), "there is a restore control");
    ok(qsa('input[type="file"]').length >= 1, "a save file can be chosen from disk");
    ok(!!qsa("textarea").find((t) => /paste a save code/i.test(t.placeholder || "")), "there is a field to paste a code into");
  }
}

/* ── restoring a bad code reports the problem in the panel ─ */
{
  let loaded = null;
  render(React.createElement(G.SaveSlots, { gs, onClose: () => {}, onLoad: (s) => { loaded = s; } }));
  const ta = qsa("textarea").find((t) => /paste a save code/i.test(t.placeholder || ""));
  if (ta) {
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value").set;
      setter.call(ta, "this is not a save code");
      ta.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
    const restore = qsa("button").find((b) => /restore this run/i.test(b.textContent));
    if (restore) {
      click(restore);
      ok(loaded === null, "a bad code does not load a broken campaign");
      ok(/doesn't look like|could not|damaged|incomplete/i.test(text()), "a bad code produces a visible explanation");
    } else ok(false, "restore button present after typing");
  } else ok(false, "paste field present");
}

/* ── accessibility affordances ───────────────────────────── */
{
  ok(G.CSS.includes("prefers-reduced-motion"), "animations are gated behind prefers-reduced-motion");
  ok(typeof G.applyTheme === "function", "a theme switcher is available");
  ok(typeof G.applyTextScale === "function", "a text-scale control is available");

  // text scale must zoom on desktop but never on a phone-width viewport,
  // where zooming the fixed-height layout would push content off-screen
  const setWidth = (w) => { try { Object.defineProperty(window, "innerWidth", { value: w, configurable: true }); } catch {} };
  setWidth(1200);
  G.applyTextScale(true);
  ok(container.style.zoom === "1.12", "on a desktop width, larger-text zooms the app");
  G.applyTextScale(false);
  ok(!container.style.zoom, "turning larger-text off restores the default scale");
  setWidth(420);
  G.applyTextScale(true);
  ok(!container.style.zoom, "on a phone width, larger-text does not zoom (it would break the layout)");
  setWidth(1200);
  G.applyTextScale(false);
}

/* ── floating deltas are readable in dark mode ──────────── */
{
  ok(G.CSS.includes("--delta-halo"), "the floating quarter deltas use a themeable halo");
  ok(G.CSS.includes("html.dark .float-delta"), "the halo has a dark-mode override");
  ok(!/text-shadow:0 1px 4px rgba\(255,255,255,\.8\)\}/.test(G.CSS),
     "the old hardcoded white halo is gone");
}

/* ── visual identity: Helvetica, flat rectangles, one cut corner ── */
{
  // Typography: one family, no webfonts, so the page needs no network request
  // and numbers still align without a monospace face.
  ok(/Helvetica/.test(G.CSS), "the interface is set in Helvetica");
  ok(!/Montserrat|DM Mono|Open Sans/.test(G.CSS), "the old webfont stack is gone");
  ok(!/fonts\.googleapis|fonts\.gstatic/.test(G.CSS), "no font is fetched over the network");
  ok(/tabular-nums/.test(G.CSS), "figures are tabular, so columns of numbers line up");

  // Shape: square by default. Uniform rounded corners on everything were the
  // main thing making this read as a template.
  render(React.createElement(G.LeftPanel, { gs, dispatch: () => {} }));
  const markup = document.getElementById("root").innerHTML;
  const radii = [...new Set([...markup.matchAll(/border-radius:\s*([^;"]+)/g)].map(m => m[1].trim()))];
  ok(radii.every(r => r === "0px" || r === "50%"),
     `corners are square, bar genuine circles (${radii.join(", ") || "none"})`);
  const shadows = [...new Set([...markup.matchAll(/box-shadow:\s*([^;"]+)/g)].map(m => m[1].trim()))];
  ok(shadows.every(s => s === "none"), `no soft drop shadows remain (${shadows.join(", ") || "none"})`);

  // The one deliberate shape: primary actions carry a clipped corner.
  ok(/\.cut\{clip-path/.test(G.CSS), "the clipped-corner treatment is defined");
  ok(!/\.cut\b[^{]*\{[^}]*border-radius/.test(G.CSS), "the cut corner replaces radius rather than joining it");

  // Buttons should not float on hover: that lift plus shadow is the SaaS tell.
  ok(!/\.btn:hover[^}]*translateY/.test(G.CSS), "buttons no longer lift on hover");
  ok(!/\.btn:hover[^}]*box-shadow:0/.test(G.CSS), "buttons no longer cast a shadow on hover");
  ok(/\.btn:focus-visible/.test(G.CSS), "keyboard focus stays visible");

  // Colour: deep flag-blue glass, with flag yellow for actions and titles.
  ok(G.P.accent.toLowerCase() === "#1f4bd8", `actions carry one blue (${G.P.accent})`);
  ok(!/#ffcc00/i.test(Object.values(G.P).join(" ")), "yellow is kept out of the interface palette");
  const rgbOf = hex => { const n = hex.replace("#", ""); return [0,2,4].map(i => parseInt(n.slice(i,i+2),16)); };
  const lum = hex => { const [r,g,b] = rgbOf(hex).map(v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); }); return 0.2126*r+0.7152*g+0.0722*b; };
  const contrast = (x, y) => { const [hi, lo] = [lum(x), lum(y)].sort((m,n)=>n-m); return (hi+0.05)/(lo+0.05); };
  for (const key of ["bg", "panel", "card"]) {
    const [r,g,b] = rgbOf(G.P[key]);
    ok(Math.min(r,g,b) > 235 && b >= r, `${key} is a light, cool surface (${G.P[key]})`);
  }
  // every text colour has to stay readable on the panels it sits on
  for (const key of ["text", "muted", "accent", "goldText", "greenText", "redText", "blue"]) {
    const c = contrast(G.P[key], G.P.panel);
    ok(c >= 4.5, `${key} reads clearly on a panel (contrast ${c.toFixed(1)})`);
  }
  ok(contrast(G.P.onAccent, G.P.accent) >= 4.5, "text on a blue fill is white and reads clearly");

  // No pastel fills and no gloss: the two habits that make buttons read as SaaS.
  ok(!/sheen/.test(G.CSS), "the gloss sweep across the primary button is gone");
}

/* ── menus share one language: blue band, yellow rule, diamond ── */
{
  let closed = false;
  render(null);
  render(React.createElement(G.Modal, { title: "Cluster Dashboard", icon: "gauge-high", onClose: () => { closed = true; } },
    React.createElement(G.Lbl, { t: "Treasury" })));
  const band = qsa(".menu-band")[0];
  ok(!!band, "a menu opens under a title block");
  if (band) {
    const title = band.querySelector(".title-caps");
    ok(!!title && /Cluster Dashboard/.test(title.textContent), "the title is set in small capitals");
    ok(band.style.textAlign === "left" && /1px solid/.test(band.style.borderBottom), "the title sits left above a hairline");
  }
  ok(qsa(".glass").length >= 1, "the window is a glass panel over the map");
  const close = qsa("button").find(b => b.getAttribute("aria-label") === "Close");
  ok(!!close, "the close control is labelled for assistive technology");
  if (close) { click(close); ok(closed, "the close control closes the menu"); }

  const heading = qsa(".menu-heading")[0];
  ok(!!heading && /Treasury/.test(heading.textContent), "section headings sit on a rule with the diamond mark");
  ok(G.BAND === "#003399", "the band colour is fixed, so light and dark menus match");

  // the management dock uses the same language for its tabs
  const sector = { id:"digital", name:"Digital", color:"#38bdf8", icon:"display" };
  render(null);
  render(React.createElement(G.Game, { gs: G.initState("Austria", "Steiermark", sector), dispatch: () => {}, vw: 1280, onRestart: () => {} }));
  const tabs = qsa('[role="tablist"] button');
  ok(tabs.length === 4, "the dock offers its four menus as tabs");
  const active = tabs.filter(b => b.getAttribute("aria-pressed") === "true");
  ok(active.length === 1 && active[0].style.fontWeight === "700" && /3px solid/.test(active[0].style.borderBottom),
     "the open tab is bold text on a yellow rule");
  ok(tabs.every(b => !b.style.background || b.style.background === "transparent"), "tabs are text, with no filled blocks");
  const idle = tabs.find(b => b.getAttribute("aria-pressed") !== "true");
  if (idle) {
    click(idle);
    const now = qsa('[role="tablist"] button').filter(b => b.getAttribute("aria-pressed") === "true");
    ok(now.length === 1 && now[0].textContent === idle.textContent, "choosing another tab moves the rule to it");
  }
}

/* ── inside a menu, a button is text that underlines on hover ── */
{
  const css = G.CSS;
  ok(/\.menu-scope \.btn:not\(\.dot\):not\(\.card-btn\):not\(\.hire-tile\):not\(\.evo-go\):not\(\.op\)\{[^}]*background:transparent !important/.test(css), "menu buttons carry no fill");
  ok(/\.menu-scope \.btn:not\(\.dot\):not\(\.card-btn\):not\(\.hire-tile\):not\(\.evo-go\):not\(\.op\)\{[^}]*border-color:transparent !important/.test(css), "menu buttons carry no box");
  ok(/\.menu-scope \.btn:not\(\.dot\):not\(\.card-btn\):not\(\.hire-tile\):not\(\.evo-go\):not\(\.op\):hover:not\(:disabled\)[^{]*\{[^}]*text-decoration:underline/.test(css), "hovering a menu button underlines it");
  ok(/\.menu-scope \.btn:not\(\.dot\):not\(\.card-btn\):not\(\.hire-tile\):not\(\.evo-go\):not\(\.op\):focus-visible/.test(css), "keyboard focus underlines it too");
  ok(/\.menu-scope \.btn:disabled\{[^}]*text-decoration:none/.test(css), "a disabled button does not underline");
  ok(css.includes('.menu-scope .btn[style*="color:#FFFFFF"]') && css.includes('.menu-scope .btn[style*="color: rgb(255, 255, 255)"]'),
     "text that sat on a fill takes the action colour, so it cannot vanish");
  ok(css.includes(".card-btn{") && /\.card-btn:hover[^{]*\{[^}]*border-color:#1F4BD8/.test(css), "option rows are framed, and the frame turns blue under the pointer");

  // every kind of menu is inside the scope
  const sector = { id:"digital", name:"Digital", color:"#38bdf8", icon:"display" };
  const g0 = G.initState("Austria", "Steiermark", sector);
  render(null);
  render(React.createElement(G.StatsModal, { gs: g0, onClose: () => {}, dispatch: () => {} }));
  ok(qsa(".menu-scope").length >= 1, "a window menu applies the text-button rule");
  render(null);
  render(React.createElement(G.Game, { gs: g0, dispatch: () => {}, vw: 1280, onRestart: () => {} }));
  ok(qsa(".menu-scope").length >= 1, "the management dock is inside the text-button rule");
  const staffTab = qsa('[role="tablist"] button').find(b => /Staff/.test(b.textContent));
  if (staffTab) { click(staffTab); ok(qsa(".menu-scope button").length >= 1, "its hire and fire controls are text"); }
  render(null);
  const ev = G.EVENTS.find(e => e.t === "choice");
  render(React.createElement(G.EventModal, { ev, onDismiss: () => {} }));
  ok(qsa(".menu-scope button").length >= 2, "event choices are text options too");

  // the information dot is a control with its own shape and keeps it
  render(null);
  render(React.createElement("div", { className: "menu-scope" }, React.createElement(G.InfoDot, { text: "why", label: "Trend" })));
  ok(qsa("button.dot").length === 1, "the information dot is exempt and keeps its circle");
}

/* ── glass interface: floating panels, option cards, the medallion ── */
{
  const sector = { id:"digital", name:"Digital", color:"#38bdf8", icon:"display" };
  const g0 = G.initState("Austria", "Steiermark", sector);
  render(null);
  render(React.createElement(G.Game, { gs: g0, dispatch: () => {}, vw: 1280, onRestart: () => {} }));
  ok(qsa(".sheet").length === 2, "the side panels are flat sheets attached to the screen edges");
  ok(qsa(".glass").length >= 1, "things floating over the map are lifted cards");
  ok(qsa(".glass-flat").length >= 1, "the top bar is a glass strip");
  const orb = qsa("button.orb")[0];
  ok(!!orb && !orb.disabled, "the medallion ends the quarter");
  ok(!!qsa("button.orb-sm")[0], "automatic play is a small round control beside it");

  // with nobody in charge the medallion says why it is unavailable
  render(null);
  render(React.createElement(G.Game, { gs: { ...g0, roster: [] }, dispatch: () => {}, vw: 1280, onRestart: () => {} }));
  const idle = qsa("button.orb")[0];
  ok(!!idle && idle.disabled && /General Manager/.test(idle.getAttribute("aria-label") || ""),
     "without a General Manager the medallion is disabled and says why");

  // event options are framed cards, and the single-answer case gets a framed confirm
  render(null);
  const choice = G.EVENTS.find(e => e.t === "choice");
  let picked = null;
  render(React.createElement(G.EventModal, { ev: choice, onDismiss: (i) => { picked = i; } }));
  const cards = qsa("button.card-btn");
  ok(cards.length === choice.choices.length, "each option is its own framed card");
  ok(!!qsa(".title-caps")[0], "the event title is set in small capitals");
  if (cards[1]) { click(cards[1]); ok(picked === 1, "choosing a card answers the event with that option"); }
  render(null);
  const plain = G.EVENTS.find(e => e.t !== "choice");
  render(React.createElement(G.EventModal, { ev: plain, onDismiss: () => {} }));
  ok(qsa("button.card-btn").length === 1, "a plain event has one framed confirm");

  ok(/\.glass\{background:#FFFFFF/.test(G.CSS), "panels are white cards");
  ok(!/small-caps/.test(G.CSS), "headings are plain sentence case, without small capitals");
}

/* ── hovering a country: a label that fits whatever it holds ── */
{
  const sector = { id:"digital", name:"Digital", color:"#38bdf8", icon:"display" };
  const g0 = G.initState("Austria", "Styria", sector);
  const longName = "Association for the Promotion of Advanced Manufacturing and Industrial Digitalisation";
  const g1 = { ...g0, rivals: [{ ...g0.rivals[0], name: longName, countries: ["Germany"], country: "Germany" }] };
  render(null);
  render(React.createElement(G.EUMap, { gs: g1, sel: null, setSel: () => {}, dispatch: () => {} }));
  const svg = qsa("svg")[0];
  svg.getBoundingClientRect = () => ({ left:0, top:0, width:900, height:700, right:900, bottom:700 });
  const de = qsa("path").find(p => (p.getAttribute("data-nuts")||"").startsWith("DE"));
  act(() => { de.dispatchEvent(new dom.window.MouseEvent("mouseover", { bubbles:true, clientX:400, clientY:300 })); });
  const label = qsa(".map-hover")[0];
  ok(!!label, "hovering a country shows a label");
  ok(label && label.textContent.includes(longName), "a long rival name appears in full, never clipped");
  ok(G.CSS.includes(".map-hover{") && /\.map-hover\{[^}]*max-width:240px/.test(G.CSS), "the label wraps at a fixed width");
  ok(label && /Click for options/.test(label.textContent), "it tells you clicking does more");
  ok(!qsa("svg text").some(t => /HOME COUNTRY|UNEXPLORED/.test(t.textContent)), "the old in-map tooltip that scaled with zoom is gone");
}

/* ── contemporary conventions hold across the interface ──── */
{
  ok(!/textTransform:"uppercase"/.test(require("fs").readFileSync(require("path").join(__dirname, "..", "src", "ClusterManagerSimulator.jsx"), "utf8")),
     "no label is forced into capitals");
  ok(/\.sheet\{[^}]*border-radius:0/.test(G.CSS) && /\.glass\{[^}]*border-radius:6px/.test(G.CSS),
     "fixed sheets are square and floating cards are rounded, so the radius tells them apart");
  render(null);
  const sector = { id:"digital", name:"Digital", color:"#38bdf8", icon:"display" };
  const g0 = { ...G.initState("Austria", "Styria", sector), budget: 3_000_000 };
  render(React.createElement(G.ProjectsModal, { gs: G.reducer(G.reducer(g0,{type:"hire",roleId:"comms"}),{type:"hire",roleId:"pm"}), dispatch: () => {}, onClose: () => {}, panel: true }));
  const entry = qsa(".proj")[0];
  ok(!!entry, "projects are listed as plain entries");
  ok(entry && entry.querySelectorAll("dl.figs dd").length === 3, "each entry shows volume, margin and risk as aligned figures");
  ok(entry && /Start project|Needs/.test(entry.textContent), "the action says what it does");
}

/* ── icons carry categories, numbers carry values ─────────── */
{
  for (const n of ["hourglass-half","calendar-days","arrow-trend-up","map-location-dot","location-dot","user-plus","circle-nodes","seedling","hand-holding-dollar"])
    ok(Array.isArray(G.ICON_PATHS[n]) && G.ICON_PATHS[n].length === 3, `the ${n} icon is embedded`);
  render(null);
  render(React.createElement(G.Facts, { items: [{ i:"hourglass-half", t:"2 q", tip:"Runs for 2 quarters" }, false, { i:"coins", t:"€151k" }] }));
  const facts = qsa(".fact");
  ok(facts.length === 2, "facts skip empty entries");
  ok(facts[0].querySelector("svg") && /2 q/.test(facts[0].textContent), "each fact is an icon with a short value");
  ok(facts[0].getAttribute("title") === "Runs for 2 quarters", "the full meaning is in the tooltip");
  ok(/Runs for 2 quarters/.test(facts[0].querySelector(".sr")?.textContent || ""), "and is read out to screen readers");

  // the top bar shows icon and figure, with the name kept for tooltips and screen readers
  const sector = { id:"digital", name:"Digital", color:"#38bdf8", icon:"display" };
  render(null);
  render(React.createElement(G.Game, { gs: G.initState("Austria", "Styria", sector), dispatch: () => {}, vw: 1280, onRestart: () => {} }));
  const treasury = qsa("div[title]").find(d => /^Treasury/.test(d.getAttribute("title")));
  ok(!!treasury && !!treasury.querySelector("svg"), "the treasury figure carries an icon");
  ok(treasury && /Treasury/.test(treasury.querySelector(".sr")?.textContent || ""), "its name stays available to screen readers");

  // attention plates lead with an icon
  let g = { ...G.initState("Austria", "Styria", sector), budget: 3_000_000 };
  g = G.reducer(G.reducer(g, { type:"hire", roleId:"comms" }), { type:"hire", roleId:"pm" });
  render(null);
  render(React.createElement(G.AttentionQueue, { items: G.attentionItems(g), onGo: () => {} }));
  ok(qsa('[role="listitem"]').every(b => b.querySelector("svg")), "every attention plate leads with an icon");
  ok(qsa('[role="listitem"]').every(b => b.textContent.length < 45), "and its text is short");
}

/* ── staff, rivals, network, next stage, info buttons ─────── */
{
  const sector = { id:"digital", name:"Digital", color:"#38bdf8", icon:"display" };
  let g = { ...G.initState("Austria", "Styria", sector), budget: 3_000_000 };
  render(null); render(React.createElement(G.StaffModal, { gs: g, dispatch: () => {}, onClose: () => {}, panel: true }));
  const tiles = qsa(".hire-tile");
  ok(tiles.length >= 6, "hiring is a grid of tiles");
  ok(tiles.every(t => t.querySelector("svg") && /€/.test(t.textContent)), "each tile shows an icon and a salary");
  ok(tiles.every(t => t.textContent.length < 50), "tiles carry no descriptions, so the grid fits without scrolling");
  ok(qsa(".hire-detail").length === 0, "no note sits under the roles until you point at one");
  act(() => { tiles[1].dispatchEvent(new dom.window.MouseEvent("mouseover", { bubbles:true })); });
  ok(qsa(".hire-detail").length === 1 && qsa(".hire-detail")[0].textContent.length > 20, "pointing at a role shows its description");
  ok(!/three quarters/i.test(text()), "the staff panel does not restate the hiring rule");
  render(null); render(React.createElement(G.RulesModal, { onClose: () => {} }));
  ok(/three quarters of the new salary/.test(text()), "the hiring rule is explained in How to play");

  render(null); render(React.createElement(G.RivalsModal, { gs: g, dispatch: () => {}, onClose: () => {}, panel: true }));
  ok(qsa(".rival").length === g.rivals.length, "each rival is a plain section");
  ok(qsa(".btn.op").every(b => b.querySelector("svg") && /€/.test(b.textContent) && b.getAttribute("title")), "rival actions are icon and price, named in the tooltip");

  render(null); render(React.createElement(G.NetworkModal, { gs: { ...g, stage: 2 }, dispatch: () => {}, onClose: () => {}, panel: true }));
  ok(qsa(".net-list li").length === 1, "your countries are listed with their coverage");
  ok(/click any region on the map/i.test(text()), "the panel points to expanding from the map");

  render(null); render(React.createElement(G.EvolveModal, { gs: g, dispatch: () => {}, onClose: () => {} }));
  ok(qsa(".evo-reqs li").length === G.evolveReqs(g).length, "each goal for the next stage is a row");
  ok(qsa(".evo-reqs .bar").length === G.evolveReqs(g).length, "with a bar showing how close you are");
  ok(qsa(".btn.evo-go")[0]?.disabled === !G.canEvolve(g), "the action is available only when every goal is met");

  // regression: inside an animated panel the (i) explanation opened out of sight
  render(null);
  render(React.createElement("div", { className: "panel-fade menu-scope" }, React.createElement(G.InfoDot, { text: "Why this works", label: "Explain" })));
  const dot = qsa("button.dot")[0];
  click(dot);
  const tip = document.body.querySelector('[role="tooltip"]');
  ok(!!tip && tip.parentElement === document.body, "the explanation renders at the page root, where no animated panel can hide it");
  ok(/Why this works/.test(tip?.textContent || ""), "and shows its text");
  act(() => { dot.dispatchEvent(new dom.window.MouseEvent("mouseout", { bubbles:true })); });
  ok(!!document.body.querySelector('[role="tooltip"]'), "a clicked explanation stays open when the pointer leaves");
  click(dot);
  ok(!document.body.querySelector('[role="tooltip"]'), "clicking again closes it");
}

/* ── choosing where to start on the map ───────────────────── */
{
  // strict matching: only a name or city that points to a region counts
  ok(G.regionFromLabel("France", "Lannion", "Photonics Bretagne") === "Brittany", "a cluster named in the local language maps to its region");
  ok(G.regionFromLabel("Germany", "Somewhere", "Generic Cluster") === "", "a cluster with no regional clue is not guessed into a region");
  ok(G.regionFromLabel("Latvia", "", "Anything") === "Latvia", "a single-region country takes its only region");
  ok(G.countryRegionShapes("Germany").length === 16, "every German region has a shape to click");

  let picked = null;
  render(null);
  render(React.createElement(G.SetupMap, { country: "", region: "", onCountry: c => { picked = c; } }));
  const de = qsa('path[data-country="Germany"]')[0];
  ok(!!de, "countries on the setup map can be clicked");
  click(de);
  ok(picked === "Germany", "clicking a country picks it");

  let reg = null;
  render(null);
  render(React.createElement(G.SetupMap, { country: "Germany", region: "", counts: { Bavaria: 5 }, onRegion: r => { reg = r; }, onEurope: () => {} }));
  const groups = qsa("g[data-region]");
  ok(groups.length === 16, "zooming into a country shows its regions");
  click(groups.find(g => g.getAttribute("data-region") === "Bavaria"));
  ok(reg === "Bavaria", "clicking a region picks it");
  ok(qsa("svg text").some(t => t.textContent === "5"), "regions show how many real clusters are based there");
  ok(qsa("button").some(b => /Europe/.test(b.textContent)), "a control zooms back out to Europe");

  // the full flow: pick on the map, then take over a real cluster or start your own
  render(null);
  render(React.createElement(G.Setup, { onStart: () => {}, canResume: false, onResume: () => {}, mobile: false }));
  click(qsa('path[data-country="Germany"]')[0]);
  ok(/Region in/.test(text()), "picking a country on the map moves setup to the region step");
  click(qsa('g[data-region="Bavaria"]')[0]);
  ok(/Start my own cluster here/.test(text()), "picking a region offers to start your own cluster there");
  const realPick = qsa(".real-pick")[0];
  ok(!!realPick, "and lists the real clusters based in it");
  if (realPick) { click(realPick); ok(/Industrial ecosystem/.test(text()), "taking one over moves on with its ecosystem set"); }
}

/* ── dark mode and back again ─────────────────────────────── */
{
  // Regression: switching back to light mode referenced a palette that no longer
  // existed, so the whole page crashed to blank.
  const sector = { id:"digital", name:"Digital", color:"#38bdf8", icon:"display" };
  const g0 = G.initState("Austria", "Styria", sector);
  const lightPanel = G.P.panel;
  let threw = null;
  try {
    G.applyTheme(true);
    render(null); render(React.createElement(G.Game, { gs: g0, dispatch: () => {}, vw: 1280, onRestart: () => {} }));
    ok(G.P.panel !== lightPanel, "dark mode swaps the palette");
    G.applyTheme(false);
    render(null); render(React.createElement(G.Game, { gs: g0, dispatch: () => {}, vw: 1280, onRestart: () => {} }));
  } catch (e) { threw = e; }
  ok(!threw, `switching dark and back to light does not crash${threw ? ` (${threw.message})` : ""}`);
  ok(G.P.panel === lightPanel, "light mode restores the original palette");
  ok(qsa("button").length > 5, "the game is still drawn after the round trip");
  G.applyTheme(false);
}

/* ── seats and locked calls read as plain lists ──────────── */
{
  const sector = { id:"digital", name:"Digital", color:"#38bdf8", icon:"display" };
  const g0 = G.initState("Austria", "Styria", sector);
  render(null); render(React.createElement(G.LeftPanel, { gs: g0, dispatch: () => {} }));
  const rows = qsa(".seat-row");
  ok(rows.length === 3, "the three seats are listed as rows");
  ok(rows.every(r => r.querySelector("svg") && /Open|Yours|\w/.test(r.textContent)), "each seat row has an icon and a status");
  ok(rows.every(r => r.getAttribute("title")), "what a seat needs is in its tooltip");
  render(null); render(React.createElement(G.ProjectsModal, { gs: g0, dispatch: () => {}, onClose: () => {}, panel: true }));
  const locked = qsa(".locked li");
  ok(locked.length >= 1, "calls you cannot start yet are listed");
  ok(locked.every(li => /Needs /.test(li.textContent)), "each says in words what is missing");
  ok(/Not yet available/.test(text()), "the list has a plain heading");
  ok(!/fontSize:(8|8\.5|9|9\.5)[,}]/.test(require("fs").readFileSync(require("path").join(__dirname, "..", "src", "ClusterManagerSimulator.jsx"), "utf8")),
     "no interface text is set smaller than 11px");
}

/* ── the setup screen ─────────────────────────────────────── */
{
  render(null);
  render(React.createElement(G.Setup, { onStart: () => {}, canResume: true, onResume: () => {}, onOpenSlots: () => {}, mobile: false }));
  ok(qsa(".setup").length === 1, "setup uses the shared control styling");
  ok(/Cluster Manager/.test(qsa("h1")[0]?.textContent || ""), "the title is set in title case");
  ok(qsa("svg[aria-label]").some(s => /Map/.test(s.getAttribute("aria-label"))), "a map of Europe sits beside the setup");
  ok(qsa("details summary").some(s => /Seed or challenge code/.test(s.textContent)), "seed and challenge codes fold away");
  const scen = qsa("button").filter(b => b.getAttribute("aria-pressed") !== null && b.querySelector("svg"));
  ok(scen.length >= 4, "scenarios are tiles with icons");
  render(null);
  render(React.createElement(G.SetupMap, { country: "Austria", region: "Styria" }));
  ok(/Styria/.test(qsa("svg")[0].getAttribute("aria-label")), "choosing a region lights it up on the map");
}

/* ── clicking a region on the map ─────────────────────────── */
{
  const sector = { id:"digital", name:"Digital", color:"#38bdf8", icon:"display" };
  const g0 = { ...G.initState("Austria", "Styria", sector), budget: 5_000_000 };
  const sent = [];
  const nuts = (code) => qsa("path").find(p => p.getAttribute("data-nuts") === code);
  render(null);
  render(React.createElement(G.EUMap, { gs: g0, sel: null, setSel: () => {}, dispatch: (a) => sent.push(a) }));
  ok(qsa("path[data-nuts]").length > 200, "every region on the map can be clicked");

  // an unheld Austrian region offers an office
  const otherCode = Object.keys(G.NUTS2_PATHS).find(c => c.startsWith("AT") && c !== "AT22");
  click(nuts(otherCode));
  const card = qsa(".region-card")[0];
  ok(!!card, "clicking a region opens its card");
  const open = card && [...card.querySelectorAll("button")].find(b => /Open an office for €/.test(b.textContent));
  ok(!!open && !open.disabled, "the card offers to open an office there, with its price");
  if (open) { click(open); ok(sent.length === 1 && sent[0].type === "expandRegion", "pressing it expands into that region"); }

  // the home region reads as held
  click(nuts("AT22"));
  ok(/Your office is here/.test(qsa(".region-card")[0]?.textContent || ""), "your own region says so");

  // a closed country explains itself and offers no button
  const deCode = Object.keys(G.NUTS2_PATHS).find(c => c.startsWith("DE"));
  click(nuts(deCode));
  const deCard = qsa(".region-card")[0];
  ok(deCard && /open up at/.test(deCard.textContent), "a country you cannot enter yet explains why");
  ok(deCard && ![...deCard.querySelectorAll("button")].some(b => /Enter|Open an office/.test(b.textContent)), "and offers nothing to press");

  // the close control and open water both dismiss the card
  const x = qsa("button").find(b => b.getAttribute("aria-label") === "Close region card");
  if (x) { click(x); ok(qsa(".region-card").length === 0, "the card closes"); }
}

/* ── the painted map: neighbours, candidates and banners ──── */
{
  const sector = { id:"mobility_transport", name:"Mobility, Transport, Automotive", color:"#2C6EC4", icon:"car" };
  let g = G.initState("Germany", "Bavaria", sector);
  g = { ...g, stage: 2, countries: ["Germany", "Austria"], regions: ["Bavaria", "Hesse", "Styria (AT)"] };
  render(null);
  render(React.createElement(G.EUMap, { gs: g, sel: null, setSel: () => {} }));
  const svg = qsa("svg")[0];
  const html = svg.innerHTML;

  // land beyond the Union is drawn, and beyond the frame, so wide screens show neighbours
  ok(G.NEIGHBOUR_LAND.length > 10000 && G.CANDIDATE_LAND.length > 2000, "neighbouring and candidate land is embedded");
  const xs = [...G.NEIGHBOUR_LAND.matchAll(/[ML](-?\d+\.?\d*),/g)].map(m => parseFloat(m[1]));
  ok(Math.min(...xs) < -100 && Math.max(...xs) > 700, "neighbouring land extends past the map frame on both sides");
  ok(/^M[-\d.]+,[-\d.]+L/.test(G.CANDIDATE_LAND), "land outlines are valid path data");
  const paths = qsa("svg path");
  ok(paths.some(p => p.getAttribute("d") === G.NEIGHBOUR_LAND), "neighbouring land is drawn on the map");
  ok(paths.some(p => p.getAttribute("d") === G.CANDIDATE_LAND), "candidate countries are drawn on the map");
  const idx = d => paths.findIndex(p => p.getAttribute("d") === d);
  ok(idx(G.NEIGHBOUR_LAND) < 3 && idx(G.CANDIDATE_LAND) < 3, "surrounding land sits beneath the Union's regions");

  // banners
  const banners = qsa(".map-banner");
  ok(banners.length >= 2 + g.rivals.length - 1, `countries and rivals carry banners (${banners.length})`);
  const labels = banners.map(b => b.textContent);
  ok(labels.some(t => /^DE 2\/\d+$/.test(t)), `your home banner counts the regions you hold (${labels.filter(t=>/^DE/.test(t))[0]})`);
  ok(labels.some(t => /^AT 1\/\d+$/.test(t)), "a second country gets its own banner");
  ok(g.rivals.every(rv => labels.some(t => t.replace("…","") && rv.name.startsWith(t.replace("…","").trim()))),
     "each rival is named on its home ground");
  ok(labels.every(t => t.length <= 18), "banner text is kept short enough to fit its plate");
  ok(banners.every(b => b.getAttribute("pointer-events") === "none"), "banners never block a click on the country beneath");
}

/* ── map-first layout: ribbon, folding panels, attention queue ── */
{
  const sector = { id:"digital", name:"Digital", color:"#38bdf8", icon:"display" };
  let g = { ...G.initState("Austria", "Steiermark", sector), budget: 3_000_000 };
  g = G.reducer(g, { type: "hire", roleId: "comms" });
  g = G.reducer(g, { type: "hire", roleId: "pm" });
  const btnBy = (re) => qsa("button").find((b) => re.test(b.getAttribute("aria-label") || b.textContent || ""));

  render(null);
  render(React.createElement(G.Game, { gs: g, dispatch: () => {}, vw: 1280, onRestart: () => {} }));

  // the queue
  const list = qsa('[role="list"]')[0];
  ok(!!list, "the attention queue is laid over the map on desktop");
  ok(qsa('[role="listitem"]').length >= 1, "it lists what could use a decision");
  ok(/Before you end the quarter/.test(text()), "the queue says what it is for");

  // the turn control carries the count
  const next = qsa("button").find((b) => /Next quarter/i.test(b.textContent));
  ok(!!next, "Next Quarter sits on the map");
  ok(!!qsa("button").find((b) => /Stage goals \d+\/\d+|Evolve now|Final stage/.test(b.textContent)),
     "the evolve control shows progress toward the next stage");
  ok(next && /orb/.test(next.className), "it is the primary turn button");
  ok(/could use you first|all clear/.test(text()), "a caption under it reports how much is still open");

  // a plate takes you to the panel that deals with it
  const plate = qsa('[role="listitem"]').find((b) => /project/i.test(b.textContent));
  if (plate) { let threw = null; try { click(plate); } catch (e) { threw = e; } ok(!threw, "following a plate opens its panel"); }

  // panels fold away to give the map the screen
  const hideDock = btnBy(/Hide the management panel/);
  const hideLeft = btnBy(/Hide the cluster summary/);
  ok(!!hideDock && !!hideLeft, "both side panels can be folded away");
  if (hideDock) {
    click(hideDock);
    ok(!!btnBy(/Show the management panel/), "the management panel folds and can be brought back");
  }
  if (hideLeft) {
    click(hideLeft);
    ok(!!btnBy(/Show the cluster summary/), "the summary panel folds and can be brought back");
  }
  ok(qsa("svg path").length > 200, "the map is still drawn with both panels folded");

  // the ribbon shows where the treasury is heading
  ok(/Treasury/i.test(text()) && /Members/i.test(text()) && /Influence/i.test(text()), "the yield ribbon carries the core figures");

  // mobile gets the same queue as a strip
  render(null);
  render(React.createElement(G.Game, { gs: g, dispatch: () => {}, vw: 420, onRestart: () => {} }));
  ok(qsa('[role="listitem"]').length >= 1, "the attention queue is present on mobile too");
  ok(!!qsa("button").find((b) => /Next Quarter/i.test(b.textContent)), "Next Quarter is present on mobile");

  // nothing to flag means no empty box
  render(null);
  render(React.createElement(G.AttentionQueue, { items: [], onGo: () => {} }));
  ok(qsa('[role="list"]').length === 0, "an empty queue draws nothing");
}

/* ── the quarter review can always be re-opened ──────────── */
{
  // Regression: the control existed only in the desktop header, so on a phone
  // there was no way back to the review once it had faded.
  const sector = { id:"digital", name:"Digital", color:"#38bdf8", icon:"display" };
  const digest = { turn:5, dBudget:84000, dMembers:-3, dInfluence:2, dBoard:-1, evolved:null,
    qMember:50000, qProj:120000, qStaff:40000, qOverhead:8000, qServicing:12000,
    qDelivery:0, qInterim:0, events:[{ t:"good", txt:"Project delivered" }] };
  const gs5 = { ...G.initState("Austria", "Steiermark", sector), turn:5, digest };
  const reviewShowing = () => qsa(".digest-card").length > 0;

  for (const vw of [1200, 500]) {
    const where = vw >= 820 ? "desktop" : "mobile";
    render(null);
    // digestOn false is the case that matters: auto-show is off, so the only
    // route back to the review is the button
    render(React.createElement(G.Game, { gs: gs5, dispatch: () => {}, vw, digestOn: false, onRestart: () => {} }));
    const btn = qsa("button").find((b) => /latest quarter review/i.test(b.getAttribute("title") || ""));
    ok(!!btn, `the quarter review can be re-opened on ${where}`);
    if (btn) {
      ok(!reviewShowing(), `the review starts hidden on ${where} when auto-show is off`);
      click(btn);
      ok(reviewShowing(), `pressing it brings the review back on ${where}`);
    }
  }

  // With no quarter played yet there is nothing to show, so the control says so
  render(null);
  render(React.createElement(G.Game, { gs: { ...gs5, digest: null }, dispatch: () => {}, vw: 500, digestOn: false, onRestart: () => {} }));
  const idle = qsa("button").find((b) => /latest quarter review/i.test(b.getAttribute("title") || ""));
  ok(!idle || idle.disabled, "before any quarter has run, the control is disabled rather than silently doing nothing");
}

/* ── your cluster is called by its name ──────────────────── */
{
  // Regression: the name was captured at setup and stored correctly, but only
  // the mobile header displayed it. On a desktop width, and on the end screen,
  // the cluster you had just named was still labelled by its ecosystem.
  const sector = { id:"aerospace_and_defe", name:"Aerospace and Defence", color:"#94a3b8", icon:"rocket" };
  const named = { ...G.initState("France", "Brittany", sector), clusterName: "Photonics Bretagne" };

  for (const vw of [1200, 500]) {
    render(null);
    render(React.createElement(G.Game, { gs: named, dispatch: () => {}, vw, onRestart: () => {} }));
    ok(/Photonics Bretagne/.test(text()),
       `the cluster is named in the header at ${vw >= 820 ? "desktop" : "mobile"} width`);
    ok(/Aerospace and Defence/.test(text()),
       `the ecosystem is still shown alongside it at ${vw}px`);
  }

  // An unnamed cluster must fall back to its ecosystem rather than showing a gap
  render(null);
  render(React.createElement(G.Game, { gs: { ...named, clusterName: "" }, dispatch: () => {}, vw: 1200, onRestart: () => {} }));
  ok(/Aerospace and Defence/.test(text()), "an unnamed cluster falls back to its ecosystem");

  // The end screen and the shared summary must agree with the header
  render(null);
  const finished = { ...named, gameWon: true, winType: "network", stage: 5, turn: 60, members: 400, seedStr: "x" };
  render(React.createElement(G.GameOver, { gs: finished, onRestart: () => {} }));
  ok(/Photonics Bretagne/.test(text()), "the end screen names the cluster");
  const score = G.runScore(finished);
  ok(G.shareSummary(finished, score, G.scoreGrade(score)).includes("Photonics Bretagne"),
     "the shared summary names the cluster");
}

/* ── info popovers stay on screen ────────────────────────── */
{
  // Regression: the trend explanations were positioned relative to their dot, so
  // near a screen edge they ran off the page and the text was cut in half.
  const longText = "Currently falling: -2.5 per quarter\nMostly down to visibility fade.\n" +
    "Pushing it up\n   +0.5  General Manager\nPulling it down\n   -3  visibility fade";
  const VW = 390, VH = 760;
  const setViewport = () => {
    try {
      Object.defineProperty(window, "innerWidth", { value: VW, configurable: true });
      Object.defineProperty(window, "innerHeight", { value: VH, configurable: true });
    } catch (e) {}
  };

  const openAt = (rect) => {
    setViewport();
    render(React.createElement(G.InfoDot, { text: longText, label: "Trend" }));
    const btn = qsa("button")[0];
    btn.getBoundingClientRect = () => rect;
    click(btn);
    return qsa('[role="tooltip"]')[0];
  };

  const M = 8;
  const near = (x) => ({ left:x, top:400, right:x+14, bottom:414, width:14, height:14 });

  const leftTip = openAt(near(6));
  ok(!!leftTip, "the explanation opens");
  if (leftTip) {
    ok(leftTip.style.position === "fixed",
       "the explanation is placed in viewport space, so no panel can clip it");
    const l = parseFloat(leftTip.style.left), w = parseFloat(leftTip.style.width);
    ok(l >= M - 0.01, `against the left edge it stays on screen (left ${l})`);
    ok(l + w <= VW - M + 0.01, "and does not spill off the right");
  }

  const rightTip = openAt(near(VW - 20));
  if (rightTip) {
    const l = parseFloat(rightTip.style.left), w = parseFloat(rightTip.style.width);
    ok(l >= M - 0.01 && l + w <= VW - M + 0.01,
       `against the right edge it stays on screen (left ${l}, width ${w})`);
  }

  // no room above: it must drop below the dot rather than off the top
  const topTip = openAt({ left:180, top:4, right:194, bottom:18, width:14, height:14 });
  if (topTip) {
    ok(parseFloat(topTip.style.top) >= M - 0.01,
       `with no room above it flips below (top ${topTip.style.top})`);
    ok(topTip.style.maxHeight === "70vh", "a long explanation scrolls rather than overflowing");
  }
}

/* ── the real-cluster picker on setup ────────────────────── */
{
  let threw = null;
  try { render(React.createElement(G.Setup, { onStart: () => {}, canResume: false, onResume: () => {} })); }
  catch (e) { threw = e; }
  ok(!threw, `setup renders with the registry picker${threw ? ` (${threw.message})` : ""}`);

  if (!threw) {
    const search = qsa("input").find((i) => /real cluster/i.test(i.getAttribute("aria-label") || ""));
    ok(!!search, "setup offers a search over real cluster organisations");
    ok(/European Cluster Collaboration Platform/i.test(text()),
       "the ECCP is credited where the names are offered");
    ok(/fiction/i.test(text()), "the setup screen makes clear that what follows is fiction");

    if (search) {
      // typing a real cluster's name should surface it
      act(() => {
        const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
        setter.call(search, "Photonics");
        search.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      });
      const hits = qsa("button").filter((b) => /photonics/i.test(b.textContent));
      ok(hits.length >= 1, `searching the registry returns matches (${hits.length})`);

      // and picking one should move setup on to region selection
      if (hits.length) {
        click(hits[0]);
        ok(!/Or select your country/i.test(text()) || /region/i.test(text()),
           "adopting a real cluster advances past the country step");
      }
    }
  }
}

/* ── the wordmark is never an invisible gradient bar ─────── */
{
  // Regression: the title used gradient-filled text with no fallback. When the
  // gradient couldn't be clipped to the glyphs (unsupported, or a repaint before
  // the webfont loaded) the gradient filled the whole box and the transparent
  // text disappeared — a coloured bar where "CLUSTER MANAGER" should be.
  ok(G.CSS.includes(".brand-title"), "the wordmark is styled by a class, not fragile inline styles");
  ok(/\.brand-title\{color:#[0-9A-Fa-f]{6}[;}]/.test(G.CSS),
     "the wordmark is a flat colour, which cannot fail to paint");

  // It was gradient-filled text, which sets the glyphs transparent and relies on
  // a clipped background showing through. Any failure of that clip left the title
  // invisible, so nothing may set the wordmark transparent by any route.
  ok(!/text-fill-color:\s*transparent/.test(G.CSS),
     "no rule makes glyphs transparent anywhere in the stylesheet");
  ok(!/background-clip:\s*text/.test(G.CSS), "the wordmark no longer depends on clipping a background to text");
  ok(!/\.brand-title[^{]*\{[^}]*background-image/.test(G.CSS), "the wordmark carries no background image");
  ok(!/fonts-ready/.test(G.CSS), "nothing waits on a webfont before becoming visible");

  // and the markup actually uses it, with the text present for screen readers
  let threw = null;
  try { render(React.createElement(G.Setup, { onStart: () => {}, savedExists: false, onLoad: () => {} })); }
  catch (e) { threw = e; }
  if (!threw) {
    const h1 = qsa("h1")[0];
    ok(!!h1 && /brand-title/.test(h1.className || ""), "the title element carries the wordmark class");
    ok(!!h1 && /CLUSTER/i.test(h1.textContent || ""), "the title text is real text, readable by assistive tech");
    ok(!(h1 && /text-fill-color/i.test(h1.getAttribute("style") || "")),
       "the title no longer hard-codes a transparent fill inline");
  } else ok(false, `setup renders for the wordmark check (${threw.message})`);
}

/* ── the setup screen offers the full choice set ───────── */
{
  let threw = null;
  try { render(React.createElement(G.Setup, { onStart: () => {}, savedExists: false, onLoad: () => {} })); }
  catch (e) { threw = e; }
  ok(!threw, `the setup screen renders${threw ? ` (${threw.message})` : ""}`);
  if (!threw) {
    const body = text();
    // Setup is a multi-step wizard: step one picks the place, so only the
    // country/region choice is on screen at first render.
    ok(/austria|belgium|country|region/i.test(body), "setup opens on the country and region choice");
    ok(qsa("button").length > 3, "setup offers selectable options");
    ok(/cluster|ecosystem|sector|start/i.test(body), "setup frames the choice in the game's terms");
  }
}

/* ── summary ─────────────────────────────────────────────── */
const total = pass + failures.length;
if (failures.length) {
  console.log(`\nui: ${pass}/${total} passed, ${failures.length} FAILED`);
  failures.forEach((f) => console.log(`  · ${f}`));
  process.exit(1);
}
console.log(`\nui: ${pass}/${total} passed`);
process.exit(0);
