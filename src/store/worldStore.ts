// UI-facing state (Zustand) + world persistence. The sim itself lives in a plain mutable
// World object owned by the Game; React reads a throttled snapshot of it from here.
import { create } from 'zustand';
import type { Needs } from '../world/activities.config';
import type { AwaySummary } from '../sim/offline';
import type { SaveData, World } from '../sim/world';

export type Speed = 0 | 1 | 4 | 16;

export type CloneSnap = {
  id: string;
  label: string;
  role: string;
  color: string;
  activity: string;
  emoji: string;
  state: string;
  zone: string;
  needs: Needs;
};

export type Snapshot = { simTime: number; day: number; clones: CloneSnap[] };

export type GameApi = {
  overview(): void;
  zoomBy(step: number): void;
  focusClone(id: string): void;
  world(): World;
};

type UIState = {
  speed: Speed;
  selectedId: string | null;
  followId: string | null;
  hover: { id: string; x: number; y: number } | null;
  snapshot: Snapshot | null;
  away: AwaySummary | null;
  game: GameApi | null;
  setSpeed(s: Speed): void;
  select(id: string | null): void;
  follow(id: string | null): void;
  setHover(h: UIState['hover']): void;
  setSnapshot(s: Snapshot): void;
  setAway(a: AwaySummary | null): void;
  setGame(g: GameApi | null): void;
};

export const useWorldStore = create<UIState>((set) => ({
  speed: 1,
  selectedId: null,
  followId: null,
  hover: null,
  snapshot: null,
  away: null,
  game: null,
  setSpeed: (speed) => set({ speed }),
  select: (selectedId) => set((s) => ({ selectedId, followId: selectedId ? s.followId : null })),
  follow: (followId) => set({ followId }),
  setHover: (hover) => set({ hover }),
  setSnapshot: (snapshot) => set({ snapshot }),
  setAway: (away) => set({ away }),
  setGame: (game) => set({ game }),
}));

// ---- Persistence (localStorage for v1; swap for an API later without touching the sim) ----

const KEY = 'many-me:v1';

export function saveWorld(w: World): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(w.serialize()));
  } catch {
    // Storage full or blocked: the world just won't persist this time.
  }
}

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    return data?.v === 1 && Array.isArray(data.clones) ? data : null;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
