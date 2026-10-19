// The Pixi side: builds the diorama, runs the fixed-step sim, renders pixel-perfect,
// handles camera + pointer input, and feeds a throttled snapshot to the React UI.
import { Application, Container, Graphics, Text } from 'pixi.js';
import { depth, iso, screenToGrid, tileCenter } from '../../engine/iso';
import { FixedStep } from '../../engine/loop';
import { activityById } from '../activities.config';
import { labelOf, outfits, roster } from '../clones.config';
import { pointById, props, WALL_TALL, WORLD_H, WORLD_W, zoneAt, type Prop } from '../zones.config';
import { fastForward } from '../../sim/offline';
import { hourOf } from '../../sim/schedule';
import { SIM_STEP_S, World } from '../../sim/world';
import type { Clone } from '../../sim/types';
import { loadSave, saveWorld, useWorldStore, type GameApi, type Snapshot } from '../../store/worldStore';
import { figureRects, OUTLINE, pose, type PoseName } from './character';
import { placePokemon, pokemonRects } from './pokemon';
import { floorEllipse, rects } from './draw';
import { lightAt } from './lighting';
import { PROP_DEFS, type DrawCtx, type PropDef } from './props';
import { drawBackWalls, drawFloor, drawPartitions } from './room';

const BG = '#15131c';
const BOUNDS = { minX: -WORLD_H * 16, maxX: WORLD_W * 16, minY: -WALL_TALL - 12, maxY: (WORLD_W + WORLD_H) * 8 + 12 };
const WORLD_CX = (BOUNDS.minX + BOUNDS.maxX) / 2;
const WORLD_CY = (BOUNDS.minY + BOUNDS.maxY) / 2;
const AWAY_CARD_MIN_MS = 60_000;

type PropView = { prop: Prop; def: PropDef; partIdx: number; g: Graphics; animated: boolean };
type CloneView = { g: Graphics; bubble: Container; bg: Graphics; text: Text; shown: string };

export class Game implements GameApi {
  private app = new Application();
  private worldLayer = new Container({ sortableChildren: true });
  private textLayer = new Container();
  private darkness = new Graphics();
  private glow = new Graphics();
  /** World offset in art px (integer, so every art pixel lands on whole device pixels). */
  private origin = { x: 0, y: 0 };
  private propViews: PropView[] = [];
  private cloneViews = new Map<string, CloneView>();
  private step = new FixedStep(SIM_STEP_S * 1000);
  private w!: World;

  private dpr = Math.min(window.devicePixelRatio || 1, 3);
  private zoomDev = 2;
  private cam = { x: WORLD_CX, y: WORLD_CY };
  private camTarget: { x: number; y: number } | null = null;
  private drag: { x: number; y: number; cx: number; cy: number; moved: boolean } | null = null;
  private wheelAcc = 0;
  private lastSnap = 0;
  private lastSave = 0;
  private host!: HTMLElement;
  private alive = true;
  private cleanups: (() => void)[] = [];

  async init(host: HTMLElement): Promise<void> {
    this.host = host;
    await this.app.init({ resizeTo: host, background: BG, antialias: false, resolution: this.dpr, autoDensity: true });
    if (!this.alive) return;
    host.appendChild(this.app.canvas);
    this.app.canvas.style.imageRendering = 'pixelated';

    this.loadWorld();
    this.buildScene();
    this.app.stage.addChild(this.worldLayer, this.textLayer);
    this.overview(true);
    this.bindInput();
    this.app.ticker.add((t) => this.frame(t.elapsedMS));
    useWorldStore.getState().setGame(this);
    if (import.meta.env.DEV) (window as unknown as { __game: Game }).__game = this;
  }

  destroy(): void {
    this.alive = false;
    if (this.w) saveWorld(this.w);
    for (const c of this.cleanups) c();
    useWorldStore.getState().setGame(null);
    try {
      this.app.destroy(true, { children: true });
    } catch {
      /* init may not have finished */
    }
  }

  world(): World {
    return this.w;
  }

