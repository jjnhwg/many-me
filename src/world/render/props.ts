// Procedural placeholder art for every prop kind in zones.config.ts.
// Each kind has one or more parts; a part's depth is its tile (+`at`) and `layer`
// (30 = behind a clone on the same tile, 80 = in front of it, e.g. a chair back or blanket).
import type { Graphics } from 'pixi.js';
import { iso, tileCenter, type Pt } from '../../engine/iso';
import type { Clone } from '../../sim/types';
import type { Prop } from '../zones.config';
import { box, faceX, faceY, floorEllipse, quad, rects, shade, wallPt, wallQuad, type R } from './draw';
import { OUTLINE } from './character';

export type DrawCtx = {
  t: number;          // real ms, for animation
  hour: number;
  night: number;      // 0..1
  sky: string;
  occupant?: Clone;   // clone using the linked point
  simTime: number;
};

export type Light = { gx: number; gy: number; z: number; r: number; color: string; strength: number };

type DrawFn = (g: Graphics, p: Prop, c: DrawCtx) => void;
type Part = { draw: DrawFn; layer?: number; at?: [number, number]; animated?: boolean };
export type PropDef = { parts: Part[]; low?: boolean; light?: (p: Prop, c: DrawCtx) => Light | null };

const X = (p: Prop) => p.tile![0];
const Y = (p: Prop) => p.tile![1];
const busy = (c: DrawCtx, act?: string) => !!c.occupant && (!act || c.occupant.current?.activityId === act);
const shadow = (g: Graphics, gx: number, gy: number, r = 0.35) => floorEllipse(g, gx, gy, r, '#000000', 0.18);

function line(g: Graphics, a: Pt, b: Pt, color: string, width = 1): void {
  g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ color, width });
}

// ---- Wall props -------------------------------------------------------------

const wallFrame = (g: Graphics, p: Prop, frame: string, inner: string, inset = 0.08, zin = 2) => {
  const w = p.wall!;
  quad(g, wallQuad(w.axis, w.at, w.from, w.to, w.z0, w.z1), frame);
  quad(g, wallQuad(w.axis, w.at, w.from + inset, w.to - inset, w.z0 + zin, w.z1 - zin), inner);
};

const windowProp: DrawFn = (g, p, c) => {
  const w = p.wall!;
  wallFrame(g, p, '#f4f1ea', c.sky, 0.1, 3);
  const mid = (w.from + w.to) / 2;
  if (c.night > 0.5) {
    for (let i = 0; i < 5; i++) {
      const u = w.from + 0.2 + ((i * 0.37) % (w.to - w.from - 0.4));
      const [sx, sy] = wallPt(w.axis, w.at, u, w.z0 + 6 + ((i * 7) % (w.z1 - w.z0 - 10)));
      g.rect(Math.round(sx), Math.round(sy), 1, 1).fill('#fff6c8');
    }
  } else {
    const cu = w.from + 0.3 + ((c.t / 60000) % 1) * (w.to - w.from - 0.6);
    quad(g, wallQuad(w.axis, w.at, cu, cu + 0.35, w.z1 - 9, w.z1 - 6), '#ffffff', 0.8);
  }
  quad(g, wallQuad(w.axis, w.at, mid - 0.03, mid + 0.03, w.z0 + 3, w.z1 - 3), '#f4f1ea');
  quad(g, wallQuad(w.axis, w.at, w.from + 0.1, w.to - 0.1, (w.z0 + w.z1) / 2 - 0.5, (w.z0 + w.z1) / 2 + 0.5), '#f4f1ea');
  quad(g, wallQuad(w.axis, w.at, w.from - 0.05, w.to + 0.05, w.z0 - 2, w.z0), '#c9c1ae');
};

const clock: DrawFn = (g, p, c) => {
  const w = p.wall!;
  const cu = (w.from + w.to) / 2;
  const cz = (w.z0 + w.z1) / 2;
  const ru = (w.to - w.from) / 2;
  const rz = (w.z1 - w.z0) / 2;
  const ring = (k: number): Pt[] => Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return wallPt(w.axis, w.at, cu + Math.cos(a) * ru * k, cz + Math.sin(a) * rz * k);
  });
  quad(g, ring(1), '#3a3340');
  quad(g, ring(0.78), '#f6f2e8');
  const d = new Date(c.simTime);
  const hand = (frac: number, len: number, col: string) => {
    const a = frac * Math.PI * 2;
    line(g, wallPt(w.axis, w.at, cu, cz), wallPt(w.axis, w.at, cu + Math.sin(a) * ru * len, cz + Math.cos(a) * rz * len), col);
  };
  hand(((d.getHours() % 12) + d.getMinutes() / 60) / 12, 0.45, '#1f1b22');
  hand(d.getMinutes() / 60, 0.7, '#c0392b');
};

const beltrack: DrawFn = (g, p) => {
  const w = p.wall!;
  quad(g, wallQuad(w.axis, w.at, w.from, w.to, w.z1 - 3, w.z1), '#6b4423');
  const belts = ['#f4f1ea', '#2f5fbf', '#7b3fa0', '#7a4b2a', '#1f1b22'];
  belts.forEach((col, i) => {
    const u = w.from + 0.2 + i * ((w.to - w.from - 0.4) / (belts.length - 1));
    quad(g, wallQuad(w.axis, w.at, u - 0.07, u + 0.07, w.z0, w.z1 - 3), col);
    if (col === '#1f1b22') quad(g, wallQuad(w.axis, w.at, u - 0.07, u + 0.07, w.z0 + 2, w.z0 + 4), '#c0392b');
  });
};

