# Contributing to Cluster Manager

Thanks for your interest. This is a single-file browser game, deliberately kept
simple to build and hack on: no framework, no bundler config, one build script.

## How the project is laid out

```
cluster-manager/
├── src/
│   └── ClusterManagerSimulator.jsx   ← THE SOURCE. Everything lives here:
│                                        game engine, React UI, map data, styles.
├── build/
│   └── build.mjs                     ← Compiles the source into index.html.
├── test/                             ← The test suite (see below).
│   ├── build-bundle.mjs              ← Makes the source importable by tests.
│   ├── helpers.mjs                   ← Tiny assertion helper, no framework.
│   ├── engine.test.mjs               ← Rules, finance, evolution, saves, content.
│   ├── fuzz.test.mjs                 ← Random play; invariants must never break.
│   ├── bot.test.mjs                  ← Competent play; exercises the late game.
│   └── ui.test.cjs                   ← Components render and respond (jsdom).
├── index.html                        ← BUILD OUTPUT, committed so GitHub Pages
│                                        can serve it. Do not edit by hand.
├── manifest.json                     ← PWA manifest (home-screen install).
├── preview.png                       ← Image used for link previews (og:image).
├── package.json                      ← Build/test dependencies and scripts.
├── README.md
└── LICENSE                           ← GNU GPL v3.
```

The entire game — the reducer, the quarter engine, the map geometry, every React
component, and the CSS — is one `.jsx` file. That is intentional: it keeps the
mental model small and the build trivial. Search within the file; the sections
are separated by banner comments (e.g. `function advanceTurn`, `function EUMap`,
`const EVENTS`, `const PROJECTS`).

## Building it yourself

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install            # one time: installs esbuild, react and jsdom
npm run build          # → writes index.html
```

Then just open `index.html` in any browser — double-clicking works. The build
bundles the source with React, minifies it, and wraps it in the HTML shell
(meta tags, favicon, manifest link). The result is a ~540 KB self-contained
page that makes no network calls except to load web fonts.

For a readable (unminified) build to debug in browser dev-tools:

```bash
npm run build:readable   # → also writes index_readable.html
```

`index_readable.html` is git-ignored — it's a throwaway debugging artifact.

## Running the tests

```bash
npm test              # everything: engine, fuzz, bot and UI
npm run test:engine   # just the rules and content checks
npm run test:fuzz     # random play, invariant checking
npm run test:bot      # competent play; also a rough balance report
npm run test:ui       # component rendering in jsdom
npm run test:soak     # a long run: 2000 fuzz games + 40 bot runs per difficulty
```

`npm test` takes well under a minute. Please run it before opening a pull
request, and add a test alongside any behaviour change.

What each suite is for:

- **engine** — the rules a change is most likely to break by accident: the
  quarter loop, project finance, staff capacity, evolution gates, territory,
  rivals, scenarios, scoring, save export/import, and the map pan/zoom maths.
  It also checks content integrity — unique ids, sane probabilities,
  satisfiable stage windows, and that **every event and project is reachable**
  in some legal game state. That last one matters: it is easy to write a gate
  nothing can satisfy, and dead content is invisible in play.
- **fuzz** — plays hundreds of games making random decisions across all 14
  industrial ecosystems and all 4 scenarios, asserting a dozen invariants after
  every quarter: finite money, membership of at least one, board confidence in
  range, exactly one General Manager, no duplicate rivals, and the
  SME/corporate/research ledger always summing to the headline member count.
- **bot** — a deliberately *competent* player that expands territory and hires
  against the next stage gate. Random play rarely survives a dozen quarters, so
  without this the late game (stage 3 and up, political seats, victory) would
  never be exercised. It doubles as a balance guard.
- **ui** — mounts every component in jsdom and checks the things that rot
  silently: the map drawing its geography, seat pins, the legend, rival threat
  cues, the save panel, and the accessibility affordances.

## Making a change

1. Edit **`src/ClusterManagerSimulator.jsx`** — never `index.html` directly.
2. Run `npm run build`.
3. Run `npm test`.
4. Open `index.html` and check it in the browser. Try both light and dark mode,
   and resize down to a phone width — the layout switches from a tabbed side
   panel (desktop) to bottom navigation (mobile) around 820 px. If you touched
   `EUMap`, check drag-to-pan and pinch-to-zoom still behave.
5. Commit **both** `src/ClusterManagerSimulator.jsx` **and** the regenerated
   `index.html`. The committed `index.html` is what the live site serves, so it
   must stay in step with the source.

### Conventions worth knowing

- **Displayed vs internal names.** Some fields differ from their labels for
  save compatibility — the stat shown as "Influence" is stored as `prestige`.
  Don't rename stored fields casually; it breaks existing saves. `migrateSave()`
  upgrades old save shapes — extend it rather than breaking the format.
- **Money is in whole euros** internally, formatted by `fmt()`, which follows
  the browser's locale for separators.
- **Difficulty is a set of multipliers** (`DIFFICULTIES`), not magic numbers
  scattered through the engine. Balance tweaks belong there.
- **The member composition ledger must always reconcile.** `gs.mix` (SME /
  corporate / research) must sum exactly to `gs.members`. Anything that changes
  membership — growth, churn, events, coverage rewards — has to keep it in
  step; call `mixOf()` on the way out. The fuzz suite enforces this.
- **Adding content.** Events live in `EVENTS`, projects in `PROJECTS`,
  scenarios in `SCENARIOS`. An event's effects follow fixed conventions: `bfx`
  below 1 is a *share* of the treasury while 1 or more is a euro amount; `mfx`
  is a member delta; `pfx` is influence (clamped 0–100); `brd` is board
  confidence; `sfx: -1` costs you a staff member. Gate an event with
  `minS`/`maxS` for stages, `req` for a named predicate in `EVENT_REQ`, and
  `eco` to restrict it to one or more industrial ecosystems. The reachability
  test will tell you if nothing can ever trigger what you added.
- **Accessibility:** honour `prefers-reduced-motion` (the CSS already gates
  animations behind it), keep colour-carried information also encoded another
  way (the rival map patterns do this), and keep tap targets reachable on
  mobile.

## Reporting bugs and requesting features

Open an [issue](https://github.com/ddbxl/cluster-manager/issues). For a bug,
include your browser, whether you were on desktop or mobile, and the steps to
reproduce. A screenshot helps a lot for anything visual. If you can, paste a
save code (Save Slots → "Create save code") so the exact run can be reproduced.

## Licence of contributions

By contributing you agree that your contribution is licensed under the
**GNU General Public License v3.0**, the same licence as the project.
Derivative works must remain under the GPL v3.
