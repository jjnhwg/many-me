// The floor plan as data. Coordinates are tiles on a W x H grid.
// x grows toward screen down-right, y toward screen down-left.

export const WORLD_W = 30;
export const WORLD_H = 21;

export type Dir = 'SE' | 'SW' | 'NE' | 'NW';
export type Rect = { x: number; y: number; w: number; h: number };

export type Zone = {
  id: string;
  name: string;
  rect: Rect;
  accent: string;
  floor: { a: string; b: string; pattern: 'planks' | 'checker' | 'rubber' | 'carpet' | 'tile' };
  wallpaper: { base: string; stripe: string; trim: string; pattern: 'stripes' | 'dots' | 'panels' | 'plain' };
};

export const zones: Zone[] = [
  {
    id: 'dojo', name: 'Dojo', rect: { x: 0, y: 0, w: 10, h: 9 }, accent: '#2f5fbf',
    floor: { a: '#c9a46c', b: '#bb9660', pattern: 'planks' },
    wallpaper: { base: '#e9dcc0', stripe: '#dccca9', trim: '#7a4b2a', pattern: 'panels' },
  },
  {
    id: 'gym', name: 'Gym', rect: { x: 10, y: 0, w: 10, h: 9 }, accent: '#e8642c',
    floor: { a: '#3b3f47', b: '#353940', pattern: 'rubber' },
    wallpaper: { base: '#8a8f99', stripe: '#7c818b', trim: '#e8642c', pattern: 'stripes' },
  },
  {
    id: 'dev', name: 'Dev Desk', rect: { x: 20, y: 0, w: 10, h: 9 }, accent: '#3ff0d8',
    floor: { a: '#2c2a3d', b: '#262435', pattern: 'carpet' },
    wallpaper: { base: '#2f2b45', stripe: '#38335a', trim: '#ff4fa3', pattern: 'dots' },
  },
  {
    id: 'hall', name: 'Hallway', rect: { x: 0, y: 9, w: 30, h: 3 }, accent: '#a7a196',
    floor: { a: '#d8d2c4', b: '#cfc8b8', pattern: 'tile' },
    wallpaper: { base: '#d8d2c4', stripe: '#cfc8b8', trim: '#8c8576', pattern: 'plain' },
  },
  {
    id: 'golf', name: 'Driving Range', rect: { x: 0, y: 12, w: 10, h: 9 }, accent: '#3f8f4f',
    floor: { a: '#4f8a4a', b: '#477f43', pattern: 'carpet' },
    wallpaper: { base: '#d6e8cf', stripe: '#c4dcbb', trim: '#2f5f3a', pattern: 'panels' },
  },
  {
    id: 'lounge', name: 'Lounge', rect: { x: 10, y: 12, w: 20, h: 9 }, accent: '#f29bb8',
    floor: { a: '#f1e3e0', b: '#e6d4d1', pattern: 'checker' },
    wallpaper: { base: '#bfe6e1', stripe: '#a9dcd5', trim: '#f29bb8', pattern: 'stripes' },
  },
];

export function zoneAt(x: number, y: number): Zone | undefined {
  return zones.find((z) => x >= z.rect.x && y >= z.rect.y && x < z.rect.x + z.rect.w && y < z.rect.y + z.rect.h);
}

// ---- Walls -------------------------------------------------------------------
// Tall walls run along the world's back edges (y = 0 and x = 0).
// Low partitions sit on interior tile edges and block movement except at doors.
// `axis: 'x'` = the wall lies on the line gx = at, spanning gy in [from, to).
// `axis: 'y'` = the wall lies on the line gy = at, spanning gx in [from, to).

export type WallRun = { axis: 'x' | 'y'; at: number; from: number; to: number; doors?: number[]; tall?: boolean };

export const WALL_TALL = 46;
export const WALL_LOW = 13;

export const walls: WallRun[] = [
  { axis: 'y', at: 0, from: 0, to: WORLD_W, tall: true },
  { axis: 'x', at: 0, from: 0, to: WORLD_H, tall: true },
  { axis: 'x', at: 10, from: 0, to: 9 },
  { axis: 'x', at: 20, from: 0, to: 9 },
  { axis: 'x', at: 10, from: 12, to: WORLD_H, doors: [18, 19] },
  { axis: 'y', at: 12, from: 0, to: WORLD_W, doors: [4, 5, 13, 14, 21, 22, 23, 24] },
];