const poster: DrawFn = (g, p) => {
  const w = p.wall!;
  const col = p.color ?? '#2f5fbf';
  wallFrame(g, p, shade(col, -0.35), col, 0.06, 1.5);
  for (let i = 0; i < 3; i++) {
    const z = w.z0 + 4 + i * 4;
    quad(g, wallQuad(w.axis, w.at, w.from + 0.2, w.to - 0.2 - i * 0.1, z, z + 1.5), shade(col, 0.55));
  }
  quad(g, wallQuad(w.axis, w.at, w.from + 0.2, w.to - 0.2, w.z1 - 8, w.z1 - 4), '#f4f1ea');
};

const mirror: DrawFn = (g, p) => {
  const w = p.wall!;
  wallFrame(g, p, '#5a5f68', '#bcd8e6', 0.06, 1.5);
  for (const k of [0.25, 0.55]) {
    const u = w.from + (w.to - w.from) * k;
    quad(g, [wallPt(w.axis, w.at, u, w.z1 - 3), wallPt(w.axis, w.at, u + 0.25, w.z1 - 3), wallPt(w.axis, w.at, u + 0.05, w.z0 + 3), wallPt(w.axis, w.at, u - 0.2, w.z0 + 3)], '#e3f1f7', 0.7);
  }
};

const neon: DrawFn = (g, p, c) => {
  const w = p.wall!;
  const flicker = Math.sin(c.t / 90) > 0.97 ? 0.4 : 1;
  const P = (u: number, z: number) => wallPt(w.axis, w.at, w.from + u * (w.to - w.from), w.z0 + z * (w.z1 - w.z0));
  const pink = '#ff4fa3';
  const cyan = '#3ff0d8';
  g.moveTo(...P(0.3, 1)).lineTo(...P(0.05, 0.5)).lineTo(...P(0.3, 0)).stroke({ color: pink, width: 1.5, alpha: flicker });
  g.moveTo(...P(0.42, 0)).lineTo(...P(0.58, 1)).stroke({ color: cyan, width: 1.5, alpha: flicker });
  g.moveTo(...P(0.7, 1)).lineTo(...P(0.95, 0.5)).lineTo(...P(0.7, 0)).stroke({ color: pink, width: 1.5, alpha: flicker });
};

// ---- Dojo -----------------------------------------------------------------------

const dummy: DrawFn = (g, p, c) => {
  const [cx, cy] = tileCenter(X(p), Y(p));
  const m = c.occupant?.moment;
  const shaking = m?.kind === 'tap' && c.simTime - m.start < 1500;
  const wob = busy(c, 'roll') ? Math.round(Math.sin(c.t / (shaking ? 30 : 190)) * (shaking ? 1.5 : 1)) : 0;
  shadow(g, X(p) + 0.5, Y(p) + 0.5, 0.32);
  const body = '#8a5532';
  const list: R[] = [
    [-4, -6, 3, 6, body], [1, -6, 3, 6, body],
    [-5 + wob, -20, 10, 14, body], [-5 + wob, -20, 1, 14, shade(body, -0.2)],
    [-8 + wob, -19, 3, 8, body], [5 + wob, -19, 3, 8, body],
    [-3 + wob, -27, 6, 7, body], [-1 + wob, -16, 2, 6, '#c9a46c'],
  ];
  rects(g, cx, cy, list, OUTLINE);
};

const heavybag: DrawFn = (g, p, c) => {
  const [cx, cy] = tileCenter(X(p), Y(p));
  const sway = Math.round(Math.sin(c.t / 900));
  shadow(g, X(p) + 0.5, Y(p) + 0.5, 0.25);
  g.rect(cx, cy - 56, 1, 20).fill('#8a8f99');
  rects(g, cx, cy, [[-4 + sway, -36, 8, 24, '#b23a3a'], [-4 + sway, -36, 2, 24, '#8e2c2c'], [-4 + sway, -32, 8, 1, '#1f1b22'], [-4 + sway, -16, 8, 1, '#1f1b22']], OUTLINE);
};

const waterjug: DrawFn = (g, p) => {
  shadow(g, X(p) + 0.5, Y(p) + 0.5, 0.25);
  box(g, X(p) + 0.3, Y(p) + 0.3, 0.4, 0.4, 12, '#7ec8f0');
  box(g, X(p) + 0.42, Y(p) + 0.42, 0.16, 0.16, 2, '#2f5fbf', { z0: 12 });
};

// ---- Gym -------------------------------------------------------------------------

const RACK = '#3a3f47';
const post = (g: Graphics, gx: number, gy: number) => box(g, gx, gy, 0.1, 0.1, 42, RACK);

const rackBack: DrawFn = (g, p, c) => {
  const x = X(p), y = Y(p);
  floorEllipse(g, x + 0.5, y + 0.5, 0.55, '#000000', 0.12);
  box(g, x - 0.05, y - 0.05, 1.1, 1.1, 1, '#4a3a2a');
  post(g, x + 0.05, y + 0.05);
  post(g, x + 0.85, y + 0.05);
  post(g, x + 0.05, y + 0.85);
  box(g, x + 0.05, y + 0.05, 0.9, 0.1, 3, RACK, { z0: 42 });
  box(g, x + 0.05, y + 0.05, 0.1, 0.9, 3, RACK, { z0: 42 });
  if (!busy(c, 'squat')) {
    box(g, x - 0.25, y + 0.47, 1.5, 0.06, 1, '#a0a6ae', { z0: 30 });
    box(g, x - 0.2, y + 0.3, 0.08, 0.4, 9, '#2a2a2e', { z0: 26 });
    box(g, x + 1.12, y + 0.3, 0.08, 0.4, 9, '#2a2a2e', { z0: 26 });
  }
};

