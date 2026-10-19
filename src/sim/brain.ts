// Activity choice: role affinity x needs x time of day x a little randomness.
import { activities, type Activity } from '../world/activities.config';
import { roster, type CloneConfig } from '../world/clones.config';
import { hourOf, scheduleWeight } from './schedule';
import type { Clone } from './types';
import type { World } from './world';

/** Justins can do anything not reserved with `only`; Pokémon only what lists them. */
export function canDo(cfg: CloneConfig, a: Activity): boolean {
  return a.only ? a.only.includes(cfg.id) : !cfg.species;
}

// Categories with many activities (gym has 4) shouldn't win just by having more entries.
// Counted per clone, since a Pokémon sees a different set of activities than a Justin.
const perCategory = new Map<string, Map<string, number>>();
function categoryCounts(cfg: CloneConfig): Map<string, number> {
  let m = perCategory.get(cfg.id);
  if (!m) {
    m = new Map();
    for (const a of activities) if (canDo(cfg, a)) m.set(a.category, (m.get(a.category) ?? 0) + 1);
    perCategory.set(cfg.id, m);
  }
  return m;
}

export type Choice = { activity: Activity; pointId: string };

export function needFactor(c: Clone, a: Activity): number {
  const { energy, focus, hunger } = c.needs;
  switch (a.category) {
    case 'eat': return (0.15 + (hunger / 50) ** 2) * (hunger > 70 ? 4 : 1);
    case 'rest': return energy < 30 ? 5 : energy > 80 ? 0.4 : 1;
    case 'sleep': return energy < 15 ? 2 : 1;
    case 'coffee': return focus < 40 ? 2.2 : focus > 85 ? 0.3 : 1;
    case 'bjj':
    case 'gym':
    case 'golf': return energy < 30 ? 0.25 : 1;
    case 'dev': return 0.35 + focus / 100;
    default: return 1;
  }
}

export function chooseActivity(world: World, c: Clone): Choice | null {
  const cfg = roster.find((r) => r.id === c.id)!;
  const hour = hourOf(world.simTime);
  const followUps = c.lastActivity ? cfg.followUps?.[c.lastActivity] : undefined;
  const counts = categoryCounts(cfg);

  const options: { item: Choice; weight: number }[] = [];
  for (const a of activities) {
    if (!canDo(cfg, a)) continue;
    const pointId = world.freePoint(a, c.id);
    if (!pointId) continue;
    let w = (cfg.affinities[a.category] ?? 0.2) * scheduleWeight(a.category, hour) * needFactor(c, a);
    w /= counts.get(a.category)!;
    if (followUps?.[a.id]) w *= followUps[a.id];
    if (a.id === c.lastActivity && a.category !== 'sleep') w *= 0.45;
    w *= world.rng.range(0.75, 1.25);
    if (w > 0) options.push({ item: { activity: a, pointId }, weight: w });
  }
  return world.rng.weighted(options) ?? null;
}
