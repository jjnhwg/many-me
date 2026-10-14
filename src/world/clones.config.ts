// The roster. The Justins share the base avatar; outfits + personality knobs differ.
// A friend can override the avatar with a `look`.
import type { Category } from './activities.config';

export type Look = {
  skin: string;
  skinShade: string;
  hair: string;
  hairHi: string;
  eye: string;
  hairStyle: 'short' | 'long';
  blush?: string;
};

export const avatar: Look = {
  skin: '#d9a47e',
  skinShade: '#bf8762',
  hair: '#1f1b22',
  hairHi: '#3a3340',
  eye: '#1f1b22',
  hairStyle: 'short',
};

export type Outfit = {
  id: string;
  top: string;
  topShade: string;
  bottom: string;
  shoes: string;
  sleeves: 'long' | 'short' | 'none';
  shorts?: boolean;
  skirt?: boolean;
  barefoot?: boolean;
  accessory?: 'belt' | 'headphones' | 'glasses' | 'headband';
  accent: string;
};

export const outfits: Record<string, Outfit> = {
  gi: { id: 'gi', top: '#f4f1ea', topShade: '#d4cfc3', bottom: '#ece8de', shoes: '#d9a47e', sleeves: 'long', barefoot: true, accessory: 'belt', accent: '#ffffff' },
  gym: { id: 'gym', top: '#e8642c', topShade: '#c44f1f', bottom: '#2b2d33', shoes: '#f3f3f3', sleeves: 'none', shorts: true, accessory: 'headband', accent: '#f3f3f3' },
  dev: { id: 'dev', top: '#4a4561', topShade: '#3a3650', bottom: '#3b5a8a', shoes: '#1d1d22', sleeves: 'long', accessory: 'headphones', accent: '#3ff0d8' },
  study: { id: 'study', top: '#c9a24a', topShade: '#ad873a', bottom: '#6b5b4b', shoes: '#5a3d2b', sleeves: 'long', accessory: 'glasses', accent: '#2a2a2a' },
  dress: { id: 'dress', top: '#f6e7a8', topShade: '#e0cd86', bottom: '#b07ce8', shoes: '#f4f1ea', sleeves: 'short', skirt: true, accent: '#ff7aa8' },
  lounge: { id: 'lounge', top: '#f2a7c3', topShade: '#d98aa8', bottom: '#9aa3b0', shoes: '#7ad1c9', sleeves: 'short', accent: '#7ad1c9' },
};

export type CloneConfig = {
  id: string;
  name: string;
  role?: string;           // omitted for friends, who go by name alone
  outfit: string;
  homeZone: string;
  color: string;           // UI chip color
  speed: number;           // tiles / sim second
  affinities: Partial<Record<Category, number>>;
  durationMul?: Partial<Record<Category, number>>;
  energyMul?: number;      // multiplier on energy drain
  followUps?: Record<string, Record<string, number>>; // after X, boost Y by factor
  startPoint: string;
  look?: Look;
};

export const roster: CloneConfig[] = [
  {
    id: 'bjj', name: 'Justin', role: 'BJJ', outfit: 'gi', homeZone: 'dojo', color: '#2f5fbf', speed: 2.3,
    affinities: { bjj: 7, gym: 1.2, dev: 0.2, study: 0.4, coffee: 0.4, eat: 1, rest: 0.7, selfcare: 0.4, sleep: 1, wander: 0.7 },
    durationMul: { rest: 0.6 }, energyMul: 0.75,
    followUps: { roll: { stretch: 2.5, roll: 1.5 }, drill: { roll: 2 } },
    startPoint: 'dojo_drill1',
  },
  {
    id: 'gym', name: 'Justin', role: 'Gym', outfit: 'gym', homeZone: 'gym', color: '#e8642c', speed: 1.9,
    affinities: { gym: 7, bjj: 0.8, dev: 0.2, study: 0.3, coffee: 0.4, eat: 1.3, rest: 0.9, selfcare: 0.5, sleep: 1, wander: 0.6 },
    followUps: { squat: { gymrest: 5, shake: 2 }, press: { gymrest: 5, shake: 2 }, gymrest: { squat: 1.6, press: 1.6 } },
    startPoint: 'gym_squat',
  },
  {
    id: 'dev', name: 'Justin', role: 'Dev', outfit: 'dev', homeZone: 'dev', color: '#3ff0d8', speed: 1.8,
    affinities: { dev: 7, coffee: 1.6, study: 1, gym: 0.3, bjj: 0.2, eat: 1, rest: 0.8, selfcare: 0.3, sleep: 1, wander: 0.5 },
    durationMul: { dev: 1.5 },
    followUps: { code: { coffee: 3 } },
    startPoint: 'dev_desk1',
  },
  {
    id: 'study', name: 'Justin', role: 'Study', outfit: 'study', homeZone: 'study', color: '#c9a24a', speed: 1.7,
    affinities: { study: 7, dev: 1, coffee: 0.9, gym: 0.3, bjj: 0.3, eat: 1, rest: 1, selfcare: 0.4, sleep: 1, wander: 0.9 },
    followUps: { read: { whiteboard: 3 }, leetcode: { whiteboard: 2.5 } },
    startPoint: 'study_laptop',
  },
  {
    id: 'chill', name: 'Justin', role: 'Chill', outfit: 'lounge', homeZone: 'lounge', color: '#f29bb8', speed: 1.5,
    affinities: { rest: 5, eat: 2, selfcare: 1.6, wander: 1.4, study: 0.6, gym: 0.3, bjj: 0.3, dev: 0.3, coffee: 0.6, sleep: 1.2 },
    durationMul: { rest: 1.4 }, energyMul: 1.3,
    startPoint: 'couch2',
  },
  {
    id: 'emily', name: 'Emily', outfit: 'dress', homeZone: 'lounge', color: '#b07ce8', speed: 1.7,
    affinities: { study: 2.5, selfcare: 3, coffee: 1.4, rest: 2, eat: 1.6, gym: 1, wander: 1.4, dev: 0.4, bjj: 0.5, sleep: 1.1 },
    followUps: { coffee: { read: 2 }, skincare: { phone: 1.6 } },
    startPoint: 'kitchen_seat1',
    look: {
      skin: '#f0c4a4', skinShade: '#d9a888', hair: '#5a3424', hairHi: '#7d4c36', eye: '#2a1d1a',
      hairStyle: 'long', blush: '#f09a9a',
    },
  },
];

export const lookOf = (id: string): Look => roster.find((r) => r.id === id)?.look ?? avatar;

/** "Justin · Gym", or just the name for someone without a role. */
export const labelOf = (cfg: CloneConfig): string => (cfg.role ? `${cfg.name} · ${cfg.role}` : cfg.name);
