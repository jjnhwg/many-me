// A* on a 4-connected tile grid with blocked tiles and blocked edges (thin walls).

export type Tile = [number, number];

export class Grid {
  readonly blocked: Uint8Array;
  private readonly walls = new Set<string>();

  constructor(readonly w: number, readonly h: number) {
    this.blocked = new Uint8Array(w * h);
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  setBlocked(x: number, y: number, v = true): void {
    if (this.inBounds(x, y)) this.blocked[y * this.w + x] = v ? 1 : 0;
  }

  isWalkable(x: number, y: number): boolean {
    return this.inBounds(x, y) && this.blocked[y * this.w + x] === 0;
  }

  /** Block movement between two orthogonally adjacent tiles. */
  blockEdge(a: Tile, b: Tile): void {
    this.walls.add(edgeKey(a, b));
  }

  wallBetween(a: Tile, b: Tile): boolean {
    return this.walls.has(edgeKey(a, b));
  }
}

function edgeKey(a: Tile, b: Tile): string {
  const [p, q] = a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? [a, b] : [b, a];
  return `${p[0]},${p[1]}|${q[0]},${q[1]}`;
}

const DIRS: Tile[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * Returns the tiles to walk through (excluding start, including goal), or null.
 * The goal tile itself may be "blocked" (e.g. a chair) as long as we can step into it.
 */
export function findPath(grid: Grid, start: Tile, goal: Tile): Tile[] | null {
  const { w } = grid;
  const idx = (x: number, y: number) => y * w + x;
  const sIdx = idx(start[0], start[1]);
  const gIdx = idx(goal[0], goal[1]);
  if (sIdx === gIdx) return [];

  const g = new Map<number, number>([[sIdx, 0]]);
  const came = new Map<number, number>();
  const open: { i: number; f: number }[] = [{ i: sIdx, f: 0 }];
  const closed = new Set<number>();
  const hCost = (i: number) => Math.abs((i % w) - goal[0]) + Math.abs(Math.floor(i / w) - goal[1]);

  while (open.length) {
    let best = 0;
    for (let k = 1; k < open.length; k++) if (open[k].f < open[best].f) best = k;
    const { i } = open.splice(best, 1)[0];
    if (i === gIdx) break;
    if (closed.has(i)) continue;
    closed.add(i);

    const cx = i % w;
    const cy = Math.floor(i / w);
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!grid.inBounds(nx, ny)) continue;
      const n = idx(nx, ny);
      const walkable = n === gIdx || grid.isWalkable(nx, ny);
      if (!walkable || grid.wallBetween([cx, cy], [nx, ny])) continue;
      const cost = (g.get(i) ?? 0) + 1;
      if (cost < (g.get(n) ?? Infinity)) {
        g.set(n, cost);
        came.set(n, i);
        open.push({ i: n, f: cost + hCost(n) });
      }
    }
  }

  if (!came.has(gIdx)) return null;
  const path: Tile[] = [];
  for (let c = gIdx; c !== sIdx; c = came.get(c)!) path.push([c % w, Math.floor(c / w)]);
  return path.reverse();
}
