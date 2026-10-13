// Day/night: a darkening tint keyed to the sim's local hour, plus sky color for windows.
import { mix } from './draw';

type Key = { h: number; alpha: number; tint: string; sky: string; night: number };

const KEYS: Key[] = [
  { h: 0, alpha: 0.5, tint: '#0b1030', sky: '#141a38', night: 1 },
  { h: 5, alpha: 0.48, tint: '#0b1030', sky: '#1c2348', night: 1 },
  { h: 6.5, alpha: 0.18, tint: '#4a2a50', sky: '#f4a76b', night: 0.4 },
  { h: 8, alpha: 0, tint: '#ffffff', sky: '#8fd3ff', night: 0 },
  { h: 16.5, alpha: 0, tint: '#ffffff', sky: '#8fd3ff', night: 0 },
  { h: 18.5, alpha: 0.18, tint: '#ff7a3a', sky: '#f07f5b', night: 0.3 },
  { h: 20, alpha: 0.42, tint: '#1a1440', sky: '#3a2a60', night: 0.85 },
  { h: 21.5, alpha: 0.5, tint: '#0b1030', sky: '#141a38', night: 1 },
  { h: 24, alpha: 0.5, tint: '#0b1030', sky: '#141a38', night: 1 },
];

export type Light = { alpha: number; tint: string; sky: string; night: number };

export function lightAt(hour: number): Light {
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].h <= hour) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = Math.min(1, Math.max(0, (hour - a.h) / (b.h - a.h)));
  return {
    alpha: a.alpha + (b.alpha - a.alpha) * t,
    tint: mix(a.tint, b.tint, t),
    sky: mix(a.sky, b.sky, t),
    night: a.night + (b.night - a.night) * t,
  };
}