  // ---- Setup -------------------------------------------------------------------------

  private loadWorld(): void {
    const save = loadSave();
    if (!save) {
      this.w = World.fresh();
      return;
    }
    this.w = World.load(save);
    const away = Date.now() - save.lastSeen;
    if (away > 1000) {
      const summary = fastForward(this.w, away);
      if (away > AWAY_CARD_MIN_MS) useWorldStore.getState().setAway(summary);
    }
  }

  private buildScene(): void {
    const L = this.worldLayer;
    const floor = drawFloor();
    floor.zIndex = -2e9;
    const back = drawBackWalls();
    back.zIndex = -1e9;
    L.addChild(floor, back, ...drawPartitions());

    for (const prop of props) {
      const def = PROP_DEFS[prop.kind];
      if (!def) continue;
      def.parts.forEach((part, partIdx) => {
        const g = new Graphics();
        if (prop.wall) g.zIndex = -1e9 + 1;
        else {
          const [x, y] = prop.tile!;
          const [w, d] = prop.size ?? [1, 1];
          const [bx, by] = part.at ? [x + part.at[0], y + part.at[1]] : def.low ? [x, y] : [x + w - 1, y + d - 1];
          g.zIndex = depth(bx, by, part.layer ?? 30);
        }
        const pv: PropView = { prop, def, partIdx, g, animated: !!part.animated };
        if (!pv.animated) part.draw(g, prop, this.drawCtx(prop, 0));
        this.propViews.push(pv);
        L.addChild(g);
      });
    }

    for (const c of this.w.clones) {
      const g = new Graphics();
      const bubble = new Container();
      const bg = new Graphics();
      const text = new Text({ text: '', style: { fontFamily: 'Pixelify Sans, system-ui, sans-serif', fontSize: 13, fill: '#1f1b22' }, resolution: this.dpr });
      text.anchor.set(0.5, 1);
      bubble.addChild(bg, text);
      bubble.visible = false;
      this.textLayer.addChild(bubble);
      L.addChild(g);
      this.cloneViews.set(c.id, { g, bubble, bg, text, shown: '' });
    }

    this.darkness.rect(-20_000, -20_000, 40_000, 40_000).fill('#ffffff');
    this.darkness.zIndex = 1e9;
    this.glow.zIndex = 1e9 + 1;
    this.glow.blendMode = 'add';
    L.addChild(this.darkness, this.glow);
  }

  private drawCtx(prop: Prop, t: number): DrawCtx {
    const hour = hourOf(this.w.simTime);
    const l = lightAt(hour);
    const pid = prop.point;
    return { t, hour, night: l.night, sky: l.sky, simTime: this.w.simTime, occupant: pid ? this.w.occupant(pid) : undefined };
  }

  // ---- Frame -----------------------------------------------------------------------------

  private frame(elapsedMs: number): void {
    if (!this.alive) return;
    const now = performance.now();
    const store = useWorldStore.getState();
    this.w.realNow = now;

    if (elapsedMs > 5000 && store.speed > 0) {
      // Tab was hidden/asleep: catch up headlessly instead of grinding thousands of ticks.
      const summary = fastForward(this.w, elapsedMs);
      if (elapsedMs > 5 * 60_000) store.setAway(summary);
      this.step.reset();
    } else {
      const ticks = this.step.advance(Math.min(elapsedMs, 250), store.speed);
      for (let i = 0; i < ticks; i++) this.w.tick(SIM_STEP_S);
    }

    const hour = hourOf(this.w.simTime);
    const light = lightAt(hour);

    for (const pv of this.propViews) {
      if (!pv.animated) continue;
      pv.g.clear();
      pv.def.parts[pv.partIdx].draw(pv.g, pv.prop, this.drawCtx(pv.prop, now));
    }
    for (const c of this.w.clones) this.drawClone(c, now, store.selectedId, store.hover?.id ?? null);

    this.darkness.visible = light.alpha > 0.01;
    this.darkness.tint = light.tint;
    this.darkness.alpha = light.alpha;
    this.drawGlow(now);

    this.updateCamera(elapsedMs, store.followId);
    this.renderWorld();
    this.updateBubbles(now);

    if (now - this.lastSnap > 250) {
      this.lastSnap = now;
      store.setSnapshot(this.snapshot());
    }
    if (now - this.lastSave > 10_000) {
      this.lastSave = now;
      saveWorld(this.w);
    }
  }

