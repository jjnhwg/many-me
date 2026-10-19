// The base avatar ("me") as a list of pixel rects, layered with an outfit and a pose.
// Origin (0,0) = between the feet. Facing 3/4 toward the viewer; mirror for the other side.
import { avatar, type Outfit } from '../clones.config';
import type { R } from './draw';
import { shade } from './draw';

type Legs = 'stand' | 'walkA' | 'walkB' | 'sit' | 'squat1' | 'squat2' | 'lunge';
type Arm = 'down' | 'swingF' | 'swingB' | 'chest' | 'type1' | 'type2' | 'up' | 'face' | 'shoulder' | 'reach' | 'out' | 'wave1' | 'wave2';
type Held =
  | 'bowl' | 'mug' | 'mugUp' | 'phone' | 'barbell' | 'dumbbellsLow' | 'dumbbellsHigh' | 'bottle' | 'bottleUp' | 'apple'
  | 'clubDown' | 'clubBack' | 'clubThrough' | 'ball' | 'putter' | 'shaker' | 'shakerUp';

export type Figure = {
  legs: Legs;
  la: Arm;
  ra: Arm;
  held?: Held[];
  bodyDy?: number;
  headDy?: number;
  eyes?: 'open' | 'closed' | 'down';
  back?: boolean;
  leanX?: number;
};

export type PoseName =
  | 'idle' | 'walk' | 'run' | 'type' | 'squat' | 'press' | 'drill' | 'roll' | 'tapRoll' | 'stretch' | 'swing' | 'putt'
  | 'sleep' | 'eat' | 'eatStand' | 'shake' | 'drink' | 'phone' | 'skincare' | 'rest' | 'facepalm' | 'fistpump'
  | 'wave';

export type PoseResult = { fig: Figure; rotation: number; lying: boolean };

const SITTING = new Set<PoseName>(['type', 'press', 'eat', 'shake', 'phone', 'rest', 'facepalm', 'fistpump']);

