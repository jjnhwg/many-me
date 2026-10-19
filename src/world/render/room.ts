// Static geometry: floor tiles + decals + slab edge, tall back walls, low partitions.
import { Graphics } from 'pixi.js';
import { depth, iso } from '../../engine/iso';
import { walls, WALL_LOW, WALL_TALL, WORLD_H, WORLD_W, zoneAt, type Zone } from '../zones.config';
import { box, quad, shade, wallQuad } from './draw';

const hash = (x: number, y: number) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

function floorColor(z: Zone, x: number, y: number): string {
  const { a, b, pattern } = z.floor;
  switch (pattern) {
    case 'planks': return (y + Math.floor((x + (y % 2) * 2) / 3)) % 2 ? a : b;
    case 'checker': return (x + y) % 2 ? a : b;
    case 'tile': return (x + y) % 2 ? a : b;
    case 'rubber':
    case 'carpet': return hash(x, y) % 5 === 0 ? b : a;
  }
}

const tileQuad = (x: number, y: number, inset = 0, z = 0) =>
  [iso(x + inset, y + inset, z), iso(x + 1 - inset, y + inset, z), iso(x + 1 - inset, y + 1 - inset, z), iso(x + inset, y + 1 - inset, z)] as [number, number][];

const rectQuad = (x0: number, y0: number, x1: number, y1: number, z = 0) =>
  [iso(x0, y0, z), iso(x1, y0, z), iso(x1, y1, z), iso(x0, y1, z)] as [number, number][];

export function drawFloor(): Graphics {
  const g = new Graphics();
  // Slab thickness along the two front edges (dollhouse look).
  const T = 8;
  for (let y = 0; y < WORLD_H; y++) {
    const z = zoneAt(WORLD_W - 1, y)!;
    quad(g, [iso(WORLD_W, y, 0), iso(WORLD_W, y + 1, 0), iso(WORLD_W, y + 1, -T), iso(WORLD_W, y, -T)], shade(z.floor.a, -0.55));
  }
  for (let x = 0; x < WORLD_W; x++) {
    const z = zoneAt(x, WORLD_H - 1)!;
    quad(g, [iso(x, WORLD_H, 0), iso(x + 1, WORLD_H, 0), iso(x + 1, WORLD_H, -T), iso(x, WORLD_H, -T)], shade(z.floor.a, -0.4));
  }
  quad(g, [iso(0, WORLD_H, -T), iso(WORLD_W, WORLD_H, -T), iso(WORLD_W, WORLD_H, -T - 2), iso(0, WORLD_H, -T - 2)], '#1a1622');
  quad(g, [iso(WORLD_W, 0, -T), iso(WORLD_W, WORLD_H, -T), iso(WORLD_W, WORLD_H, -T - 2), iso(WORLD_W, 0, -T - 2)], '#1a1622');

  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const z = zoneAt(x, y)!;
      quad(g, tileQuad(x, y), floorColor(z, x, y));
      if (z.floor.pattern === 'tile') {
        g.poly(tileQuad(x, y).flat()).stroke({ color: shade(z.floor.a, -0.12), width: 1, alpha: 0.6 });
      } else if (z.floor.pattern === 'rubber' && hash(x, y) % 3 === 0) {
        const [sx, sy] = iso(x + 0.3 + (hash(y, x) % 5) / 10, y + 0.4, 0);
        g.rect(Math.round(sx), Math.round(sy), 1, 1).fill(shade(z.floor.a, 0.15));
      }
    }
  }

  // Decals: dojo mats, golf turf, rugs, hallway runner.
  quad(g, rectQuad(1, 1, 9, 8), '#5b83d6');
  for (let my = 0; my < 3; my++) {
    for (let mx = 0; mx < 4; mx++) {
      const x0 = 1.15 + mx * 1.95;
      const y0 = 1.15 + my * 2.25;
      quad(g, rectQuad(x0, y0, x0 + 1.85, y0 + 2.15), (mx + my) % 2 ? '#2f5fbf' : '#2a55ab');
    }
  }
  // Driving range: hitting mat in front of the screen, putting green in the corner.
  quad(g, rectQuad(1.6, 14.8, 4.6, 17.6), '#2f5f33');
  quad(g, rectQuad(1.8, 15.0, 4.4, 17.4), '#3f8a45');
  quad(g, rectQuad(1.8, 16.95, 4.4, 17.05), '#e8f2e0');
  quad(g, rectQuad(5.3, 18.4, 9.6, 20.9), '#5fae55');
  quad(g, rectQuad(5.5, 18.6, 9.4, 20.7), '#8fd47a');
  quad(g, rectQuad(12.2, 14.2, 16.2, 17.8), '#5fb8b0');
  quad(g, rectQuad(12.45, 14.45, 15.95, 17.55), '#7ad1c9');
  quad(g, rectQuad(0.5, 9.7, 29.5, 11.3), '#b9b09d');
  quad(g, rectQuad(0.65, 9.85, 29.35, 11.15), '#c9a46c');
  // Pokémon room: a big Poké Ball on the floor and a pond around Greninja's rock.
  const disc = (cx: number, cy: number, r: number, a0: number, a1: number) =>
    Array.from({ length: 13 }, (_, i) => {
      const a = a0 + ((a1 - a0) * i) / 12;
      return iso(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0);
    }) as [number, number][];
  quad(g, disc(35, 12, 2.6, 0, Math.PI * 2), '#2a2a2e');
  quad(g, disc(35, 12, 2.4, Math.PI * 0.75, Math.PI * 1.75), '#e84a4a');
  quad(g, disc(35, 12, 2.4, -Math.PI * 0.25, Math.PI * 0.75), '#f4f1ea');
  // Black band across the middle, along the line between the two halves.
  const [dx, dy, px, py] = [Math.SQRT1_2 * 2.4, -Math.SQRT1_2 * 2.4, Math.SQRT1_2 * 0.18, Math.SQRT1_2 * 0.18];
  quad(g, [iso(35 - dx - px, 12 - dy - py), iso(35 + dx - px, 12 + dy - py), iso(35 + dx + px, 12 + dy + py), iso(35 - dx + px, 12 - dy + py)], '#2a2a2e');
  quad(g, disc(35, 12, 0.7, 0, Math.PI * 2), '#2a2a2e');
  quad(g, disc(35, 12, 0.45, 0, Math.PI * 2), '#f4f1ea');
  quad(g, disc(38.4, 9.5, 1.5, 0, Math.PI * 2), '#3d7fb8');
  quad(g, disc(38.4, 9.5, 1.25, 0, Math.PI * 2), '#5fa8d8');
  // Kitchen floor sheen.
  quad(g, rectQuad(18, 13, 24, 18.5), '#ffffff', 0.25);
  return g;
}