  private poseName(c: Clone): PoseName {
    const m = c.moment;
    if (m) {
      const t = this.w.simTime - m.start;
      if (m.kind === 'build') return t < 2200 ? 'facepalm' : 'fistpump';
      if (m.kind === 'tap') return t < 1500 ? 'tapRoll' : 'stretch';
      if (m.kind === 'wave') return 'wave';
    }
    if (c.state === 'walking') return 'walk';
    if ((c.state === 'doing' || c.state === 'sleeping') && c.current) return activityById.get(c.current.activityId)!.anim as PoseName;
    return 'idle';
  }

  /** Interpolated anchor of a clone in art px (feet), plus lift for lying down. */
  private cloneAnchor(c: Clone): { x: number; y: number; lying: boolean } {
    const a = this.step.alpha;
    let gx = c.prev.x + (c.pos.x - c.prev.x) * a;
    let gy = c.prev.y + (c.pos.y - c.prev.y) * a;
    let z = 0;
    const name = this.poseName(c);
    const lying = name === 'sleep';
    if (lying && c.current) {
      const lie = pointById.get(c.current.pointId)?.lie;
      if (lie) {
        z = lie.z;
        gx += lie.offset?.[0] ?? 0;
        gy += lie.offset?.[1] ?? 0;
      }
    }
    const [sx, sy] = tileCenter(gx, gy, z);
    return { x: sx, y: sy, lying };
  }

  private drawClone(c: Clone, now: number, selectedId: string | null, hoverId: string | null): void {
    const v = this.cloneViews.get(c.id)!;
    const g = v.g;
    const cfg = roster.find((r) => r.id === c.id)!;
    const name = this.poseName(c);
    const anchor = this.cloneAnchor(c);
    g.clear();

    if (cfg.species) {
      // Pokémon: one sprite per species, no back view or lying rotation (Gliscor hangs instead).
      const pp = pokemonRects(cfg.species, name, now + c.id.length * 137);
      if (name !== 'sleep') {
        g.ellipse(0, 0, 9, 3.5).fill({ color: '#000000', alpha: 0.22 });
        if (c.id === selectedId || c.id === hoverId) g.ellipse(0, 0, 12, 5).stroke({ color: cfg.color, width: 1, alpha: c.id === selectedId ? 1 : 0.6 });
      }
      rects(g, 0, 0, placePokemon(pp), OUTLINE);
      g.pivot.set(0, 0);
      g.rotation = 0;
      g.scale.x = c.dir === 'SW' || c.dir === 'NW' ? -1 : 1;
      g.position.set(Math.round(anchor.x), Math.round(anchor.y));
      const a = this.step.alpha;
      g.zIndex = depth(c.prev.x + (c.pos.x - c.prev.x) * a, c.prev.y + (c.pos.y - c.prev.y) * a, 60);
      return;
    }

    const back = c.dir === 'NE' || c.dir === 'NW';
    const p = pose(name, now + c.id.length * 137, back && name !== 'sleep');
    if (!p.lying) {
      g.ellipse(0, 0, 7, 3).fill({ color: '#000000', alpha: 0.22 });
      if (c.id === selectedId || c.id === hoverId) g.ellipse(0, 0, 10, 5).stroke({ color: cfg.color, width: 1, alpha: c.id === selectedId ? 1 : 0.6 });
    }
    rects(g, 0, 0, figureRects(outfits[c.outfit], p.fig), OUTLINE);

    g.pivot.set(0, p.lying ? -14 : 0);
    g.rotation = p.rotation;
    g.scale.x = !p.lying && (c.dir === 'SW' || c.dir === 'NW') ? -1 : 1;
    g.position.set(Math.round(anchor.x), Math.round(anchor.y));
    const a = this.step.alpha;
    g.zIndex = depth(c.prev.x + (c.pos.x - c.prev.x) * a, c.prev.y + (c.pos.y - c.prev.y) * a, 60);
  }

