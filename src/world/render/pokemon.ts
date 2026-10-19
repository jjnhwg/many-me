// Pokémon sprites as pixel rects, like character.ts but one hand-drawn body per species.
// Origin (0,0) = on the floor under the body, facing screen-right (mirrored for SW/NW like the Justins).
// `lift` raises the whole sprite (hovering, sitting on a rock); `flipY` hangs it from the anchor instead.
import type { Species } from '../clones.config';
import type { R } from './draw';
import { shade } from './draw';

export type PokePose = { rects: R[]; flipY?: boolean; lift?: number };

export function pokemonRects(species: Species, pose: string, t: number): PokePose {
  const f = (period: number, n: number) => Math.floor(t / period) % n;
  switch (species) {
    case 'arcanine': return arcanine(pose, f);
    case 'greninja': return greninja(pose, f);
    case 'gliscor': return gliscor(pose, f);
    case 'lucario': return lucario(pose, f);
    case 'latios': return latios(pose, f);
  }
}

type Frame = (period: number, n: number) => number;

// ---- Arcanine: orange quadruped, black stripes, cream mane and tail ---------------------------

const AO = '#e8742c';
const AOd = shade(AO, -0.22);
const AC = '#f3e2b0';
const ACd = '#d9c48e';
const K = '#2a2a2e';
const EYE = '#1a1622';

function arcanine(pose: string, f: Frame): PokePose {
  const r: R[] = [];
  const add = (x: number, y: number, w: number, h: number, c: string) => r.push([x, y, w, h, c]);

  if (pose === 'sleep') {
    const b = f(1400, 2); // breathing
    add(-17, -6, 6, 3, AC); add(-16, -8, 4, 2, AC);                 // tail curled round the front
    add(-12, -9 - b, 18, 8 + b, AO); add(-12, -2, 18, 1, AOd);     // body lying flat
    add(-8, -9 - b, 1, 4, K); add(-4, -9 - b, 1, 5, K); add(0, -9 - b, 1, 4, K);
    add(3, -12, 7, 8, AC);                                           // mane
    add(6, -13, 9, 7, AO); add(13, -10, 4, 3, AC); add(16, -10, 1, 1, K); // head resting
    add(7, -15, 2, 2, AO); add(11, -15, 2, 2, AOd); add(8, -14, 4, 1, AC);
    add(10, -10, 2, 1, EYE);                                         // closed eye
    add(3, -2, 5, 2, AC); add(-10, -2, 4, 2, AC);                   // paws tucked
    return { rects: r };
  }

  const walking = pose === 'walk' || pose === 'run';
  const k = walking ? f(150, 4) : 0;
  const eating = pose === 'eat';
  const flame = pose === 'flame';
  const tailDy = walking ? 0 : f(260, 2); // wag
  const legH = (lift: boolean) => (lift ? 5 : 7);
  // Legs: far legs darker; diagonal pairs lift together while walking.
  add(-11, -7, 3, legH(k === 1), AO); add(-11, -2 - (k === 1 ? 2 : 0), 3, 2, AC);
  add(-7, -7, 3, legH(k === 3), AOd); add(-7, -2 - (k === 3 ? 2 : 0), 3, 2, ACd);
  add(3, -7, 3, legH(k === 3), AO); add(3, -2 - (k === 3 ? 2 : 0), 3, 2, AC);
  add(6, -7, 3, legH(k === 1), AOd); add(6, -2 - (k === 1 ? 2 : 0), 3, 2, ACd);
  // Tail: a big cream plume.
  add(-17, -18 + tailDy, 5, 5, AC); add(-16, -21 + tailDy, 4, 3, AC); add(-15, -14 + tailDy, 3, 2, ACd);
  // Body + stripes.
  add(-12, -15, 18, 9, AO); add(-11, -7, 16, 1, AOd);
  add(-8, -15, 1, 4, K); add(-4, -15, 1, 5, K); add(0, -15, 1, 4, K);
  // Mane.
  add(2, -21, 8, 11, AC); add(2, -16, 1, 5, ACd);
  // Head (lowered to the bowl while eating, pushed forward while breathing fire).
  const hx = 6 + (flame ? 1 : 0);
  const hy = -27 + (eating ? 9 : 0);
  add(hx, hy, 9, 7, AO);
  add(hx + 1, hy - 3, 2, 3, AO); add(hx + 5, hy - 3, 2, 3, AOd);   // ears
  add(hx + 2, hy - 2, 4, 2, AC);                                   // head tuft
  add(hx + 3, hy, 1, 2, K);                                        // forehead stripe
  add(hx + 7, hy + 4, 4, 3, AC);                                   // muzzle
  add(hx + 10, hy + 4, 1, 1, K);                                   // nose
  add(hx + 5, hy + 2, 1, 2, EYE);
  if (eating && f(300, 2)) add(hx + 9, hy + 7, 2, 1, '#d33b3b');   // berry
  if (flame) {
    add(hx + 9, hy + 6, 2, 1, '#7a1f1f');                          // open mouth
    // Flame stream: a flickering cone that reaches toward the target.
    const len = 20 + f(90, 4) * 3;
    for (let i = 0; i < len; i += 3) {
      const spread = Math.min(3, Math.floor(i / 6));
      const x = hx + 11 + i;
      const y = hy + 5 - spread;
      add(x, y, 3, 1 + spread * 2, i > len - 7 ? '#e8421c' : '#ff8c1a');
      if (i < len - 4) add(x, y + spread, 3, 1, '#ffd23f');
    }
  }
  return { rects: r };
}

