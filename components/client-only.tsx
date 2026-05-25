'use client';

import { useEffect, useState } from 'react';

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <div className="kinetic-rise rounded-lg border border-slate-200 bg-white p-8 text-slate-500">ローカルデータベースを準備しています...</div>;
  return <>{children}</>;
}