  private drawGlow(now: number): void {
    const g = this.glow;
    g.clear();
    for (const pv of this.propViews) {
      if (pv.partIdx !== 0 || !pv.def.light) continue;
      const l = pv.def.light(pv.prop, this.drawCtx(pv.prop, now));
      if (!l || l.strength <= 0.01) continue;
      for (let k = 0; k < 4; k++) floorEllipse(g, l.gx, l.gy, l.r * (1 - k * 0.22), l.color, 0.07 * l.strength, 0);
      const [sx, sy] = iso(l.gx, l.gy, l.z);
      g.circle(Math.round(sx), Math.round(sy), 3).fill({ color: l.color, alpha: 0.25 * l.strength });
    }
  }

  // ---- Camera ------------------------------------------------------------------------------

  private get cssZoom(): number {
    return this.zoomDev / this.dpr;
  }

  private fitZoom(): number {
    const { width, height } = this.app.screen;
    const s = Math.min(width / (BOUNDS.maxX - BOUNDS.minX + 40), (height - 110) / (BOUNDS.maxY - BOUNDS.minY + 40));
    return Math.max(1, Math.floor(s * this.dpr));
  }

  private setZoom(z: number, anchorCss?: { x: number; y: number }): void {
    const max = Math.round(this.dpr * 7);
    z = Math.max(1, Math.min(max, Math.round(z)));
    if (z === this.zoomDev) return;
    if (anchorCss) {
      const { width, height } = this.app.screen;
      const wp = this.cssToWorld(anchorCss.x, anchorCss.y);
      this.zoomDev = z;
      this.cam.x = wp.x + (width / 2 - anchorCss.x) / this.cssZoom;
      this.cam.y = wp.y + (height / 2 - anchorCss.y) / this.cssZoom;
      this.camTarget = null;
    } else this.zoomDev = z;
  }

  overview(instant = false): void {
    this.setZoom(this.fitZoom());
    this.camTarget = { x: WORLD_CX, y: WORLD_CY + 10 };
    if (instant) this.cam = { ...this.camTarget };
    useWorldStore.getState().follow(null);
  }

  zoomBy(step: number): void {
    const { width, height } = this.app.screen;
    this.setZoom(this.zoomDev + step, { x: width / 2, y: height / 2 });
  }

  focusClone(id: string): void {
    const s = useWorldStore.getState();
    s.select(id);
    s.follow(id);
    if (this.zoomDev < this.fitZoom() + this.dpr) this.setZoom(this.fitZoom() + Math.round(this.dpr * 1.5));
  }

  private zoomToZone(x: number, y: number): void {
    const z = zoneAt(Math.floor(x), Math.floor(y));
    if (!z) return;
    const { width, height } = this.app.screen;
    const { rect } = z;
    const pxW = (rect.w + rect.h) * 16 + 30;
    const pxH = (rect.w + rect.h) * 8 + WALL_TALL + 30;
    const target = Math.floor(this.dpr * Math.min((width * 0.9) / pxW, ((height - 120) * 0.9) / pxH));
    const [cx, cy] = iso(rect.x + rect.w / 2, rect.y + rect.h / 2, 14);
    this.setZoom(Math.max(target, this.fitZoom() + 1));
    this.camTarget = { x: cx, y: cy };
    useWorldStore.getState().follow(null);
  }