const rackFront: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  post(g, x + 0.85, y + 0.85);
  box(g, x + 0.05, y + 0.85, 0.9, 0.1, 3, RACK, { z0: 42 });
  box(g, x + 0.85, y + 0.05, 0.1, 0.9, 3, RACK, { z0: 42 });
};

const bench: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  shadow(g, x + 0.5, y + 0.5, 0.4);
  box(g, x + 0.2, y + 0.4, 0.08, 0.2, 6, '#555a63');
  box(g, x + 0.72, y + 0.4, 0.08, 0.2, 6, '#555a63');
  box(g, x + 0.12, y + 0.3, 0.76, 0.4, 2, '#b5302a', { z0: 6 });
};

const treadmill: DrawFn = (g, p, c) => {
  const x = X(p), y = Y(p);
  box(g, x - 0.15, y + 0.2, 1.2, 0.6, 4, '#2a2a2e', { top: '#34343a' });
  const off = busy(c) ? (c.t / 400) % 0.25 : 0;
  for (let k = 0; k < 5; k++) {
    const u = x - 0.1 + ((k * 0.25 + off) % 1.1);
    quad(g, [iso(u, y + 0.25, 4), iso(u + 0.04, y + 0.25, 4), iso(u + 0.04, y + 0.75, 4), iso(u, y + 0.75, 4)], '#4a4a52');
  }
};

const treadconsole: DrawFn = (g, p, c) => {
  const x = X(p), y = Y(p);
  box(g, x - 0.05, y + 0.2, 0.3, 0.6, 4, '#2a2a2e');
  box(g, x + 0.05, y + 0.25, 0.08, 0.08, 22, '#555a63');
  box(g, x + 0.05, y + 0.67, 0.08, 0.08, 22, '#555a63');
  box(g, x - 0.05, y + 0.2, 0.3, 0.6, 4, '#2a2a2e', { z0: 22, top: busy({ ...c, occupant: c.occupant }) ? '#3ff0d8' : '#44444c' });
};

const stool: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  shadow(g, x + 0.5, y + 0.5, 0.25);
  box(g, x + 0.46, y + 0.46, 0.08, 0.08, 7, '#555a63');
  box(g, x + 0.3, y + 0.3, 0.4, 0.4, 2, p.color ?? '#a8774a', { z0: 6 });
};

const dumbbells: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  box(g, x + 0.1, y + 0.15, 0.8, 0.6, 7, RACK);
  box(g, x + 0.1, y + 0.05, 0.8, 0.15, 16, RACK);
  for (let i = 0; i < 4; i++) {
    box(g, x + 0.15 + i * 0.19, y + 0.25, 0.12, 0.4, 3, i % 2 ? '#2a2a2e' : '#c0392b', { z0: 7 });
    box(g, x + 0.17 + i * 0.19, y + 0.06, 0.1, 0.12, 3, '#2a2a2e', { z0: 16 });
  }
};

const platetree: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  shadow(g, x + 0.5, y + 0.5, 0.3);
  box(g, x + 0.25, y + 0.25, 0.5, 0.5, 2, RACK);
  box(g, x + 0.45, y + 0.45, 0.1, 0.1, 24, '#555a63', { z0: 2 });
  ['#c0392b', '#2f5fbf', '#2a2a2e'].forEach((col, i) => box(g, x + 0.28, y + 0.38 + i * 0.08, 0.44, 0.05, 11, col, { z0: 3 + i * 3 }));
};

const chalk: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  shadow(g, x + 0.5, y + 0.5, 0.25);
  box(g, x + 0.38, y + 0.38, 0.24, 0.24, 11, '#555a63');
  box(g, x + 0.25, y + 0.25, 0.5, 0.5, 3, '#e8e4dc', { z0: 11, top: '#fbfaf6' });
};

const cooler: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  shadow(g, x + 0.5, y + 0.5, 0.3);
  box(g, x + 0.25, y + 0.25, 0.5, 0.5, 18, '#e8e8ec');
  box(g, x + 0.3, y + 0.3, 0.4, 0.4, 11, '#7ec8f0', { z0: 18 });
  quad(g, faceY(y + 0.75, x + 0.35, x + 0.42, 12, 14), '#2f5fbf');
  quad(g, faceY(y + 0.75, x + 0.55, x + 0.62, 12, 14), '#c0392b');
};

const kettlebells: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  box(g, x + 0.15, y + 0.3, 0.28, 0.28, 5, '#2a2a2e');
  box(g, x + 0.22, y + 0.37, 0.14, 0.14, 2, '#2a2a2e', { z0: 5 });
  box(g, x + 0.55, y + 0.45, 0.32, 0.32, 6, '#c0392b');
  box(g, x + 0.63, y + 0.53, 0.16, 0.16, 2, '#c0392b', { z0: 6 });
};

// ---- Dev -------------------------------------------------------------------------

const CODE_COLORS = ['#3ff0d8', '#ff4fa3', '#f7d154', '#8fd3ff', '#b48cff'];

