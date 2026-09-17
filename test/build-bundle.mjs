/*
 * Builds importable bundles from the game source so tests can reach inside it.
 *
 * The game ships as one big .jsx with no exports (it's an app, not a library),
 * so we make a temp copy, append an export list, and bundle it twice:
 *   - engine.mjs  (ESM)  → for fast headless engine tests
 *   - ui.cjs      (CJS)  → for jsdom/React component tests
 *
 * Run automatically by `npm test`; you rarely call this directly.
 */
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src", "ClusterManagerSimulator.jsx");
const TMP = join(__dirname, ".tmp");
const OUT = join(__dirname, ".build");

// Engine surface: pure logic, no React needed.
const ENGINE_EXPORTS = [
  "initState", "advanceTurn", "reducer", "migrateSave",
  "availableProjects", "lockedProjects", "projectConditions", "projBudget",
  "projSpendQ", "projNeed", "projMargin", "calcFailRate", "calcOverhead",
  "staffCostQ", "roleCost", "byRole", "byRoleEff", "skillOf", "staffName",
  "visibleStaff", "staffSpan", "roleCap", "hireBlockReason",
  "canEvolve", "evolveReqs", "computeFullCountries", "applyCoverage",
  "countryCap", "COUNTRY_CAP", "getRegion",
  "mixOf", "feeMult", "resShare", "corpShare", "cohesionShare", "MIX_FOCUS",
  "makeRivals", "spawnRival", "archOf", "pickRivalEvent", "marketPool",
  "marketShare", "projContest", "RIVAL_ARCHETYPES", "RIVAL_OPS",
  "seatStatus", "seatsHeld", "SEATS",
  "applyEvent", "EVENTS", "PROJECTS", "STAFF_ROLES", "EU_COUNTRIES",
  "DIFFICULTIES", "SCENARIOS", "ACHIEVEMENTS", "checkAchievements",
  "runScore", "scoreGrade", "statTrends",
  "hashSeed", "mulberry32", "challengeCode", "parseChallenge",
  "NUTS2_PATHS", "NUTS0_PATHS", "MAP_CENT", "NAME_TO_ISO", "ISO_TO_NAME",
  "exportSave", "importSave", "downloadSave", "slimSave", "saveChecksum",
  "clampMapView", "zoomMapAt", "MAP_ZOOM_MIN", "MAP_ZOOM_MAX", "MAP_W", "MAP_H",
  "pickEvent", "EVENT_REQ", "ECOSYSTEMS", "ECCP_CLUSTERS", "clusterPicks", "registrySeed",
  "REGIONS_BY_COUNTRY", "RIS_MODIFIER",
  "memberFee", "evolveCost", "trendTitle", "shareSummary", "challengeURL", "SERVICING_SHARE", "servicingCost", "costIndex",
  "ECO_MIX", "BASE_MIX", "FEE_W", "mixFor", "defaultMix",
];

// Components + styling, for render tests.
const UI_EXPORTS = [
  ...ENGINE_EXPORTS,
  "EUMap", "LeftPanel", "RightPanel", "Setup", "Game", "GameOver", "Modal",
  "ProjectsModal", "StaffModal", "NetworkModal", "RivalsModal", "RulesModal",
  "EvolveModal", "LogModal", "EventModal", "StatsModal", "ProjCard",
  "DigestCard", "SaveSlots", "Tutorial", "MapLegend", "StageBanner",
  "ProgressRing", "EmptyState", "FloatingDeltas", "InfoDot",
  "CSS", "P", "applyTheme", "applyTextScale", "fmt",
];

function makeSource(exports) {
  const src = readFileSync(SRC, "utf8");
  // Only export names that actually exist, so a renamed internal doesn't
  // break the whole suite with an opaque bundler error.
  // Matches `const X =`, `function X(`, `class X`, and comma-separated
  // declarators like `const MAP_W = 609, MAP_H = 600;`
  // the lists are hand-maintained, so drop any name added twice
  const unique = [...new Set(exports)];
  const present = unique.filter((n) =>
    new RegExp(`(^|\\n)\\s*(const|let|var|function|class)\\s+${n}\\b`).test(src) ||
    new RegExp(`[,(]\\s*${n}\\s*=`).test(src)
  );
  const missing = unique.filter((n) => !present.includes(n));
  if (missing.length) {
    console.log(`  note: not in source (skipped): ${missing.join(", ")}`);
  }
  return `${src}\n\nexport { ${present.join(", ")} };\n`;
}

async function main() {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  mkdirSync(OUT, { recursive: true });

  writeFileSync(join(TMP, "engine.jsx"), makeSource(ENGINE_EXPORTS));
  writeFileSync(join(TMP, "ui.jsx"), makeSource(UI_EXPORTS));

  await build({
    entryPoints: [join(TMP, "engine.jsx")],
    outfile: join(OUT, "engine.mjs"),
    bundle: true, format: "esm",
    loader: { ".jsx": "jsx" }, jsx: "automatic",
    nodePaths: [join(ROOT, "node_modules")],
    logLevel: "error",
  });

  await build({
    entryPoints: [join(TMP, "ui.jsx")],
    outfile: join(OUT, "ui.cjs"),
    bundle: true, format: "cjs",
    loader: { ".jsx": "jsx" }, jsx: "automatic",
    external: ["react", "react-dom"],
    nodePaths: [join(ROOT, "node_modules")],
    logLevel: "error",
  });

  rmSync(TMP, { recursive: true, force: true });
  console.log("  test bundles ready");
}

main().catch((e) => { console.error(e); process.exit(1); });
