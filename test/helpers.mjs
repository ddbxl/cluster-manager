/*
 * A deliberately tiny test helper — no framework, no dependencies.
 * Each suite creates a runner, calls ok()/eq() as it goes, and ends
 * with runner.finish() which prints a summary and sets the exit code.
 */
export function runner(name) {
  let pass = 0;
  const failures = [];
  const quiet = process.env.QUIET === "1";

  const ok = (cond, msg) => {
    if (cond) {
      pass++;
      if (!quiet) console.log(`  ok   ${msg}`);
    } else {
      failures.push(msg);
      console.log(`  FAIL ${msg}`);
    }
  };

  const eq = (actual, expected, msg) =>
    ok(
      actual === expected,
      `${msg}${actual === expected ? "" : `  (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`}`
    );

  const near = (actual, expected, tol, msg) =>
    ok(
      Math.abs(actual - expected) <= tol,
      `${msg}${Math.abs(actual - expected) <= tol ? "" : `  (got ${actual}, want ${expected}±${tol})`}`
    );

  const throws = (fn, msg) => {
    let threw = false;
    try { fn(); } catch { threw = true; }
    ok(threw, msg);
  };

  const finish = () => {
    const total = pass + failures.length;
    if (failures.length) {
      console.log(`\n${name}: ${pass}/${total} passed, ${failures.length} FAILED`);
      failures.forEach((f) => console.log(`  · ${f}`));
      process.exitCode = 1;
      return false;
    }
    console.log(`\n${name}: ${pass}/${total} passed`);
    return true;
  };

  return { ok, eq, near, throws, finish };
}

/* Deterministic RNG so probabilistic code paths can be tested reproducibly.
   Always restore the original in a finally block. */
export function withSeededRandom(values, fn) {
  const real = Math.random;
  let i = 0;
  Math.random = () => values[i++ % values.length];
  try { return fn(); } finally { Math.random = real; }
}

/* Advance a game a number of quarters, behaving like a competent player:
   dismiss events, and keep a General Manager (the engine correctly refuses
   to advance without one, which would otherwise stall a test loop). */
export function playQuarters(G, gs, n, opts = {}) {
  let g = gs;
  for (let i = 0; i < n; i++) {
    if (g.gameOver || g.gameWon) break;
    g = G.advanceTurn(g);
    if (g.pendingEvent) {
      g = G.reducer(g, { type: "dismissEvent", choiceIdx: g.pendingEvent.choices ? 0 : null });
    }
    if (G.byRole(g.roster, "manager") < 1) {
      g = G.reducer(g, { type: "hire", roleId: "manager" });
    }
    if (opts.each) g = opts.each(g, i) || g;
  }
  return g;
}
