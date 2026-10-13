# CLAUDE.md

**Many Me**: an isometric diorama where five versions of Justin (BJJ, Gym, Dev, Study, Chill) live on
the user's local clock and keep simulating while the tab is closed. See `README.md` for controls and layout.

## Stack and commands

React 19 + TypeScript + PixiJS v8 + Zustand, bundled with Vite.

- `npm run dev`: dev server (the `many-me` preview config in `.claude/launch.json` uses port 5174)
- `npm run build`: type-check (`tsc -p .`) then production build. Run it to verify changes; there are no tests.

## Code layout

- `src/engine/`: iso math and depth sort, A* pathfinding, fixed-step loop, seeded RNG
- `src/sim/`: clone state machine and needs, activity brain, schedule, offline catch-up
- `src/world/*.config.ts`: all data (zones, props, activities, dialogue, clone roster)
- `src/world/render/`: procedural pixel art and the Pixi `Game` class
- `src/ui/`: React overlay (HUD, clone panel, time controls, hover tag, away card)
- `src/store/`: Zustand UI store and `localStorage` persistence (key `many-me:v1`)

## Conventions

- The sim ticks at 10 Hz independently of rendering and must stay renderable-free, so it can
  fast-forward headlessly (30 s steps, capped at 24 h) on return.
- New clones, activities, props or dialogue are data changes in `src/world/*.config.ts`, not code changes.
- If the save shape changes, bump the `localStorage` key version.

## Commits and pushes to main

Commit and push incrementally: after each self-contained change (a feature, a fix, a refactor step)
that passes `npm run build`, commit it and push to `main` (`origin` is github.com/jjnhwg/many-me).
Don't batch unrelated changes into one commit or leave finished work unpushed.

Every commit message must start with a type and a short, accurate summary:

- `feature: <what the user can now do>`
- `bugfix: <what was broken and what's fixed>`
- `refactor:`, `docs:`, `chore:` for everything else

Then add a blank line and 1–3 lines explaining *why* and anything notable.

Example:

    bugfix: photo upload no longer fails on HEIC images

    Converted HEIC to JPEG before saving. Uploads from iPhones were
    returning 500.

Before pushing to main, run `git log origin/main..HEAD` and check that
every commit being pushed follows this format. If one doesn't, ask me
before rewriting it.
