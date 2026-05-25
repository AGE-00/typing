'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'jp-typing-theme';
type Theme = 'light' | 'dark';

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme);
  window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const initial = readTheme();
    setTheme(initial);
    applyTheme(initial);

    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        const next = readTheme();
        setTheme(next);
        applyTheme(next);
      }
    };
    const onThemeChange = (event: Event) => setTheme((event as CustomEvent<Theme>).detail);

    window.addEventListener('storage', onStorage);
    window.addEventListener('themechange', onThemeChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('themechange', onThemeChange);
    };
  }, []);

  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const Icon = theme === 'dark' ? Sun : Moon;

  return <button
    type="button"
    onClick={() => {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      setTheme(nextTheme);
      applyTheme(nextTheme);
    }}
    aria-label={`${nextTheme === 'dark' ? 'ダーク' : 'ライト'}テーマに切り替え`}
    aria-pressed={theme === 'dark'}
    className="kinetic-hover inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-blue-700"
  >
    <Icon className="h-4 w-4" />
    <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
  </button>;
}
