import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('kinetic-surface kinetic-hover rounded-lg border border-slate-200 bg-white p-5 shadow-soft', className)} {...props} />;
}

export function CollapsibleCard({ title, children, className, defaultOpen = false }: { title: React.ReactNode; children: React.ReactNode; className?: string; defaultOpen?: boolean }) {
  return <details open={defaultOpen} className={cn('group kinetic-surface overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft', className)}>
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 [&::-webkit-details-marker]:hidden">
      <h2 className="font-bold text-slate-950">{title}</h2>
      <span className="text-sm font-semibold text-blue-700"><span className="group-open:hidden">開く</span><span className="hidden group-open:inline">閉じる</span></span>
    </summary>
    <div className="border-t border-slate-200 p-4">{children}</div>
  </details>;
}

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('kinetic-hover inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50', className)} {...props} />;
}

export function SecondaryButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('kinetic-hover inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-800 transition hover:bg-slate-50', className)} {...props} />;
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700', className)} {...props} />;
}

export function StatCard({ label, value, help }: { label: string; value: React.ReactNode; help?: string }) {
  return <Card className="p-4"><div className="text-sm text-slate-500">{label}</div><div className="mt-2 text-3xl font-bold text-slate-950">{value}</div>{help ? <div className="mt-1 text-xs text-slate-400">{help}</div> : null}</Card>;
}
