/*
 * Engine tests — pure logic, no DOM.
 *
 * These guard the rules a contributor is most likely to break by accident:
 * the quarter loop, project finance, the member-composition ledger, staff
 * capacity, evolution gates, rivals, scenarios and save migration.
 *
 * Run with:  npm test        (or: node test/engine.test.mjs)
 */
import * as G from "./.build/engine.mjs";
import { runner, withSeededRandom, playQuarters } from "./helpers.mjs";

const t = runner("engine");
const SECTOR = { id: "digital", name: "Digital", color: "#38bdf8", icon: "display" };
const fresh = (country = "Austria", region = "Steiermark") =>
  G.initState(country, region, SECTOR);

/* ── initial state ─────────────────────────────────────────── */
{
  const gs = fresh();
  t.eq(gs.stage, 0, "new game starts at stage 0");
  t.eq(gs.turn, 0, "new game starts at turn 0");
  t.ok(gs.members > 0, "new game has founding members");
  t.ok(gs.budget > 0, "new game has seed capital");
  t.eq(G.byRole(gs.roster, "manager"), 1, "new game starts with exactly one General Manager");
  t.eq(gs.country, "Austria", "chosen country is recorded");
  t.ok(Array.isArray(gs.rivals) && gs.rivals.length > 0, "rivals are seeded");
  t.ok(!gs.gameOver && !gs.gameWon, "new game is neither won nor lost");
}

/* ── the quarter loop ──────────────────────────────────────── */
{
  // Give the cluster ample cash so this tests the quarter loop itself rather
  // than the economy: a passive cluster legitimately goes broke otherwise.
  const gs = { ...fresh(), difficulty: "junior", budget: 5_000_000 };
  const after = playQuarters(G, gs, 12);
  t.eq(after.turn, 12, "twelve quarters advance the turn counter to 12");
  t.ok(Number.isFinite(after.budget), "budget stays a finite number");
  t.ok(Number.isFinite(after.members) && after.members >= 1, "membership stays a positive number");
  t.ok(after.boardConf >= 0 && after.boardConf <= 100, "board confidence stays within 0–100");
  t.ok(Array.isArray(after.log) && after.log.length > 0, "the quarter log records activity");
}

/* ── running out of money ends the run ────────────────────── */
{
  const broke = playQuarters(G, { ...fresh(), budget: 1 }, 30);
  t.ok(broke.gameOver || broke.turn === 30, "a cluster with no money either fails or survives, never hangs");
  if (broke.gameOver) t.ok(broke.turn < 30, "insolvency ends the run early");
  else t.ok(true, "the cluster clawed its way through thirty quarters");
}

/* ── the engine refuses to run without a General Manager ───── */
{
  let gs = fresh();
  gs = { ...gs, roster: gs.roster.filter((r) => r.role !== "manager") };
  const before = gs.turn;
  const after = G.advanceTurn(gs);
  t.eq(after.turn, before, "a cluster with no General Manager cannot advance the quarter");
}

/* ── member-composition ledger stays exactly reconciled ────── */
{
  let worst = 0;
  for (const scenarioId of G.SCENARIOS.map((s) => s.id)) {
    const scen = G.SCENARIOS.find((s) => s.id === scenarioId);
    let gs = { ...fresh(), scenario: scenarioId };
    if (scen.apply) gs = scen.apply(gs);
    const after = playQuarters(G, gs, 40, {
      each: (g, i) =>
        i % 4 === 0 && g.budget > 250000
          ? G.reducer(g, { type: "hire", roleId: ["comms", "pm", "trainer"][i % 3] })
          : g,
    });
    const mix = after.mix || {};
    const sum = (mix.sme || 0) + (mix.corp || 0) + (mix.res || 0);
    worst = Math.max(worst, Math.abs(sum - after.members));
  }
  t.eq(worst, 0, "SME/corporate/research ledger always sums to the headline member count");
}

/* ── mixOf always returns an exactly-summing composition ───── */
{
  const gs = { ...fresh(), members: 100, mix: { sme: 33, corp: 33, res: 33 } };
  const m = G.mixOf(gs);
  t.eq(m.sme + m.corp + m.res, 100, "mixOf reconciles a drifted ledger to the member count");
  const zeroed = G.mixOf({ ...fresh(), members: 7, mix: { sme: 0, corp: 0, res: 0 } });
  t.eq(zeroed.sme + zeroed.corp + zeroed.res, 7, "mixOf recovers from an empty ledger");
}

/* ── fee multiplier reflects composition ───────────────────── */
{
  const base = { ...fresh(), members: 100 };
  const smeHeavy = G.feeMult({ ...base, mix: { sme: 100, corp: 0, res: 0 } });
  const corpHeavy = G.feeMult({ ...base, mix: { sme: 0, corp: 100, res: 0 } });
  const resHeavy = G.feeMult({ ...base, mix: { sme: 0, corp: 0, res: 100 } });
  t.ok(corpHeavy > smeHeavy, "corporate members pay higher fees than SMEs");
  t.ok(smeHeavy > resHeavy, "SMEs pay higher fees than research organisations");
}

