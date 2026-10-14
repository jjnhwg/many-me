// Per-clone state machine:
//   IDLE -> CHOOSE_ACTIVITY -> WALK_TO(point) -> DO(activity, duration) -> IDLE
//                                    \-> interrupted by a need (hunger/energy) -> IDLE (needs win the next choice)
import { activityById, lines, type Activity } from '../world/activities.config';
import { roster, type CloneConfig } from '../world/clones.config';
import { pointById } from '../world/zones.config';
import { findPath } from '../engine/pathfinding';
import { chooseActivity } from './brain';
import { hourOf, nextWake } from './schedule';
import type { Clone } from './types';
import type { World } from './world';

const MIN = 60_000;
const clamp = (v: number) => Math.max(0, Math.min(100, v));

export function createClone(cfg: CloneConfig, rngNext: () => number): Clone {
  const p = pointById.get(cfg.startPoint)!;
  return {
    id: cfg.id, name: cfg.name, role: cfg.role ?? cfg.name, outfit: cfg.outfit,
    pos: { x: p.tile[0], y: p.tile[1] }, prev: { x: p.tile[0], y: p.tile[1] },
    dir: p.dir, state: 'idle', path: [], idleFor: rngNext() * 2,
    needs: { energy: 70 + rngNext() * 25, focus: 60 + rngNext() * 30, hunger: 20 + rngNext() * 30, mood: 60 + rngNext() * 20 },
    totalsMs: {}, counts: {}, log: [],
  };
}

export function moodEmoji(mood: number): string {
  return mood > 78 ? '😄' : mood > 55 ? '🙂' : mood > 32 ? '😐' : '😩';
}

const cfgOf = (c: Clone) => roster.find((r) => r.id === c.id)!;

export function updateClone(w: World, c: Clone, dt: number): void {
  c.prev.x = c.pos.x;
  c.prev.y = c.pos.y;
  updateNeeds(c, dt);
  if (c.moment && w.simTime > c.moment.start + c.moment.dur) c.moment = undefined;

  switch (c.state) {
    case 'idle':
      c.idleFor -= dt;
      if (c.idleFor <= 0) decide(w, c);
      else if (!w.headless && Math.random() < dt / 90) say(w, c, lines.idle);
      break;
    case 'walking':
      if (c.moment?.kind !== 'wave') walk(w, c, dt);
      break;
    case 'doing':
    case 'sleeping': {
      const a = activityById.get(c.current!.activityId)!;
      c.totalsMs[a.id] = (c.totalsMs[a.id] ?? 0) + dt * 1000;
      if (w.simTime >= c.current!.endsAt || shouldInterrupt(c, a)) finish(w, c, a);
      else if (!w.headless) maybeMoment(w, c, a, dt);
      break;
    }
  }
}

function updateNeeds(c: Clone, dt: number): void {
  const h = dt / 3600;
  const n = c.needs;
  const a = c.current && (c.state === 'doing' || c.state === 'sleeping') ? activityById.get(c.current.activityId) : undefined;
  const sleeping = c.state === 'sleeping';
  let e = a?.effects.energy ?? (c.state === 'walking' ? -6 : -3);
  if (e < 0) e *= cfgOf(c).energyMul ?? 1;
  n.energy = clamp(n.energy + e * h);
  n.hunger = clamp(n.hunger + ((sleeping ? 5 : 16) + (a?.effects.hunger ?? 0)) * h);
  n.focus = clamp(n.focus + (a?.effects.focus ?? 4) * h);
  let m = (55 - n.mood) * 0.6 + (a?.effects.mood ?? 0);
  if (n.hunger > 80) m -= 8;
  if (n.energy < 20) m -= 8;
  n.mood = clamp(n.mood + m * h);
}

function shouldInterrupt(c: Clone, a: Activity): boolean {
  const { hunger, energy } = c.needs;
  if (a.category !== 'eat' && a.category !== 'sleep' && hunger > 90) return true;
  if (!['rest', 'sleep', 'eat', 'coffee'].includes(a.category) && energy < 6) return true;
  return false;
}

function decide(w: World, c: Clone): void {
  const choice = chooseActivity(w, c);
  if (!choice) { c.idleFor = 2; return; }
  const p = pointById.get(choice.pointId)!;
  const from: [number, number] = [Math.round(c.pos.x), Math.round(c.pos.y)];
  const path = findPath(w.grid, from, p.tile);
  if (!path) { c.idleFor = 1; return; }
  w.reserve(p.id, c.id);
  c.target = { activityId: choice.activity.id, pointId: p.id };
  if (path.length === 0) {
    start(w, c);
  } else {
    c.path = path;
    c.state = 'walking';
    if (!w.headless && Math.random() < 0.12) say(w, c, lines.walk);
  }
}