// ---- Interaction points ---------------------------------------------------------
// A tile where a clone stands/sits/lies to do an activity.
// `lie` = height and grid offset used when lying down; `blocks` = extra points reserved with it.

export type Point = {
  id: string;
  tile: [number, number];
  dir: Dir;
  lie?: { z: number; offset?: [number, number] };
  blocks?: string[];
};

export const points: Point[] = [
  // Dojo
  { id: 'dojo_drill1', tile: [2, 3], dir: 'SE' },
  { id: 'dojo_drill2', tile: [2, 6], dir: 'SE' },
  { id: 'dojo_roll', tile: [4, 4], dir: 'SE' },
  { id: 'dojo_stretch1', tile: [7, 3], dir: 'SW' },
  { id: 'dojo_stretch2', tile: [7, 6], dir: 'SW' },
  { id: 'dojo_mat', tile: [1, 7], dir: 'SE', lie: { z: 2 } },
  { id: 'dojo_mat2', tile: [3, 7], dir: 'SE', lie: { z: 2 } },
  // Gym
  { id: 'gym_squat', tile: [13, 3], dir: 'SE' },
  { id: 'gym_bench', tile: [16, 3], dir: 'SE' },
  { id: 'gym_tread', tile: [11, 7], dir: 'SE' },
  { id: 'gym_stool', tile: [18, 6], dir: 'SW' },
  // Dev
  { id: 'dev_desk1', tile: [24, 2], dir: 'NE' },
  { id: 'dev_coffee', tile: [28, 5], dir: 'SE' },
  // Driving range: the golfer faces SW so the swing follows through toward the screen on the back wall.
  { id: 'golf_tee', tile: [3, 16], dir: 'SW' },
  { id: 'golf_putt', tile: [6, 20], dir: 'SE' },
  { id: 'golf_beanbag', tile: [8, 14], dir: 'SE', lie: { z: 4 } },
  // Lounge
  { id: 'couch1', tile: [11, 15], dir: 'SE', lie: { z: 7, offset: [0, 0.5] }, blocks: ['couch2'] },
  { id: 'couch2', tile: [11, 16], dir: 'SE' },
  { id: 'fridge', tile: [18, 14], dir: 'NE' },
  { id: 'kitchen_seat1', tile: [20, 17], dir: 'SE' },
  { id: 'kitchen_seat2', tile: [21, 16], dir: 'SW' },
  { id: 'bed1', tile: [26, 13], dir: 'SE', lie: { z: 9, offset: [0, 0.55] } },
  { id: 'bed2', tile: [27, 13], dir: 'SE', lie: { z: 9, offset: [0, 0.55] } },
  { id: 'vanity', tile: [28, 14], dir: 'NE' },
  // Hallway hangouts
  { id: 'hall1', tile: [3, 10], dir: 'SE' },
  { id: 'hall2', tile: [8, 11], dir: 'SW' },
  { id: 'hall3', tile: [14, 10], dir: 'SE' },
  { id: 'hall4', tile: [19, 9], dir: 'SW' },
  { id: 'hall5', tile: [24, 11], dir: 'SE' },
  { id: 'hall6', tile: [28, 10], dir: 'SW' },
];

export const pointById = new Map(points.map((p) => [p.id, p]));

// ---- Props -------------------------------------------------------------------------
// `kind` selects a draw function in render/props.ts. Floor props occupy `tile` (+ `size`).
// Wall props sit on a wall plane: `wall: { axis, at, from, to, z0, z1 }`.
// `point` links a prop to the point it reacts to (monitor glows when someone codes, etc.).

export type Prop = {
  kind: string;
  tile?: [number, number];
  size?: [number, number];
  solid?: boolean;
  wall?: { axis: 'x' | 'y'; at: number; from: number; to: number; z0: number; z1: number };
  point?: string;
  color?: string;
};