/** Tall back walls: one Graphics, drawn behind everything. */
export function drawBackWalls(): Graphics {
  const g = new Graphics();
  const H = WALL_TALL;
  const T = 0.28;
  for (const run of walls.filter((w) => w.tall)) {
    for (let i = run.from; i < run.to; i++) {
      const z = run.axis === 'y' ? zoneAt(i, 0)! : zoneAt(0, i)!;
      const wp = z.wallpaper;
      const dark = run.axis === 'x' ? -0.1 : 0;
      quad(g, wallQuad(run.axis, run.at, i, i + 1, 0, H), shade(wp.base, dark));
      switch (wp.pattern) {
        case 'stripes':
          for (let k = 0; k < 4; k++) quad(g, wallQuad(run.axis, run.at, i + k / 4, i + k / 4 + 0.1, 4, H), shade(wp.stripe, dark));
          break;
        case 'dots':
          for (let k = 0; k < 3; k++) for (let r = 0; r < 4; r++) {
            const u = i + 0.15 + k * 0.33 + (r % 2) * 0.16;
            quad(g, wallQuad(run.axis, run.at, u, u + 0.05, 12 + r * 8, 13.5 + r * 8), shade(wp.stripe, 0.25 + dark));
          }
          break;
        case 'panels':
          quad(g, wallQuad(run.axis, run.at, i, i + 1, 0, 16), shade(wp.trim, 0.25 + dark));
          quad(g, wallQuad(run.axis, run.at, i + 0.1, i + 0.9, 3, 13), shade(wp.trim, 0.1 + dark));
          quad(g, wallQuad(run.axis, run.at, i, i + 1, 16, 18), shade(wp.trim, dark));
          break;
        case 'plain':
          break;
      }
      quad(g, wallQuad(run.axis, run.at, i, i + 1, 0, 3), shade(wp.trim, dark));
      quad(g, wallQuad(run.axis, run.at, i, i + 1, H - 3, H), shade(wp.trim, -0.15 + dark));
      // Top cap (wall thickness).
      const cap = run.axis === 'y'
        ? [iso(i, 0, H), iso(i + 1, 0, H), iso(i + 1, -T, H), iso(i, -T, H)]
        : [iso(0, i, H), iso(0, i + 1, H), iso(-T, i + 1, H), iso(-T, i, H)];
      quad(g, cap as [number, number][], '#3a3340');
    }
  }
  // Cut ends, so the walls read as thick slabs.
  quad(g, [iso(WORLD_W, 0, 0), iso(WORLD_W, -T, 0), iso(WORLD_W, -T, H), iso(WORLD_W, 0, H)], '#2a2530');
  quad(g, [iso(0, WORLD_H, 0), iso(-T, WORLD_H, 0), iso(-T, WORLD_H, H), iso(0, WORLD_H, H)], '#2a2530');
  quad(g, [iso(-T, -T, H), iso(0, -T, H), iso(0, 0, H), iso(-T, 0, H)], '#3a3340');
  return g;
}

/** Low partition walls: one Graphics per tile segment so they depth-sort with clones. */
export function drawPartitions(): Graphics[] {
  const out: Graphics[] = [];
  for (const run of walls.filter((w) => !w.tall)) {
    for (let i = run.from; i < run.to; i++) {
      if (run.doors?.includes(i)) continue;
      const g = new Graphics();
      const [tx, ty] = run.axis === 'x' ? [run.at, i] : [i, run.at];
      const z = zoneAt(tx, ty)!;
      const col = z.wallpaper.base;
      if (run.axis === 'x') box(g, run.at - 0.09, i, 0.18, 1, WALL_LOW, col, { top: z.wallpaper.trim });
      else box(g, i, run.at - 0.09, 1, 0.18, WALL_LOW, col, { top: z.wallpaper.trim });
      g.zIndex = depth(tx, ty, -30);
      out.push(g);
    }
  }
  return out;
}