function walk(w: World, c: Clone, dt: number): void {
  let budget = cfgOf(c).speed * dt;
  while (budget > 0 && c.path.length) {
    const [tx, ty] = c.path[0];
    const dx = tx - c.pos.x;
    const dy = ty - c.pos.y;
    const d = Math.hypot(dx, dy);
    if (d > 0) c.dir = dx > 0 ? 'SE' : dx < 0 ? 'NW' : dy > 0 ? 'SW' : 'NE';
    if (d <= budget) {
      c.pos.x = tx;
      c.pos.y = ty;
      c.path.shift();
      budget -= d;
    } else {
      c.pos.x += (dx / d) * budget;
      c.pos.y += (dy / d) * budget;
      budget = 0;
    }
  }
  if (!c.path.length) start(w, c);
}

function start(w: World, c: Clone): void {
  const a = activityById.get(c.target!.activityId)!;
  const p = pointById.get(c.target!.pointId)!;
  const cfg = cfgOf(c);
  let ms: number;
  if (a.category === 'sleep') {
    // Night sleep runs until ~7am; if they only got into bed after waking hours began, it's a short lie-in.
    const h = hourOf(w.simTime);
    const night = h >= 20 || h < 7;
    const wake = nextWake(w.simTime) + w.rng.range(-30, 45) * MIN;
    ms = night ? Math.max(wake - w.simTime, 20 * MIN) : w.rng.range(10, 30) * MIN;
  } else {
    let mins = w.rng.range(a.duration[0], a.duration[1]) * (cfg.durationMul?.[a.category] ?? 1);
    if (a.focusTask) mins *= 0.7 + (0.6 * c.needs.focus) / 100;
    ms = mins * MIN;
  }
  c.pos.x = p.tile[0];
  c.pos.y = p.tile[1];
  c.dir = p.dir;
  c.current = { activityId: a.id, pointId: p.id, startedAt: w.simTime, endsAt: w.simTime + ms };
  c.state = a.anim === 'sleep' ? 'sleeping' : 'doing';
  c.log.push({ activityId: a.id, start: w.simTime });
  if (c.log.length > 150) c.log.splice(0, c.log.length - 150);
}

function finish(w: World, c: Clone, a: Activity): void {
  c.counts[a.id] = (c.counts[a.id] ?? 0) + 1;
  const entry = c.log[c.log.length - 1];
  if (entry && entry.activityId === a.id && entry.end === undefined) entry.end = w.simTime;
  c.needs.mood = clamp(c.needs.mood + 2 + w.rng.next() * 3);
  if (!w.headless) c.bubble = { text: moodEmoji(c.needs.mood), until: w.realNow + 2200 };
  c.lastActivity = a.id;
  c.current = undefined;
  c.target = undefined;
  c.moment = undefined;
  w.release(c.id);
  c.state = 'idle';
  c.idleFor = w.rng.range(0.5, 3);
}

// ---- Micro-moments (only while someone is watching) ----------------------------------

function say(w: World, c: Clone, pool: string[] | undefined, ms = 2800): void {
  if (!pool?.length) return;
  c.bubble = { text: pool[Math.floor(Math.random() * pool.length)], until: w.realNow + ms };
}

function maybeMoment(w: World, c: Clone, a: Activity, dt: number): void {
  if (c.moment) {
    const t = w.simTime - c.moment.start;
    if (c.moment.kind === 'build' && !c.moment.flag && t > 2200) {
      c.moment.flag = true;
      c.bubble = { text: 'it works??', until: w.realNow + 2400 };
    }
    return;
  }
  if (Math.random() > dt / 20) return;
  const r = Math.random();
  if (a.id === 'code' && r < 0.4) {
    c.moment = { kind: 'build', start: w.simTime, dur: 4400 };
    c.bubble = { text: 'nooo 🔴', until: w.realNow + 2000 };
  } else if (a.id === 'roll' && r < 0.45) {
    c.moment = { kind: 'tap', start: w.simTime, dur: 4000 };
    c.bubble = { text: 'tap! 🤚', until: w.realNow + 1800 };
  } else if (a.id === 'read' && r < 0.3) {
    c.moment = { kind: 'doze', start: w.simTime, dur: 15_000 + Math.random() * 20_000 };
    c.bubble = { text: '💤', until: w.realNow + 3000 };
  } else {
    say(w, c, lines[a.id]);
  }
}
