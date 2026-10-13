import { useWorldStore, type Speed } from '../store/worldStore';

const SPEEDS: { v: Speed; label: string }[] = [
  { v: 0, label: '❚❚' },
  { v: 1, label: '1×' },
  { v: 4, label: '4×' },
  { v: 16, label: '16×' },
];

export function TimeControls() {
  const speed = useWorldStore((s) => s.speed);
  const setSpeed = useWorldStore((s) => s.setSpeed);
  const game = useWorldStore((s) => s.game);
  return (
    <div className="card controls">
      {SPEEDS.map((s) => (
        <button key={s.v} className={speed === s.v ? 'on' : ''} onClick={() => setSpeed(s.v)} title={s.v === 0 ? 'Pause (space)' : `${s.label} speed`}>
          {s.label}
        </button>
      ))}
      <i className="sep" />
      <button onClick={() => game?.zoomBy(-1)} title="Zoom out (-)">−</button>
      <button onClick={() => game?.zoomBy(1)} title="Zoom in (+)">+</button>
      <button onClick={() => game?.overview()} title="Whole world (Esc)">⌂</button>
    </div>
  );
}
