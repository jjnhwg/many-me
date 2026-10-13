import { useWorldStore } from '../store/worldStore';
import { NeedBars } from './NeedBars';

export function HoverTag() {
  const hover = useWorldStore((s) => s.hover);
  const snap = useWorldStore((s) => s.snapshot);
  const c = hover && snap?.clones.find((k) => k.id === hover.id);
  if (!hover || !c) return null;
  return (
    <div className="card hover" style={{ left: hover.x, top: hover.y }}>
      <div className="name" style={{ color: c.color }}>{c.label}</div>
      <div className="act">{c.emoji} {c.activity}</div>
      <NeedBars needs={c.needs} />
    </div>
  );
}
