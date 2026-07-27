/*
 * Bot tests — a deliberately competent player.
 *
 * Random fuzzing rarely survives past a dozen quarters, which leaves the
 * late game (evolution to stage 3+, political seats, victory) untested. This
 * bot plays a sensible strategy so those paths actually get exercised, and it
 * doubles as a balance check: the game must be winnable on Junior and hard on
 * Expert. If a change makes every difficulty trivially winnable — or makes the
 * game unwinnable — this suite notices.
 *
 * Run with:  npm test
 *            RUNS=50 node test/bot.test.mjs   (tighter balance estimate)
 */
import * as G from "./.build/engine.mjs";
import { runner } from "./helpers.mjs";

const t = runner("bot");
const RUNS = Number(process.env.RUNS || 12);
const MAX_QUARTERS = 120;
const SECTOR = { id: "digital", name: "Digital", color: "#38bdf8", icon: "display" };

/* Roles the next stage gate will demand, so the bot hires with purpose
   rather than alphabetically. Mirrors evolveReqs() in the engine. */
const STAGE_ROLES = {
  0: ["comms", "pm"],
  1: ["comms", "pm", "analyst", "trainer"],
  2: ["analyst", "legal", "finance", "trainer", "hr"],
  3: ["lobbyist", "lobbyist", "legal", "legal", "finance", "eu"],
  4: ["director", "director", "legal", "eu", "hr"],
  5: [],
};
const FALLBACK_HIRES = ["comms", "pm", "analyst", "trainer", "finance", "hr", "legal", "lobbyist"];

/* Maps an unmet evolveReqs() label back to the role that satisfies it, so the
   bot can hire exactly what's blocking its next stage. */
const GATE_ROLE = {
  "Managers": "manager",
  "Analysts": "analyst",
  "Legal Counsel": "legal",
  "Lobbyists": "lobbyist",
  "Finance Director": "finance",
  "Executive Director": "director",
  "Staff": "comms",
};

/* Expansion costs, mirroring the formulas the Network panel uses. */
const regionCost = (g) => Math.round((g.prestige || 0) * 1400 + 30000);
const countryCost = (g) => Math.round((g.prestige || 0) * 7000 + 150000);

/* Regions inside countries we already hold that we haven't opened yet. */
function openRegions(g) {
  const held = new Set(g.regions || []);
  return (g.countries || [])
    .flatMap((c) => (G.EU_COUNTRIES[c] || []).map((n) => ({ country: c, name: n })))
    .filter((r) => !held.has(r.name));
}

/* Countries we could move into, cheapest-first by simply taking any we lack. */
function openCountries(g) {
  const held = new Set(g.countries || []);
  return Object.keys(G.EU_COUNTRIES).filter((c) => !held.has(c));
}

function playSmart(difficulty) {
  let g = { ...G.initState("Austria", "Steiermark", SECTOR), difficulty };
  let maxStage = 0, seatsSeen = 0, evolutions = 0;

  for (let q = 0; q < MAX_QUARTERS; q++) {
    if (g.gameOver || g.gameWon) break;

    // 1. Evolve as soon as the gate opens — it unlocks everything downstream.
    if (G.canEvolve(g)) {
      const before = g.stage;
      g = G.reducer(g, { type: "evolve" });
      if (g.stage > before) evolutions++;
    }

    // 2. Never operate without a General Manager.
    if (G.byRole(g.roster, "manager") < 1) g = G.reducer(g, { type: "hire", roleId: "manager" });

    // 3. Management capacity is the real constraint: the GM supervises seven and
    //    each Executive Director adds seven. Directors are exempt from the cap,
    //    so hire one whenever we're close to full or a role gate is blocked.
    const affordable = (roleId) => {
      const def = G.STAFF_ROLES.find((r) => r.id === roleId);
      if (!def) return false;
      const reserve = G.staffCostQ(g.roster, g.turn) * 2 + 40000;
      return g.budget - G.roleCost(def, g.turn) >= reserve;
    };
    if (G.visibleStaff(g.roster) + 1 > G.staffSpan(g.roster) && affordable("director")) {
      g = G.reducer(g, { type: "hire", roleId: "director" });
    }

    // 4. Hire what the next evolution gate actually demands, then fill out depth.
    const unmetRoles = G.evolveReqs(g)
      .filter((r) => !r.ok)
      .map((r) => GATE_ROLE[r.l])
      .filter(Boolean);
    for (const role of [...unmetRoles, ...(STAGE_ROLES[g.stage] || []), ...FALLBACK_HIRES]) {
      if (G.hireBlockReason(g, role)) continue;
      if (!affordable(role)) continue;
      g = G.reducer(g, { type: "hire", roleId: role });
    }

    // 5. Keep the project pipeline full — projects are the income engine.
    const avail = G.availableProjects(g);
    if (avail.length && (g.activeProjects || []).length < 4) {
      const best = [...avail].sort((a, b) => G.projBudget(b, 2) - G.projBudget(a, 2))[0];
      if (best) g = G.reducer(g, { type: "startProject", p: best, n: 2 });
    }

    // 6. Expand territory — regions and countries are hard evolution gates.
    const rc = regionCost(g);
    const reserveForOps = G.staffCostQ(g.roster, g.turn) * 3 + 60000;
    if (g.budget - rc > reserveForOps) {
      const region = openRegions(g)[0];
      if (region) g = G.reducer(g, { type: "expandRegion", region: region.name, cost: rc });
    }
    const cc = countryCost(g);
    if (g.stage >= 2 && g.budget - cc > reserveForOps && (g.countries || []).length < G.countryCap(g)) {
      const country = openCountries(g)[0];
      if (country) g = G.reducer(g, { type: "expandCountry", country, cost: cc });
    }

    g = G.advanceTurn(g);
    if (g.pendingEvent) {
      g = G.reducer(g, { type: "dismissEvent", choiceIdx: g.pendingEvent.choices ? 0 : null });
    }

    maxStage = Math.max(maxStage, g.stage || 0);
    seatsSeen = Math.max(seatsSeen, G.seatsHeld(g));
  }

  return {
    won: !!g.gameWon, lost: !!g.gameOver, turn: g.turn,
    maxStage, seatsSeen, evolutions,
    score: G.runScore(g), grade: G.scoreGrade(G.runScore(g)),
    finalMembers: g.members, finalMix: g.mix,
  };
}

