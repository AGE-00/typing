import type React from 'react';

export function OptionBlock({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <section className="kinetic-rise"><h2 className="font-bold text-slate-950">{title}</h2>{description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}<div className="mt-4">{children}</div></section>;
}
