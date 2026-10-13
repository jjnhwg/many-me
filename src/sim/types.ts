import type { Dir } from '../world/zones.config';
import type { Needs } from '../world/activities.config';

export type CloneState = 'idle' | 'walking' | 'doing' | 'sleeping';

export type Moment = { kind: 'build' | 'tap' | 'doze' | 'wave'; start: number; dur: number; flag?: boolean };

export type LogEntry = { activityId: string; start: number; end?: number };

export type Clone = {
  id: string;
  name: string;
  role: string;
  outfit: string;
  pos: { x: number; y: number };
  prev: { x: number; y: number };
  dir: Dir;
  state: CloneState;
  path: [number, number][];
  target?: { activityId: string; pointId: string };
  current?: { activityId: string; pointId: string; startedAt: number; endsAt: number };
  idleFor: number;          // sim seconds left before choosing again
  needs: Needs;
  lastActivity?: string;
  totalsMs: Record<string, number>;
  counts: Record<string, number>;
  log: LogEntry[];
  // Presentation-only state (not essential to persist, but harmless)
  moment?: Moment;
  bubble?: { text: string; until: number };
  lastGreet?: number;
};