// ---- Greninja: dark-blue ninja frog with a pink tongue scarf ---------------------------------

const GB = '#2c4f96';
const GBl = '#4f7fd0';
const GCr = '#f0e6c8';
const GP = '#ef7fb0';
const GRed = '#d33b3b';

function greninja(pose: string, f: Frame): PokePose {
  const r: R[] = [];
  const add = (x: number, y: number, w: number, h: number, c: string) => r.push([x, y, w, h, c]);
  const sitting = pose === 'meditate' || pose === 'sleep';
  const eyesClosed = pose === 'sleep' || pose === 'meditate';
  const scarfWave = f(240, 2);

  if (sitting) {
    // Cross-legged, hands together.
    add(-7, -4, 14, 4, GB); add(-7, -1, 4, 1, GBl); add(3, -1, 4, 1, GBl);
  } else {
    const k = pose === 'walk' ? f(150, 4) : 0;
    // Deep ninja crouch: thighs out, shins down.
    add(-6, -9, 4, 3, GB); add(2, -9, 4, 3, GB);
    add(-5, -6, 3, k === 1 ? 4 : 5, GBl); add(3, -6, 3, k === 3 ? 4 : 5, GBl);
    add(-7, -1 - (k === 1 ? 1 : 0), 4, 1, GBl); add(3, -1 - (k === 3 ? 1 : 0), 4, 1, GBl);
  }
  const by = sitting ? 5 : 0; // the upper body sits lower when cross-legged
  add(-4, -17 + by, 8, 9, GB); add(-2, -15 + by, 4, 6, GCr);            // body + belly
  // Scarf: wraps the neck and streams out behind.
  add(-5, -19 + by, 10, 2, GP);
  add(-10, -19 + by + scarfWave, 5, 2, GP); add(-14, -18 + by - scarfWave, 4, 2, GP);
  // Head.
  add(-4, -26 + by, 9, 7, GB);
  add(-4, -28 + by, 2, 2, GB); add(3, -28 + by, 2, 2, GB);               // head points
  add(0, -22 + by, 4, 1, GCr);                                           // face streak
  if (eyesClosed) add(2, -24 + by, 2, 1, K);
  else { add(2, -24 + by, 2, 2, GRed); add(3, -24 + by, 1, 1, '#ffd23f'); }
  // Arms.
  if (pose === 'shuriken') {
    const k = f(300, 4);
    add(-6, -16 + by, 2, 6, GBl);
    if (k === 0) { add(3, -24 + by, 2, 7, GBl); add(3, -26 + by, 2, 2, GCr); }     // wind-up
    else { add(4, -16 + by, 8, 2, GBl); add(12, -16 + by, 2, 2, GCr); }             // release
    if (k > 0) {
      // The shuriken spins away toward the target.
      const sx = 14 + k * 9;
      const c = k % 2 ? '#7fd4ff' : '#bfeaff';
      add(sx, -17, 5, 1, c); add(sx + 2, -19, 1, 5, c); add(sx + 2, -17, 1, 1, '#ffffff');
    }
  } else if (sitting) {
    add(-5, -14 + by, 2, 4, GBl); add(3, -14 + by, 2, 4, GBl); add(-1, -12 + by, 2, 2, GCr);
  } else if (pose === 'eat') {
    add(-6, -16, 2, 6, GBl); add(3, -18, 2, 5, GBl); add(3, -20, 2, 2, GRed);
  } else {
    add(-6, -16, 2, 6, GBl); add(4, -16, 2, 6, GBl); add(5, -10, 2, 2, GCr);
  }
  return { rects: r, lift: pose === 'meditate' ? 6 : 0 };
}

