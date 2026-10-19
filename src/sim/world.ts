import { Grid } from '../engine/pathfinding';
import { Rng } from '../engine/rng';
import { roster } from '../world/clones.config';
import { activityById, GREETINGS, type Activity } from '../world/activities.config';
import { points, pointById, props, walls, WORLD_H, WORLD_W } from '../world/zones.config';
import { createClone, updateClone } from './clone';
import type { Clone } from './types';

export type SaveData = {
  v: 1;
  simTime: number;
  lastSeen: number;
  seed: number;
  rngState: number;
  bornAt: number;
  clones: Clone[];
};

export const SIM_STEP_S = 0.1; // 10 Hz

const POKEMON = new Set(roster.filter((r) => r.species).map((r) => r.id));

// Reverse lookup: which points also block this one (couch1 blocks couch2 => couch2 blocked by couch1).
const blockedBy = new Map<string, string[]>();
for (const p of points) for (const b of p.blocks ?? []) blockedBy.set(b, [...(blockedBy.get(b) ?? []), p.id]);

export class World {
  simTime: number;
  seed: number;
  rng: Rng;
  bornAt: number;
  clones: Clone[];
  grid = buildGrid();
  headless = false;
  /** performance.now() of the current frame; used for bubble lifetimes. */
  realNow = 0;
  private reservations = new Map<string, string>();

  constructor(data: Omit<SaveData, 'v' | 'lastSeen'>) {
    this.simTime = data.simTime;
    this.seed = data.seed;
    this.rng = new Rng(data.seed);
    this.rng.state = data.rngState;
    this.bornAt = data.bornAt;
    this.clones = data.clones;
    for (const c of this.clones) {
      const pid = c.current?.pointId ?? c.target?.pointId;
      if (pid) this.reserve(pid, c.id);
    }
  }

  static fresh(now = Date.now()): World {
    const seed = (Math.random() * 2 ** 32) >>> 0;
    const rng = new Rng(seed);
    const clones = roster.map((cfg) => createClone(cfg, () => rng.next()));
    return new World({ simTime: now, seed, rngState: rng.state, bornAt: now, clones });
  }

  static load(data: SaveData): World {
    // Older saves may be missing fields added later; fill them defensively.
    const known = new Set(roster.map((r) => r.id));
    const clones = data.clones.filter((c) => known.has(c.id));
    for (const cfg of roster) {
      if (!clones.some((c) => c.id === cfg.id)) clones.push(createClone(cfg, Math.random));
    }
    // Rooms and activities can be removed between versions; drop anything that no longer exists.
    const grid = buildGrid();
    const stale = (s?: { activityId: string; pointId: string }) => !!s && (!activityById.has(s.activityId) || !pointById.has(s.pointId));
    const realActivity = (id: string) => activityById.has(id);
    for (const c of clones) {
      // A saved walk may route through furniture that has since moved, so walkers re-plan too.
      if (stale(c.current) || stale(c.target) || c.state === 'walking') {
        c.current = undefined;
        c.target = undefined;
        c.path = [];
        c.state = 'idle';
        c.idleFor = 0;
      }
      if (c.lastActivity && !realActivity(c.lastActivity)) c.lastActivity = undefined;
      c.log = c.log.filter((l) => realActivity(l.activityId));
      c.totalsMs = Object.fromEntries(Object.entries(c.totalsMs).filter(([id]) => realActivity(id)));
      c.counts = Object.fromEntries(Object.entries(c.counts).filter(([id]) => realActivity(id)));
      if (!c.current && !grid.isWalkable(Math.round(c.pos.x), Math.round(c.pos.y))) {
        const start = pointById.get(roster.find((r) => r.id === c.id)!.startPoint)!;
        c.pos = { x: start.tile[0], y: start.tile[1] };
      }
      c.prev = { ...c.pos };
      c.bubble = undefined;
      c.moment = undefined;
    }
    return new World({ ...data, clones });
  }

  serialize(): SaveData {
    return {
      v: 1, simTime: this.simTime, lastSeen: Date.now(), seed: this.seed,
      rngState: this.rng.state, bornAt: this.bornAt, clones: this.clones,
    };
  }

  tick(dt: number): void {
    this.simTime += dt * 1000;
    for (const c of this.clones) updateClone(this, c, dt);
    if (!this.headless) this.greetings();
  }

  // ---- Reservations ----------------------------------------------------------

  isFree(pointId: string, cloneId: string): boolean {
    const ok = (id: string) => {
      const who = this.reservations.get(id);
      return who === undefined || who === cloneId;
    };
    const p = pointById.get(pointId)!;
    return ok(pointId) && (p.blocks ?? []).every(ok) && (blockedBy.get(pointId) ?? []).every(ok);
  }

  freePoint(a: Activity, cloneId: string): string | undefined {
    const free = a.points.filter((id) => this.isFree(id, cloneId));
    return free.length ? this.rng.pick(free) : undefined;
  }

  reserve(pointId: string, cloneId: string): void {
    this.reservations.set(pointId, cloneId);
    for (const b of pointById.get(pointId)?.blocks ?? []) this.reservations.set(b, cloneId);
  }

  release(cloneId: string): void {
    for (const [k, v] of this.reservations) if (v === cloneId) this.reservations.delete(k);
  }

  occupant(pointId: string): Clone | undefined {
    return this.clones.find((c) => c.current?.pointId === pointId);
  }

  // ---- Two clones passing in the hall: stop, high-five, carry on ----------------

  private greetings(): void {
    // Only Justins high-five; Pokémon keep to themselves.
    const walking = this.clones.filter((c) => c.state === 'walking' && !c.moment && !POKEMON.has(c.id));
    for (let i = 0; i < walking.length; i++) {
      for (let j = i + 1; j < walking.length; j++) {
        const a = walking[i];
        const b = walking[j];
        if (Math.hypot(a.pos.x - b.pos.x, a.pos.y - b.pos.y) > 1.1) continue;
        if (this.simTime - Math.max(a.lastGreet ?? -1e12, b.lastGreet ?? -1e12) < 90_000) continue;
        for (const [me, other] of [[a, b], [b, a]] as const) {
          me.moment = { kind: 'wave', start: this.simTime, dur: 1400 };
          me.lastGreet = this.simTime;
          const dx = other.pos.x - me.pos.x;
          const dy = other.pos.y - me.pos.y;
          me.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'SE' : 'NW') : dy > 0 ? 'SW' : 'NE';
        }
        a.bubble = { text: GREETINGS[Math.floor(Math.random() * GREETINGS.length)], until: this.realNow + 1800 };
      }
    }
  }
}

function buildGrid(): Grid {
  const g = new Grid(WORLD_W, WORLD_H);
  for (const p of props) {
    if (!p.solid || !p.tile) continue;
    const [w, d] = p.size ?? [1, 1];
    for (let dx = 0; dx < w; dx++) for (let dy = 0; dy < d; dy++) g.setBlocked(p.tile[0] + dx, p.tile[1] + dy);
  }
  for (const run of walls) {
    if (run.at <= 0) continue;
    for (let i = run.from; i < run.to; i++) {
      if (run.doors?.includes(i)) continue;
      if (run.axis === 'x') g.blockEdge([run.at - 1, i], [run.at, i]);
      else g.blockEdge([i, run.at - 1], [i, run.at]);
    }
  }
  return g;
}
