# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/taigedi123/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/taigedi123/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Platinum Road — an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: a checklist saved in the browser with export and import, filters by kind and grade, a spoiler setting that hides story trophies until earned, an 8-stage roadmap to the platinum, a missables page, a next-up planner, progress counters for every PSN target, and a guide in our own words — with its sources cited — for every trophy.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. The guide is plain static files under `app/` (no build step, no network at runtime): `app/index.html` opens in desktop Chrome and works with the network off.

## What is inside

- `app/index.html` — the page: progress hero, checklist, roadmap, missables, planner, about.
- `app/css/base.css` — the whole look, one dark "Vice night" theme, system fonts only.
- `app/js/main.js` — boot, wiring, deep links (`?view=`, `?open=`, `?spoiler=`, `?seed=`).
- `app/js/data.js` — loads the trophy and roadmap data.
- `app/js/store.js` — progress, counters, notes and settings in localStorage, plus export/import.
- `app/js/filters.js` — kind, grade, search and spoiler rules.
- `app/js/views.js` — renders the checklist, guide pane, roadmap, missables and planner.
- `app/data/trophies.json` — the official 55 trophies (names, descriptions and grades as PlayStation publishes them, via Exophase and PSNProfiles), each with a guide in our own words, its sources, kind, hidden flag, PSN target and rarity, and roadmap stage.
- `app/data/roadmap.json` — the 8-stage road to the platinum, built from the official descriptions.
- `screenshots/` — four renders of the app in desktop Chrome (see `shots.json` for the views).
- `main.ts` — the hand-in program: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`.

## Honesty note

The game released on 19 November 2026. Trophy names, descriptions, grades, hidden flags and PSN counts are the official list; the guides are written from those descriptions. Where a step is not pinned down yet — a location, a trigger, a count — the guide says so instead of inventing one. Specific facts drawn from other guides are cited beside the trophy they belong to; no guide text is copied from anywhere. There is no Rockstar logo, artwork or game screenshot in this repo.

---

<sub>Entered on [make.fun](https://make.fun/?ref=5xww654b&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
