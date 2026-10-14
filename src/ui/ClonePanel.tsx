import { useWorldStore } from '../store/worldStore';
import { activityById } from '../world/activities.config';
import { roster } from '../world/clones.config';
import { formatDuration } from '../sim/offline';
import { NeedBars } from './NeedBars';
import { Portrait } from './Portrait';

const fmtTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export function ClonePanel() {
  const selectedId = useWorldStore((s) => s.selectedId);
  const followId = useWorldStore((s) => s.followId);
  const snap = useWorldStore((s) => s.snapshot);
  const game = useWorldStore((s) => s.game);
  const select = useWorldStore((s) => s.select);
  const follow = useWorldStore((s) => s.follow);
  const c = selectedId && snap?.clones.find((k) => k.id === selectedId);
  const clone = selectedId ? game?.world().clones.find((k) => k.id === selectedId) : undefined;
  if (!c || !clone || !snap) return null;
  const cfg = roster.find((r) => r.id === c.id)!;

  const dayStart = new Date(snap.simTime);
  dayStart.setHours(0, 0, 0, 0);
  const today = clone.log.filter((l) => (l.end ?? snap.simTime) >= dayStart.getTime() && l.activityId !== 'wander').slice(-14).reverse();
  const totals = Object.entries(clone.totalsMs)
    .filter(([id, ms]) => ms > 30_000 && id !== 'wander')
    .sort((a, b) => b[1] - a[1]);

  return (
    <aside className="card panel">
      <header>
        <Portrait cloneId={cfg.id} outfit={cfg.outfit} bg={`${cfg.color}33`} />
        <div>
          <h2>{c.label}</h2>
          <div className="sub">{c.zone}</div>
          <div style={{ marginTop: 8 }}>
            <button className={`btn ${followId === c.id ? 'on' : ''}`} onClick={() => (followId === c.id ? follow(null) : game?.focusClone(c.id))}>
              {followId === c.id ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>
        <button className="x" onClick={() => select(null)} aria-label="Close">×</button>
      </header>
      <div className="body">
        <section>
          <h3>Right now</h3>
          <div className="now">{c.emoji} {c.activity}</div>
        </section>
        <section>
          <h3>Needs</h3>
          <NeedBars needs={c.needs} />
        </section>
        <section>
          <h3>Today</h3>
          {today.length ? (
            <ul className="log">
              {today.map((l, i) => {
                const a = activityById.get(l.activityId)!;
                return (
                  <li key={`${l.start}-${i}`}>
                    <time>{fmtTime(l.start)}</time>
                    <span>{a.emoji} {a.label}</span>
                    <span className="d">{l.end ? formatDuration(l.end - l.start) : 'now'}</span>
                  </li>
                );
              })}
            </ul>
          ) : <div className="sub">Nothing logged yet today.</div>}
        </section>
        <section>
          <h3>Lifetime</h3>
          {totals.length ? (
            <div className="totals">
              {totals.map(([id, ms]) => {
                const a = activityById.get(id)!;
                const n = clone.counts[id] ?? 0;
                return (
                  <div key={id} style={{ display: 'contents' }}>
                    <span>{a.emoji} {a.label}</span>
                    <span>{formatDuration(ms)}{a.summary.kind === 'count' && n ? ` · ${n}×` : ''}</span>
                  </div>
                );
              })}
            </div>
          ) : <div className="sub">Just getting started.</div>}
        </section>
      </div>
    </aside>
  );
}
