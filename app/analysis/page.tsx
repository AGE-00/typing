'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button, SecondaryButton } from '@/components/ui';
import { deleteSession, getAnalysisSessions, getSessionCount } from '@/lib/db';
import type { MistakeStat, PracticeSession } from '@/lib/types';
import { aggregateKeyStats, buildProgressSeries } from '@/lib/typing/analysis';
import { formatDate, formatPercent } from '@/lib/utils';

type PracticePlanSuggestion = {
  title: string;
  body: string;
  href: string;
  cta: string;
  focusKey?: string;
};

export default function AnalysisPage() {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [totalSessionCount, setTotalSessionCount] = useState(0);

  useEffect(() => {
    void Promise.all([getAnalysisSessions(), getSessionCount()]).then(([loadedSessions, total]) => {
      setSessions(loadedSessions);
      setTotalSessionCount(total);
    });
  }, []);

  const analytics = useMemo(() => {
    const count = sessions.length;
    const totalInputs = sessions.reduce((sum, session) => sum + (session.totalInputs ?? session.summary.totalTyped), 0);
    const totalMistakes = sessions.reduce((sum, session) => sum + (session.mistakes ?? session.summary.mistakesCount), 0);
    const avgWpm = count ? sessions.reduce((sum, session) => sum + session.summary.wpm, 0) / count : 0;
    const avgKpm = count ? sessions.reduce((sum, session) => sum + session.summary.kpm, 0) / count : 0;
    const avgAccuracy = count ? sessions.reduce((sum, session) => sum + session.summary.accuracy, 0) / count : 0;
    const bestWpm = Math.max(0, ...sessions.map((session) => session.summary.wpm));
    const keys = aggregateKeyStats(sessions).slice(0, 12);
    const slow = [...keys].sort((a, b) => b.averageReactionMs - a.averageReactionMs).slice(0, 10);
    const mistakeMap = new Map<string, MistakeStat>();

    sessions.forEach((session) => session.summary.mistakes.forEach((mistake) => {
      const id = `${mistake.expected}->${mistake.actual}`;
      const current = mistakeMap.get(id) ?? { ...mistake, count: 0 };
      current.count += mistake.count;
      mistakeMap.set(id, current);
    }));

    const mistakes = [...mistakeMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);
    const progress = buildProgressSeries(sessions).slice(-24);
    const weakTarget = keys[0];
    const latest = sessions[0];
    const streakDays = buildPracticeStreakDays(sessions);
    const suggestion = buildSuggestion({ avgAccuracy, avgWpm, count, latest, totalMistakes, weakTarget });

    return { avgAccuracy, avgKpm, avgWpm, bestWpm, count, keys, mistakes, progress, slow, streakDays, suggestion, totalInputs, totalMistakes, weakTarget };
  }, [sessions]);

  const handleDelete = async (sessionId: string) => {
    if (!confirm('このセッション結果を削除しますか？')) return;
    await deleteSession(sessionId);
    setSessions((current) => current.filter((session) => session.id !== sessionId));
    setTotalSessionCount((count) => Math.max(0, count - 1));
  };

  return <main className="mx-auto max-w-6xl px-4 pb-16">
    <header className="kinetic-rise flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 py-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-950">次の練習</h1>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
          <span>{totalSessionCount} セッション</span>
          {totalSessionCount > sessions.length ? <span>直近 {sessions.length} 件を集計</span> : null}
          <span>{analytics.totalInputs} 打鍵</span>
          <span>{analytics.totalMistakes} ミス</span>
        </div>
      </div>
      <Link href="/practice"><Button>練習する</Button></Link>
    </header>

    <section className="grid gap-5 py-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="kinetic-surface kinetic-hover rounded-lg border border-slate-900 bg-slate-950 p-7 text-white shadow-soft">
        <div className="text-sm font-semibold text-slate-300">今日のメニュー</div>
        <h2 className="mt-3 text-3xl font-black leading-tight">{analytics.suggestion.title}</h2>
        <p className="mt-4 max-w-2xl leading-7 text-slate-300">{analytics.suggestion.body}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={analytics.suggestion.href}><Button className="bg-white text-slate-950 hover:bg-slate-100">{analytics.suggestion.cta}</Button></Link>
          <Link href="/practice"><SecondaryButton className="border-white/20 bg-white/10 text-white hover:bg-white/15">通常練習</SecondaryButton></Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DecisionMetric label="正確率" value={formatPercent(analytics.avgAccuracy)} note={analytics.avgAccuracy >= 96 ? '安定' : '精度優先'} />
        <DecisionMetric label="平均WPM" value={analytics.avgWpm.toFixed(1)} note={`最高 ${analytics.bestWpm.toFixed(1)}`} />
        <DecisionMetric label="優先キー" value={analytics.weakTarget?.key ?? '-'} note={analytics.weakTarget ? `${analytics.weakTarget.mistakes} ミス` : '記録待ち'} />
        <DecisionMetric label="連続日数" value={`${analytics.streakDays}`} note={analytics.streakDays ? '今日まで継続' : '今日から開始'} />
      </div>
    </section>

    <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
      <Panel title="推移">
        <div className="h-72">{analytics.progress.length ? <ResponsiveContainer width="100%" height="100%">
          <LineChart data={analytics.progress} margin={{ left: -10, right: 18, top: 12, bottom: 18 }}>
            <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="name"
              tickFormatter={formatProgressTick}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={16}
              interval="preserveStartEnd"
              padding={{ left: 14, right: 14 }}
            />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip labelFormatter={(label) => String(label)} />
            <Line type="monotone" dataKey="wpm" name="WPM" stroke="hsl(var(--foreground))" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="accuracy" name="正確率" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer> : <Empty />}</div>
      </Panel>

      <Panel title="根拠">
        {analytics.weakTarget ? <div className="space-y-4">
          <div>
            <div className="text-sm text-slate-500">次に寄せるキー</div>
            <div className="mt-1 font-mono text-5xl font-black text-slate-950">{analytics.weakTarget.key}</div>
          </div>
          <dl className="grid grid-cols-3 gap-3 border-y border-slate-200 py-4 text-sm">
            <div><dt className="text-slate-500">ミス</dt><dd className="mt-1 font-mono font-bold">{analytics.weakTarget.mistakes}</dd></div>
            <div><dt className="text-slate-500">試行</dt><dd className="mt-1 font-mono font-bold">{analytics.weakTarget.attempts}</dd></div>
            <div><dt className="text-slate-500">反応</dt><dd className="mt-1 font-mono font-bold">{Math.round(analytics.weakTarget.averageReactionMs)}ms</dd></div>
          </dl>
          <Link href={`/practice?weakKey=${encodeURIComponent(analytics.weakTarget.key)}`}><SecondaryButton className="w-full">このキーで練習</SecondaryButton></Link>
        </div> : <Empty />}
      </Panel>
    </section>

    <section className="mt-5 grid gap-5 lg:grid-cols-2">
      <Panel title="弱いキー">
        <div className="h-72">{analytics.keys.length ? <ResponsiveContainer width="100%" height="100%">
          <BarChart data={analytics.keys.map((key) => ({ key: key.key, mistakes: key.mistakes, accuracy: Number(key.accuracy.toFixed(1)) }))} margin={{ left: -10, right: 12, top: 12, bottom: 12 }}>
            <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="key" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="mistakes" name="ミス" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer> : <Empty />}</div>
      </Panel>

      <Panel title="反応が遅いキー">
        <div className="h-72">{analytics.slow.length ? <ResponsiveContainer width="100%" height="100%">
          <BarChart data={analytics.slow.map((key) => ({ key: key.key, ms: Math.round(key.averageReactionMs) }))} margin={{ left: -10, right: 12, top: 12, bottom: 12 }}>
            <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="key" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="ms" name="ms" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer> : <Empty />}</div>
      </Panel>
    </section>

    <section className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <Panel title="ミスパターン">
        <div className="divide-y divide-slate-200">
          {analytics.mistakes.length ? analytics.mistakes.map((mistake) => <div key={`${mistake.expected}-${mistake.actual}`} className="flex items-center justify-between py-3 font-mono">
            <span>{mistake.expected} → {mistake.actual}</span>
            <span className="text-slate-500">{mistake.count}回</span>
          </div>) : <Empty />}
        </div>
      </Panel>

      <Panel title="最近のセッション">
        <div className="divide-y divide-slate-200">
          {sessions.length ? sessions.slice(0, 5).map((session) => <div key={session.id} className="grid gap-2 py-3 text-sm md:grid-cols-[1fr_5rem_5rem_8rem_4rem] md:items-center">
            <Link href={`/result/${session.id}`} className="font-semibold text-slate-950 hover:text-slate-700">{session.japanese}</Link>
            <span className="font-mono">W {session.summary.wpm.toFixed(1)}</span>
            <span>{formatPercent(session.summary.accuracy)}</span>
            <span className="text-slate-500">{formatDate(session.endedAt)}</span>
            <button className="text-left text-red-700 hover:text-red-800 md:text-right" onClick={() => void handleDelete(session.id)}>削除</button>
          </div>) : <Empty />}
        </div>
      </Panel>
    </section>
  </main>;
}