  private updateCamera(dtMs: number, followId: string | null): void {
    if (followId) {
      const c = this.w.clones.find((k) => k.id === followId);
      if (c) {
        const a = this.cloneAnchor(c);
        this.camTarget = { x: a.x, y: a.y - 16 };
      }
    }
    if (this.camTarget) {
      const k = Math.min(1, (dtMs / 1000) * 7);
      this.cam.x += (this.camTarget.x - this.cam.x) * k;
      this.cam.y += (this.camTarget.y - this.cam.y) * k;
      if (!followId && Math.hypot(this.camTarget.x - this.cam.x, this.camTarget.y - this.cam.y) < 0.3) this.camTarget = null;
    }
    this.cam.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, this.cam.x));
    this.cam.y = Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, this.cam.y));
  }

  private renderWorld(): void {
    const { width, height } = this.app.screen;
    const cz = this.cssZoom;
    this.origin.x = Math.round(width / cz / 2 - this.cam.x);
    this.origin.y = Math.round(height / cz / 2 - this.cam.y);
    this.worldLayer.scale.set(cz);
    this.worldLayer.position.set(this.origin.x * cz, this.origin.y * cz);
  }

  private worldToCss(x: number, y: number): { x: number; y: number } {
    return { x: (x + this.origin.x) * this.cssZoom, y: (y + this.origin.y) * this.cssZoom };
  }

  private cssToWorld(x: number, y: number): { x: number; y: number } {
    return { x: x / this.cssZoom - this.origin.x, y: y / this.cssZoom - this.origin.y };
  }

  // ---- Speech bubbles (screen-res text over the pixel world) ---------------------------------

  private updateBubbles(now: number): void {
    for (const c of this.w.clones) {
      const v = this.cloneViews.get(c.id)!;
      let text = c.bubble && c.bubble.until > now ? c.bubble.text : '';
      if (!text && c.state === 'sleeping') text = ['z', 'z z', 'z z Z'][Math.floor(now / 600) % 3];
      if (!text) {
        v.bubble.visible = false;
        continue;
      }
      if (text !== v.shown) {
        v.shown = text;
        v.text.text = text;
        const w = Math.ceil(v.text.width) + 12;
        const h = Math.ceil(v.text.height) + 6;
        v.bg.clear();
        v.bg.roundRect(-w / 2, -h - 4, w, h, 6).fill({ color: '#fffdf6', alpha: 0.95 }).stroke({ color: '#1f1b22', width: 1.5 });
        v.bg.poly([-4, -5, 4, -5, 0, 1]).fill('#fffdf6');
        v.text.position.set(0, -7);
      }
      const a = this.cloneAnchor(c);
      const p = this.worldToCss(a.x, a.y - (a.lying ? 14 : 34));
      v.bubble.position.set(Math.round(p.x), Math.round(p.y));
      v.bubble.visible = true;
    }
  }

  // ---- Input ----------------------------------------------------------------------------------

  private hitClone(cssX: number, cssY: number): Clone | undefined {
    const wp = this.cssToWorld(cssX, cssY);
    let best: Clone | undefined;
    let bestZ = -Infinity;
    for (const c of this.w.clones) {
      const a = this.cloneAnchor(c);
      const dx = wp.x - a.x;
      const dy = wp.y - a.y;
      const hit = a.lying ? Math.abs(dx) < 16 && Math.abs(dy + 14) < 12 : Math.abs(dx) < 10 && dy > -33 && dy < 4;
      const z = this.cloneViews.get(c.id)!.g.zIndex;
      if (hit && z > bestZ) {
        best = c;
        bestZ = z;
      }
    }
    return best;
  }

  private bindInput(): void {
    const el = this.app.canvas;
    const local = (e: PointerEvent | WheelEvent) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      el.addEventListener(type, fn as EventListener, opts);
      this.cleanups.push(() => el.removeEventListener(type, fn as EventListener));
    };

    on('pointerdown', (e) => {
      const p = local(e);
      this.drag = { x: p.x, y: p.y, cx: this.cam.x, cy: this.cam.y, moved: false };
      el.setPointerCapture(e.pointerId);
    });
    on('pointermove', (e) => {
      const p = local(e);
      const s = useWorldStore.getState();
      if (this.drag) {
        const dx = p.x - this.drag.x;
        const dy = p.y - this.drag.y;
        if (!this.drag.moved && Math.hypot(dx, dy) > 4) {
          this.drag.moved = true;
          if (s.followId) s.follow(null);
        }
        if (this.drag.moved) {
          this.cam.x = this.drag.cx - dx / this.cssZoom;
          this.cam.y = this.drag.cy - dy / this.cssZoom;
          this.camTarget = null;
          el.style.cursor = 'grabbing';
          return;
        }
      }
      const c = this.hitClone(p.x, p.y);
      el.style.cursor = c ? 'pointer' : 'grab';
      if (c) s.setHover({ id: c.id, x: e.clientX, y: e.clientY });
      else if (s.hover) s.setHover(null);
    });
    on('pointerup', (e) => {
      const d = this.drag;
      this.drag = null;
      el.style.cursor = 'grab';
      if (!d || d.moved) return;
      const p = local(e);
      const c = this.hitClone(p.x, p.y);
      const s = useWorldStore.getState();
      if (c) {
        s.select(c.id);
        return;
      }
      const wp = this.cssToWorld(p.x, p.y);
      const [gx, gy] = screenToGrid(wp.x, wp.y);
      if (gx >= 0 && gy >= 0 && gx < WORLD_W && gy < WORLD_H) this.zoomToZone(gx, gy);
      else s.select(null);
    });
    on('pointerleave', () => useWorldStore.getState().setHover(null));
    on('wheel', (e) => {
      e.preventDefault();
      this.wheelAcc += e.deltaY;
      if (Math.abs(this.wheelAcc) < 40) return;
      const step = this.wheelAcc < 0 ? 1 : -1;
      this.wheelAcc = 0;
      this.setZoom(this.zoomDev + step, local(e));
    }, { passive: false });

    const save = () => saveWorld(this.w);
    const onVis = () => {
      if (document.visibilityState === 'hidden') save();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeunload', save);
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const s = useWorldStore.getState();
      if (e.key === 'Escape') { s.select(null); this.overview(); }
      if (e.key === ' ') { e.preventDefault(); s.setSpeed(s.speed === 0 ? 1 : 0); }
      if (e.key === '1') s.setSpeed(1);
      if (e.key === '2') s.setSpeed(4);
      if (e.key === '3') s.setSpeed(16);
      if (e.key === '=' || e.key === '+') this.zoomBy(1);
      if (e.key === '-') this.zoomBy(-1);
    };
    window.addEventListener('keydown', onKey);
    this.cleanups.push(
      () => document.removeEventListener('visibilitychange', onVis),
      () => window.removeEventListener('beforeunload', save),
      () => window.removeEventListener('keydown', onKey),
    );
    el.style.cursor = 'grab';
    el.style.touchAction = 'none';
  }

  // ---- Snapshot for React ------------------------------------------------------------------------

  private snapshot(): Snapshot {
    const startOfDay = (t: number) => {
      const d = new Date(t);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };
    const day = Math.round((startOfDay(this.w.simTime) - startOfDay(this.w.bornAt)) / 86_400_000) + 1;
    return {
      simTime: this.w.simTime,
      day,
      clones: this.w.clones.map((c) => {
        const cfg = roster.find((r) => r.id === c.id)!;
        const act = c.current ? activityById.get(c.current.activityId) : c.target ? activityById.get(c.target.activityId) : undefined;
        let activity = 'thinking about what to do';
        if (c.state === 'walking' && act) activity = `heading off ${act.label === 'hanging out' ? 'to hang out' : `→ ${act.label}`}`;
        else if (act && c.current) activity = act.label;
        if (c.moment?.kind === 'build') activity = 'fixing a broken build';
        const zone = zoneAt(Math.round(c.pos.x), Math.round(c.pos.y))?.name ?? '';
        return {
          id: c.id, label: labelOf(cfg), role: cfg.role ?? cfg.name, color: cfg.color,
          activity, emoji: act?.emoji ?? '💭', state: c.state, zone, needs: { ...c.needs },
        };
      }),
    };
  }
}
