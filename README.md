# Cluster Manager

An EU industrial strategy simulation in a single HTML file.

You start with a small regional cluster initiative and build it into the Pan-European Cluster Network. Or you outlast your rivals and win by consolidating the market. On the way you hire a named team, finance projects that run on public funding, expand across a real map of Europe, play politics in Brussels, and fend off rival clusters that each have a personality.

## Play

Play in your browser: **[ddbxl.github.io/cluster-manager](https://ddbxl.github.io/cluster-manager)**

Or run it on your own machine, with no install, no server and no dependencies:

1. Download `index.html`, or clone the repository: `git clone https://github.com/ddbxl/cluster-manager.git`
2. Open the file in any modern browser. Double-clicking works.

React, the game engine, the map data and the styling all sit inside that one file (about 560 KB). The game saves to your browser storage as you play, and you get three manual save slots as well, so you can close the tab and pick the run up later. Your browser fetches fonts from the web; everything else runs offline, and you can install the game to a phone home screen as a Progressive Web App.

The in-game **How to Play** button, on the setup screen and in the header, holds the full manual.

## The game

You run a cluster organisation, the body that connects companies, universities and public authorities in one industrial ecosystem. Pick a country, a NUTS-2 home region and one of 14 industrial ecosystems, then grow through six stages:

**Cluster Initiative → Cluster Organisation → National Association → Cross-Border Metacluster → EU Platform → Pan-European Cluster Network**

You win by reaching Stage 5 before your rivals, or by clearing the field of them and consolidating the market. You lose if your board loses confidence, if the money runs out, or if a rival builds the Network first.

## Core systems

**Projects are investments.** Winning a call commits you to spending before you earn. You pre-finance delivery in instalments each quarter, interim payments reimburse 70 per cent as you go, and success pays the balance plus a margin (about 15 per cent on local calls, rising to 32 per cent on EU ones). Fail, and an audit cuts the reimbursement to 60 per cent of your costs. Each call shows you its cash-flow terms and its enabling conditions before you commit.

**Named team, one boss.** Your cluster cannot advance a quarter without a General Manager, and you can hold only one. The GM supervises seven people, and each Executive Director you hire widens that span by seven more. No single role may exceed a third of the team. Each hire is a named person with a skill level from 1 to 5 that rises with tenure and lifts their output, and about one in eight arrives as a star. Strong performers ask for raises, rivals try to headhunt them, and each new office brings mandatory local staff you cannot dismiss. Salaries rise one per cent a quarter.

**Member composition.** Your membership mixes SMEs (low fees, volatile), corporates (high fees, and an anchor share that steadies your board) and research institutes (low fees, but a strong share lifts margins on research projects). A recruitment-focus control steers who joins next. Regions on the *Emerging* tier of the innovation scoreboard carry cohesion-fund intensity, which pays richer regional and national margins at a little more delivery risk.

**Real geography.** You expand across 232 NUTS-2 regions drawn with true Eurostat borders. Countries have to border the ones you hold, ferry links count, and your maturity caps how many you run at once: three as a National Association, nine as a Metacluster, nineteen as an EU Platform. Covering a whole country earns you a political bonus. From National Association onward your cluster works across ecosystems.

**Influence and political seats.** Influence measures your standing with public authorities, and it fades unless you keep spending effort on it. You trade it for three contested chairs: the Regional S3 Committee, the National Cluster Platform and the EU High-Level Group. Each chair buys something concrete, such as better margins, cheaper expansion, protection from poaching or slower rivals. You hold one of each, rivals race you for them, and either side can displace the other.

**Living rivals.** Each rival cluster plays an archetype: Poacher, Brussels Insider, Expansionist, Deliverer or Discounter. They take territory, bid against you for the same calls, raid your members and draw on the same finite market. A new entrant replaces any rival that collapses or that you buy out, so a fresh name arrives to keep the pressure on you; only the last rival's exit ends the race. Build too big a lead and the survivors form a temporary coalition against you. You can hit back with talent raids, PR campaigns, consortium pacts, scouting missions and buyouts of failing rivals.

**Four scenarios, achievements and shareable runs.** Start a Classic Campaign, a Rescue Mission where you take over a collapsing cluster, a Late Entrant race where the rivals begin established, or a Merger Aftermath. The merger hands you a large corporate-heavy membership, a sceptical board and a duplicated payroll that exceeds your management capacity on day one. Ten achievements reward specific feats. A seed makes a start reproducible: copy the challenge code from your end-of-run report card, send it to someone, and they race the identical opening. Then compare scores and grades.

**A living policy cycle.** You meet the instruments your members would face in real life across ninety-nine events: CBAM reporting, the Net-Zero Industry Act, AI Act conformity, Just Transition allocations, Interreg partner searches, EIT communities, state-aid scrutiny, the cohesion mid-term review. Many belong to a single ecosystem, so a textiles cluster and an aerospace cluster read different news. Others answer the shape of your cluster: whether you hold a seat, how corporate-heavy your membership has become, how thin the treasury is, how crowded the field looks. Thirty-nine funding calls span the ladder from an Open Doors Week to a Pan-European Flagship Alliance.

**Three difficulties.** Junior teaches you the ropes, Officer gives you a fair fight, Expert removes the safety net.

## Quality of life and accessibility

- Trend indicators on each stat, with tap or hover breakdowns that name each contributing factor
- A compact quarter-review card covering headline deltas, cash flow and events, which stays out of your way instead of blocking the screen
- Dark mode, a larger-text toggle, colour-blind-friendly rival patterns on the map, and full `prefers-reduced-motion` support
- Keyboard shortcuts: Space advances the quarter, 1 to 4 open the panels, U undoes, Esc closes
- One-step undo on Junior and Officer, sound you can mute, and a CSV export of your run history
- Drag, pinch, scroll or tap the buttons to pan and zoom the map, so the Baltics and Benelux stay legible on a phone
- Move a run between devices: export it as a save code or a small file and restore it anywhere, which matters because browser storage disappears when you clear site data
- A tabbed side panel on desktop, bottom navigation on mobile, and a screen-reader label on the map

## Grounded in reality

The rules come from public European Commission reports and research on clusters, innovation ecosystems and Smart Specialisation (S3).

Cluster names and membership calibration come from the [European Cluster Collaboration Platform](https://reports.clustercollaboration.eu/) registry. You can take the helm of any of 1,445 real cluster organisations across the EU and candidate countries, and your rivals are drawn from the same list, matched to their real country and industrial ecosystem. Membership composition follows the registry too: across 1,300 profiles reporting a usable split, the median cluster is 81.5 per cent SME, 9.3 per cent corporate and 9.2 per cent research, and each ecosystem starts from its own observed mix. That is why a mobility cluster earns more in membership fees than a textiles one.

Only organisational fields are used: names, countries, cities and ecosystems. No contact details or named individuals appear anywhere in the game. What the rivals then do is invented, and describes no real organisation.

## Tech notes

- One self-contained HTML file: React 18 and the game engine, compiled and minified with esbuild, with no CDN calls
- Saves to `localStorage`, with an in-memory fallback for strict privacy modes, plus three manual slots and portable export to a code or a `.cmsave` file
- One command builds it (`npm run build`), and a suite of about 250 checks covers it: engine rules, a fuzz harness that plays hundreds of games checking invariants, a bot that plays well enough to reach the late game, and jsdom component tests. See [CONTRIBUTING.md](CONTRIBUTING.md)
- Installs as a Progressive Web App through the bundled `manifest.json`
- The embedded React library keeps its standard MIT licence header (© Meta), which covers the framework rather than the game

## Licence

Free software under the **GNU General Public License v3.0**. See [LICENSE](LICENSE). You may run, study, share and modify it, and derivative works must stay under the GPL v3.

React is © Meta Platforms, Inc. and ships under its own MIT licence, which is compatible with distribution inside this GPL-licensed work.