// ---- Gliscor: purple fang scorpion, big wings, pincers, curled stinger tail -------------------

const LP = '#8e6cc4';
const LPd = '#6a4c9c';
const LW = '#5a3f8a';
const LPink = '#c94f7c';
const LY = '#ffd23f';

function gliscor(pose: string, f: Frame): PokePose {
  const r: R[] = [];
  const add = (x: number, y: number, w: number, h: number, c: string) => r.push([x, y, w, h, c]);
  const folded = pose === 'sleep' || pose === 'eat';
  const up = !folded && f(pose === 'glide' ? 200 : 320, 2) === 0;

  // Wings (behind the body).
  if (folded) {
    add(-7, -18, 3, 12, LW); add(4, -18, 3, 12, LW);
  } else if (up) {
    add(-16, -28, 12, 7, LW); add(-16, -22, 12, 1, LPink);
    add(4, -28, 12, 7, LW); add(4, -22, 12, 1, LPink);
  } else {
    add(-16, -21, 12, 6, LW); add(-16, -16, 12, 1, LPink);
    add(4, -21, 12, 6, LW); add(4, -16, 12, 1, LPink);
  }
  // Tail: curls up behind, stinger on the end.
  add(-6, -9, 2, 4, LPd); add(-9, -6, 4, 2, LPd); add(-11, -10, 2, 4, LPd); add(-12, -13, 3, 3, LPink);
  // Body + head.
  add(-4, -18, 8, 9, LP); add(-2, -15, 4, 5, '#b89ae0');
  add(-3, -24, 7, 6, LP); add(-3, -26, 2, 2, LPd); add(2, -26, 2, 2, LPd);
  if (pose === 'sleep') add(1, -22, 2, 1, K);
  else { add(1, -22, 2, 2, LY); add(2, -21, 1, 1, GRed); }
  add(3, -19, 1, 1, '#ffffff'); // fang
  // Pincers.
  const snap = pose === 'eat' ? f(300, 2) : 0;
  add(4, -15, 3, 2, LPd); add(7, -17 - snap, 2, 3, LPink); add(7, -13, 2, 2, LPink);
  add(-7, -15, 3, 2, LPd);

  if (pose === 'sleep') return { rects: r, flipY: true };
  const hover = folded ? 0 : pose === 'glide' ? 8 + f(400, 2) : 4;
  return { rects: r, lift: hover };
}

// ---- Lucario: blue and black jackal, cream chest with a spike, aura sensors ------------------

const UB = '#3a6fc4';
const UBd = shade(UB, -0.2);
const UCr = '#f0dfa0';