function formatProgressTick(value: string | number) {
  return String(value).replace('回目', '');
}

function buildPracticeStreakDays(sessions: PracticeSession[]) {
  const days = new Set(sessions.map((session) => formatLocalDay(new Date(session.endedAt))));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = formatLocalDay(cursor);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function formatLocalDay(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildSuggestion({
  avgAccuracy,
  avgWpm,
  count,
  latest,
  totalMistakes,
  weakTarget,
}: {
  avgAccuracy: number;
  avgWpm: number;
  count: number;
  latest?: PracticeSession;
  totalMistakes: number;
  weakTarget?: { key: string; mistakes: number; attempts: number; averageReactionMs: number };
}): PracticePlanSuggestion {
  if (!count) {
    return {
      title: 'まず5問だけ打つ',
      body: '記録がまだないため、短い練習で基準値を作ります。最初のセッションから正確率、速度、キー別の迷いを保存します。',
      href: '/practice',
      cta: '5問で始める',
    };
  }

  if (weakTarget && weakTarget.mistakes >= 3) {
    return {
      title: `今日は「${weakTarget.key}」を含む問題`,
      body: `直近の記録では「${weakTarget.key}」のミスが目立ちます。同じ長さ・難易度の範囲で、このキーを含む問題を多めに出して指の迷いを減らします。`,
      href: `/practice?weakKey=${encodeURIComponent(weakTarget.key)}`,
      cta: 'このキーで練習',
      focusKey: weakTarget.key,
    };
  }

  if (avgAccuracy < 94) {
    return {
      title: '速度より正確率を戻す',
      body: `平均正確率は ${formatPercent(avgAccuracy)}。短い問題で打ち急ぎを減らし、ミスの少ないリズムを作ります。`,
      href: '/practice',
      cta: '短く練習',
    };
  }

  if (latest && latest.summary.wpm < avgWpm * 0.85) {
    return {
      title: '前回のリズムを取り戻す',
      body: `前回のWPMが平均より落ちています。条件を変えずに短めのセッションで、普段の速度へ戻す練習が合います。`,
      href: '/practice',
      cta: 'リズム練習',
    };
  }

  if (totalMistakes <= 2 && count >= 3) {
    return {
      title: '少し負荷を上げる',
      body: 'ミスが少なく安定しています。通常練習で問題数や文章の長さを少し上げると、分析できるデータも増えます。',
      href: '/practice',
      cta: '練習を続ける',
    };
  }

  return {
    title: '通常練習で記録を増やす',
    body: '大きく崩れている指標はありません。もう1セッション追加して、弱点キーと速度の推移を見やすくします。',
    href: '/practice',
    cta: '練習する',
  };
}

function DecisionMetric({ label, note, value }: { label: string; note: string; value: string }) {
  return <div className="kinetic-surface kinetic-hover rounded-lg border border-slate-200 bg-white p-4">
    <div className="text-sm text-slate-500">{label}</div>
    <div className="mt-1 font-mono text-3xl font-black text-slate-950">{value}</div>
    <div className="mt-2 text-xs text-slate-500">{note}</div>
  </div>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="kinetic-surface kinetic-rise rounded-lg border border-slate-200 bg-white p-5">
    <h2 className="font-bold text-slate-950">{title}</h2>
    <div className="mt-4">{children}</div>
  </section>;
}

function Empty() {
  return <div className="flex min-h-32 items-center justify-center rounded-lg bg-slate-50 p-6 text-sm text-slate-500">データがありません</div>;
}
