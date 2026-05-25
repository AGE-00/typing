'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Button, Card, CollapsibleCard, StatCard } from '@/components/ui';
import { getPromptResults, getSession } from '@/lib/db';
import type { PracticeSession, PromptResult } from '@/lib/types';
import { formatDate, formatPercent } from '@/lib/utils';

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<PracticeSession | null>();
  const [promptResults, setPromptResults] = useState<PromptResult[]>([]);
  useEffect(() => {
    void getSession(params.id).then(async (loaded) => {
      setSession(loaded ?? null);
      if (loaded) setPromptResults(loaded.promptResults?.length ? loaded.promptResults : await getPromptResults(loaded.id));
    });
  }, [params.id]);
  if (session === undefined) return <main className="mx-auto max-w-5xl px-4">読み込み中...</main>;
  if (!session) return <main className="mx-auto max-w-5xl px-4"><Card>結果が見つかりません。</Card></main>;
  const s = session.summary;
  const weakestKey = s.weakKeys.find((key) => key.mistakes > 0)?.key ?? s.slowKeys[0]?.key ?? '';
  const isFailed = Boolean(session.isFailed);
  return <main className="mx-auto max-w-5xl px-4 pb-16">
    <div className="kinetic-rise mb-6 flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-4xl font-black">セッション結果</h1><p className="mt-2 text-slate-600">{formatDate(session.endedAt)}</p></div>
      <StatusBadge failed={isFailed} />
    </div>

    {isFailed ? <Card className="mb-6 border-red-200 bg-red-50">
      <div className="flex items-center gap-3 text-red-700"><XCircle className="h-7 w-7" /><h2 className="text-2xl font-black">Failed</h2></div>
      <p className="mt-3 text-red-900">Strict Mode中にミスが発生したため、セッションは失敗として保存されました。同じ文に再挑戦するか、弱いキーを重点的に練習しましょう。</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <FailureItem label="完了した問題数" value={`${session.completedQuestionCount ?? promptResults.filter((r) => r.completed).length} / ${session.questionCount ?? 1}`} />
        <FailureItem label="失敗した問題" value={session.failedQuestion ?? '-'} />
        <FailureItem label="失敗位置" value={session.failedPosition ?? '-'} />
        <FailureItem label="期待キー" value={session.failedExpectedKey ?? '-'} />
        <FailureItem label="実際のキー" value={session.failedActualKey ?? '-'} />
        <FailureItem label="対象の日本語文字" value={session.failedTargetChar ?? '-'} />
        <FailureItem label="対象ローマ字セグメント" value={session.failedTargetRomaji ?? '-'} />
        <FailureItem label="失敗までのKPM" value={s.kpm.toFixed(0)} />
      </div>
    </Card> : null}

    <div className="grid gap-4 md:grid-cols-4"><StatCard label="WPM" value={s.wpm.toFixed(1)} /><StatCard label="KPM" value={s.kpm.toFixed(0)} /><StatCard label="正確率" value={formatPercent(s.accuracy)} /><StatCard label="ミス" value={s.mistakesCount} /></div>
    <div className="mt-4 grid gap-4 md:grid-cols-3"><StatCard label="完了問題数" value={`${session.completedQuestionCount ?? promptResults.filter((r) => r.completed).length}/${session.questionCount ?? 1}`} /><StatCard label="総入力" value={s.totalTyped} /><StatCard label="合計時間" value={`${Math.round(s.durationMs / 1000)}秒`} /></div>

    <CollapsibleCard title="問題別結果" className="mt-6"><div className="space-y-3">{promptResults.length ? promptResults.map((result) => <div key={result.id} className={`kinetic-hover rounded-lg p-4 ${result.failed ? 'bg-red-50 ring-1 ring-red-200' : 'bg-slate-50'}`}><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-bold">Question {result.questionIndex + 1}</div><div className={`text-sm font-bold ${result.failed ? 'text-red-700' : 'text-slate-500'}`}>{result.failed ? 'Failed' : result.completed ? 'Completed' : 'Incomplete'}</div></div><div className="mt-2 text-lg font-medium">{result.text}</div><div className="mt-3 grid gap-2 text-sm md:grid-cols-4"><span>正確率 {formatPercent(result.accuracy)}</span><span>KPM {result.kpm.toFixed(0)}</span><span>ミス {result.mistakes}</span><span>入力 {result.correctInputs}/{result.totalInputs}</span></div></div>) : <p className="text-slate-500">問題別データはありません。</p>}</div></CollapsibleCard>

    <div className="mt-6 grid gap-4 md:grid-cols-2"><CollapsibleCard title="弱いキー"><KeyList rows={s.weakKeys}/></CollapsibleCard><CollapsibleCard title="反応が遅いキー"><KeyList rows={s.slowKeys}/></CollapsibleCard></div>
    <CollapsibleCard title="頻出ミス" className="mt-6"><div className="grid gap-2">{s.mistakes.length ? s.mistakes.map((m) => <div key={`${m.expected}-${m.actual}`} className="flex justify-between rounded-lg bg-slate-50 p-3 font-mono"><span>{m.expected} → {m.actual}</span><span>{m.count}回</span></div>) : <p className="text-slate-500">ミスはありません。</p>}</div></CollapsibleCard>
    <div className="mt-6 flex flex-wrap gap-3"><Link href="/practice"><Button>{isFailed ? 'Strict Modeで再挑戦' : 'もう一度練習'}</Button></Link><Link href={weakestKey ? `/practice?weakKey=${encodeURIComponent(weakestKey)}` : '/practice'}><Button className="bg-slate-900 hover:bg-slate-800">弱点キーを練習</Button></Link><Link href="/analysis"><Button className="bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50">詳しく分析</Button></Link></div>
  </main>;
}

function StatusBadge({ failed }: { failed: boolean }) { return <div className={`kinetic-pop inline-flex items-center gap-2 rounded-full px-4 py-2 font-bold ${failed ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-950'}`}>{failed ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}{failed ? 'Failed' : 'Completed'}</div>; }
function FailureItem({ label, value }: { label: string; value: string | number }) { return <div className="rounded-lg bg-white/70 p-3"><div className="text-xs font-semibold text-red-500">{label}</div><div className="mt-1 break-all font-mono text-lg font-bold text-red-950">{value}</div></div>; }
function KeyList({ rows }: { rows: PracticeSession['summary']['weakKeys'] }) { return <div className="mt-4 space-y-2">{rows.length ? rows.map((r) => <div key={r.key} className="kinetic-hover grid grid-cols-[3rem_1fr_5rem] items-center gap-3 rounded-lg bg-slate-50 p-3"><div className="font-mono text-xl font-bold">{r.key}</div><div className="h-2 rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(8, 100 - r.accuracy)}%` }}/></div><div className="text-right text-sm text-slate-500">{Math.round(r.averageReactionMs)}ms</div></div>) : <p className="text-slate-500">データなし</p>}</div>; }
