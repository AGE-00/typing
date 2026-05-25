export function ToggleOptionCard({
  active,
  title,
  description,
  icon,
  warning,
  onChange,
}: {
  active: boolean;
  title: string;
  description?: string;
  icon: React.ReactNode;
  warning?: boolean;
  onChange: (checked: boolean) => void;
}) {
  const activeClass = warning ? 'border-red-300 bg-red-50 shadow-sm' : 'border-blue-300 bg-blue-50 shadow-sm';
  return <label className={`kinetic-surface kinetic-hover flex min-h-20 cursor-pointer items-center justify-between rounded-lg border p-4 transition ${active ? activeClass : 'border-slate-200 bg-white'}`}>
    <span>
      <span className="flex items-center gap-2 font-bold">{icon}{title}{active ? <span className={`kinetic-pop rounded-full px-2 py-0.5 text-xs ${warning ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>ON</span> : null}</span>
      {description ? <span className="mt-1 block text-sm text-slate-600">{description}</span> : null}
    </span>
    <input type="checkbox" checked={active} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5" />
  </label>;
}