function screen(g: Graphics, gy: number, x0: number, x1: number, z0: number, z1: number, c: DrawCtx, seed: number): void {
  const m = c.occupant?.moment;
  let bg = '#0d1020';
  if (m?.kind === 'build') bg = c.simTime - m.start < 2200 ? '#5a1020' : '#0f4a2a';
  quad(g, faceY(gy, x0, x1, z0, z1), c.occupant ? bg : '#14141c');
  if (!c.occupant) return;
  const rows = Math.floor((z1 - z0 - 2) / 2);
  const scroll = Math.floor(c.t / 260);
  for (let r = 0; r < rows; r++) {
    const k = (r + scroll + seed) * 7919;
    const indent = (k % 3) * 0.05;
    const len = 0.15 + ((k >> 3) % 5) * 0.06;
    const a = x0 + 0.04 + indent;
    const z = z1 - 2 - r * 2;
    quad(g, faceY(gy, a, Math.min(x1 - 0.03, a + len), z - 1, z), CODE_COLORS[(k >> 5) % CODE_COLORS.length]);
  }
}

const desk: DrawFn = (g, p, c) => {
  const x = X(p), y = Y(p);
  for (const [lx, ly] of [[0.05, 0.12], [0.88, 0.12], [0.05, 0.8], [0.88, 0.8]]) box(g, x + lx, y + ly, 0.07, 0.07, 12, '#2a2738');
  box(g, x, y + 0.1, 1, 0.8, 2, '#5a4a6a', { z0: 12 });
  for (let i = 0; i < 2; i++) {
    const mx = x + 0.06 + i * 0.46;
    box(g, mx + 0.17, y + 0.32, 0.06, 0.06, 3, '#2a2a2e', { z0: 14 });
    box(g, mx, y + 0.28, 0.42, 0.05, 11, '#1a1a22', { z0: 16 });
    screen(g, y + 0.33, mx + 0.02, mx + 0.4, 17, 26, c, i * 13 + x);
  }
  box(g, x + 0.3, y + 0.6, 0.4, 0.12, 1, '#2a2a2e', { z0: 14, top: '#3a3a44' });
  box(g, x + 0.82, y + 0.55, 0.1, 0.1, 3, '#f0ece4', { z0: 14, top: '#5a3a24' });
};

const officechairSeat: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  shadow(g, x + 0.5, y + 0.5, 0.3);
  box(g, x + 0.47, y + 0.47, 0.06, 0.06, 6, '#555a63');
  box(g, x + 0.25, y + 0.25, 0.5, 0.5, 2, '#26232f', { z0: 6 });
};

const officechairBack: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  box(g, x + 0.27, y + 0.72, 0.46, 0.07, 9, '#26232f', { z0: 8 });
};

const coffeemachine: DrawFn = (g, p, c) => {
  const x = X(p), y = Y(p);
  box(g, x + 0.05, y + 0.05, 0.9, 0.9, 13, '#6b5b4b', { top: '#8c7a66' });
  box(g, x + 0.25, y + 0.2, 0.5, 0.45, 11, '#2a2a2e', { z0: 13 });
  quad(g, faceY(y + 0.65, x + 0.32, x + 0.38, 19, 21), busy(c) ? '#3ff0d8' : '#c0392b');
  box(g, x + 0.45, y + 0.7, 0.12, 0.12, 3, '#f0ece4', { z0: 13 });
  if (busy(c)) {
    const [sx, sy] = iso(x + 0.5, y + 0.76, 18);
    for (let i = 0; i < 3; i++) {
      const k = ((c.t / 200 + i * 3) % 8);
      g.rect(Math.round(sx + Math.sin(k + i) * 1.5), Math.round(sy - k * 1.5), 1, 1).fill({ color: '#ffffff', alpha: 0.7 - k * 0.08 });
    }
  }
};

const plant: DrawFn = (g, p, c) => {
  const x = X(p), y = Y(p);
  shadow(g, x + 0.5, y + 0.5, 0.25);
  box(g, x + 0.33, y + 0.33, 0.34, 0.34, 7, '#c0623b');
  const [cx, cy] = tileCenter(x, y, 7);
  const sw = Math.round(Math.sin(c.t / 1300 + x) * 0.6);
  rects(g, cx, cy, [
    [-6 + sw, -9, 12, 7, '#3f8f4f'], [-4 + sw, -15, 8, 7, '#4fa85f'], [-8 + sw, -6, 4, 4, '#3f8f4f'],
    [4 + sw, -7, 4, 4, '#4fa85f'], [-1 + sw, -17, 2, 3, '#62c174'], [-3 + sw, -12, 2, 2, '#62c174'],
  ]);
};

const serverrack: DrawFn = (g, p, c) => {
  const x = X(p), y = Y(p);
  box(g, x + 0.15, y + 0.1, 0.7, 0.8, 32, '#1e1e26');
  for (let r = 0; r < 6; r++) {
    quad(g, faceY(y + 0.9, x + 0.2, x + 0.8, 4 + r * 4.5, 7 + r * 4.5), '#2a2a36');
    const on = Math.sin(c.t / (180 + r * 37) + r) > 0;
    quad(g, faceY(y + 0.9, x + 0.25, x + 0.3, 5 + r * 4.5, 6 + r * 4.5), on ? '#3ff0d8' : '#1b5a50');
    quad(g, faceY(y + 0.9, x + 0.34, x + 0.38, 5 + r * 4.5, 6 + r * 4.5), r % 3 === 0 && on ? '#ff4fa3' : '#3a2a36');
  }
};

const floorlamp: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  shadow(g, x + 0.5, y + 0.5, 0.2);
  box(g, x + 0.35, y + 0.35, 0.3, 0.3, 1.5, '#2a2a2e');
  box(g, x + 0.47, y + 0.47, 0.06, 0.06, 26, '#2a2a2e');
  box(g, x + 0.28, y + 0.28, 0.44, 0.44, 7, '#f3d9a0', { z0: 25, top: '#fff1cc' });
};

