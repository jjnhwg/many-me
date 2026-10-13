// World <-> screen math for a 2:1 isometric projection.
// Grid coords (gx, gy) are continuous; tile (x, y) spans [x, x+1] x [y, y+1].
// Screen px are "art pixels" before camera zoom.

export const TW = 32;
export const TH = 16;
const HW = TW / 2;
const HH = TH / 2;

export type Pt = [number, number];

export function iso(gx: number, gy: number, z = 0): Pt {
  return [(gx - gy) * HW, (gx + gy) * HH - z];
}

/** Screen position of a tile's center (where a clone's feet go). */
export function tileCenter(tx: number, ty: number, z = 0): Pt {
  return iso(tx + 0.5, ty + 0.5, z);
}

export function screenToGrid(sx: number, sy: number): Pt {
  return [(sx / HW + sy / HH) / 2, (sy / HH - sx / HW) / 2];
}

/**
 * Painter's-order key. Anything on tile (x, y) sorts by x + y; `layer` breaks ties:
 *  walls -30, props +30, clones +60, front-of-clone prop parts +80.
 */
export function depth(gx: number, gy: number, layer = 0): number {
  return Math.round((gx + gy) * 100) + layer;
}

/** Flatten points for Graphics.poly. */
export function flat(pts: Pt[]): number[] {
  const out: number[] = [];
  for (const [x, y] of pts) out.push(x, y);
  return out;
}
