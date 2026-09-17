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
  ok(G.CSS.includes(".map-sea::before"), "the dot texture is a separate fixed-size layer");
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
  ok(/Quarter \d/.test(text()), "the watermark is still shown");
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
  ok(qsa(".threat-pulse").length >= 1, "a rival ahead of you is visually flagged as a threat");
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

  // Colour: the European flag, and true neutral greys. Blue-tinted greys are a
  // large part of what made this read as generic software.
  ok(G.P.accent.toLowerCase() === "#003399" || G.P.accent.toLowerCase() === "#6d9bff",
     `actions carry Reflex Blue (${G.P.accent})`);
  ok(G.P.gold.toLowerCase() === "#ffcc00", `emphasis carries flag yellow (${G.P.gold})`);
  const neutral = hex => {
    const n = hex.replace("#", "");
    const r = parseInt(n.slice(0,2),16), g = parseInt(n.slice(2,4),16), b = parseInt(n.slice(4,6),16);
    return Math.max(r,g,b) - Math.min(r,g,b) <= 6;
  };
  for (const key of ["bg", "card", "border", "bright", "text", "muted"]) {
    ok(neutral(G.P[key]), `${key} is a true grey, not a tinted one (${G.P[key]})`);
  }

  // No pastel fills and no gloss: the two habits that make buttons read as SaaS.
  ok(!/sheen/.test(G.CSS), "the gloss sweep across the primary button is gone");
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
  ok(/\.brand-title\{color:#[0-9A-Fa-f]{6}/.test(G.CSS),
     "the wordmark has a solid colour by default, so it is legible even if the gradient never paints");
  ok(G.CSS.includes("@supports"), "the transparent-glyph trick is behind a feature query");

  // the transparent fill must only ever apply inside the @supports block AND
  // once fonts are ready — never unconditionally
  const transparentRules = G.CSS.split("\n").filter((l) => /text-fill-color:transparent/.test(l));
  ok(transparentRules.length > 0, "the gradient fill is defined");
  const supportsBlock = G.CSS.slice(G.CSS.indexOf("@supports ((-webkit-background-clip"));
  ok(transparentRules.every((l) => supportsBlock.includes(l.trim())),
     "every transparent-text rule sits inside the feature query");
  ok(/html\.fonts-ready \.brand-title/.test(G.CSS),
     "the gradient only switches on once the webfonts have loaded");

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