const lampLight = (z: number) => (p: Prop, c: DrawCtx): Light | null =>
  c.night > 0.05 ? { gx: X(p) + 0.5, gy: Y(p) + 0.5, z, r: 2.2, color: '#ffcf7a', strength: c.night } : null;

const beanbag: DrawFn = (g, p) => {
  const [cx, cy] = tileCenter(X(p), Y(p));
  shadow(g, X(p) + 0.5, Y(p) + 0.5, 0.45);
  rects(g, cx, cy, [[-11, -8, 22, 9, '#7b4fa0'], [-9, -11, 18, 4, '#9466bb'], [-11, -1, 22, 1, '#5e3a7d'], [-6, -10, 6, 1, '#ad86cf']], OUTLINE);
};


// ---- Driving range -------------------------------------------------------------------

/** Golf simulator screen on the back wall. While someone is at the tee, a ball flies off after each impact frame. */
const golfscreen: DrawFn = (g, p, c) => {
  const w = p.wall!;
  wallFrame(g, p, '#2a2a2e', c.night > 0.5 && !busy(c) ? '#28405a' : '#9fd4f0', 0.1, 2);
  const U = (k: number) => w.from + 0.1 + k * (w.to - w.from - 0.2);
  const P = (k: number, z: number) => wallPt(w.axis, w.at, U(k), z);
  const zh = w.z0 + 2 + (w.z1 - w.z0 - 4) * 0.45; // horizon
  quad(g, wallQuad(w.axis, w.at, U(0), U(1), w.z0 + 2, zh), '#4f9a48');
  quad(g, [P(0.25, w.z0 + 2), P(0.75, w.z0 + 2), P(0.54, zh), P(0.46, zh)], '#7cc46a');
  quad(g, wallQuad(w.axis, w.at, U(0), U(1), zh, zh + 1.5), '#3d7a3a');
  // Yardage flags down the fairway.
  for (const [k, z, col] of [[0.38, 0.55, '#ff4f4f'], [0.6, 0.78, '#ffd23f'], [0.5, 0.92, '#ffffff']] as const) {
    const [sx, sy] = P(k, w.z0 + 2 + (zh - w.z0 - 2) * z);
    g.rect(Math.round(sx), Math.round(sy) - 3, 1, 3).fill('#f4f1ea');
    g.rect(Math.round(sx) + 1, Math.round(sy) - 3, 2, 1).fill(col);
  }
  const o = c.occupant;
  if (o && busy(c, 'range')) {
    // Same clock as the swing pose: 6 frames x 350 ms, impact at 1050 ms.
    const cyc = (c.t + o.id.length * 137) % 2100;
    if (cyc >= 1050) {
      const u = (cyc - 1050) / 1050;
      const [sx, sy] = P(0.5 + 0.08 * Math.sin(u * 3), w.z0 + 3 + (zh + 8 - w.z0 - 3) * Math.sin((u * Math.PI) / 2) - u * u * 6);
      const s = u < 0.5 ? 2 : 1;
      g.rect(Math.round(sx), Math.round(sy), s, s).fill('#ffffff');
    }
  }
};

const ballbucket: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  shadow(g, x + 0.5, y + 0.5, 0.25);
  box(g, x + 0.32, y + 0.32, 0.36, 0.36, 6, '#e8642c');
  const [cx, cy] = tileCenter(x, y, 6);
  rects(g, cx, cy, [[-4, -2, 2, 2, '#ffffff'], [-1, -3, 2, 2, '#f4f1ea'], [2, -2, 2, 2, '#ffffff'], [0, -1, 2, 1, '#e6e1d6']]);
};

const golfbag: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  shadow(g, x + 0.5, y + 0.5, 0.22);
  box(g, x + 0.36, y + 0.36, 0.28, 0.28, 16, '#1f4f8f');
  box(g, x + 0.35, y + 0.35, 0.3, 0.3, 2, '#f4f1ea', { z0: 10 });
  const [cx, cy] = tileCenter(x, y, 16);
  rects(g, cx, cy, [[-3, -5, 1, 5, '#c0c4ca'], [-1, -7, 1, 7, '#c0c4ca'], [2, -4, 1, 4, '#c0c4ca'], [-4, -6, 2, 2, '#2a2a2e'], [-2, -9, 3, 3, '#e8642c'], [2, -5, 2, 2, '#2a2a2e']], OUTLINE);
};

const golfflag: DrawFn = (g, p, c) => {
  const x = X(p), y = Y(p);
  floorEllipse(g, x + 0.5, y + 0.5, 0.13, '#1a1a1a');
  box(g, x + 0.48, y + 0.48, 0.04, 0.04, 24, '#f4f1ea');
  const [cx, cy] = tileCenter(x, y, 24);
  const flap = Math.sin(c.t / 260) > 0 ? 6 : 5;
  rects(g, cx, cy, [[1, 0, flap, 4, '#d33b3b'], [1, 3, flap, 1, '#a82a2a']]);
};

// ---- Lounge -----------------------------------------------------------------------------

const COUCH = '#e07a9a';
const couchBase: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  floorEllipse(g, x + 0.5, y + 1, 0.8, '#000000', 0.12);
  box(g, x + 0.05, y + 0.05, 0.25, 1.9, 17, shade(COUCH, -0.1));
  box(g, x + 0.1, y + 0.05, 0.8, 0.18, 12, shade(COUCH, -0.1));
  box(g, x + 0.2, y + 0.15, 0.7, 1.75, 7, COUCH);
  line(g, iso(x + 0.3, y + 1, 7), iso(x + 0.9, y + 1, 7), shade(COUCH, -0.25));
};