const results = {};
for (const diff of ["junior", "officer", "expert"]) {
  results[diff] = Array.from({ length: RUNS }, () => playSmart(diff));
}

const rate = (d) => results[d].filter((r) => r.won).length / RUNS;
const best = (d, key) => Math.max(...results[d].map((r) => r[key]));

/* ── the bot must actually make progress ─────────────────────── */
{
  const jr = results.junior;
  t.ok(best("junior", "maxStage") >= 2, `competent play reaches at least stage 2 on Junior (best: ${best("junior", "maxStage")})`);
  t.ok(jr.some((r) => r.evolutions > 0), "competent play triggers cluster evolution");
  t.ok(jr.some((r) => r.turn > 20), "competent play survives well beyond the early game");
}

/* ── late-game systems get exercised ────────────────────────── */
{
  const anySeat = Object.values(results).flat().some((r) => r.seatsSeen > 0);
  t.ok(anySeat, "competent play wins at least one political seat somewhere");
  const deepStage = Math.max(...Object.values(results).flat().map((r) => r.maxStage));
  t.ok(deepStage >= 3, `late-game stages are reached and exercised (deepest: stage ${deepStage})`);
}

/* ── the composition ledger survives a full-length game ────── */
{
  const bad = Object.values(results).flat().filter((r) => {
    const m = r.finalMix || {};
    return (m.sme || 0) + (m.corp || 0) + (m.res || 0) !== r.finalMembers;
  });
  t.eq(bad.length, 0, "the composition ledger stays reconciled through long games");
}

/* ── difficulty ordering (balance guard) ────────────────────── */
{
  const j = rate("junior"), o = rate("officer"), e = rate("expert");
  const avgScore = (d) => results[d].reduce((s, r) => s + r.score, 0) / RUNS;
  console.log(`    win rates — junior ${(j * 100).toFixed(0)}%  officer ${(o * 100).toFixed(0)}%  expert ${(e * 100).toFixed(0)}%`);
  console.log(`    avg score — junior ${avgScore("junior").toFixed(0)}  officer ${avgScore("officer").toFixed(0)}  expert ${avgScore("expert").toFixed(0)}`);

  // Adjacent difficulties are deliberately close, so comparing their win rates
  // at this sample size measures noise, not balance. Compare the extremes,
  // where the designed gap is large enough to be meaningful.
  t.ok(avgScore("junior") >= avgScore("expert"),
       `Junior yields better outcomes than Expert (${avgScore("junior").toFixed(0)} vs ${avgScore("expert").toFixed(0)})`);
  t.ok(e < 1, "Expert is never a guaranteed win");
  t.ok(j > 0, "Junior is winnable by competent play");
  t.ok(G.DIFFICULTIES.junior.fail < G.DIFFICULTIES.expert.fail,
       "the difficulty multipliers themselves stay correctly ordered");
}

/* ── scoring behaves ───────────────────────────────────────── */
{
  const all = Object.values(results).flat();
  t.ok(all.every((r) => Number.isFinite(r.score) && r.score >= 0), "every run produces a finite, non-negative score");
  t.ok(all.every((r) => typeof r.grade === "string" && r.grade.length > 0), "every run produces a letter grade");
  const winners = all.filter((r) => r.won);
  const losers = all.filter((r) => r.lost);
  if (winners.length && losers.length) {
    const avg = (xs) => xs.reduce((s, r) => s + r.score, 0) / xs.length;
    t.ok(avg(winners) > avg(losers), "winning runs score better than failed ones");
  } else {
    t.ok(true, "not enough mixed outcomes this run to compare winner and loser scores");
  }
}

t.finish();
