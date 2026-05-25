import type { KeyStat, KeyStroke, MistakeStat, PracticeSentence, RomanizationHabit, SessionSummary } from '@/lib/types';
import { getRomanizationEfficiency } from './romanization';

type AnalyzeInput = {
  sentence: Pick<PracticeSentence, 'romanized'>;
  strokes: KeyStroke[];
  startedAt: number;
  endedAt: number;
  activeDurationMs?: number;
  typed?: string;
  acceptedRomanizations?: string[];
};

export function analyzeSession({ sentence, strokes, startedAt, endedAt, activeDurationMs, typed, acceptedRomanizations }: AnalyzeInput): SessionSummary {
  void sentence;
  const durationMs = Math.max(1000, activeDurationMs ?? endedAt - startedAt);
  const totalTyped = strokes.length;
  const correctTyped = strokes.filter((s) => s.correct).length;
  const mistakesCount = totalTyped - correctTyped;
  const minutes = durationMs / 60000;
  const accuracy = totalTyped === 0 ? 100 : (correctTyped / totalTyped) * 100;
  const kpm = correctTyped / minutes;
  const wpm = correctTyped / 5 / minutes;

  const byExpected = new Map<string, { attempts: number; mistakes: number; totalReaction: number }>();
  const mistakes = new Map<string, MistakeStat>();

  strokes.forEach((stroke) => {
    const stat = byExpected.get(stroke.expected) ?? { attempts: 0, mistakes: 0, totalReaction: 0 };
    stat.attempts += 1;
    stat.totalReaction += stroke.reactionMs;
    if (!stroke.correct) {
      stat.mistakes += 1;
      const id = `${stroke.expected}->${stroke.key}`;
      const mistake = mistakes.get(id) ?? { expected: stroke.expected, actual: stroke.key, count: 0 };
      mistake.count += 1;
      mistakes.set(id, mistake);
    }
    byExpected.set(stroke.expected, stat);
  });

  const keyStats: KeyStat[] = [...byExpected.entries()].map(([key, stat]) => ({
    key,
    attempts: stat.attempts,
    mistakes: stat.mistakes,
    accuracy: stat.attempts === 0 ? 100 : ((stat.attempts - stat.mistakes) / stat.attempts) * 100,
    averageReactionMs: stat.totalReaction / stat.attempts,
  }));

  const weakKeys = [...keyStats]
    .filter((key) => key.attempts > 0)
    .sort((a, b) => b.mistakes - a.mistakes || a.accuracy - b.accuracy || b.attempts - a.attempts)
    .slice(0, 8);

  const slowKeys = [...keyStats]
    .sort((a, b) => b.averageReactionMs - a.averageReactionMs)
    .slice(0, 8);

  return {
    totalTyped,
    correctTyped,
    mistakesCount,
    accuracy,
    wpm,
    kpm,
    durationMs,
    keyStats,
    weakKeys,
    slowKeys,
    mistakes: [...mistakes.values()].sort((a, b) => b.count - a.count).slice(0, 12),
    romanizationEfficiency: typed && acceptedRomanizations?.length ? getRomanizationEfficiency(typed, acceptedRomanizations) : undefined,
  };
}

export function aggregateKeyStats(sessions: { summary: SessionSummary }[]): KeyStat[] {
  const map = new Map<string, { attempts: number; mistakes: number; weightedReaction: number }>();
  sessions.forEach(({ summary }) => {
    const rows = summary.keyStats?.length ? summary.keyStats : [...new Map([...summary.weakKeys, ...summary.slowKeys].map((key) => [key.key, key])).values()];
    rows.forEach((key) => {
      const stat = map.get(key.key) ?? { attempts: 0, mistakes: 0, weightedReaction: 0 };
      stat.attempts += key.attempts;
      stat.mistakes += key.mistakes;
      stat.weightedReaction += key.averageReactionMs * key.attempts;
      map.set(key.key, stat);
    });
  });
  return [...map.entries()].map(([key, stat]) => ({
    key,
    attempts: stat.attempts,
    mistakes: stat.mistakes,
    accuracy: stat.attempts ? ((stat.attempts - stat.mistakes) / stat.attempts) * 100 : 100,
    averageReactionMs: stat.attempts ? stat.weightedReaction / stat.attempts : 0,
  })).sort((a, b) => b.mistakes - a.mistakes || b.averageReactionMs - a.averageReactionMs);
}

export function aggregateRomanizationHabits(sessions: { typed: string; acceptedRomanizations: string[]; summary: SessionSummary }[]): RomanizationHabit[] {
  const map = new Map<string, RomanizationHabit>();
  sessions.forEach((session) => {
    if (!session.typed || !session.acceptedRomanizations.length) return;
    const efficiency = session.summary.romanizationEfficiency ?? getRomanizationEfficiency(session.typed, session.acceptedRomanizations);
    if (efficiency.extraKeystrokes <= 0) return;
    const id = `${efficiency.typed}->${efficiency.optimal}`;
    const current = map.get(id) ?? { ...efficiency, count: 0 };
    current.count += 1;
    map.set(id, current);
  });
  return [...map.values()].sort((a, b) => b.extraKeystrokes * b.count - a.extraKeystrokes * a.count || b.count - a.count);
}

export function buildProgressSeries(sessions: { endedAt: number; summary: SessionSummary }[]) {
  return [...sessions]
    .sort((a, b) => a.endedAt - b.endedAt)
    .map((session, index) => ({
      name: `${index + 1}回目`,
      wpm: Number(session.summary.wpm.toFixed(1)),
      accuracy: Number(session.summary.accuracy.toFixed(1)),
      date: new Date(session.endedAt).toLocaleDateString('ja-JP'),
    }));
}
