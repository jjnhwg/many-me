// The roster. Every Justin shares the base avatar; outfits + personality knobs differ.
// Pokémon set `species` instead and are drawn by render/pokemon.ts.
import type { Category } from './activities.config';

export const avatar = {
  skin: '#d9a47e',
  skinShade: '#bf8762',
  hair: '#1f1b22',
  hairHi: '#3a3340',
  eye: '#1f1b22',
};

export type Outfit = {
  id: string;
  top: string;
  topShade: string;
  bottom: string;
  shoes: string;
  sleeves: 'long' | 'short' | 'none';
  shorts?: boolean;
  barefoot?: boolean;
  accessory?: 'belt' | 'headphones' | 'cap' | 'headband';
  accent: string;
};

export const outfits: Record<string, Outfit> = {
  gi: { id: 'gi', top: '#f4f1ea', topShade: '#d4cfc3', bottom: '#ece8de', shoes: '#d9a47e', sleeves: 'long', barefoot: true, accessory: 'belt', accent: '#ffffff' },
  gym: { id: 'gym', top: '#e8642c', topShade: '#c44f1f', bottom: '#2b2d33', shoes: '#f3f3f3', sleeves: 'none', shorts: true, accessory: 'headband', accent: '#f3f3f3' },
  dev: { id: 'dev', top: '#4a4561', topShade: '#3a3650', bottom: '#3b5a8a', shoes: '#1d1d22', sleeves: 'long', accessory: 'headphones', accent: '#3ff0d8' },
  golf: { id: 'golf', top: '#7cc4a4', topShade: '#5fa887', bottom: '#d8c8a0', shoes: '#f4f1ea', sleeves: 'short', accessory: 'cap', accent: '#1f4f8f' },
  lounge: { id: 'lounge', top: '#f2a7c3', topShade: '#d98aa8', bottom: '#9aa3b0', shoes: '#7ad1c9', sleeves: 'short', accent: '#7ad1c9' },
};

export type Species = 'arcanine' | 'greninja' | 'gliscor' | 'lucario' | 'latios';

export type CloneConfig = {
  id: string;
  name: string;
  role?: string;           // "BJJ", "Gym"...; Pokémon go by name alone
  outfit: string;          // unused for Pokémon
  species?: Species;
  cries?: string[];        // replaces the generic idle / walking chatter
  homeZone: string;
  color: string;           // UI chip color
  speed: number;           // tiles / sim second
  affinities: Partial<Record<Category, number>>;
  durationMul?: Partial<Record<Category, number>>;
  energyMul?: number;      // multiplier on energy drain
  followUps?: Record<string, Record<string, number>>; // after X, boost Y by factor
  startPoint: string;
};

