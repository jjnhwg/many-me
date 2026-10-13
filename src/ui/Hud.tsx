import { useWorldStore } from '../store/worldStore';

export function Hud() {
  const snap = useWorldStore((s) => s.snapshot);
  const selectedId = useWorldStore((s) => s.selectedId);
  const game = useWorldStore((s) => s.game);
  if (!snap) return null;
  const d = new Date(snap.simTime);
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const weekday = d.toLocaleDateString([], { weekday: 'short' });
  return (
    <div className="hud">
      <div className="card brand">
        <h1>Many Me</h1>
        <div className="clock">{weekday} {time}</div>
        <div className="sub">Day {snap.day}</div>
      </div>
      <div className="card roster">
        {snap.clones.map((c) => (
          <button key={c.id} className={`chip ${selectedId === c.id ? 'on' : ''}`} onClick={() => game?.focusClone(c.id)} title={`Follow ${c.label}`}>
            <i className="dot" style={{ background: c.color }} />
            <div>
              <b>{c.role}</b>
              <span>{c.emoji} {c.activity}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
