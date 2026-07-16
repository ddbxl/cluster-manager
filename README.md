# Cluster Manager

**An EU industrial strategy simulation in a single HTML file.**

Take a small regional cluster initiative and build it into the **Pan-European Cluster Network** — or outlast your rivals and win by market consolidation. Manage staff, finance publicly funded projects, expand across a real map of Europe, play politics in Brussels, and fight off three rival clusters with personalities of their own.

## Play

**Play now in your browser: [ddbxl.github.io/cluster-manager](https://ddbxl.github.io/cluster-manager/)**

Or run it locally — no install, no server, no dependencies:

1. Download `index.html` (or clone the repository:
   `git clone https://github.com/ddbxl/cluster-manager.git`)
2. Open it in any modern browser (double-click works)

That's it. React, the game engine, the map data and the styling are all bundled inside the one file (~450 KB). Your game saves automatically to your browser's local storage — close the tab and continue later. An internet connection is only used to load fonts; the game itself runs fully offline.

An in-game **How to Play** button (setup screen and header) contains the full manual.

## The game

You run a **cluster organisation** — the body that connects companies, universities and public authorities in one industrial ecosystem. Pick a country, a NUTS-2 home region and one of 16 industrial ecosystems, then grow through six stages:

> Cluster Initiative → Cluster Organisation → National Association → Cross-Border Metacluster → EU Platform → **Pan-European Cluster Network**

**You win** by reaching Stage 5 first, or by eliminating all three rivals (market consolidation).
**You lose** if the board's confidence collapses, the money runs out — or a rival builds the Network before you.

## Core systems

**Projects are investments.** Publicly funded calls don't hand you their volume: you pre-finance delivery in quarterly instalments, interim payments reimburse 70 % as you go, and success pays the balance **plus a margin** (local ~15 % → EU ~32 %). Failure is audited down to 60 % of costs — a real loss. Every call shows its cash-flow deal and enabling conditions before you commit.

**One boss, balanced teams.** Nothing advances without your **General Manager** (exactly one, ever). The GM manages 7 staff; each Executive Director extends the span by 7; no role may exceed a third of the team. Every new office hires mandatory local staff you can't dismiss. Salaries inflate +1 % per quarter.

**Real geography.** 232 NUTS-2 regions with true borders (Eurostat geometry). Country expansion is bordering-only (ferry links count) and capped by maturity — a National Association manages 3 countries, a Metacluster 9, an EU Platform 19. Full national coverage earns a political bonus.

**Influence & political seats.** Influence — your standing with public authorities — fades unless maintained, and converts into three contested chairs: the Regional S3 Committee, the National Cluster Platform and the EU High-Level Group. Each grants better margins, cheaper expansion, poaching protection or slower rivals. One chair each; rivals race you for them, and can be displaced.

**Living rivals.** Three rival clusters, each with a distinct archetype — *Poacher, Brussels Insider, Expansionist, Deliverer, Discounter*. They expand territorially, contest your funding bids, raid your members and draw from the same finite market. Fight back with **talent raids, PR campaigns, consortium pacts and outright acquisitions** of collapsing rivals.

**Three difficulties.** *Junior* to learn the ropes, *Officer* for a fair fight, *Expert* — the unforgiving original calibration.

## Grounded in reality

The game mechanics are based on publicly available European Commission reports and research on clusters, innovation ecosystems and Smart Specialisation (S3).

## Tech notes

- Single self-contained HTML file: React 18 + game engine pre-compiled and minified with esbuild, no CDN calls
- Saves via `localStorage` (with an in-memory fallback for restrictive privacy modes)
- Works on desktop (tabbed side panel) and mobile (bottom navigation)
- The embedded React library carries its standard MIT licence header (© Meta) — that notice covers the framework, not the game

## Licence

This project is free software, released under the **GNU General Public License v3.0** — see [`LICENSE`](LICENSE). You may run, study, share and modify it; derivative works must remain under the GPL v3.

The embedded React library is © Meta Platforms, Inc. and is used under its own MIT licence, which is compatible with distribution inside this GPL-licensed work.