const couchFront: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  box(g, x + 0.1, y + 1.78, 0.8, 0.18, 12, shade(COUCH, -0.1));
};

const coffeetable: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  shadow(g, x + 0.5, y + 1, 0.5);
  box(g, x + 0.25, y + 0.25, 0.08, 0.08, 6, '#6b4423');
  box(g, x + 0.67, y + 1.67, 0.08, 0.08, 6, '#6b4423');
  box(g, x + 0.2, y + 0.2, 0.6, 1.6, 2, '#a8774a', { z0: 6 });
  box(g, x + 0.35, y + 0.4, 0.3, 0.35, 2, '#2f5fbf', { z0: 8 });
  box(g, x + 0.45, y + 1.2, 0.12, 0.12, 3, '#f0ece4', { z0: 8 });
};

const fridge: DrawFn = (g, p, c) => {
  const x = X(p), y = Y(p);
  box(g, x + 0.1, y + 0.1, 0.8, 0.78, 38, '#e8eef0');
  const gy = y + 0.88;
  if (busy(c)) {
    quad(g, faceY(gy, x + 0.15, x + 0.85, 2, 36), '#fff8d0');
    for (const z of [10, 20, 28]) quad(g, faceY(gy, x + 0.15, x + 0.85, z, z + 1), '#d9d2b0');
    quad(g, faceY(gy, x + 0.2, x + 0.35, 11, 16), '#e8642c');
    quad(g, faceY(gy, x + 0.5, x + 0.62, 21, 26), '#3f8f4f');
    // Open door swung toward the viewer.
    quad(g, [iso(x + 0.88, gy, 37), iso(x + 0.95, gy + 0.6, 37), iso(x + 0.95, gy + 0.6, 1), iso(x + 0.88, gy, 1)], '#d4dcdf');
  } else {
    line(g, iso(x + 0.1, gy, 24), iso(x + 0.9, gy, 24), '#b8c2c6');
    quad(g, faceY(gy, x + 0.78, x + 0.82, 26, 33), '#8a8f99');
    quad(g, faceY(gy, x + 0.78, x + 0.82, 12, 20), '#8a8f99');
    quad(g, faceY(gy, x + 0.25, x + 0.4, 28, 32), '#f7d154');
  }
};

const counter: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  box(g, x, y + 0.1, 1, 0.8, 14, '#d9cbb5', { top: '#f0e6d6' });
  line(g, iso(x + 0.5, y + 0.9, 1), iso(x + 0.5, y + 0.9, 12), '#b8a88e');
  box(g, x + 0.2, y + 0.25, 0.3, 0.25, 3, '#a0a6ae', { z0: 14 });
};

const stove: DrawFn = (g, p, c) => {
  const x = X(p), y = Y(p);
  box(g, x, y + 0.1, 1, 0.8, 14, '#d9cbb5', { top: '#2a2a2e' });
  const cooking = (c.hour >= 7 && c.hour < 8.5) || (c.hour >= 18 && c.hour < 19.5);
  for (const [u, v] of [[0.3, 0.35], [0.7, 0.35], [0.3, 0.7], [0.7, 0.7]]) {
    floorEllipse(g, x + u, y + v, 0.12, cooking && u < 0.5 ? '#e8642c' : '#555a63', 1, 14.2);
  }
  if (cooking) box(g, x + 0.18, y + 0.22, 0.25, 0.25, 4, '#8a8f99', { z0: 14 });
  quad(g, faceY(y + 0.9, x + 0.15, x + 0.85, 3, 11), '#2a2a2e');
};

const table: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  shadow(g, x + 0.5, y + 0.5, 0.45);
  box(g, x + 0.45, y + 0.45, 0.1, 0.1, 11, '#6b4423');
  box(g, x + 0.08, y + 0.08, 0.84, 0.84, 2, '#a8774a', { z0: 11 });
  floorEllipse(g, x + 0.35, y + 0.5, 0.13, '#f4f1ea', 1, 13.2);
  floorEllipse(g, x + 0.6, y + 0.3, 0.13, '#f4f1ea', 1, 13.2);
};

const bed: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  box(g, x + 0.03, y + 0.03, 1.94, 1.94, 6, '#8a5a32');
  box(g, x + 0.08, y + 0.15, 1.84, 1.78, 3, '#f4f4f4', { z0: 6 });
  box(g, x + 0.03, y, 1.94, 0.14, 22, '#8a5a32');
  box(g, x + 0.18, y + 0.2, 0.7, 0.35, 2, '#ffffff', { z0: 9 });
  box(g, x + 1.12, y + 0.2, 0.7, 0.35, 2, '#ffffff', { z0: 9 });
};

const blanket: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  box(g, x + 0.06, y + 0.95, 1.88, 1.0, 3, '#5fb8b0', { z0: 8, top: '#7ad1c9' });
  for (let i = 0; i < 4; i++) line(g, iso(x + 0.25 + i * 0.45, y + 1.0, 11), iso(x + 0.25 + i * 0.45, y + 1.9, 11), '#a7e4dd');
};

const nightstand: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  box(g, x + 0.2, y + 0.2, 0.6, 0.6, 11, '#8a5a32');
  box(g, x + 0.42, y + 0.42, 0.16, 0.16, 5, '#2a2a2e', { z0: 11 });
  box(g, x + 0.32, y + 0.32, 0.36, 0.36, 5, '#f3d9a0', { z0: 16, top: '#fff1cc' });
};

