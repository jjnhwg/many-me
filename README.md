# Many Me

A cozy isometric diorama where five versions of Justin (BJJ, Gym, Dev, Golf, Chill) live their own lives,
follow a daily rhythm tied to your local clock, and keep living while the tab is closed.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Controls

- Drag to pan, scroll (or `+` / `-`) to zoom in whole-pixel steps
- Hover a Justin for a name tag + need bars; click for the side panel (today's log, lifetime totals, Follow)
- Click a room to zoom into it; `Esc` or ⌂ returns to the whole world
- Pause / 1× / 4× / 16× at the bottom (`space`, `1`, `2`, `3`)

## How it's built

React + TypeScript + PixiJS v8 + Zustand, bundled with Vite.

```
src/
  engine/   iso math + depth sort, A* pathfinding, fixed-step loop, seeded RNG
  sim/      clone state machine + needs, activity brain, time-of-day schedule, offline catch-up
  world/    zones/props/points, activities + dialogue, clone roster (all data)
  world/render/  procedural pixel art (props, characters, rooms, lighting) + the Pixi Game class
  ui/       React overlay: HUD, clone panel, time controls, hover tag, "While you were away"
  store/    Zustand UI store + localStorage persistence
```

- The sim ticks at 10 Hz independently of rendering, so the same code fast-forwards headlessly
  (30 s steps, capped at 24 h) when you come back.
- 1× is real time: the HUD clock is your local clock, so mornings are gym time, afternoons are for coding,
  evenings are for BJJ, and everyone sleeps from about 1 to 7 am.
- Adding a clone, activity, prop or line of dialogue is a data change in `src/world/*.config.ts`.
- All art is placeholder pixel art drawn in code, so swapping in real sprites is the remaining milestone.
- Saves live in `localStorage` under `many-me:v1`. Delete that key to start a fresh world.