export const props: Prop[] = [
  // Dojo
  { kind: 'dummy', tile: [5, 4], solid: true, point: 'dojo_roll' },
  { kind: 'heavybag', tile: [8, 1], solid: true },
  { kind: 'waterjug', tile: [0, 8], solid: true },
  { kind: 'clock', wall: { axis: 'y', at: 0, from: 3.6, to: 4.6, z0: 30, z1: 40 } },
  { kind: 'window', wall: { axis: 'y', at: 0, from: 6.4, to: 8.4, z0: 16, z1: 38 } },
  { kind: 'beltrack', wall: { axis: 'x', at: 0, from: 1.8, to: 3.8, z0: 20, z1: 32 } },
  { kind: 'poster', wall: { axis: 'x', at: 0, from: 5.2, to: 6.6, z0: 16, z1: 36 }, color: '#2f5fbf' },
  // Gym
  { kind: 'rack_back', tile: [13, 3], point: 'gym_squat' },
  { kind: 'rack_front', tile: [13, 3] },
  { kind: 'bench', tile: [16, 3], point: 'gym_bench' },
  { kind: 'treadmill', tile: [11, 7], point: 'gym_tread' },
  { kind: 'treadconsole', tile: [12, 7], solid: true },
  { kind: 'stool', tile: [18, 6] },
  { kind: 'dumbbells', tile: [18, 1], solid: true },
  { kind: 'platetree', tile: [15, 1], solid: true },
  { kind: 'chalk', tile: [11, 4], solid: true },
  { kind: 'cooler', tile: [19, 7], solid: true },
  { kind: 'kettlebells', tile: [17, 7], solid: true },
  { kind: 'mirror', wall: { axis: 'y', at: 0, from: 14.4, to: 17.6, z0: 8, z1: 38 } },
  { kind: 'window', wall: { axis: 'y', at: 0, from: 10.8, to: 12.4, z0: 16, z1: 38 } },
  // Dev
  { kind: 'desk', tile: [24, 1], solid: true, point: 'dev_desk1' },
  { kind: 'officechair', tile: [24, 2] },
  { kind: 'coffeemachine', tile: [29, 5], solid: true, point: 'dev_coffee' },
  { kind: 'plant', tile: [29, 1], solid: true },
  { kind: 'plant', tile: [20, 7], solid: true },
  { kind: 'serverrack', tile: [29, 3], solid: true },
  { kind: 'neon', wall: { axis: 'y', at: 0, from: 23.6, to: 25.4, z0: 24, z1: 36 } },
  { kind: 'window', wall: { axis: 'y', at: 0, from: 27.2, to: 28.6, z0: 16, z1: 38 } },
  { kind: 'poster', wall: { axis: 'y', at: 0, from: 20.6, to: 21.6, z0: 18, z1: 34 }, color: '#ff4fa3' },
  // Hall
  { kind: 'plant', tile: [29, 9], solid: true },
  { kind: 'window', wall: { axis: 'x', at: 0, from: 9.4, to: 11.6, z0: 16, z1: 38 } },
  // Driving range
  { kind: 'golfscreen', wall: { axis: 'x', at: 0, from: 13.6, to: 18.6, z0: 6, z1: 40 }, point: 'golf_tee' },
  { kind: 'ballbucket', tile: [4, 17], solid: true },
  { kind: 'golfbag', tile: [0, 20], solid: true },
  { kind: 'floorlamp', tile: [0, 12], solid: true },
  { kind: 'beanbag', tile: [8, 14], point: 'golf_beanbag' },
  { kind: 'golfflag', tile: [8, 20], solid: true, point: 'golf_putt' },
  { kind: 'plant', tile: [9, 12], solid: true },
  // Lounge — living
  { kind: 'couch', tile: [11, 15], size: [1, 2], point: 'couch1' },
  { kind: 'coffeetable', tile: [13, 15], size: [1, 2], solid: true },
  { kind: 'plant', tile: [17, 13], solid: true },
  { kind: 'floorlamp', tile: [10, 13], solid: true },
  // Lounge — kitchen
  { kind: 'fridge', tile: [18, 13], solid: true, point: 'fridge' },
  { kind: 'counter', tile: [19, 13], solid: true },
  { kind: 'stove', tile: [20, 13], solid: true },
  { kind: 'table', tile: [21, 17], solid: true },
  { kind: 'stool', tile: [20, 17] },
  { kind: 'stool', tile: [21, 16] },
  // Lounge — bedroom
  { kind: 'bed', tile: [26, 13], size: [2, 2] },
  { kind: 'blanket', tile: [26, 13], size: [2, 2] },
  { kind: 'nightstand', tile: [25, 13], solid: true },
  { kind: 'vanity', tile: [28, 13], solid: true, point: 'vanity' },
  { kind: 'plant', tile: [29, 19], solid: true },
];
