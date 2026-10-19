import { useEffect, useRef } from 'react';
import { outfits, roster } from '../world/clones.config';
import { figureRects, OUTLINE, pose } from '../world/render/character';
import { placePokemon, pokemonRects } from '../world/render/pokemon';

/** The clone's sprite drawn big on a plain canvas (same rects as the world renderer). */
export function Portrait({ cloneId, outfit, bg }: { cloneId: string; outfit: string; bg: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    const species = roster.find((r) => r.id === cloneId)?.species;
    const S = 2;
    const W = species ? 40 : 32;
    const H = 38;
    cv.width = W * S;
    cv.height = H * S;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cv.width, cv.height);
    const list = species ? placePokemon({ ...pokemonRects(species, 'idle', 0), lift: 0 }) : figureRects(outfits[outfit], pose('idle', 0, false).fig);
    const ox = W / 2;
    const oy = H - 4;
    ctx.fillStyle = OUTLINE;
    for (const [x, y, w, h] of list) ctx.fillRect((ox + x - 1) * S, (oy + y - 1) * S, (w + 2) * S, (h + 2) * S);
    for (const [x, y, w, h, c] of list) {
      ctx.fillStyle = c;
      ctx.fillRect((ox + x) * S, (oy + y) * S, w * S, h * S);
    }
  }, [cloneId, outfit, bg]);
  return <canvas ref={ref} className="portrait" />;
}