const vanity: DrawFn = (g, p, c) => {
  const x = X(p), y = Y(p);
  box(g, x + 0.1, y + 0.25, 0.8, 0.6, 13, '#f4f4f4');
  floorEllipse(g, x + 0.5, y + 0.55, 0.2, '#cfe8f0', 1, 13.2);
  box(g, x + 0.12, y + 0.15, 0.76, 0.08, 24, '#d9cbb5', { z0: 13 });
  const gy = y + 0.23;
  quad(g, faceY(gy, x + 0.17, x + 0.83, 16, 35), '#cfe8f0');
  quad(g, faceY(gy, x + 0.25, x + 0.4, 18, 33), '#e3f3f8');
  if (busy(c, 'skincare')) {
    // Reflection: face with a green sheet mask.
    const [mx, my] = iso(x + 0.52, gy, 30);
    rects(g, Math.round(mx), Math.round(my), [[-3, -1, 6, 6, '#d9a47e'], [-3, -2, 6, 2, '#1f1b22'], [-2, 1, 4, 3, '#9ad08a'], [-1, 2, 1, 1, '#1f1b22'], [1, 2, 1, 1, '#1f1b22']]);
  }
  box(g, x + 0.2, y + 0.3, 0.1, 0.1, 4, '#f29bb8', { z0: 13 });
  box(g, x + 0.75, y + 0.35, 0.08, 0.08, 5, '#7ad1c9', { z0: 13 });
};

// ---- Registry ------------------------------------------------------------------------------

// ---- Pokémon room ------------------------------------------------------------------

/** Pokémon Center healing machine: six ball slots that light up in turn. */
const healer: DrawFn = (g, p, c) => {
  const x = X(p), y = Y(p);
  box(g, x + 0.05, y + 0.15, 1.9, 0.7, 14, '#f4f1ea', { top: '#ffffff' });
  box(g, x + 0.05, y + 0.15, 1.9, 0.7, 3, '#e84a4a', { z0: 14 });
  const lit = Math.floor(c.t / 400) % 7;
  for (let i = 0; i < 6; i++) {
    const [sx, sy] = iso(x + 0.3 + (i % 3) * 0.6, y + 0.35 + Math.floor(i / 3) * 0.3, 17);
    g.rect(Math.round(sx) - 1, Math.round(sy) - 1, 3, 2).fill(i === lit ? '#7dff9a' : '#e84a4a');
    g.rect(Math.round(sx) - 1, Math.round(sy), 3, 1).fill('#f4f1ea');
  }
  quad(g, faceY(y + 0.85, x + 0.6, x + 1.4, 4, 11), '#9fd4f0');
};

/** A Poké Ball emblem on the wall. */
const pokeposter: DrawFn = (g, p) => {
  const w = p.wall!;
  const cu = (w.from + w.to) / 2;
  const cz = (w.z0 + w.z1) / 2;
  const ru = (w.to - w.from) / 2;
  const rz = (w.z1 - w.z0) / 2;
  const arc = (a0: number, a1: number, k: number) => Array.from({ length: 9 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / 8;
    return wallPt(w.axis, w.at, cu + Math.cos(a) * ru * k, cz + Math.sin(a) * rz * k);
  });
  quad(g, arc(0, Math.PI * 2, 1.05), '#2a2a2e');
  quad(g, arc(0, Math.PI, 1), '#e84a4a');
  quad(g, arc(Math.PI, Math.PI * 2, 1), '#f4f1ea');
  quad(g, wallQuad(w.axis, w.at, w.from, w.to, cz - 1, cz + 1), '#2a2a2e');
  quad(g, arc(0, Math.PI * 2, 0.28), '#2a2a2e');
  quad(g, arc(0, Math.PI * 2, 0.17), '#f4f1ea');
};

/** Tall wooden perch; Gliscor hangs from the crossbar to sleep. */
const perch: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  shadow(g, x + 0.5, y + 0.5, 0.3);
  box(g, x + 0.25, y + 0.25, 0.5, 0.5, 2, '#6b4423');
  box(g, x + 0.44, y + 0.44, 0.12, 0.12, 36, '#8a5a32');
  box(g, x + 0.1, y + 0.44, 0.8, 0.12, 2, '#8a5a32', { z0: 34 });
};

/** Bullseye on a stand: Flamethrower and Water Shuriken practice. It flashes when hit. */
const target: DrawFn = (g, p, c) => {
  const x = X(p), y = Y(p);
  shadow(g, x + 0.5, y + 0.5, 0.3);
  box(g, x + 0.45, y + 0.45, 0.1, 0.1, 8, '#6b4423');
  const hit = busy(c) && Math.floor(c.t / 300) % 4 >= 2;
  const ring = (k: number, col: string) => {
    const pts: Pt[] = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return iso(x + 0.5, y + 0.5 + Math.cos(a) * 0.4 * k, 18 + Math.sin(a) * 9 * k);
    });
    quad(g, pts, col);
  };
  ring(1, hit ? '#fff3c0' : '#f4f1ea');
  ring(0.7, '#e84a4a');
  ring(0.42, '#f4f1ea');
  ring(0.18, '#e84a4a');
};

/** Flat rock in a small pond for Greninja. */
const pondrock: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  box(g, x + 0.15, y + 0.15, 0.7, 0.7, 6, '#8a8f99', { top: '#a9aeb7' });
  box(g, x + 0.3, y + 0.25, 0.3, 0.25, 1, '#9aa0aa', { z0: 6 });
};

