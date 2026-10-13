// Low-level drawing helpers: shaded iso boxes, wall-plane quads, floor ellipses.
import type { Graphics } from 'pixi.js';
import { flat, iso, type Pt } from '../../engine/iso';

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const f = (c: number) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
  r = f(r); g = f(g); b = f(b);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}

export function quad(g: Graphics, pts: Pt[], color: string, alpha = 1): void {
  g.poly(flat(pts)).fill({ color, alpha });
}

/**
 * Iso box with footprint (gx, gy)-(gx+w, gy+d), from height z0 to z0+h (art px).
 * Faces: top (light), left/+y (base), right/+x (dark).
 */
export function box(
  g: Graphics, gx: number, gy: number, w: number, d: number, h: number, color: string,
  opts: { z0?: number; top?: string; left?: string; right?: string } = {},
): void {
  const z0 = opts.z0 ?? 0;
  const z1 = z0 + h;
  if (h > 0) {
    quad(g, [iso(gx, gy + d, z1), iso(gx + w, gy + d, z1), iso(gx + w, gy + d, z0), iso(gx, gy + d, z0)], opts.left ?? color);
    quad(g, [iso(gx + w, gy, z1), iso(gx + w, gy + d, z1), iso(gx + w, gy + d, z0), iso(gx + w, gy, z0)], opts.right ?? shade(color, -0.25));
  }
  quad(g, [iso(gx, gy, z1), iso(gx + w, gy, z1), iso(gx + w, gy + d, z1), iso(gx, gy + d, z1)], opts.top ?? shade(color, 0.18));
}

/** Quad on the +y face of a box (the face toward screen-left) — e.g. a monitor's screen. */
export function faceY(gy: number, gx0: number, gx1: number, z0: number, z1: number): Pt[] {
  return [iso(gx0, gy, z1), iso(gx1, gy, z1), iso(gx1, gy, z0), iso(gx0, gy, z0)];
}

/** Quad on the +x face of a box (toward screen-right). */
export function faceX(gx: number, gy0: number, gy1: number, z0: number, z1: number): Pt[] {
  return [iso(gx, gy0, z1), iso(gx, gy1, z1), iso(gx, gy1, z0), iso(gx, gy0, z0)];
}

/** A point on a wall plane: axis 'y' => plane gy = at, u runs along gx; axis 'x' => plane gx = at, u along gy. */
export function wallPt(axis: 'x' | 'y', at: number, u: number, z: number): Pt {
  return axis === 'y' ? iso(u, at, z) : iso(at, u, z);
}

export function wallQuad(axis: 'x' | 'y', at: number, u0: number, u1: number, z0: number, z1: number): Pt[] {
  return [wallPt(axis, at, u0, z1), wallPt(axis, at, u1, z1), wallPt(axis, at, u1, z0), wallPt(axis, at, u0, z0)];
}

/** Flat ellipse on the floor (radius in grid units), for shadows, rugs and light pools. */
export function floorEllipse(g: Graphics, gx: number, gy: number, r: number, color: string, alpha = 1, z = 0): void {
  const pts: Pt[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    pts.push(iso(gx + Math.cos(a) * r, gy + Math.sin(a) * r, z));
  }
  quad(g, pts, color, alpha);
}

/** Pixel rects in screen space relative to an anchor (with an optional dark outline pass). */
export type R = [number, number, number, number, string];

export function rects(g: Graphics, ox: number, oy: number, list: R[], outline?: string): void {
  if (outline) for (const [x, y, w, h] of list) g.rect(ox + x - 1, oy + y - 1, w + 2, h + 2).fill(outline);
  for (const [x, y, w, h, c] of list) g.rect(ox + x, oy + y, w, h).fill(c);
}