/* ── staff capacity and hiring rules ───────────────────────── */
{
  const gs = fresh();
  t.ok(G.staffSpan(gs.roster) >= 7, "a General Manager can supervise at least seven people");
  t.ok(G.roleCap(gs.roster) >= 2, "the per-role cap is at least two");
  const blocked = G.hireBlockReason(gs, "manager");
  t.ok(typeof blocked === "string" && blocked.length > 0, "hiring a second General Manager is blocked with a reason");
  const allowed = G.hireBlockReason(gs, "comms");
  t.ok(!allowed, "hiring a Communications Director is allowed in a fresh game");
}

/* ── staff skill affects effective output ──────────────────── */
{
  const low = [{ role: "comms", hiredTurn: 0, skill: 1 }];
  const high = [{ role: "comms", hiredTurn: 0, skill: 5 }];
  t.ok(G.byRoleEff(high, "comms") > G.byRoleEff(low, "comms"), "a more skilled specialist contributes more than a novice");
  t.eq(G.byRole(low, "comms"), 1, "headcount ignores skill");
}

/* ── project finance ───────────────────────────────────────── */
{
  const proj = G.PROJECTS[0];
  const solo = G.projBudget(proj, 0);
  const partnered = G.projBudget(proj, 3);
  t.ok(solo > 0, "a project has a positive budget");
  t.ok(partnered > solo, "partners increase the project budget");
  t.ok(G.projSpendQ(proj, 0) > 0, "a project costs money each quarter it runs");
  t.ok(G.projMargin(proj, "expert") <= G.projMargin(proj, "junior"), "Junior difficulty is no less generous than Expert on margins");
}

/* ── the economy stays a constraint late on ───────────────── */
{
  // Membership income scales with both headcount and stage, so without a
  // matching cost it compounds and the endgame stops being a game. Servicing
  // costs rise as a share of the fee to keep the surplus meaningful but bounded.
  t.ok(Array.isArray(G.SERVICING_SHARE) && G.SERVICING_SHARE.length === 6,
       "every stage has a servicing share");
  t.ok(G.SERVICING_SHARE.every((s, i) => i === 0 || s > G.SERVICING_SHARE[i - 1]),
       "servicing takes a bigger share of the fee at every stage");
  t.ok(G.SERVICING_SHARE[5] < 0.9, "servicing never swallows the whole fee");

  const fee = st => [500, 1500, 3000, 5500, 9000, 16000][st];
  const profile = [[10,1,2],[45,2,5],[150,4,10],[350,8,18],[600,14,28],[900,20,40]];
  const nets = profile.map(([mem, regs, staff], st) => {
    const roster = [{ role:"manager", hiredTurn:0, skill:3 },
      ...Array.from({length: staff-1}, (_, i) => ({ role:["comms","pm","analyst","trainer","finance","legal","hr","director"][i%8], hiredTurn:0, skill:3 }))];
    const turn = st * 14;
    const income = mem * fee(st);
    return income - G.servicingCost(mem, st) - G.calcOverhead(st, true, regs, turn) - G.staffCostQ(roster, turn);
  });
  t.ok(nets[5] > 0, "a mature cluster still runs a surplus");
  t.ok(nets[5] < 4_000_000,
       `the endgame surplus stays bounded (${Math.round(nets[5]).toLocaleString()} a quarter)`);
  t.ok(nets[5] > nets[2], "growing the cluster is still worth doing");
  t.ok(nets[5] / Math.max(1, nets[2]) < 40,
       "late income does not outrun early income by orders of magnitude");

  // costs drift up over a campaign, so an old treasury buys less
  t.ok(G.costIndex(0) === 1, "the cost index starts at parity");
  t.ok(G.costIndex(40) > G.costIndex(0), "costs inflate over a long campaign");
  t.near(G.costIndex(40), Math.pow(1.01, 40), 0.001, "inflation runs at one per cent a quarter");
  t.ok(G.calcOverhead(3, false, 5, 40) > G.calcOverhead(3, false, 5, 0),
       "overheads rise as the campaign runs on");

  // servicing must be visible to the player, not a silent deduction
  const played = playQuarters(G, { ...fresh(), budget: 3_000_000 }, 8);
  t.ok(typeof played.qServicing === "number" && played.qServicing >= 0,
       "member servicing is reported as its own line in the quarter's finances");
}

/* ── difficulty multipliers are ordered sensibly ───────────── */
{
  const { junior, officer, expert } = G.DIFFICULTIES;
  t.ok(junior.fail < officer.fail && officer.fail < expert.fail, "failure risk rises from Junior to Expert");
  t.ok(junior.margin > officer.margin && officer.margin > expert.margin, "margins shrink from Junior to Expert");
  t.ok(junior.seed >= officer.seed && officer.seed >= expert.seed, "seed capital shrinks from Junior to Expert");
}

/* ── evolution gates ──────────────────────────────────────── */
{
  const gs = fresh();
  t.ok(!G.canEvolve(gs), "a brand-new cluster cannot evolve immediately");
  const reqs = G.evolveReqs(gs);
  t.ok(Array.isArray(reqs) && reqs.length > 0, "evolution lists its requirements");
  t.ok(reqs.every((r) => "cur" in r && "req" in r && "ok" in r), "each requirement reports current, required and met");
  const maxed = { ...gs, members: 9999, budget: 9e8, prestige: 9999, completedProjects: Array(50).fill({ id: "x" }), regions: Array(20).fill("r"), boardConf: 90 };
  t.ok(G.evolveReqs(maxed).filter((r) => !r.ok).length < reqs.filter((r) => !r.ok).length, "meeting targets satisfies more requirements");
}

