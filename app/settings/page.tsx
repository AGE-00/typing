'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MotionGroup, MotionSection } from '@/components/motion/MotionSection';
import { Card, SecondaryButton } from '@/components/ui';
import { clearLocalData, exportLocalData, getSettings, importLocalData, updateSettings } from '@/lib/db';
import { dispatchMotionPreferenceChange } from '@/lib/motion';
import type { AnimationPreference, PersonalizationMode, UserSettings } from '@/lib/types';

const animationOptions: Array<[AnimationPreference, string, string]> = [
  ['off', '無効', 'すぐ切り替えます。'],
  ['minimal', '最小', '練習に関係する動きだけ。'],
  ['standard', '標準', '画面全体を少し動かします。'],
];

const romanizationOptions: Array<[UserSettings['preferredRomanization'], string, string]> = [
  ['hepburn', 'ヘボン式', 'shi / chi / tsu'],
  ['kunrei', '訓令式', 'si / ti / tu'],
];

const personalizationOptions: Array<[PersonalizationMode, string, string]> = [
  ['off', '使わない', '均等に出題。'],
  ['balanced', '標準', '苦手キーを少し混ぜます。'],
  ['intensive', '集中', '苦手キーを前に寄せます。'],
];

export default function SettingsPage() {
  const importInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => { void getSettings().then(setSettings); }, []);

  if (!settings) return <main className="mx-auto max-w-3xl px-4">設定を読み込み中...</main>;

  const save = async (next: UserSettings) => {
    setSettings(next);
    if (next.animationPreference !== settings.animationPreference) dispatchMotionPreferenceChange(next.animationPreference);
    await updateSettings(next);
    setMessage('保存しました');
  };

  const handleExport = async () => {
    const data = await exportLocalData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `jp-typing-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('バックアップを書き出しました');
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    try {
      const imported = await importLocalData(JSON.parse(await file.text()));
      const nextSettings = await getSettings();
      setSettings(nextSettings);
      dispatchMotionPreferenceChange(nextSettings.animationPreference);
      setMessage(`${imported.sessions} セッションを読み込みました`);
    } catch {
      setMessage('バックアップを読み込めませんでした');
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  return <main className="mx-auto max-w-4xl px-4 pb-16">
    <MotionSection className="kinetic-rise mb-6">
      <h1 className="text-4xl font-black">設定</h1>
      <p className="mt-2 text-slate-600">入力、動き、出題の寄せ方を調整します。</p>
    </MotionSection>
    <MotionGroup><Card className="space-y-6">
      <MotionSection as="section">
        <h2 className="font-bold">アニメーション設定</h2>
        <p className="mt-1 text-sm text-slate-600">入力中の動きの量を選びます。</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {animationOptions.map(([value, label, help]) => <button
            key={value}
            type="button"
            onClick={() => save({ ...settings, animationPreference: value })}
            className={`kinetic-surface kinetic-hover rounded-lg border p-4 text-left transition ${settings.animationPreference === value ? 'border-blue-600 bg-blue-50 text-blue-950 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
          >
            <div className="font-bold">{label}</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">{help}</div>
          </button>)}
        </div>
        <p className="mt-3 text-xs text-slate-500">端末側で動きを減らす設定が有効な場合は、その設定を優先します。</p>
      </MotionSection>
      <MotionSection as="section">
        <h2 className="font-bold">ローマ字表示</h2>
        <p className="mt-1 text-sm text-slate-600">表示の基準を選びます。</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {romanizationOptions.map(([value, label, help]) => <button
            key={value}
            type="button"
            onClick={() => save({ ...settings, preferredRomanization: value })}
            className={`kinetic-surface kinetic-hover rounded-lg border p-4 text-left transition ${settings.preferredRomanization === value ? 'border-blue-600 bg-blue-50 text-blue-950 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
          >
            <div className="font-bold">{label}</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">{help}</div>
          </button>)}
        </div>
      </MotionSection>
      <MotionSection as="section">
        <h2 className="font-bold">出題のパーソナライズ</h2>
        <p className="mt-1 text-sm text-slate-600">記録を出題に反映します。</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {personalizationOptions.map(([value, label, help]) => <button
            key={value}
            type="button"
            onClick={() => save({ ...settings, personalizationMode: value })}
            className={`kinetic-surface kinetic-hover rounded-lg border p-4 text-left transition ${settings.personalizationMode === value ? 'border-slate-900 bg-slate-100 text-slate-950 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
          >
            <div className="font-bold">{label}</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">{help}</div>
          </button>)}
        </div>
      </MotionSection>
      <MotionSection><Toggle label="フォーカスモードをデフォルトで有効化" description="練習開始時から、表示をしぼった画面で始めます。" checked={settings.focusModeDefault} onChange={(v) => save({ ...settings, focusModeDefault: v })}/></MotionSection>
      <MotionSection><Toggle label="厳格モードをデフォルトで有効化" description="1回のミスで終了する練習を標準にします。" checked={settings.strictMode} onChange={(v) => save({ ...settings, strictMode: v })}/></MotionSection>
      {message ? <MotionSection as="section"><p className="text-sm text-blue-700">{message}</p></MotionSection> : null}
    </Card></MotionGroup>
    <MotionSection><Card className="mt-6 border-red-100">
      <h2 className="font-bold text-red-700">ローカルデータ</h2>
      <p className="mt-2 text-sm text-slate-600">履歴をバックアップ、復元、削除できます。</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <SecondaryButton onClick={() => void handleExport()}>バックアップを書き出す</SecondaryButton>
        <SecondaryButton onClick={() => importInputRef.current?.click()}>バックアップを読み込む</SecondaryButton>
        <SecondaryButton className="text-red-700" onClick={async () => { if (confirm('練習履歴を削除しますか？')) { await clearLocalData(); setMessage('練習履歴を削除しました'); } }}>練習履歴を削除</SecondaryButton>
      </div>
      <input ref={importInputRef} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => void handleImport(event.target.files?.[0])} />
    </Card></MotionSection>
    <MotionSection className="mt-8 border-t border-slate-200 pt-4 text-sm text-slate-500">
      <Link href="/about" className="hover:text-slate-800">実装ノート</Link>
    </MotionSection>
  </main>;
}

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="kinetic-hover flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
    <span>
      <span className="font-medium">{label}</span>
      {description ? <span className="mt-1 block text-sm text-slate-600">{description}</span> : null}
    </span>
    <input type="checkbox" className="h-5 w-5" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  </label>;
}
