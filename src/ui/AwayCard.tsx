import { useWorldStore } from '../store/worldStore';
import { formatDuration } from '../sim/offline';

export function AwayCard() {
  const away = useWorldStore((s) => s.away);
  const setAway = useWorldStore((s) => s.setAway);
  if (!away) return null;
  const rows = away.clones.filter((c) => c.items.length);
  return (
    <div className="away-wrap" onClick={() => setAway(null)}>
      <div className="card away" onClick={(e) => e.stopPropagation()}>
        <h2>While you were away</h2>
        <div className="sub">{formatDuration(away.elapsedMs)} passed{away.elapsedMs >= 24 * 3600_000 ? ' (caught up the last 24h)' : ''}.</div>
        <ul>
          {rows.map((c) => (
            <li key={c.id}>
              <b><i className="dot" style={{ background: c.color }} />{c.label}</b>
              {c.items.map((t) => <div key={t}>{t}</div>)}
            </li>
          ))}
          {!rows.length && <li className="sub">Everyone mostly hung around.</li>}
        </ul>
        <button className="btn" onClick={() => setAway(null)} autoFocus>Back to the world</button>
      </div>
    </div>
  );
}