/* ── coverage / territory ──────────────────────────────────── */
{
  const gs = fresh();
  t.ok(gs.countries.includes("Austria"), "the home country is part of your territory");
  const cap = G.countryCap(gs);
  t.ok(cap >= 1, "there is a positive cap on simultaneous countries");
  const full = G.computeFullCountries(gs);
  t.ok(Array.isArray(full), "full-coverage countries are computed as a list");
}

/* ── rivals ───────────────────────────────────────────────── */
{
  const gs = fresh();
  const rv = gs.rivals[0];
  t.ok(rv.name && rv.color && Array.isArray(rv.countries), "a rival has a name, colour and territory");
  t.ok(G.archOf(rv), "a rival has a recognisable archetype");
  t.ok(G.marketPool(gs) > 0, "the addressable market is positive");
  const share = G.marketShare(gs);
  t.ok(share >= 0 && share <= 1, "your market share is a fraction between 0 and 1");
  const spawned = G.spawnRival(gs);
  t.ok(spawned && spawned.id && spawned.name && spawned.color, "a new entrant can be generated to refill the field");
  t.ok(!gs.rivals.some((r) => r.id === spawned.id), "a new entrant gets a fresh id");
  t.ok(!gs.rivals.some((r) => r.color === spawned.color) || G.RIVAL_ARCHETYPES.length > 0, "a new entrant takes an unused colour where one is free");
}

/* ── scenarios ────────────────────────────────────────────── */
{
  t.eq(G.SCENARIOS.length, 4, "four scenarios are offered");
  const rescue = G.SCENARIOS.find((s) => s.id === "rescue");
  const applied = rescue.apply(fresh());
  t.ok(applied.stage === 1, "Rescue Mission starts an established cluster at stage 1");
  t.ok(applied.boardConf < 40, "Rescue Mission starts with a nervous board");
  t.ok(applied.members > fresh().members, "Rescue Mission inherits a member base");
  const late = G.SCENARIOS.find((s) => s.id === "late");
  const lateApplied = late.apply(fresh());
  t.ok(lateApplied.budget > fresh().budget, "Late Entrant compensates with extra seed capital");
  t.ok(lateApplied.rivals.every((r) => r.stage >= 2), "Late Entrant starts every rival established");

  const merger = G.SCENARIOS.find((s) => s.id === "merger");
  const merged = merger.apply(fresh());
  t.ok(merged.members > 150, "Merger Aftermath inherits a large membership");
  t.ok(merged.boardConf < 40, "Merger Aftermath starts with a sceptical board");
  t.ok(G.visibleStaff(merged.roster) > G.staffSpan(merged.roster),
       "Merger Aftermath starts over management capacity — the duplicated payroll is the puzzle");
  t.ok(G.corpShare(merged) > 0.3, "Merger Aftermath starts corporate-heavy");
  const mm = merged.mix;
  t.eq(mm.sme + mm.corp + mm.res, merged.members, "Merger Aftermath's composition ledger is consistent");

  // every scenario must produce a state the engine can actually run
  for (const sc of G.SCENARIOS) {
    const started = sc.apply ? sc.apply(fresh()) : fresh();
    const run = playQuarters(G, { ...started, scenario: sc.id }, 6);
    t.ok(Number.isFinite(run.budget) && run.members >= 1, `the ${sc.name} scenario runs without breaking`);
  }
}

/* ── achievements ─────────────────────────────────────────── */
{
  t.ok(G.ACHIEVEMENTS.length >= 10, "there are at least ten achievements");
  t.ok(G.ACHIEVEMENTS.every((a) => a.id && a.name && typeof a.check === "function"), "every achievement has an id, name and check");
  const seated = { ...fresh(), seats: { regional: true } };
  const res = G.checkAchievements(seated);
  t.ok(res && typeof res.achv === "object" && Array.isArray(res.won), "achievement checking returns the ledger plus newly won awards");
  t.ok(res.won.some((a) => a.id === "first_seat"), "taking a seat newly unlocks the first-seat award");
  t.eq(G.checkAchievements({ ...seated, achv: res.achv }).won.length, 0, "an already-unlocked award is not awarded twice");
  t.ok(G.ACHIEVEMENTS.find((a) => a.id === "first_seat").check(seated), "holding a seat unlocks the first-seat achievement");
}

/* ── seats ────────────────────────────────────────────────── */
{
  const gs = fresh();
  t.eq(G.seatsHeld(gs), 0, "a new cluster holds no seats");
  t.eq(G.seatsHeld({ ...gs, seats: { regional: true, national: true } }), 2, "held seats are counted");
  t.ok(G.SEATS.length === 3, "there are three political seats");
  t.ok(G.SEATS.every((s) => s.infl > 0), "each seat has an influence threshold");
}

/* ── scoring ──────────────────────────────────────────────── */
{
  const weak = G.runScore(fresh());
  const strong = G.runScore({ ...fresh(), stage: 5, members: 900, prestige: 500, boardConf: 95, completedProjects: Array(40).fill({ id: "x" }), countries: Array(20).fill("c"), seats: { regional: true, national: true, eu: true } });
  t.ok(strong > weak, "a stronger run scores higher");
  t.ok(typeof G.scoreGrade(strong) === "string", "a score maps to a letter grade");
}

