import type React from 'react';

export function OptionButton({ active, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return <button className={`${active ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50'} rounded-xl px-4 py-2.5 font-semibold transition ${className ?? ''}`} {...props} />;
}
