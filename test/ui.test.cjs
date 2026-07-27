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