const dogbed: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  shadow(g, x + 0.5, y + 0.5, 0.5);
  box(g, x + 0.02, y + 0.02, 0.96, 0.96, 4, '#c0392b');
  box(g, x + 0.15, y + 0.15, 0.7, 0.7, 1, '#f3d9a0', { z0: 2 });
  box(g, x + 0.02, y + 0.02, 0.2, 0.96, 3, '#a83226', { z0: 4 });
  box(g, x + 0.02, y + 0.02, 0.96, 0.2, 3, '#a83226', { z0: 4 });
};

const sleepmat: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  box(g, x + 0.1, y + 0.15, 0.8, 0.7, 1, '#3a6fc4', { top: '#5a8ad8' });
};

const berrybowl: DrawFn = (g, p) => {
  const x = X(p), y = Y(p);
  shadow(g, x + 0.5, y + 0.5, 0.3);
  box(g, x + 0.25, y + 0.25, 0.5, 0.5, 4, '#2f5fbf');
  const [cx, cy] = tileCenter(x, y, 4);
  rects(g, cx, cy, [[-4, -2, 2, 2, '#d33b3b'], [-1, -3, 2, 2, '#3f6fd8'], [2, -2, 2, 2, '#ffb3c7'], [0, -1, 2, 1, '#7a3fa0']]);
};

const wall = (draw: DrawFn, animated = false): PropDef => ({ parts: [{ draw, animated }] });
const one = (draw: DrawFn, animated = false): PropDef => ({ parts: [{ draw, animated }] });

export const PROP_DEFS: Record<string, PropDef> = {
  window: wall(windowProp, true),
  clock: wall(clock, true),
  beltrack: wall(beltrack),
  poster: wall(poster),
  mirror: wall(mirror),
  neon: { parts: [{ draw: neon, animated: true }], light: (p, c) => {
    const w = p.wall!;
    return { gx: (w.from + w.to) / 2, gy: w.at + 0.6, z: 20, r: 2, color: '#ff4fa3', strength: 0.35 + c.night * 0.65 };
  } },
  dummy: one(dummy, true),
  heavybag: one(heavybag, true),
  waterjug: one(waterjug),
  rack_back: { parts: [{ draw: rackBack, animated: true }], low: true },
  rack_front: { parts: [{ draw: rackFront, layer: 80 }] },
  bench: { parts: [{ draw: bench }], low: true },
  treadmill: { parts: [{ draw: treadmill, animated: true }], low: true },
  treadconsole: one(treadconsole, true),
  stool: { parts: [{ draw: stool }], low: true },
  dumbbells: one(dumbbells),
  platetree: one(platetree),
  chalk: one(chalk),
  cooler: one(cooler),
  kettlebells: one(kettlebells),
  desk: { parts: [{ draw: desk, animated: true }], light: (p, c) =>
    c.occupant ? { gx: X(p) + 0.5, gy: Y(p) + 0.6, z: 20, r: 1.6, color: '#3ff0d8', strength: 0.25 + c.night * 0.6 } : null },
  officechair: { parts: [{ draw: officechairSeat }, { draw: officechairBack, layer: 80 }], low: true },
  coffeemachine: one(coffeemachine, true),
  plant: one(plant, true),
  serverrack: { parts: [{ draw: serverrack, animated: true }], light: (p, c) =>
    ({ gx: X(p) + 0.5, gy: Y(p) + 1, z: 14, r: 1.2, color: '#3ff0d8', strength: c.night * 0.5 }) },
  floorlamp: { parts: [{ draw: floorlamp }], light: lampLight(28) },
  beanbag: { parts: [{ draw: beanbag }], low: true },
  golfscreen: { parts: [{ draw: golfscreen, animated: true }], light: (p, c) => {
    const w = p.wall!;
    return busy(c) || c.night < 0.5 ? { gx: w.at + 1, gy: (w.from + w.to) / 2, z: 20, r: 2.4, color: '#9fd4f0', strength: 0.15 + c.night * 0.5 } : null;
  } },
  ballbucket: one(ballbucket),
  golfbag: one(golfbag),
  golfflag: one(golfflag, true),
  couch: { parts: [{ draw: couchBase }, { draw: couchFront, layer: 80, at: [0, 1] }], low: true },
  coffeetable: one(coffeetable),
  fridge: { parts: [{ draw: fridge, animated: true }], light: (p, c) =>
    c.occupant ? { gx: X(p) + 0.5, gy: Y(p) + 1.2, z: 18, r: 1.4, color: '#fff3c0', strength: 0.3 + c.night * 0.6 } : null },
  counter: one(counter),
  stove: one(stove, true),
  table: one(table),
  bed: { parts: [{ draw: bed }], low: true },
  blanket: { parts: [{ draw: blanket, layer: 80, at: [1, 1] }] },
  nightstand: { parts: [{ draw: nightstand }], light: lampLight(18) },
  healer: one(healer, true),
  pokeposter: wall(pokeposter),
  perch: one(perch),
  target: one(target, true),
  pondrock: { parts: [{ draw: pondrock }], low: true },
  dogbed: { parts: [{ draw: dogbed }], low: true },
  berrybowl: one(berrybowl),
  sleepmat: { parts: [{ draw: sleepmat }], low: true },
  vanity: { parts: [{ draw: vanity, animated: true }], light: (p, c) =>
    c.night > 0.05 ? { gx: X(p) + 0.5, gy: Y(p) + 0.8, z: 26, r: 1.3, color: '#fff3e0', strength: c.night * 0.7 } : null },
};
