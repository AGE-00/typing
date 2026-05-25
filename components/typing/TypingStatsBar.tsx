export function TypingStatsBar({
  mistakeCount,
  typedLength,
  targetLength,
  accuracy,
  kpm,
  wpm,
  streak = 0,
}: {
  mistakeCount: number;
  typedLength: number;
  targetLength: number;
  accuracy: number;
  kpm: number;
  wpm: number;
  streak?: number;
}) {
  return <div className="kinetic-rise flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-slate-200 py-3 text-sm" aria-label="入力統計">
    <Metric label="入力" value={`${typedLength}/${targetLength}`} />
    <Metric label="正確率" value={`${accuracy.toFixed(1)}%`} />
    <Metric label="KPM" value={kpm.toFixed(0)} />
    <Metric label="WPM" value={wpm.toFixed(1)} />
    <Metric label="ミス" value={mistakeCount} danger={mistakeCount > 0} />
    {streak >= 10 ? <Metric label="連続" value={streak} /> : null}
  </div>;
}

function Metric({ label, value, danger = false }: { label: string; value: string | number; danger?: boolean }) {
  return <span className="inline-flex items-baseline gap-1.5">
    <span className="text-slate-500">{label}</span>
    <span className={`font-mono text-base font-bold ${danger ? 'text-red-700' : 'text-slate-950'}`}>{value}</span>
  </span>;
}
