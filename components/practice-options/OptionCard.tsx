export function OptionCard({ active, title, onClick }: { active: boolean; title: string; help?: string; onClick: () => void }) {
  return <button onClick={onClick} className={`kinetic-surface kinetic-hover min-h-14 rounded-lg border p-4 text-left transition ${active ? 'border-blue-600 bg-blue-50 text-blue-950 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`} aria-pressed={active}>
    <div className="flex items-center justify-between gap-3"><span className="font-bold">{title}</span>{active ? <span className="kinetic-pop rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">選択中</span> : null}</div>
  </button>;
}