export const roster: CloneConfig[] = [
  {
    id: 'bjj', name: 'Justin', role: 'BJJ', outfit: 'gi', homeZone: 'dojo', color: '#2f5fbf', speed: 2.3,
    affinities: { bjj: 7, gym: 1.2, dev: 0.2, golf: 0.4, pokemon: 0.5, coffee: 0.4, eat: 1, rest: 0.7, selfcare: 0.4, sleep: 1, wander: 0.7 },
    durationMul: { rest: 0.6 }, energyMul: 0.75,
    followUps: { roll: { stretch: 2.5, roll: 1.5 }, drill: { roll: 2 } },
    startPoint: 'dojo_drill1',
  },
  {
    id: 'gym', name: 'Justin', role: 'Gym', outfit: 'gym', homeZone: 'gym', color: '#e8642c', speed: 1.9,
    affinities: { gym: 7, bjj: 0.8, dev: 0.2, golf: 0.4, pokemon: 0.5, coffee: 0.4, eat: 1.3, rest: 0.9, selfcare: 0.5, sleep: 1, wander: 0.6 },
    followUps: { squat: { gymrest: 5, shake: 2 }, press: { gymrest: 5, shake: 2 }, gymrest: { squat: 1.6, press: 1.6 } },
    startPoint: 'gym_squat',
  },
  {
    id: 'dev', name: 'Justin', role: 'Dev', outfit: 'dev', homeZone: 'dev', color: '#3ff0d8', speed: 1.8,
    affinities: { dev: 7, coffee: 1.6, golf: 0.5, pokemon: 0.8, gym: 0.3, bjj: 0.2, eat: 1, rest: 0.8, selfcare: 0.3, sleep: 1, wander: 0.5 },
    durationMul: { dev: 1.5 },
    followUps: { code: { coffee: 3 } },
    startPoint: 'dev_desk1',
  },
  {
    id: 'golf', name: 'Justin', role: 'Golf', outfit: 'golf', homeZone: 'golf', color: '#3f8f4f', speed: 1.7,
    affinities: { golf: 7, gym: 0.6, pokemon: 0.6, coffee: 0.9, dev: 0.3, bjj: 0.3, eat: 1, rest: 1, selfcare: 0.4, sleep: 1, wander: 0.9 },
    followUps: { range: { putt: 2.5 }, putt: { range: 1.5 } },
    startPoint: 'golf_tee',
  },
  {
    id: 'chill', name: 'Justin', role: 'Chill', outfit: 'lounge', homeZone: 'lounge', color: '#f29bb8', speed: 1.5,
    affinities: { rest: 5, eat: 2, selfcare: 1.6, wander: 1.4, golf: 0.6, pokemon: 1.6, gym: 0.3, bjj: 0.3, dev: 0.3, coffee: 0.6, sleep: 1.2 },
    durationMul: { rest: 1.4 }, energyMul: 1.3,
    startPoint: 'couch2',
  },
  // Pokémon live in the Pokémon room and only do activities that list them in `only`.
  {
    id: 'arcanine', name: 'Arcanine', species: 'arcanine', outfit: '', homeZone: 'pokemon', color: '#e8742c', speed: 2.6,
    affinities: { pokemon: 5, rest: 2, eat: 1.4, wander: 1.6, sleep: 1 },
    cries: ['Arooo!', 'woof', '*tail wag*', '🔥'],
    startPoint: 'poke_bed',
  },
  {
    id: 'greninja', name: 'Greninja', species: 'greninja', outfit: '', homeZone: 'pokemon', color: '#2c4f96', speed: 2.4,
    affinities: { pokemon: 5, rest: 2.5, eat: 1.2, wander: 1.4, sleep: 1 },
    followUps: { watershuriken: { meditate: 2 } },
    cries: ['Gekkouga.', '...', '💧'],
    startPoint: 'poke_rock',
  },
  {
    id: 'gliscor', name: 'Gliscor', species: 'gliscor', outfit: '', homeZone: 'pokemon', color: '#8e6cc4', speed: 2.0,
    affinities: { pokemon: 6, eat: 1.4, wander: 2, sleep: 1 },
    cries: ['Gli-gli!', 'Gliscor!', '🦇'],
    startPoint: 'poke_glide1',
  },
  {
    id: 'lucario', name: 'Lucario', species: 'lucario', outfit: '', homeZone: 'pokemon', color: '#3a6fc4', speed: 2.4,
    affinities: { pokemon: 5, eat: 1.2, wander: 1.4, sleep: 1 },
    cries: ['Kwah!', '...', 'I sense your aura.'],
    startPoint: 'poke_mat',
  },
  {
    id: 'latios', name: 'Latios', species: 'latios', outfit: '', homeZone: 'pokemon', color: '#3f6fd8', speed: 3,
    affinities: { pokemon: 6, eat: 1.2, wander: 2, sleep: 1 },
    cries: ['Hyuuun!', 'Latios!', '✈️'],
    startPoint: 'poke_hover',
  },
];

/** "Justin · Gym", or just the name for someone without a role. */
export const labelOf = (cfg: CloneConfig): string => (cfg.role ? `${cfg.name} · ${cfg.role}` : cfg.name);