/** Pick the figure for a pose at time t (ms). */
export function pose(name: PoseName, t: number, back: boolean): PoseResult {
  const f = (period: number, n: number) => Math.floor(t / period) % n;
  const sit = SITTING.has(name);
  const base: Figure = { legs: sit ? 'sit' : 'stand', la: 'down', ra: 'down', back, bodyDy: sit ? 2 : 0 };
  let rotation = 0;
  let fig: Figure = base;
  switch (name) {
    case 'idle': fig = { ...base, headDy: f(700, 2) }; break;
    case 'walk':
    case 'run': {
      const k = f(name === 'run' ? 95 : 150, 4);
      const legs: Legs[] = ['walkA', 'stand', 'walkB', 'stand'];
      fig = { ...base, legs: legs[k], la: k === 0 ? 'swingF' : k === 2 ? 'swingB' : 'down', ra: k === 0 ? 'swingB' : k === 2 ? 'swingF' : 'down', bodyDy: k % 2 ? -1 : 0 };
      break;
    }
    case 'type': { const k = f(180, 2); fig = { ...base, la: k ? 'type1' : 'type2', ra: k ? 'type2' : 'type1' }; break; }
    case 'squat': {
      const k = f(520, 4);
      const legs: Legs[] = ['stand', 'squat1', 'squat2', 'squat1'];
      fig = { ...base, legs: legs[k], bodyDy: [0, 3, 6, 3][k], la: 'shoulder', ra: 'shoulder', held: ['barbell'] };
      break;
    }
    case 'press': { const up = f(750, 2) === 1; fig = { ...base, la: up ? 'up' : 'shoulder', ra: up ? 'up' : 'shoulder', held: [up ? 'dumbbellsHigh' : 'dumbbellsLow'] }; break; }
    case 'drill': {
      const k = f(420, 4);
      fig = { ...base, legs: (['stand', 'lunge', 'squat1', 'stand'] as Legs[])[k], bodyDy: [0, 3, 3, 0][k], leanX: [0, 2, 1, 0][k], la: k === 1 ? 'out' : 'chest', ra: k ? 'out' : 'chest' };
      break;
    }
    case 'roll':
    case 'tapRoll': {
      const k = f(name === 'tapRoll' ? 120 : 380, 4);
      fig = { ...base, legs: k % 2 ? 'squat1' : 'lunge', bodyDy: 3 + (k % 2), leanX: 2 + (k === 1 ? 1 : 0), la: 'out', ra: k === 3 ? 'chest' : 'out' };
      rotation = [0.12, 0.2, 0.08, 0.16][k];
      break;
    }
    case 'stretch': {
      const k = f(800, 4);
      fig = { ...base, la: 'up', ra: 'up' };
      rotation = [0, 0.18, 0, -0.18][k];
      break;
    }
    case 'swing': {
      // 6 frames x 350 ms: address, address, top of backswing, impact, follow-through x2.
      // The range screen times its ball flight to the impact frame (see golfscreen in props.ts).
      const k = f(350, 6);
      if (k <= 1) fig = { ...base, la: 'chest', ra: 'chest', held: ['clubDown', 'ball'], eyes: 'down', headDy: 1 };
      else if (k === 2) fig = { ...base, la: 'shoulder', ra: 'chest', held: ['clubBack', 'ball'], eyes: 'down' };
      else if (k === 3) fig = { ...base, la: 'chest', ra: 'chest', held: ['clubDown'], leanX: 1 };
      else { fig = { ...base, la: 'chest', ra: 'shoulder', held: ['clubThrough'] }; rotation = 0.06; }
      break;
    }
    case 'putt': {
      const k = f(550, 4);
      fig = { ...base, la: 'chest', ra: 'chest', held: ['putter', 'ball'], eyes: 'down', headDy: 2, bodyDy: 1, leanX: [0, -1, 0, 1][k] };
      break;
    }
    case 'sleep': return { fig: { ...base, back: false, eyes: 'closed', bodyDy: f(1400, 2) }, rotation: 1.107, lying: true };
    case 'eat':
    case 'eatStand': {
      const up = f(650, 2) === 1;
      fig = { ...base, la: 'chest', ra: up ? 'face' : 'chest', held: name === 'eat' ? ['bowl'] : ['apple'] };
      break;
    }
    case 'shake': {
      // Sip, sip, regret, stare at what's left.
      const k = f(900, 4);
      fig = k < 2
        ? { ...base, ra: 'face', held: ['shakerUp'], eyes: 'closed' }
        : { ...base, ra: 'chest', held: ['shaker'], eyes: k === 2 ? 'closed' : 'down', headDy: k === 2 ? 2 : 1 };
      break;
    }
    case 'drink': { const up = f(900, 2) === 1; fig = { ...base, ra: up ? 'face' : 'chest', held: [up ? 'mugUp' : 'mug'] }; break; }
    case 'rest': { const up = f(1500, 3) === 2; fig = { ...base, ra: up ? 'face' : 'chest', held: [up ? 'bottleUp' : 'bottle'] }; break; }
    case 'phone': fig = { ...base, la: 'chest', ra: 'chest', held: ['phone'], eyes: 'down', headDy: 1 }; break;
    case 'skincare': { const k = f(450, 2); fig = { ...base, la: k ? 'face' : 'up', ra: k ? 'up' : 'face' }; break; }
    case 'facepalm': fig = { ...base, la: 'face', ra: 'face', eyes: 'closed', headDy: 1 }; break;
    case 'fistpump': fig = { ...base, ra: f(220, 2) ? 'up' : 'shoulder', la: 'down' }; break;
    case 'wave': fig = { ...base, ra: f(180, 2) ? 'wave1' : 'wave2' }; break;
  }
  return { fig, rotation, lying: false };
}

