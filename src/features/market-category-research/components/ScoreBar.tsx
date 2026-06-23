import { scoreColor } from '../utils';

interface Props {
  label: string;
  value: number;
  max?: number;
}

export function ScoreBar({ label, value, max = 100 }: Props) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs text-slate-500">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${scoreColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-semibold tabular-nums text-slate-700">{value}</span>
    </div>
  );
}
