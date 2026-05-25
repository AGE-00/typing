'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Keyboard, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

const items = [
  ['/', '開始', Keyboard],
  ['/analysis', '分析', BarChart3],
  ['/settings', '設定', Settings],
] as const;

export function Nav() {
  const pathname = usePathname();

  return <nav className="relative z-30 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5">
    <Link href="/" className="text-lg font-black tracking-tight">JP Typing</Link>
    <div className="flex max-w-full flex-wrap items-center gap-2 text-sm">
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-slate-200 bg-white/55 p-1 text-xs text-slate-500 backdrop-blur-sm">
        {items.map(([href, label, Icon]) => {
          const active = pathname === href;
          return <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'kinetic-hover inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold transition hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
              active && 'bg-white text-slate-950 shadow-[0_0_0_1px_rgba(0,0,0,0.16)]',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </Link>;
        })}
      </div>
      <ThemeToggle />
    </div>
  </nav>;
}