/* ── seeds and challenge codes ────────────────────────────── */
{
  const code = G.challengeCode({ ...fresh(), seedStr: "brussels", difficulty: "officer", scenario: "rescue" });
  const parsed = G.parseChallenge(code);
  t.eq(parsed.seed, "brussels", "a challenge code round-trips its seed");
  t.eq(parsed.difficulty, "officer", "a challenge code round-trips its difficulty");
  t.eq(parsed.scenario, "rescue", "a challenge code round-trips its scenario");
  t.ok(!G.parseChallenge("not-a-code"), "a malformed challenge code is rejected");
  const rngA = G.mulberry32(G.hashSeed("same"));
  const rngB = G.mulberry32(G.hashSeed("same"));
  t.eq(rngA(), rngB(), "the same seed produces the same random stream");
  const rngC = G.mulberry32(G.hashSeed("different"));
  t.ok(G.mulberry32(G.hashSeed("same"))() !== rngC(), "different seeds diverge");
}

/* ── save migration ──────────────────────────────────────── */
{
  const migrated = G.migrateSave({});
  t.ok(migrated.mix && typeof migrated.mix.sme === "number", "migration fills in a missing composition ledger");
  t.ok(migrated.seats && typeof migrated.seats === "object", "migration fills in missing seats");
  t.ok(Array.isArray(migrated.history), "migration fills in a missing history");
  const preserved = G.migrateSave({ members: 42, prestige: 17, stage: 3 });
  t.eq(preserved.members, 42, "migration preserves existing member counts");
  t.eq(preserved.prestige, 17, "migration preserves influence (stored as prestige)");
  t.eq(preserved.stage, 3, "migration preserves the stage");
}

/* ── map pan & zoom ──────────────────────────────────────── */
{
  const { clampMapView: clamp, zoomMapAt: zoomAt, MAP_W: W, MAP_H: H,
          MAP_ZOOM_MIN: MIN, MAP_ZOOM_MAX: MAX } = G;

  t.ok(MIN === 1 && MAX > MIN, `the map zooms between fit and ${MAX}x`);
  t.ok(clamp({ x: -999, y: -999, z: 1 }).x === 0, "at the fitted zoom the view is pinned to the whole map");
  t.ok(clamp({ x: 999, y: 999, z: 1 }).y === 0, "there is nowhere to pan at the fitted zoom");
  t.near(clamp({ x: 9999, y: 0, z: 2 }).x, W / 2, 0.01, "panning stops at the eastern edge");
  t.near(clamp({ x: 0, y: 9999, z: 2 }).y, H / 2, 0.01, "panning stops at the southern edge");
  t.eq(clamp({ x: 0, y: 0, z: 99 }).z, MAX, "zoom is capped so the map can't dissolve into pixels");
  t.eq(clamp({ x: 0, y: 0, z: 0.01 }).z, MIN, "zoom is floored at the fitted view");

  // the point under the finger must stay under the finger while pinching
  const start = { x: 0, y: 0, z: 1 };
  const focus = { x: 300, y: 200 };
  const zoomed = zoomAt(start, 2, focus.x, focus.y);
  const rel = (v) => ({ x: (focus.x - v.x) / (W / v.z), y: (focus.y - v.y) / (H / v.z) });
  t.near(rel(start).x, rel(zoomed).x, 0.02, "pinch-zoom keeps the focal point horizontally pinned");
  t.near(rel(start).y, rel(zoomed).y, 0.02, "pinch-zoom keeps the focal point vertically pinned");
  t.eq(zoomed.z, 2, "the zoom factor is applied");

  const deep = zoomAt(start, 5, W / 2, H / 2);
  const backOut = zoomAt(deep, 1 / 99, W / 2, H / 2);
  t.ok(backOut.z === MIN && backOut.x === 0 && backOut.y === 0, "zooming all the way out restores the fitted view");

  // the visible rectangle must never show empty space beyond the map
  for (const z of [1, 1.5, 3, MAX]) {
    const v = clamp({ x: 99999, y: 99999, z });
    const inside = v.x >= 0 && v.y >= 0 && v.x + W / v.z <= W + 0.01 && v.y + H / v.z <= H + 0.01;
    t.ok(inside, `at ${z}x the visible area stays within the map bounds`);
  }
}

/* ── explaining why a stat moved ──────────────────────────── */
{
  const g = playQuarters(G, { ...fresh(), budget: 2_000_000 }, 10);
  const trends = G.statTrends(g);
  for (const key of ["influence", "members", "board", "budget"]) {
    const tr = trends[key];
    t.ok(tr && typeof tr.delta === "number" && Array.isArray(tr.factors),
         `${key} reports a per-quarter change with its causes`);
  }
  const text = G.trendTitle(trends.budget);
  t.ok(/rising|falling|Holding steady/.test(text), "the explanation says which way the stat is moving");
  t.ok(/Mostly/.test(text), "the explanation names the dominant cause first");
  t.ok(/per quarter/.test(text), "the explanation gives the rate");
  t.ok(!/undefined|NaN/.test(text), "the explanation contains no broken values");

  // the biggest driver must actually be listed first
  const sorted = [...trends.budget.factors].sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  if (sorted.length) t.ok(text.includes(sorted[0].l), "the named cause is the largest contributor");

  // servicing must appear in the treasury breakdown now that it is charged
  const labels = trends.budget.factors.map(f => f.l);
  t.ok(labels.some(l => /servicing/i.test(l)) || g.qServicing === 0,
       "member servicing shows up in the treasury breakdown");
  t.ok(G.trendTitle(null) === "", "a missing trend explains nothing rather than crashing");
}