function lucario(pose: string, f: Frame): PokePose {
  const r: R[] = [];
  const add = (x: number, y: number, w: number, h: number, c: string) => r.push([x, y, w, h, c]);
  const sitting = pose === 'sleep';
  const by = sitting ? 5 : 0;

  // Tail.
  add(-7, -12 + by, 3, 2, UB); add(-9, -11 + by, 2, 3, UB);
  if (sitting) {
    add(-6, -4, 12, 4, K); add(-6, -1, 3, 1, UB); add(3, -1, 3, 1, UB);
  } else {
    const k = pose === 'walk' ? f(150, 4) : 0;
    add(-4, -10, 3, 4, K); add(1, -10, 3, 4, K);                         // black thighs
    add(-4, -6, 3, k === 1 ? 4 : 5, UB); add(1, -6, 3, k === 3 ? 4 : 5, UB); // blue shins
    add(-5, -1 - (k === 1 ? 1 : 0), 4, 1, K); add(1, -1 - (k === 3 ? 1 : 0), 4, 1, K);
  }
  // Torso: cream chest with the white spike.
  add(-4, -19 + by, 8, 9, UCr); add(-4, -19 + by, 1, 9, shade(UCr, -0.15));
  add(1, -16 + by, 2, 2, '#ffffff');
  // Head: blue with a black mask, red eyes, pointed ears, and the four dangling aura sensors.
  add(-4, -27 + by, 9, 8, UB);
  add(-3, -30 + by, 2, 3, UB); add(3, -30 + by, 2, 3, UBd);
  add(-4, -24 + by, 9, 2, K);
  if (sitting) add(2, -24 + by, 2, 1, '#e8b4b4');
  else add(2, -24 + by, 2, 2, GRed);
  add(4, -21 + by, 2, 2, UCr);                                           // muzzle
  const sway = f(500, 2);
  add(-6, -23 + by, 2, 5 + sway, K); add(-8, -22 + by, 2, 4 + (1 - sway), K);
  // Arms.
  if (pose === 'aura') {
    const k = f(320, 4);
    add(3, -17, 7, 2, UB); add(3, -14, 7, 2, UBd); add(10, -17, 2, 5, K); // both palms forward
    // The sphere charges in the palms, then flies toward the target.
    const sx = k === 0 ? 12 : 12 + k * 8;
    const size = k === 0 ? 3 : 5;
    add(sx, -16 - Math.floor(size / 2) + 1, size, size, '#5ab0ff');
    add(sx + 1, -16 - Math.floor(size / 2) + 2, Math.max(1, size - 2), Math.max(1, size - 2), '#bfe6ff');
  } else if (sitting) {
    add(-5, -14 + by, 2, 4, UB); add(3, -14 + by, 2, 4, UB); add(-1, -12 + by, 2, 2, K);
  } else if (pose === 'eat') {
    add(-6, -18, 2, 6, UB); add(3, -20, 2, 5, UB); add(3, -22, 2, 2, GRed);
  } else {
    add(-6, -18, 2, 7, UB); add(4, -18, 2, 7, UB); add(-6, -11, 2, 2, K); add(4, -11, 2, 2, K);
  }
  return { rects: r };
}

// ---- Latios: blue and white jet dragon, red triangle on the chest, always hovering -----------

const TB = '#3f6fd8';
const TBd = shade(TB, -0.25);
const TW = '#e9eef7';

function latios(pose: string, f: Frame): PokePose {
  const r: R[] = [];
  const add = (x: number, y: number, w: number, h: number, c: string) => r.push([x, y, w, h, c]);
  const asleep = pose === 'sleep';
  // Swept-back jet wings.
  add(-14, -24, 10, 3, TBd); add(-16, -22, 6, 2, TBd);
  // Long body lying horizontally, tail fins at the back.
  add(-12, -21, 18, 6, TB); add(-10, -16, 15, 2, TW);
  add(-17, -20, 5, 3, TB); add(-19, -23, 3, 3, TBd); add(-19, -17, 3, 2, TBd);
  // Red triangle on the chest.
  add(1, -19, 3, 2, GRed); add(2, -17, 1, 1, GRed);
  // Head.
  add(5, -25, 8, 7, TB); add(9, -21, 5, 3, TW);
  add(6, -28, 3, 3, TBd);                                          // head crest
  if (asleep) add(9, -23, 2, 1, K);
  else { add(9, -23, 2, 2, GRed); add(10, -23, 1, 1, '#ffffff'); }
  // Little arms tucked under.
  add(2, -15, 2, 3, TB); add(-3, -15, 2, 3, TBd);
  if (pose === 'soar') {
    // Speed lines trailing behind.
    const k = f(120, 3);
    for (let i = 0; i < 3; i++) add(-26 - ((i + k) % 3) * 3, -22 + i * 3, 5, 1, '#bfe6ff');
  }
  const bob = f(asleep ? 1200 : 400, 2);
  return { rects: r, lift: (asleep ? 2 : pose === 'soar' ? 10 : 6) + bob };
}

/** Apply lift / flip, giving rects ready to draw at the anchor. */
export function placePokemon(p: PokePose): R[] {
  const lift = p.lift ?? 0;
  return p.rects.map(([x, y, w, h, c]) => (p.flipY ? [x, -y - h, w, h, c] : [x, y - lift, w, h, c]) as R);
}
