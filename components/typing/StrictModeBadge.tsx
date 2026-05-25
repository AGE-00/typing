export function StrictModeBadge({ enabled }: { enabled: boolean }) {
  if (!enabled) return <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">Non-Strict Mode</span>;
  return <span className="rounded-full bg-red-50 px-3 py-1 font-bold text-red-700 ring-1 ring-red-200">Strict Mode: ON</span>;
}
