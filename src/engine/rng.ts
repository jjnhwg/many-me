// Seeded RNG (mulberry32). State is a single uint32 so it serializes trivially.

export class Rng {
  state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  int(min: number, maxExclusive: number): number {
    return Math.floor(this.range(min, maxExclusive));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  weighted<T>(items: readonly { item: T; weight: number }[]): T | undefined {
    const total = items.reduce((s, i) => s + Math.max(0, i.weight), 0);
    if (total <= 0) return undefined;
    let r = this.next() * total;
    for (const i of items) {
      r -= Math.max(0, i.weight);
      if (r <= 0) return i.item;
    }
    return items[items.length - 1].item;
  }
}

export function hashSeed(...parts: number[]): number {
  let h = 2166136261;
  for (const p of parts) {
    h ^= p >>> 0;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
