import type { Needs } from '../world/activities.config';

const ROWS: { key: keyof Needs; label: string; color: string; invert?: boolean }[] = [
  { key: 'energy', label: 'Energy', color: '#7ad17a' },
  { key: 'focus', label: 'Focus', color: '#3ff0d8' },
  { key: 'hunger', label: 'Hunger', color: '#f0a050' },
  { key: 'mood', label: 'Mood', color: '#f29bb8' },
];

export function NeedBars({ needs }: { needs: Needs }) {
  return (
    <div className="bars">
      {ROWS.map((r) => (
        <div key={r.key} style={{ display: 'contents' }}>
          <span>{r.label}</span>
          <div className="bar"><i style={{ width: `${needs[r.key]}%`, background: r.color }} /></div>
          <span className="num">{Math.round(needs[r.key])}</span>
        </div>
      ))}
    </div>
  );
}
