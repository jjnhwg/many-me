// Time-of-day weights per category. `hour` is a float in [0, 24).
import type { Category } from '../world/activities.config';

const between = (h: number, a: number, b: number) => (a <= b ? h >= a && h < b : h >= a || h < b);

export const isSleepTime = (h: number) => between(h, 1, 7);

export function scheduleWeight(cat: Category, h: number): number {
  if (cat === 'sleep') {
    if (isSleepTime(h)) return 80;
    if (between(h, 23, 1)) return 3;
    return 0;
  }
  // Almost nobody does anything else in the middle of the night.
  const night = isSleepTime(h) ? 0.02 : 1;
  switch (cat) {
    case 'gym': return night * (between(h, 6, 11) ? 2.4 : between(h, 17, 21) ? 1.0 : between(h, 11, 17) ? 0.8 : 0.3);
    case 'dev': return night * (between(h, 12, 19) ? 2.4 : between(h, 9, 12) ? 1.3 : between(h, 19, 24) ? 1.0 : 0.4);
    case 'bjj': return night * (between(h, 17, 22) ? 2.6 : between(h, 10, 13) ? 1.0 : 0.5);
    case 'study': return night * (between(h, 8, 12) || between(h, 19, 23) ? 1.7 : 0.8);
    case 'eat': return night * (between(h, 7, 9.5) || between(h, 12, 13.5) || between(h, 18, 20) ? 3 : 0.35);
    case 'coffee': return night * (between(h, 7, 11) ? 2 : between(h, 13, 16) ? 1.5 : between(h, 20, 24) ? 0.15 : 0.7);
    case 'rest': return night * (between(h, 14, 16) || between(h, 22, 24) ? 1.5 : 1);
    case 'selfcare': return night * (between(h, 21, 24) || between(h, 0, 1) ? 4 : between(h, 7, 8.5) ? 2 : 0.25);
    case 'wander': return night * 1;
  }
}

export function hourOf(simTime: number): number {
  const d = new Date(simTime);
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

/** Next local 7:00 after `t`. */
export function nextWake(t: number): number {
  const d = new Date(t);
  d.setHours(7, 0, 0, 0);
  if (d.getTime() <= t) d.setDate(d.getDate() + 1);
  return d.getTime();
}
