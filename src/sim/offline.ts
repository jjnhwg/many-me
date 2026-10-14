// "They keep living while you're away": headless fast-forward + a summary of what changed.
import { hashSeed, Rng } from '../engine/rng';
import { activityById } from '../world/activities.config';
import { labelOf, roster } from '../world/clones.config';
import type { World } from './world';

export const MAX_CATCHUP_MS = 24 * 3600_000;
const STEP_S = 30;

export type AwaySummary = {
  elapsedMs: number;
  clones: { id: string; label: string; color: string; items: string[] }[];
};

export function formatDuration(ms: number): string {
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function fastForward(w: World, ms: number): AwaySummary {
  ms = Math.min(ms, MAX_CATCHUP_MS);
  const before = new Map(w.clones.map((c) => [c.id, { totals: { ...c.totalsMs }, counts: { ...c.counts } }]));

  // Deterministic replays: the catch-up RNG is seeded from the save seed + the day it starts on.
  const day = Math.floor(w.simTime / 86_400_000);
  const liveRng = w.rng;
  w.rng = new Rng(hashSeed(w.seed, day, Math.floor(ms / 60_000)));
  w.headless = true;
  for (let left = ms; left > 0; left -= STEP_S * 1000) w.tick(Math.min(STEP_S, left / 1000));
  w.headless = false;
  liveRng.state = hashSeed(liveRng.state, w.rng.state);
  w.rng = liveRng;

  for (const c of w.clones) {
    c.prev = { ...c.pos };
    c.bubble = undefined;
    c.moment = undefined;
  }

  return {
    elapsedMs: ms,
    clones: w.clones.map((c) => {
      const cfg = roster.find((r) => r.id === c.id)!;
      const b = before.get(c.id)!;
      // Lead with the clone's specialty (its highest-affinity category).
      const home = Object.entries(cfg.affinities).sort((x, y) => (y[1] ?? 0) - (x[1] ?? 0))[0][0];
      const weight = (id: string) => (activityById.get(id)!.category === home ? 4 : 1);
      const rows = Object.keys(c.totalsMs)
        .map((id) => ({
          id,
          ms: (c.totalsMs[id] ?? 0) - (b.totals[id] ?? 0),
          n: (c.counts[id] ?? 0) - (b.counts[id] ?? 0),
        }))
        .filter((r) => r.ms > 90_000 && r.id !== 'wander')
        .sort((x, y) => y.ms * weight(y.id) - x.ms * weight(x.id))
        .slice(0, 3);
      const items = rows.map((r) => {
        const a = activityById.get(r.id)!;
        return a.summary.kind === 'time'
          ? a.summary.text.replace('{t}', formatDuration(r.ms))
          : a.summary.text.replace('{n}', String(Math.max(1, r.n))).replace(/\b1x\b/, 'once');
      });
      return { id: c.id, label: labelOf(cfg), color: cfg.color, items };
    }),
  };
}