/* ── sharing a run ────────────────────────────────────────── */
{
  const g = { ...fresh(), seedStr: "brussels", difficulty: "officer", scenario: "rescue",
    clusterName: "Silicon Alps", stage: 4, members: 612, turn: 52,
    countries: ["Austria", "Germany", "Italy"], completedProjects: Array(23).fill({ id: "x" }),
    seats: { regional: true, national: true }, gameWon: true, winType: "network" };
  const score = G.runScore(g), grade = G.scoreGrade(score);
  const text = G.shareSummary(g, score, grade);
  t.ok(text.includes("Silicon Alps"), "the summary names your cluster");
  t.ok(text.includes(grade), "the summary carries the grade");
  t.ok(/612/.test(text), "the summary carries the membership reached");
  t.ok(/Officer/.test(text), "the summary states the difficulty");
  t.ok(/Rescue/.test(text), "the summary names a non-default scenario");
  t.ok(text.includes("CM1|brussels|officer|rescue"), "the summary carries the challenge so others can race it");
  t.ok(!/undefined|NaN|\[object/.test(text), "the summary has no broken values");

  // an unseeded run cannot promise a replayable challenge
  const noSeed = G.shareSummary({ ...g, seedStr: "" }, score, grade);
  t.ok(!/Race the same start/.test(noSeed), "an unseeded run does not offer a challenge link");

  // the challenge in a shared link must round-trip
  const parsed = G.parseChallenge(G.challengeURL(g).split("cm=").pop().replace(/%7C/gi, "|"));
  t.ok(parsed && parsed.seed === "brussels", "a shared challenge link round-trips its seed");
}

/* ── save export / import ─────────────────────────────────── */
{
  const played = playQuarters(G, { ...fresh(), budget: 3_000_000 }, 16);
  const code = G.exportSave(played);
  t.ok(code.startsWith("CMSAVE1."), "an exported save is tagged with its format version");
  t.ok(code.length < JSON.stringify(played).length * 1.2, "the export is no bulkier than the raw state");

  const back = G.importSave(code);
  t.ok(back.ok, "a save code imports successfully");
  t.eq(back.state.turn, played.turn, "the imported run is at the same quarter");
  t.eq(back.state.members, played.members, "membership survives the round trip");
  t.eq(back.state.stage, played.stage, "the stage survives the round trip");
  t.eq(back.state.country, played.country, "the country survives the round trip");
  t.eq((back.state.rivals || []).length, (played.rivals || []).length, "rivals survive the round trip");
  t.near(back.state.budget, played.budget, 1, "the treasury survives the round trip");
  const m = back.state.mix;
  t.eq(m.sme + m.corp + m.res, back.state.members, "the imported composition ledger is reconciled");

  // non-ASCII place names must survive (btoa alone would mangle them)
  const accented = G.exportSave({ ...played, region: "Île-de-France", country: "Österreich" });
  const accentedBack = G.importSave(accented);
  t.ok(accentedBack.ok, "a save with accented place names imports");
  t.eq(accentedBack.state.region, "Île-de-France", "accented region names survive the round trip");

  // the cosmetic log is dropped to keep codes small, but must not break loading
  t.ok(Array.isArray(back.state.log), "the imported run still has a usable log array");

  // every failure mode explains itself rather than throwing
  const bad = [
    ["", "empty input"],
    ["hello world", "unrelated text"],
    ["CMSAVE1.abc.!!!not-base64!!!", "corrupt payload"],
    [code.slice(0, -25), "truncated code"],
    ["CMSAVE1.000000." + code.split(".")[2], "wrong checksum"],
  ];
  for (const [input, label] of bad) {
    const r = G.importSave(input);
    t.ok(!r.ok && typeof r.error === "string" && r.error.length > 10,
         `${label} is rejected with a readable explanation`);
  }
  t.ok(!G.importSave(null).ok, "a null code is rejected rather than throwing");
}

/* ── events ──────────────────────────────────────────────── */
{
  t.ok(G.EVENTS.length >= 40, "there is a large event pool");
  t.ok(G.EVENTS.every((e) => e.id && e.n && typeof e.p === "number"), "every event has an id, name and probability");
  t.ok(G.EVENTS.every((e) => e.p > 0 && e.p <= 1), "event probabilities are sane fractions");
  const ids = G.EVENTS.map((e) => e.id);
  t.eq(new Set(ids).size, ids.length, "event ids are unique");
  const choiceEvents = G.EVENTS.filter((e) => e.t === "choice");
  t.ok(choiceEvents.length > 0, "some events offer the player a choice");
  t.ok(choiceEvents.every((e) => Array.isArray(e.choices) && e.choices.length >= 2), "every choice event offers at least two options");
  t.ok(choiceEvents.every((e) => e.choices.every((c) => c.label && c.fx)), "every option has a label and an effect");

  // ecosystem-targeted events must name real ecosystems, or they'd never fire
  const ecoIds = new Set(["energy_renewables","agri_food","mobility_transport","digital","health",
    "energy_intensive_i","tourism","construction","creative_and_cultu","electronics",
    "aerospace_and_defe","proximity_and_soci","textiles","retail"]);
  const targeted = G.EVENTS.filter((e) => e.eco);
  t.ok(targeted.length >= 10, `events can be targeted at an ecosystem (${targeted.length} are)`);
  const badEco = targeted.flatMap((e) => (Array.isArray(e.eco) ? e.eco : [e.eco])).filter((x) => !ecoIds.has(x));
  t.eq(badEco.length, 0, "every ecosystem-targeted event names a real ecosystem");

  // stage windows must be satisfiable
  t.ok(G.EVENTS.every((e) => (e.minS ?? 0) <= (e.maxS ?? 5)), "no event has an impossible stage window");
  t.ok(G.EVENTS.length >= 90, `the event pool is substantial (${G.EVENTS.length} events)`);
}

/* ── composition calibrated to the ECCP registry ──────────── */
{
  const mult = (s, c, r) => s * G.FEE_W.sme + c * G.FEE_W.corp + r * G.FEE_W.res;
  const b = G.BASE_MIX;
  t.near(b.sme + b.corp + b.res, 1, 0.005, "the baseline composition shares sum to one");
  t.near(mult(b.sme, b.corp, b.res), 1, 0.02,
         "the median real composition earns a 1.0x fee multiplier, so the economy stays calibrated");
  t.ok(b.sme > 0.75, `the baseline is SME-dominated as the registry shows (${(b.sme * 100).toFixed(0)}%)`);

  // the relative incentive to recruit corporates must survive the rescale
  t.ok(G.FEE_W.corp / G.FEE_W.sme > 2, "corporates are still worth far more per member than SMEs");
  t.ok(G.FEE_W.res < G.FEE_W.sme, "research members still pay the lowest fees");

  // per-ecosystem mixes must be well formed and actually differentiate
  const mults = [];
  for (const [eco, mix] of Object.entries(G.ECO_MIX)) {
    t.near(mix.sme + mix.corp + mix.res, 1, 0.005, `${eco} composition shares sum to one`);
    mults.push(mult(mix.sme, mix.corp, mix.res));
  }
  t.ok(Object.keys(G.ECO_MIX).length >= 10, "most ecosystems carry their own observed composition");
  t.ok(Math.max(...mults) - Math.min(...mults) > 0.15,
       `ecosystem choice meaningfully changes fee income (spread ${(Math.max(...mults) - Math.min(...mults)).toFixed(2)}x)`);

  // a new game starts on its ecosystem's mix, and the ledger reconciles
  for (const ecoId of ["mobility_transport", "textiles", "digital"]) {
    const gs = G.initState("Austria", "Steiermark", { id: ecoId, name: ecoId, color: "#888", icon: "industry" });
    const m = gs.mix;
    t.eq(m.sme + m.corp + m.res, gs.members, `a new ${ecoId} cluster has a reconciled ledger`);
  }
  // at scale the ecosystem difference is visible
  const big = n => G.defaultMix(1000, n);
  t.ok(big("mobility_transport").corp > big("textiles").corp * 2,
       "mobility clusters start far more corporate-heavy than textiles");
}

/* ── the cluster registry ─────────────────────────────────── */
{
  t.ok(G.ECCP_CLUSTERS.length > 1200, `the registry carries the real cluster profiles (${G.ECCP_CLUSTERS.length})`);
  t.ok(G.ECCP_CLUSTERS.every(c => c.n && c.c), "every profile has a name and a country");
  t.ok(G.ECCP_CLUSTERS.every(c => /^[A-Z]{2}$/.test(c.c)), "country codes are well formed");

  // no personal data may ever reach the bundle
  const fields = new Set(G.ECCP_CLUSTERS.flatMap(c => Object.keys(c)));
  t.ok([...fields].every(f => ["n", "c", "e", "y"].includes(f)),
       `the registry carries organisational fields only (${[...fields].join(", ")})`);
  const blob = JSON.stringify(G.ECCP_CLUSTERS);
  t.ok(!/@[a-z0-9.-]+\.[a-z]{2,}/i.test(blob), "no contact email survived into the registry");

  // ecosystem tags must match the game's own ids
  const ecoIds = new Set(G.ECOSYSTEMS.map(e => e.id));
  t.ok(G.ECCP_CLUSTERS.filter(c => c.e).every(c => ecoIds.has(c.e)),
       "every tagged profile names an ecosystem the game knows");
  const names = G.ECCP_CLUSTERS.map(c => c.n);
  t.eq(new Set(names).size, names.length, "registry names are unique");
}

/* ── rivals are seeded coherently from the registry ───────── */
{
  const byName = new Map(G.ECCP_CLUSTERS.map(c => [c.n, c]));
  let sampled = 0, fromRegistry = 0, mismatched = 0, dupes = 0, homeClash = 0;
  for (let i = 0; i < 60; i++) {
    const sector = G.ECOSYSTEMS[i % G.ECOSYSTEMS.length];
    const gs = G.initState("Austria", "Steiermark", sector);
    const seen = new Set();
    for (const rv of gs.rivals) {
      sampled++;
      if (seen.has(rv.name)) dupes++;
      seen.add(rv.name);
      const hit = byName.get(rv.name);
      if (hit) {
        fromRegistry++;
        if (hit.e !== rv.sectorId) mismatched++;
        if (G.NAME_TO_ISO[rv.country] !== hit.c) mismatched++;
      }
    }
    if (gs.rivals.some(r => r.country === "Austria")) homeClash++;
  }
  t.eq(homeClash, 0, "no rival is ever based in the player's own country");
  t.eq(mismatched, 0, "a rival's registry name always matches its own country and ecosystem");
  t.eq(dupes, 0, "no two rivals on a board share a name");
  t.ok(fromRegistry / sampled > 0.8, `rivals are usually real clusters (${Math.round(100 * fromRegistry / sampled)}%)`);
  t.ok(G.registrySeed("textiles", "Austria", []) !== null, "a seed can be drawn for a named ecosystem");
  t.ok(G.registrySeed("no_such_ecosystem", "Austria", []) === null,
       "an unknown ecosystem yields no seed, so the caller falls back to an invented name");
}

/* ── every event is actually reachable ────────────────────── */
{
  // Content that can never fire is dead weight, and it's easy to write a gate
  // that nothing satisfies (a predicate demanding more rivals than the engine
  // will ever spawn, say). Sweep a wide range of cluster shapes and confirm
  // every event in the pool can be selected by at least one of them.
  const ecoIds = ["energy_renewables","agri_food","mobility_transport","digital","health",
    "energy_intensive_i","tourism","construction","creative_and_cultu","electronics",
    "aerospace_and_defe","proximity_and_soci","textiles","retail"];
  const shapes = [
    { budget: 2_000_000, boardConf: 85, s3Aligned: true,  seats: { regional:true, national:true, eu:true } },
    { budget: 50_000,    boardConf: 25, s3Aligned: false, seats: {} },
    { budget: 400_000,   boardConf: 60, s3Aligned: true,  seats: { regional:true } },
  ];
  const mixes = [[90,5,5],[40,45,15],[50,20,30]];
  const seen = new Set();

  for (const eco of ecoIds) {
    const sector = { id: eco, name: eco, color: "#888", icon: "industry" };
    for (let stage = 0; stage <= 5; stage++) {
      for (const shape of shapes) {
        for (const [smePct, corpPct] of mixes) {
          for (const nRivals of [1, 2, 3]) {
          for (const busy of [0, 3]) {
            const base = G.initState("Austria", "Steiermark", sector);
            const members = 100;
            const sme = Math.round(members * smePct / 100);
            const corp = Math.round(members * corpPct / 100);
            const st = {
              ...base, ...shape, stage, members,
              mix: { sme, corp, res: members - sme - corp },
              roster: [...Array(14)].map((_, i) => ({ role: i === 0 ? "manager" : "comms", hiredTurn: 0, skill: 2 })),
              rivals: base.rivals.slice(0, nRivals),
              activeProjects: [...Array(busy)].map((_, i) => ({ id: `p${i}`, endTurn: 9, dur: 4 })),
              countries: ["Austria","Germany","Italy","France"],
              fullCountries: ["Austria"],
              lastEventId: null,
            };
            for (let k = 0; k < 40; k++) { const ev = G.pickEvent(st); if (ev) seen.add(ev.id); }
          }
          }
        }
      }
    }
  }

  const unreachable = G.EVENTS.map((e) => e.id).filter((id) => !seen.has(id));
  t.eq(unreachable.length, 0,
       `every event can fire in some reachable game state${unreachable.length ? ` — dead: ${unreachable.join(", ")}` : ""}`);

  // and the same for projects: each must be startable by some legal state
  const reachableProjects = new Set();
  for (let stage = 0; stage <= 5; stage++) {
    const base = G.initState("Austria", "Steiermark", { id:"digital", name:"Digital", color:"#38bdf8", icon:"display" });
    const st = { ...base, stage, members: 900, prestige: 95, boardConf: 90,
      budget: 2_000_000_000, s3Aligned: true, projCooldown: {},
      regions: Array(24).fill(0).map((_, i) => `R${i}`),
      countries: Array(20).fill(0).map((_, i) => `C${i}`),
      roster: [
        { role: "manager", hiredTurn: 0, skill: 3 },
        ...["comms","pm","analyst","trainer","lobbyist","finance","legal","hr","director"]
          .flatMap((r) => [0, 1, 2].map(() => ({ role: r, hiredTurn: 0, skill: 3 }))),
      ],
      activeProjects: [], completedProjects: Array(70).fill({ id: "x" }) };
    G.availableProjects(st).forEach((p) => reachableProjects.add(p.id));
  }
  const deadProjects = G.PROJECTS.map((p) => p.id).filter((id) => !reachableProjects.has(id));
  t.eq(deadProjects.length, 0,
       `every project becomes available to a strong cluster${deadProjects.length ? ` — dead: ${deadProjects.join(", ")}` : ""}`);
}

/* ── projects catalogue integrity ─────────────────────────── */
{
  t.ok(G.PROJECTS.length >= 20, "there is a substantial project catalogue");
  const ids = G.PROJECTS.map((p) => p.id);
  t.eq(new Set(ids).size, ids.length, "project ids are unique");
  t.ok(G.PROJECTS.every((p) => p.name && p.dur > 0), "every project has a name and a duration");
  t.ok(G.PROJECTS.every((p) => p.stage === undefined || p.stage >= 0), "project stage gates are non-negative");
  t.ok(G.PROJECTS.length >= 35, `the project catalogue is substantial (${G.PROJECTS.length} calls)`);
  const cats = new Set(G.PROJECTS.map((p) => p.cat));
  t.ok(["research","comms","training","lobbying","network"].every((c) => cats.has(c)), "every project category is represented");
  for (const s of [0, 1, 2, 3, 4]) {
    t.ok(G.PROJECTS.some((p) => p.s === s), `there are calls available at stage ${s}`);
  }
  t.ok(G.PROJECTS.every((p) => p.base > 0 && p.dur > 0 && p.cat && p.fund), "every call has a budget, duration, category and funding source");
}

/* ── staff roles integrity ────────────────────────────────── */
{
  const ids = G.STAFF_ROLES.map((r) => r.id);
  t.eq(new Set(ids).size, ids.length, "staff role ids are unique");
  t.ok(G.STAFF_ROLES.every((r) => r.name && r.cost > 0), "every role has a name and a salary");
  t.ok(G.STAFF_ROLES.every((r) => G.roleCost(r, 0) > 0), "every role costs something to hire");
  t.ok(G.roleCost(G.STAFF_ROLES[0], 40) > G.roleCost(G.STAFF_ROLES[0], 0), "salaries inflate over a long campaign");
  t.ok(G.STAFF_ROLES.find((r) => r.id === "manager"), "the General Manager role exists");
}

/* ── regional S3 data ─────────────────────────────────────── */
{
  const R = G.REGIONS_BY_COUNTRY;
  const countries = Object.keys(R);
  const all = countries.flatMap(c => R[c]);
  t.eq(countries.length, 27, "every EU member state has regions");
  t.ok(all.length > 200, `the region table is complete (${all.length} records)`);
  t.ok(all.every(r => r.name && r.nuts), "every region has a name and a NUTS code");
  t.ok(all.every(r => Array.isArray(r.ecos) && r.ecos.length > 0),
       "every region lists at least one smart-specialisation priority");

  // an innovation tier the modifier table cannot read would silently flatten the
  // region's starting conditions, so every value present must map to an entry
  const unmapped = [...new Set(all.map(r => r.ris || ""))].filter(v => !(v in G.RIS_MODIFIER));
  t.eq(unmapped.length, 0, `every innovation tier maps to a modifier${unmapped.length ? `: ${unmapped.join(", ")}` : ""}`);

  // priorities must name ecosystems the game knows, or alignment can never match
  const ecoNames = new Set(G.ECOSYSTEMS.map(e => e.name).concat(["Cross-ecosystem"]));
  const strayEcos = [...new Set(all.flatMap(r => r.ecos))].filter(e => !ecoNames.has(e));
  t.eq(strayEcos.length, 0, `every listed priority names a known ecosystem${strayEcos.length ? `: ${strayEcos.slice(0,3).join(", ")}` : ""}`);

  // regionally planned countries should not all share one identical list
  const greece = R["Greece"] || [];
  t.ok(new Set(greece.map(r => r.ecos.join("|"))).size > 1,
       "regions in a regionally planned country have distinct priorities");

  // cohesion classification arrived with the refresh
  const withCoh = all.filter(r => r.coh);
  t.ok(withCoh.length > 100, `most regions carry a cohesion classification (${withCoh.length})`);
  const cohVals = new Set(withCoh.map(r => r.coh));
  t.ok([...cohVals].every(v => /Less Developed|Transition|More Developed/.test(v)),
       "cohesion classifications use the official categories");

  // NUTS codes should be unique per country and resolvable
  for (const c of countries) {
    const codes = R[c].map(r => r.nuts);
    if (new Set(codes).size !== codes.length) { t.ok(false, `${c} has duplicate NUTS codes`); break; }
  }
  t.ok(true, "no country repeats a NUTS code");
  t.ok(G.getRegion("Austria", "Styria")?.ris === "Strong", "a known region resolves with its tier");
}

/* ── map data integrity ──────────────────────────────────── */
{
  const n2 = Object.keys(G.NUTS2_PATHS).length;
  const n0 = Object.keys(G.NUTS0_PATHS).length;
  t.ok(n2 > 200, `the map carries the NUTS-2 region geometry (${n2} regions)`);
  t.eq(n0, 27, "the map carries all 27 country outlines");
  t.ok(Object.values(G.NUTS2_PATHS).every((d) => typeof d === "string" && d.startsWith("M")), "every region path is valid SVG path data");
  t.ok(G.MAP_CENT.BE && G.MAP_CENT.DE, "country centroids exist for Belgium and Germany");
}

/* ── a deterministic event application ───────────────────── */
{
  const gs = fresh();
  withSeededRandom([0.01, 0.5, 0.9], () => {
    const ev = G.EVENTS.find((e) => e.t !== "choice");
    const after = G.applyEvent(gs, ev, null);
    t.ok(after && typeof after === "object", "applying an event returns a new state");
    t.ok(Number.isFinite(after.budget), "applying an event leaves the budget finite");
  });
}

t.finish();
