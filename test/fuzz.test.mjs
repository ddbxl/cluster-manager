/*
 * Fuzz tests — play many games with random decisions and assert that a set of
 * invariants never breaks. This is the suite most likely to catch a subtle
 * regression in the quarter engine, because it explores states no hand-written
 * test would think to construct.
 *
 * Run with:  npm test           (150 games)
 *            GAMES=1000 node test/fuzz.test.mjs   (longer soak)
 */
import * as G from "./.build/engine.mjs";
import { runner } from "./helpers.mjs";

const t = runner("fuzz");
const GAMES = Number(process.env.GAMES || 150);
const MAX_QUARTERS = 60;

// All 14 ecosystems, so ecosystem-targeted events get exercised too.
const SECTORS = [
  { id: "energy_renewables", name: "Energy-Renewables", color: "#34d399", icon: "leaf" },
  { id: "agri_food", name: "Agri-food", color: "#4ade80", icon: "wheat-awn" },
  { id: "mobility_transport", name: "Mobility, Transport, Automotive", color: "#60a5fa", icon: "car" },
  { id: "digital", name: "Digital", color: "#38bdf8", icon: "display" },
  { id: "health", name: "Health", color: "#f87171", icon: "hospital" },
  { id: "energy_intensive_i", name: "Energy Intensive Industries", color: "#fb923c", icon: "industry" },
  { id: "tourism", name: "Tourism", color: "#2dd4bf", icon: "plane" },
  { id: "construction", name: "Construction", color: "#f0a020", icon: "trowel" },
  { id: "creative_and_cultu", name: "Creative and Cultural Industries", color: "#c084fc", icon: "palette" },
  { id: "electronics", name: "Electronics", color: "#facc15", icon: "microchip" },
  { id: "aerospace_and_defe", name: "Aerospace and Defence", color: "#94a3b8", icon: "rocket" },
  { id: "proximity_and_soci", name: "Proximity and Social Economy", color: "#a78bfa", icon: "handshake" },
  { id: "textiles", name: "Textiles", color: "#f472b6", icon: "shirt" },
  { id: "retail", name: "Retail", color: "#fb7185", icon: "bag-shopping" },
];
const DIFFS = ["junior", "officer", "expert"];
const SCENS = G.SCENARIOS.map((s) => s.id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/* Every invariant that must hold after any quarter, in any game. */
function checkInvariants(g, ctx) {
  const problems = [];
  const fin = (v) => typeof v === "number" && Number.isFinite(v);

  if (!fin(g.budget)) problems.push("budget became non-finite");
  if (!fin(g.members) || g.members < 1) problems.push(`members invalid (${g.members})`);
  if (!fin(g.prestige) || g.prestige < 0) problems.push(`influence invalid (${g.prestige})`);
  if (!fin(g.boardConf) || g.boardConf < 0 || g.boardConf > 100) problems.push(`board confidence out of range (${g.boardConf})`);
  if (!fin(g.stage) || g.stage < 0 || g.stage > 5) problems.push(`stage out of range (${g.stage})`);
  if (!fin(g.turn) || g.turn < 0) problems.push(`turn invalid (${g.turn})`);

  const mix = g.mix || {};
  const mixSum = (mix.sme || 0) + (mix.corp || 0) + (mix.res || 0);
  if (mixSum !== g.members) problems.push(`composition ledger ${mixSum} != members ${g.members}`);
  if (mix.sme < 0 || mix.corp < 0 || mix.res < 0) problems.push("negative segment in composition ledger");

  if (!Array.isArray(g.roster)) problems.push("roster is not a list");
  else {
    const gms = G.byRole(g.roster, "manager");
    if (gms > 1) problems.push(`more than one General Manager (${gms})`);
    if (g.roster.some((r) => !r || !r.role)) problems.push("roster contains a malformed entry");
  }

  if (!Array.isArray(g.activeProjects)) problems.push("active projects is not a list");
  else if (g.activeProjects.some((p) => !p || !p.id)) problems.push("an active project is malformed");

  if (!Array.isArray(g.rivals)) problems.push("rivals is not a list");
  else {
    const ids = g.rivals.map((r) => r.id);
    if (new Set(ids).size !== ids.length) problems.push("duplicate rival ids");
    if (g.rivals.some((r) => !fin(r.members) || r.members < 0)) problems.push("a rival has invalid membership");
    if (g.rivals.some((r) => r.stage < 0 || r.stage > 5)) problems.push("a rival is outside the stage range");
  }

  if (!Array.isArray(g.countries) || g.countries.length === 0) problems.push("territory list is empty");
  if (g.countries && new Set(g.countries).size !== g.countries.length) problems.push("duplicate countries in territory");

  if (g.gameWon && g.gameOver) problems.push("game is simultaneously won and lost");

  return problems.map((p) => `${p}  [${ctx}]`);
}

/* Play one game making random-but-plausible decisions. */
function playRandomGame(seedInfo) {
  const sector = pick(SECTORS);
  const difficulty = pick(DIFFS);
  const scenarioId = pick(SCENS);
  const scen = G.SCENARIOS.find((s) => s.id === scenarioId);

  let g = G.initState("Austria", "Steiermark", sector);
  g = { ...g, difficulty, scenario: scenarioId };
  if (scen && scen.apply) g = scen.apply(g);

  const allProblems = [];
  for (let q = 0; q < MAX_QUARTERS; q++) {
    if (g.gameOver || g.gameWon) break;

    // random actions before the quarter turns
    const roll = Math.random();
    if (roll < 0.30) {
      const role = pick(G.STAFF_ROLES).id;
      if (!G.hireBlockReason(g, role)) g = G.reducer(g, { type: "hire", roleId: role });
    } else if (roll < 0.45) {
      const avail = G.availableProjects(g);
      if (avail.length) {
        const p = pick(avail);
        g = G.reducer(g, { type: "startProject", p, n: Math.floor(Math.random() * 4) });
      }
    } else if (roll < 0.52 && G.MIX_FOCUS) {
      const keys = Array.isArray(G.MIX_FOCUS) ? G.MIX_FOCUS.map((m) => m.id) : Object.keys(G.MIX_FOCUS);
      g = G.reducer(g, { type: "setFocus", focus: pick(keys) });
    } else if (roll < 0.56 && G.canEvolve(g)) {
      g = G.reducer(g, { type: "evolve" });
    }

    g = G.advanceTurn(g);
    allProblems.push(...checkInvariants(g, `${difficulty}/${scenarioId} q${q} post-turn`));

    if (g.pendingEvent) {
      const ev = g.pendingEvent;
      const idx = ev.choices ? Math.floor(Math.random() * ev.choices.length) : null;
      g = G.reducer(g, { type: "dismissEvent", choiceIdx: idx });
      allProblems.push(...checkInvariants(g, `${difficulty}/${scenarioId} q${q} post-event(${ev.id})`));
    }

    if (G.byRole(g.roster, "manager") < 1) g = G.reducer(g, { type: "hire", roleId: "manager" });
    if (allProblems.length) break; // stop at first broken game, report it
  }
  return { problems: allProblems, finalTurn: g.turn, won: !!g.gameWon, over: !!g.gameOver };
}

let broken = 0;
let wins = 0;
let losses = 0;
let totalQuarters = 0;
const firstFailures = [];

for (let i = 0; i < GAMES; i++) {
  const r = playRandomGame(i);
  totalQuarters += r.finalTurn;
  if (r.won) wins++;
  if (r.over) losses++;
  if (r.problems.length) {
    broken++;
    if (firstFailures.length < 5) firstFailures.push(r.problems[0]);
  }
}

t.eq(broken, 0, `invariants hold across ${GAMES} chaotic games (${totalQuarters} quarters played)`);
if (firstFailures.length) firstFailures.forEach((f) => console.log(`    ↳ ${f}`));

// Sanity: the fuzz should actually be exercising the game, not bailing immediately.
t.ok(totalQuarters / GAMES > 5, `games run a meaningful length (avg ${(totalQuarters / GAMES).toFixed(1)} quarters)`);
t.ok(wins + losses > 0, `games reach a conclusion (${wins} won, ${losses} lost, rest still running at cap)`);

t.finish();