export function figureRects(o: Outfit, fig: Figure): R[] {
  const out: R[] = [];
  const add = (x: number, y: number, w: number, h: number, c: string) => out.push([x, y, w, h, c]);
  const dy = fig.bodyDy ?? 0;
  const lx = fig.leanX ?? 0;
  const { skin, skinShade, hair, hairHi, eye } = avatar;
  const shoe = o.barefoot ? skin : o.shoes;

  // ---- legs ----
  const leg = (x: number, top: number, h: number, w = 3) => {
    if (o.shorts) {
      const sh = Math.min(5, h - 2);
      add(x, top, w, sh, o.bottom);
      add(x, top + sh, w, h - sh, skin);
    } else add(x, top, w, h, o.bottom);
  };
  switch (fig.legs) {
    case 'stand': leg(-4, -10, 9); leg(1, -10, 9); add(-5, -2, 4, 2, shoe); add(1, -2, 4, 2, shoe); break;
    case 'walkA': leg(-4, -10, 9); leg(1, -10, 7); add(-5, -2, 4, 2, shoe); add(1, -4, 4, 2, shoe); break;
    case 'walkB': leg(-4, -10, 7); leg(1, -10, 9); add(-5, -4, 4, 2, shoe); add(1, -2, 4, 2, shoe); break;
    case 'sit':
      add(-4, -8, 3, 3, shade(o.shorts ? o.bottom : o.bottom, 0.12)); add(1, -8, 3, 3, shade(o.bottom, 0.12));
      leg(-4, -5, 4); leg(1, -5, 4); add(-5, -2, 4, 2, shoe); add(1, -2, 4, 2, shoe);
      break;
    case 'squat1': leg(-6, -7, 6); leg(3, -7, 6); add(-7, -2, 4, 2, shoe); add(3, -2, 4, 2, shoe); add(-5, -8, 10, 2, o.bottom); break;
    case 'squat2': leg(-7, -4, 3, 4); leg(3, -4, 3, 4); add(-7, -2, 4, 2, shoe); add(3, -2, 4, 2, shoe); add(-6, -5, 12, 2, o.bottom); break;
    case 'lunge': leg(-6, -7, 6); leg(2, -8, 7); add(-7, -2, 4, 2, shoe); add(2, -2, 4, 2, shoe); add(-5, -8, 9, 2, o.bottom); break;
  }

  // ---- torso ----
  const ty = -19 + dy;
  const tx = -5 + lx;
  if (fig.back && o.accessory === 'headphones') add(tx + 1, ty - 1, 8, 3, o.topShade); // hood
  if (o.sleeves === 'none') {
    add(tx + 1, ty, 8, 9, o.top);
    add(tx, ty, 1, 3, skin); add(tx + 9, ty, 1, 3, skin);
    add(tx, ty + 3, 1, 6, o.top); add(tx + 9, ty + 3, 1, 6, o.top);
  } else add(tx, ty, 10, 9, o.top);
  add(tx, ty, 1, 9, o.topShade);
  add(tx, ty + 8, 10, 1, o.topShade);
  if (!fig.back) {
    if (o.id === 'gi') { add(tx + 4, ty, 1, 5, o.topShade); add(tx + 5, ty + 1, 1, 4, o.topShade); }
    if (o.id === 'dev') { add(tx + 3, ty + 5, 4, 2, o.topShade); add(tx + 4, ty + 1, 1, 3, '#d8d4e6'); add(tx + 6, ty + 1, 1, 3, '#d8d4e6'); }
    if (o.id === 'golf') { add(tx + 3, ty, 4, 1, '#f4f1ea'); add(tx + 4, ty + 1, 2, 2, o.topShade); }
    if (o.id === 'lounge') add(tx + 6, ty + 2, 2, 2, o.accent);
    if (o.id === 'gym') add(tx + 4, ty + 2, 2, 2, shade(o.top, 0.3));
  }
  if (o.accessory === 'belt') {
    // Shaded edges keep a white belt readable against a white gi.
    add(tx, ty + 6, 10, 1, o.topShade);
    add(tx, ty + 7, 10, 2, o.accent);
    if (!fig.back) { add(tx + 4, ty + 7, 2, 4, o.accent); add(tx + 3, ty + 7, 1, 4, o.topShade); add(tx + 6, ty + 7, 1, 4, o.topShade); }
  }
  add(lx - 1, ty - 1, 2, 1, skin); // neck

  // ---- arms ----
  const armColor = o.sleeves === 'none' ? skin : o.top;
  const arm = (side: -1 | 1, mode: Arm) => {
    // side -1 = screen-left arm. Coordinates computed for the left arm then mirrored.
    const m = (x: number, w: number) => (side < 0 ? tx + x : tx + 10 - x - w);
    const sleeve = (x: number, y: number, w: number, h: number) => {
      if (o.sleeves === 'short') { add(m(x, w), y, w, Math.min(3, h), o.top); if (h > 3) add(m(x, w), y + 3, w, h - 3, skin); }
      else add(m(x, w), y, w, h, armColor);
    };
    const hand = (x: number, y: number) => add(m(x, 2), y, 2, 2, skin);
    switch (mode) {
      case 'down': sleeve(-2, ty, 2, 7); hand(-2, ty + 7); break;
      case 'swingF': sleeve(-2, ty, 2, 6); hand(-1, ty + 6); break;
      case 'swingB': sleeve(-2, ty, 2, 7); hand(-3, ty + 6); break;
      case 'chest': sleeve(-2, ty, 2, 5); add(m(-1, 3), ty + 4, 3, 2, armColor); hand(2, ty + 4); break;
      case 'type1': sleeve(-2, ty, 2, 5); add(m(-1, 3), ty + 4, 3, 2, armColor); hand(1, ty + 5); break;
      case 'type2': sleeve(-2, ty, 2, 5); add(m(-1, 3), ty + 4, 3, 2, armColor); hand(1, ty + 4); break;
      case 'up': sleeve(-2, ty - 8, 2, 9); hand(-2, ty - 10); break;
      case 'shoulder': sleeve(-3, ty - 3, 2, 4); hand(-3, ty - 5); break;
      case 'face': sleeve(-2, ty, 2, 3); add(m(-1, 2), ty - 3, 2, 4, armColor); hand(1, ty - 5); break;
      case 'reach': sleeve(-2, ty - 2, 2, 3); add(m(-6, 5), ty - 3, 5, 2, armColor); hand(-8, ty - 4); break;
      case 'out': add(m(-6, 6), ty + 2, 6, 2, armColor); hand(-8, ty + 2); break;
      case 'wave1': sleeve(-3, ty - 7, 2, 8); hand(-4, ty - 9); break;
      case 'wave2': sleeve(-2, ty - 7, 2, 8); hand(-1, ty - 9); break;
    }
  };
  // In the 3/4 view the "right" arm (+x) is the far one.
  arm(-1, fig.la);
  arm(1, fig.ra);

  // ---- head ----
  const hy = -28 + dy + (fig.headDy ?? 0);
  const hx = -4 + lx;
  add(hx, hy, 8, 8, skin);
  add(hx, hy + 7, 8, 1, skinShade);
  if (fig.back) {
    add(hx - 1, hy - 1, 10, 7, hair);
    add(hx + 1, hy - 1, 3, 1, hairHi);
  } else {
    add(hx, hy - 1, 8, 3, hair);
    add(hx - 1, hy, 1, 4, hair);
    add(hx + 8, hy, 1, 3, hair);
    add(hx + 3, hy - 2, 3, 1, hair);
    add(hx + 1, hy - 1, 2, 1, hairHi);
    add(hx, hy + 2, 3, 1, hair);
    const eyes = fig.eyes ?? 'open';
    if (eyes === 'open') { add(hx + 3, hy + 4, 1, 2, eye); add(hx + 6, hy + 4, 1, 2, eye); }
    else if (eyes === 'closed') { add(hx + 2, hy + 5, 2, 1, eye); add(hx + 5, hy + 5, 2, 1, eye); }
    else { add(hx + 3, hy + 5, 1, 1, eye); add(hx + 6, hy + 5, 1, 1, eye); }
    add(hx + 5, hy + 7, 1, 1, skinShade);
  }
  if (o.accessory === 'cap') {
    add(hx - 1, hy - 2, 10, 3, o.accent);
    add(hx + 1, hy - 2, 3, 1, shade(o.accent, 0.3));
    if (!fig.back) add(hx + 2, hy + 1, 8, 1, shade(o.accent, -0.3)); // brim
  }
  if (o.accessory === 'headphones') {
    add(hx - 1, hy - 2, 10, 1, '#16161c');
    add(hx - 2, hy + 2, 2, 4, '#16161c'); add(hx + 8, hy + 2, 2, 4, '#16161c');
    add(hx - 2, hy + 3, 1, 2, o.accent);
  }
  if (o.accessory === 'headband') add(hx, hy + 1, 8, 1, o.accent);

  // ---- held items ----
  for (const h of fig.held ?? []) {
    switch (h) {
      case 'bowl': add(lx - 3, ty + 6, 6, 2, '#f4f1ea'); add(lx - 3, ty + 6, 6, 1, '#d06b4a'); add(lx + 2, ty + 2, 1, 5, '#a8774a'); break;
      case 'apple': add(lx + 1, ty + 4, 3, 3, '#d64545'); break;
      case 'mug': add(tx + 9, ty + 3, 3, 3, '#f0ece4'); break;
      case 'mugUp': add(tx + 6, ty - 4, 3, 3, '#f0ece4'); break;
      case 'phone': add(lx - 2, ty + 3, 4, 3, '#1a1a1a'); add(lx - 1, ty + 3, 2, 2, '#8fd3ff'); break;
      case 'barbell': add(lx - 14, ty - 4, 28, 1, '#a0a6ae'); add(lx - 15, ty - 7, 2, 7, '#2a2a2e'); add(lx + 13, ty - 7, 2, 7, '#2a2a2e'); break;
      case 'dumbbellsLow': add(tx - 4, ty - 6, 4, 2, '#2a2a2e'); add(tx + 10, ty - 6, 4, 2, '#2a2a2e'); break;
      case 'dumbbellsHigh': add(tx - 3, ty - 11, 4, 2, '#2a2a2e'); add(tx + 9, ty - 11, 4, 2, '#2a2a2e'); break;
      case 'bottle': add(tx + 9, ty + 2, 2, 4, '#5ab0ff'); break;
      case 'bottleUp': add(tx + 6, ty - 5, 2, 4, '#5ab0ff'); break;
      // Golf. Clubs are drawn with the hands at the chest (down) or by a shoulder (back/through),
      // sweeping over the head so the shaft never crosses the face.
      case 'clubDown': for (let i = 0; i < 5; i++) add(lx + 1 + i, ty + 7 - dy + i * 2, 1, 3, CLUB); add(lx + 5, -2, 3, 2, CLUB_HEAD); break;
      case 'clubBack': add(tx - 3, ty - 12, 1, 7, CLUB); add(tx - 3, ty - 12, 11, 1, CLUB); add(tx + 7, ty - 13, 2, 2, CLUB_HEAD); break;
      case 'clubThrough': add(tx + 12, ty - 12, 1, 7, CLUB); add(tx + 2, ty - 12, 11, 1, CLUB); add(tx + 1, ty - 13, 2, 2, CLUB_HEAD); break;
      case 'putter': for (let i = 0; i < 4; i++) add(lx + 1 + i, ty + 7 - dy + i * 3, 1, 3, CLUB); add(lx + 4, -1, 3, 1, CLUB_HEAD); break;
      case 'ball': add(lx + 9, -2, 2, 2, '#ffffff'); break;
      case 'shaker': add(tx + 9, ty - 1, 4, 1, '#7b3fa0'); add(tx + 9, ty, 4, 7, '#efe6d6'); add(tx + 9, ty + 3, 4, 4, '#b98a62'); break;
      case 'shakerUp': add(tx + 5, ty - 9, 4, 1, '#7b3fa0'); add(tx + 5, ty - 8, 4, 7, '#efe6d6'); add(tx + 5, ty - 8, 4, 3, '#b98a62'); break;
    }
  }
  return out;
}

const CLUB = '#c0c4ca';
const CLUB_HEAD = '#2a2a2e';

export const OUTLINE = '#1a1622';
