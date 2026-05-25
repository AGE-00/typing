'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { Clock3, Flag, Pause, Play, RotateCcw, ShieldAlert, Target } from 'lucide-react';
import { OptionBlock } from '@/components/practice-options/OptionBlock';
import { OptionButton } from '@/components/practice-options/OptionButton';
import { OptionCard } from '@/components/practice-options/OptionCard';
import { ToggleOptionCard } from '@/components/practice-options/ToggleOptionCard';
import { RomanizedGuide } from '@/components/typing/RomanizedGuide';
import { StrictModeBadge } from '@/components/typing/StrictModeBadge';
import { TypingPrompt } from '@/components/typing/TypingPrompt';
import { TypingStatsBar } from '@/components/typing/TypingStatsBar';
import { Badge, Button, SecondaryButton } from '@/components/ui';
import { getRecentSessions, getSettings, saveSession } from '@/lib/db';
import type { AnimationPreference, KeyStroke, PracticeSessionOptions, PracticeText, PromptResult, UserSettings } from '@/lib/types';
import { getEffectiveMotionLevel, getMotionConfig } from '@/lib/motion';
import { aggregateKeyStats, analyzeSession } from '@/lib/typing/analysis';
import { practiceTexts } from '@/lib/typing/practice-texts';
import { buildPracticePlan, buildInputEventRecords, buildWeaknessPracticeSource, getTargetSegmentAtPosition } from '@/lib/typing/practice-selection';
import { buildAcceptedRomanizations, chooseRomanizationForText, getPrimaryRomanization } from '@/lib/typing/romanization';

const questionOptions = [5, 10, 20, 30, 50] as const;
const lengthOptions = [
  ['word', '単語'],
  ['short', '短文'],
  ['medium', '少し長い短文'],
] as const;
const difficultyOptions = [
  ['beginner', 'やさしい'],
  ['normal', 'ふつう'],
  ['advanced', 'むずかしい'],
  ['technical', '技術用語'],
] as const;

type FinishReason = 'mistake' | 'manual_end' | 'time_limit';
type FinishFailure = KeyStroke & { questionIndex: number; text: PracticeText };
type PendingFinish = {
  promptResults: PromptResult[];
  allStrokes: KeyStroke[];
  reason?: FinishReason;
  failure?: FinishFailure;
};

function FormatTime({ ms }: { ms: number }) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return <>{minutes}:{rest.toString().padStart(2, '0')}</>;
}

function buildPromptResultRecord({
  completed,
  failed,
  finalTyped,
  index,
  preferredRomanization,
  sessionId,
  startedAt,
  endedAt,
  strokes,
  text,
}: {
  completed?: boolean;
  failed: boolean;
  finalTyped: string;
  index: number;
  preferredRomanization: UserSettings['preferredRomanization'];
  sessionId: string;
  startedAt: number;
  endedAt: number;
  strokes: KeyStroke[];
  text: PracticeText;
}): PromptResult {
  const correctInputs = strokes.filter((s) => s.correct).length;
  const totalInputs = strokes.length;
  const minutes = Math.max(1 / 60, (endedAt - startedAt) / 60000);
  return {
    id: `${sessionId}-${index}`,
    sessionId,
    practiceTextId: text.id,
    questionIndex: index,
    text: text.text,
    reading: text.reading ?? text.text,
    targetRomanized: getPrimaryRomanization(text.reading ?? text.text, preferredRomanization),
    typed: finalTyped,
    startedAt,
    endedAt,
    totalInputs,
    correctInputs,
    mistakes: totalInputs - correctInputs,
    accuracy: totalInputs ? (correctInputs / totalInputs) * 100 : 100,
    kpm: correctInputs / minutes,
    completed: completed ?? (!failed && finalTyped.length > 0),
    failed,
  };
}

function usePracticeDefaults({
  setAnimationPreference,
  setOptions,
  setPreferredRomanization,
  setPreferredWeakKeys,
  setPrefersReducedMotion,
  setWeakKey,
}: {
  setAnimationPreference: Dispatch<SetStateAction<AnimationPreference>>;
  setOptions: Dispatch<SetStateAction<PracticeSessionOptions>>;
  setPreferredRomanization: Dispatch<SetStateAction<UserSettings['preferredRomanization']>>;
  setPreferredWeakKeys: Dispatch<SetStateAction<string[]>>;
  setPrefersReducedMotion: Dispatch<SetStateAction<boolean>>;
  setWeakKey: Dispatch<SetStateAction<string>>;
}) {
  useEffect(() => {
    setWeakKey(new URLSearchParams(window.location.search).get('weakKey')?.trim().toLowerCase() ?? '');
    void getSettings().then((settings) => {
      setAnimationPreference(settings.animationPreference);
      setPreferredRomanization(settings.preferredRomanization);
      setOptions((current) => ({ ...current, strictMode: settings.strictMode, focusMode: settings.focusModeDefault, personalizationMode: settings.personalizationMode }));
    });
    void getRecentSessions(40).then((sessions) => {
      const keys = aggregateKeyStats(sessions)
        .filter((key) => key.mistakes > 0)
        .slice(0, 5)
        .map((key) => key.key);
      setPreferredWeakKeys(keys);
    });
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setPrefersReducedMotion(media.matches);
    syncMotion();
    media.addEventListener('change', syncMotion);
    return () => media.removeEventListener('change', syncMotion);
  }, [setAnimationPreference, setOptions, setPreferredRomanization, setPreferredWeakKeys, setPrefersReducedMotion, setWeakKey]);
}

export default function PracticePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastStrokeAt = useRef<number | null>(null);
  const pausedStartedAt = useRef<number | null>(null);
  const isFinishingRef = useRef(false);
  const [options, setOptions] = useState<PracticeSessionOptions>({ questionCount: 5, lengthType: 'word', difficulty: 'normal', strictMode: false, durationSec: null, focusMode: false });
  const [preferredRomanization, setPreferredRomanization] = useState<UserSettings['preferredRomanization']>('hepburn');
  const [preferredWeakKeys, setPreferredWeakKeys] = useState<string[]>([]);
  const [weakKey, setWeakKey] = useState('');
  const [animationPreference, setAnimationPreference] = useState<AnimationPreference>('minimal');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [customCount, setCustomCount] = useState('');
  const [plan, setPlan] = useState<PracticeText[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [currentStrokes, setCurrentStrokes] = useState<KeyStroke[]>([]);
  const [allStrokes, setAllStrokes] = useState<KeyStroke[]>([]);
  const [promptResults, setPromptResults] = useState<PromptResult[]>([]);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [promptStartedAt, setPromptStartedAt] = useState<number | null>(null);
  const [pausedDurationMs, setPausedDurationMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [pendingFinish, setPendingFinish] = useState<PendingFinish | null>(null);
  const [lastMistakeAt, setLastMistakeAt] = useState(0);
  const [clockTick, setClockTick] = useState(0);
  const sessionId = useRef<string>('');

  const currentText = plan[questionIndex];
  const reading = currentText?.reading ?? currentText?.text ?? '';
  const target = useMemo(() => currentText ? getPrimaryRomanization(reading, preferredRomanization) : '', [currentText, preferredRomanization, reading]);
  const currentChoice = useMemo(() => currentText ? chooseRomanizationForText(reading, typed, preferredRomanization) : null, [currentText, preferredRomanization, reading, typed]);
  const displayTarget = currentChoice?.target ?? target;
  void clockTick;
  const effectiveMotionLevel = getEffectiveMotionLevel(animationPreference, prefersReducedMotion);
  const motion = getMotionConfig(effectiveMotionLevel);
  const elapsedMs = sessionStartedAt ? Date.now() - sessionStartedAt : 0;
  const effectiveElapsedMs = Math.max(0, elapsedMs - pausedDurationMs - (isPaused && pausedStartedAt.current ? Date.now() - pausedStartedAt.current : 0));
  const correctCount = allStrokes.filter((s) => s.correct).length;
  const accuracy = allStrokes.length ? (correctCount / allStrokes.length) * 100 : 100;
  const kpm = sessionStartedAt ? (correctCount / Math.max(1, effectiveElapsedMs / 60000)) : 0;
  const wpm = kpm / 5;
  const latestStateRef = useRef({
    allStrokes,
    currentStrokes,
    currentText,
    isPaused,
    options,
    pausedDurationMs,
    plan,
    preferredRomanization,
    promptResults,
    promptStartedAt,
    questionIndex,
    reading,
    sessionStartedAt,
    typed,
    weakKey,
  });

  latestStateRef.current = {
    allStrokes,
    currentStrokes,
    currentText,
    isPaused,
    options,
    pausedDurationMs,
    plan,
    preferredRomanization,
    promptResults,
    promptStartedAt,
    questionIndex,
    reading,
    sessionStartedAt,
    typed,
    weakKey,
  };

  useEffect(() => { if (isRunning) inputRef.current?.focus(); }, [isRunning, questionIndex]);

  usePracticeDefaults({
    setAnimationPreference,
    setOptions,
    setPreferredRomanization,
    setPreferredWeakKeys,
    setPrefersReducedMotion,
    setWeakKey,
  });

  useEffect(() => {
    if (!isRunning || isPaused) return;
    const timer = window.setInterval(() => setClockTick((tick) => tick + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isPaused, isRunning]);

  const updateOption = <K extends keyof PracticeSessionOptions>(key: K, value: PracticeSessionOptions[K]) => setOptions((current) => ({ ...current, [key]: value }));

  const start = () => {
    const parsedCustom = Number.parseInt(customCount, 10);
    const questionCount = Number.isFinite(parsedCustom) && parsedCustom > 0 ? Math.min(100, parsedCustom) : options.questionCount;
    const requestedOptions = { ...options, questionCount, preferredWeakKeys: weakKey ? [weakKey] : preferredWeakKeys, personalizationMode: weakKey ? 'intensive' as const : options.personalizationMode };
    const source = buildWeaknessPracticeSource(weakKey, practiceTexts);
    const nextPlan = buildPracticePlan(requestedOptions, source, Date.now());
    const nextOptions = { ...requestedOptions, questionCount: nextPlan.length || questionCount };
    sessionId.current = crypto.randomUUID();
    setOptions(nextOptions);
    setPlan(nextPlan);
    setQuestionIndex(0);
    setTyped('');
    setCurrentStrokes([]);
    setAllStrokes([]);
    setPromptResults([]);
    setSaveError('');
    setPendingFinish(null);
    setPausedDurationMs(0);
    pausedStartedAt.current = null;
    const now = Date.now();
    setSessionStartedAt(now);
    setPromptStartedAt(now);
    lastStrokeAt.current = null;
    setIsRunning(true);
    setIsPaused(false);
    setIsFinishing(false);
    isFinishingRef.current = false;
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const finishSession = useCallback(async (nextPromptResults: PromptResult[], nextAllStrokes: KeyStroke[], reason?: FinishReason, failure?: FinishFailure) => {
    const snapshot = latestStateRef.current;
    if (isFinishingRef.current || !snapshot.sessionStartedAt || !snapshot.plan.length) return;
    isFinishingRef.current = true;
    setIsFinishing(true);
    setSaveError('');
    const pending: PendingFinish = { promptResults: nextPromptResults, allStrokes: nextAllStrokes, reason, failure };
    setPendingFinish(pending);
    const endedAt = Date.now();
    const totalPaused = snapshot.pausedDurationMs + (snapshot.isPaused && pausedStartedAt.current ? endedAt - pausedStartedAt.current : 0);
    const activeDurationMs = Math.max(1000, endedAt - snapshot.sessionStartedAt - totalPaused);
    let finalPromptResults = nextPromptResults;
    if (reason && reason !== 'mistake' && snapshot.currentText && snapshot.promptStartedAt && !nextPromptResults.some((result) => result.questionIndex === snapshot.questionIndex)) {
      finalPromptResults = [...nextPromptResults, buildPromptResultRecord({
        completed: false,
        failed: false,
        finalTyped: snapshot.typed,
        index: snapshot.questionIndex,
        preferredRomanization: snapshot.preferredRomanization,
        sessionId: sessionId.current,
        startedAt: snapshot.promptStartedAt,
        endedAt,
        strokes: snapshot.currentStrokes,
        text: snapshot.currentText,
      })];
    }
    const typedJoined = finalPromptResults.map((r) => r.typed).join('|');
    const acceptedForAllPrompts = finalPromptResults.flatMap((result) => buildAcceptedRomanizations(result.reading, snapshot.preferredRomanization));
    const summary = analyzeSession({ sentence: { romanized: snapshot.plan.map((p) => getPrimaryRomanization(p.reading ?? p.text, snapshot.preferredRomanization)).join('') }, strokes: nextAllStrokes, startedAt: snapshot.sessionStartedAt, endedAt, activeDurationMs, typed: typedJoined, acceptedRomanizations: acceptedForAllPrompts });
    const inputEvents = buildInputEventRecords(sessionId.current, nextAllStrokes);
    const first = snapshot.plan[0];
    try {
      await saveSession({
        id: sessionId.current,
        sentenceId: first.id,
        japanese: `${finalPromptResults.filter((r) => r.completed).length}/${snapshot.options.questionCount}問完了`,
        reading: first.reading ?? first.text,
        targetRomanized: getPrimaryRomanization(first.reading ?? first.text, snapshot.preferredRomanization),
        acceptedRomanizations: buildAcceptedRomanizations(first.reading ?? first.text, snapshot.preferredRomanization),
        typed: typedJoined,
        startedAt: snapshot.sessionStartedAt,
        endedAt,
        strokes: nextAllStrokes,
        summary,
        mode: snapshot.weakKey ? 'weakness' : snapshot.options.lengthType === 'short' ? 'short' : 'normal',
        durationSec: snapshot.options.durationSec,
        questionCount: snapshot.options.questionCount,
        completedQuestionCount: finalPromptResults.filter((r) => r.completed).length,
        strictMode: snapshot.options.strictMode,
        isFailed: reason === 'mistake',
        failureReason: reason,
        failedAtQuestionIndex: failure?.questionIndex,
        failedPosition: failure?.position,
        failedQuestion: failure?.text.text,
        failedExpectedKey: failure?.expected,
        failedActualKey: failure?.key,
        failedTargetChar: failure?.targetChar,
        failedTargetRomaji: failure?.targetRomaji,
        totalInputs: summary.totalTyped,
        correctInputs: summary.correctTyped,
        mistakes: summary.mistakesCount,
        accuracy: summary.accuracy,
        kpm: summary.kpm,
        wpm: summary.wpm,
        promptResults: finalPromptResults,
        inputEvents,
        options: { ...snapshot.options, category: snapshot.weakKey ? 'all' : snapshot.options.category },
      });
      router.push(`/result/${sessionId.current}`);
    } catch (error) {
      console.error('Failed to save practice session', error);
      setSaveError('セッション結果を保存できませんでした。ブラウザの保存領域を確認して、再試行してください。');
      setPendingFinish(pending);
      pausedStartedAt.current = Date.now();
      setIsPaused(true);
      setIsFinishing(false);
      isFinishingRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [router]);

  useEffect(() => {
    if (!isRunning || !options.durationSec || !sessionStartedAt) return;
    const timer = window.setInterval(() => {
      const snapshot = latestStateRef.current;
      if (!snapshot.sessionStartedAt || snapshot.isPaused || !snapshot.options.durationSec) return;
      const elapsed = Date.now() - snapshot.sessionStartedAt;
      const paused = snapshot.pausedDurationMs + (pausedStartedAt.current ? Date.now() - pausedStartedAt.current : 0);
      if (elapsed - paused >= snapshot.options.durationSec * 1000) {
        void finishSession(snapshot.promptResults, snapshot.allStrokes, 'time_limit');
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [finishSession, isRunning, options.durationSec, sessionStartedAt]);

  const completePrompt = (finalTyped: string, finalStrokes: KeyStroke[], nextAllStrokes: KeyStroke[]) => {
    if (!currentText || !promptStartedAt) return;
    const endedAt = Date.now();
    const promptResult = buildPromptResultRecord({
      failed: false,
      finalTyped,
      index: questionIndex,
      preferredRomanization,
      sessionId: sessionId.current,
      startedAt: promptStartedAt,
      endedAt,
      strokes: finalStrokes,
      text: currentText,
    });
    const nextPromptResults = [...promptResults, promptResult];
    setPromptResults(nextPromptResults);
    if (questionIndex + 1 >= plan.length) {
      void finishSession(nextPromptResults, nextAllStrokes);
      return;
    }
    setQuestionIndex((index) => index + 1);
    setTyped('');
    setCurrentStrokes([]);
    setPromptStartedAt(Date.now());
    lastStrokeAt.current = null;
  };

  const failStrict = (failureStroke: KeyStroke, nextCurrentStrokes: KeyStroke[], nextAllStrokes: KeyStroke[]) => {
    if (!currentText || !promptStartedAt) return;
    const endedAt = Date.now();
    const failedPrompt = buildPromptResultRecord({
      failed: true,
      finalTyped: typed,
      index: questionIndex,
      preferredRomanization,
      sessionId: sessionId.current,
      startedAt: promptStartedAt,
      endedAt,
      strokes: nextCurrentStrokes,
      text: currentText,
    });
    const nextPromptResults = [...promptResults, failedPrompt];
    setPromptResults(nextPromptResults);
    void finishSession(nextPromptResults, nextAllStrokes, 'mistake', { ...failureStroke, questionIndex, text: currentText });
  };

  const togglePause = () => {
    if (!isPaused) {
      pausedStartedAt.current = Date.now();
      setIsPaused(true);
      return;
    }
    if (pausedStartedAt.current) setPausedDurationMs((duration) => duration + Date.now() - pausedStartedAt.current!);
    pausedStartedAt.current = null;
    setIsPaused(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKey = useCallback((keyName: string, event?: { preventDefault: () => void; metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean }) => {
    if (!isRunning || isFinishing || !currentText) return;
    if (keyName === 'Tab') return;
    if (keyName === 'Escape') {
      if (options.focusMode) {
        setOptions((currentOptions) => ({ ...currentOptions, focusMode: false }));
        return;
      }
      void finishSession(promptResults, allStrokes, 'manual_end');
      return;
    }
    if (isPaused) return;
    if (keyName.length !== 1 || event?.metaKey || event?.ctrlKey || event?.altKey) return;
    event?.preventDefault();
    const key = keyName.toLowerCase();
    const now = Date.now();
    const expected = currentChoice?.nextExpected ?? displayTarget[typed.length] ?? '';
    const candidate = chooseRomanizationForText(reading, typed + key, preferredRomanization);
    const correct = Boolean(candidate);
    const segment = getTargetSegmentAtPosition(reading, displayTarget, typed.length);
    const reactionMs = lastStrokeAt.current ? now - lastStrokeAt.current : Math.max(0, now - (promptStartedAt ?? now));
    const stroke: KeyStroke = { key, expected, correct, timestamp: now, reactionMs, position: typed.length, targetChar: segment.targetChar, targetRomaji: segment.targetRomaji, questionIndex, practiceTextId: currentText.id };
    const nextCurrentStrokes = [...currentStrokes, stroke];
    const nextAllStrokes = [...allStrokes, stroke];
    lastStrokeAt.current = now;
    setCurrentStrokes(nextCurrentStrokes);
    setAllStrokes(nextAllStrokes);
    if (!correct) setLastMistakeAt(now);
    if (!correct && options.strictMode) { failStrict(stroke, nextCurrentStrokes, nextAllStrokes); return; }
    if (correct) {
      const nextTyped = typed + key;
      setTyped(nextTyped);
      if (candidate?.complete) completePrompt(nextTyped, nextCurrentStrokes, nextAllStrokes);
    }
  }, [allStrokes, completePrompt, currentChoice?.nextExpected, currentStrokes, currentText, displayTarget, failStrict, finishSession, isFinishing, isPaused, isRunning, options.focusMode, options.strictMode, preferredRomanization, promptResults, promptStartedAt, questionIndex, reading, typed]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => handleKey(event.key, event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [handleKey]);

  if (!isRunning) {
    return <main className="mx-auto max-w-5xl px-4 pb-16">
      <section className="py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Badge className="bg-slate-100 text-slate-700">練習設定</Badge>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">今日の練習を組む</h1>
            {weakKey ? <p className="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">キー「{weakKey}」を多めに出題します。</p> : null}
          </div>
          <Button onClick={start} className="min-h-12 px-6"><Play className="mr-2 h-5 w-5" />開始</Button>
        </div>

        <div className="kinetic-surface space-y-7 rounded-lg border border-slate-200 bg-white p-5 shadow-soft md:p-6">
          <OptionBlock title="問題数">
            <div className="flex flex-wrap gap-2">{questionOptions.map((count) => <OptionButton key={count} active={options.questionCount === count && !customCount} onClick={() => { setCustomCount(''); updateOption('questionCount', count); }}>{count}問</OptionButton>)}<label className="min-w-40"><span className="sr-only">任意の問題数</span><input className="min-h-11 w-full rounded-lg border border-slate-300 px-4 py-2.5" inputMode="numeric" placeholder="任意の問題数" value={customCount} onChange={(e) => setCustomCount(e.target.value.replace(/\D/g, ''))} /></label></div>
          </OptionBlock>
          <OptionBlock title="文章の長さ">
            <div className="grid gap-3 md:grid-cols-4">{lengthOptions.map(([value, label]) => <OptionCard key={value} active={options.lengthType === value} onClick={() => updateOption('lengthType', value)} title={label} />)}<OptionCard active={options.lengthType === 'long'} onClick={() => updateOption('lengthType', 'long')} title="長文" /></div>
          </OptionBlock>
          <OptionBlock title="難易度">
            <div className="grid gap-3 md:grid-cols-4">{difficultyOptions.map(([value, label]) => <OptionCard key={value} active={options.difficulty === value} onClick={() => updateOption('difficulty', value)} title={label} />)}</div>
          </OptionBlock>

          <div className="grid gap-4 md:grid-cols-3">
            <ToggleOptionCard active={options.strictMode} warning title="1ミス終了" description="緊張感を上げる" icon={<ShieldAlert className="h-5 w-5 text-red-600" />} onChange={(checked) => updateOption('strictMode', checked)} />
            <ToggleOptionCard active={options.focusMode} title="集中表示" description="練習画面を全画面化" icon={<Target className="h-5 w-5 text-blue-600" />} onChange={(checked) => updateOption('focusMode', checked)} />
            <div className="kinetic-surface kinetic-hover rounded-lg border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-2 font-bold"><Clock3 className="h-5 w-5 text-slate-600" />制限時間</div><div className="mt-3 flex flex-wrap gap-2">{[null, 30, 60, 120].map((sec) => <OptionButton key={sec ?? 'none'} active={options.durationSec === sec} onClick={() => updateOption('durationSec', sec as PracticeSessionOptions['durationSec'])}>{sec ? `${sec}秒` : 'なし'}</OptionButton>)}</div></div>
          </div>
        </div>
      </section>
    </main>;
  }

  const progress = displayTarget ? Math.min(100, Math.round((typed.length / displayTarget.length) * 100)) : 0;
  const mistakeCount = allStrokes.filter((s) => !s.correct).length;
  const hasRecentMistake = lastMistakeAt > 0 && Date.now() - lastMistakeAt < 180;
  const currentStreak = [...allStrokes].reverse().findIndex((stroke) => !stroke.correct);
  const streak = currentStreak === -1 ? allStrokes.length : currentStreak;
  const remainingTimeMs = options.durationSec ? Math.max(0, options.durationSec * 1000 - effectiveElapsedMs) : null;
  const progressStyle = { width: `${((questionIndex + progress / 100) / plan.length) * 100}%`, transitionDuration: motion.cssDuration };

  return <main className={`${options.focusMode ? 'fixed inset-0 z-50 max-w-none overflow-auto bg-slate-50 px-4 py-6 text-slate-950 md:px-8' : 'mx-auto max-w-6xl px-4 pb-16'}`}>
    <div className={`mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 ${options.focusMode ? 'max-w-6xl' : ''}`}>
      <div><h1 className="text-2xl font-black">練習</h1><p className="text-sm text-slate-600">{questionIndex + 1} / {plan.length}{weakKey ? ` · ${weakKey}` : ''}{isPaused ? ' · 一時停止中' : ''}</p></div>
      <div className="flex flex-wrap gap-2"><SecondaryButton onClick={togglePause}>{isPaused ? <Play className="mr-2 h-4 w-4"/> : <Pause className="mr-2 h-4 w-4"/>}{isPaused ? '再開' : '一時停止'}</SecondaryButton>{options.focusMode ? <SecondaryButton onClick={() => updateOption('focusMode', false)}>集中表示を終了(Esc)</SecondaryButton> : null}<SecondaryButton onClick={() => void finishSession(promptResults, allStrokes, 'manual_end')}><Flag className="mr-2 h-4 w-4"/>終了</SecondaryButton>{!options.focusMode ? <SecondaryButton onClick={start}><RotateCcw className="mr-2 h-4 w-4"/>最初から</SecondaryButton> : null}</div>
    </div>
    {saveError ? <div className="mx-auto mb-5 flex max-w-6xl flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert">
      <span>{saveError}</span>
      <div className="flex gap-2">
        <SecondaryButton className="border-red-200 text-red-700 hover:bg-white" onClick={() => pendingFinish ? void finishSession(pendingFinish.promptResults, pendingFinish.allStrokes, pendingFinish.reason, pendingFinish.failure) : undefined}>再試行</SecondaryButton>
        <SecondaryButton className="border-red-200 text-red-700 hover:bg-white" onClick={start}>破棄して最初から</SecondaryButton>
      </div>
    </div> : null}
    <section className={`mx-auto max-w-6xl space-y-5 transition-colors ${options.focusMode ? 'text-slate-950' : ''}`} aria-label="タイピングゲーム盤面">
      <div className={`kinetic-rise flex flex-wrap items-center gap-x-5 gap-y-2 text-sm ${options.focusMode ? 'text-slate-300' : 'text-slate-600'}`}>
        <span>正確率 <strong className="font-mono text-slate-950">{accuracy.toFixed(1)}%</strong></span>
        <span>KPM <strong className="font-mono text-slate-950">{kpm.toFixed(0)}</strong></span>
        <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" />{remainingTimeMs === null ? <FormatTime ms={effectiveElapsedMs} /> : <FormatTime ms={remainingTimeMs} />}</span>
        <StrictModeBadge enabled={options.strictMode} />
      </div>
      {options.strictMode ? <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />1ミスで終了し、結果画面にキーのずれを残します。</div> : null}
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-slate-800 transition-all" style={progressStyle} /></div>
      <TypingPrompt text={currentText?.text} reading={reading} focusMode={options.focusMode} hasRecentMistake={hasRecentMistake} />
      <RomanizedGuide typed={typed} target={displayTarget} progress={progress} motionLevel={effectiveMotionLevel} />
      <input ref={inputRef} aria-label="typing-input" className="h-0 w-0 opacity-0" value={typed} onChange={() => undefined} autoFocus inputMode="none" />
      <TypingStatsBar mistakeCount={mistakeCount} typedLength={typed.length} targetLength={displayTarget.length} accuracy={accuracy} kpm={kpm} wpm={wpm} streak={streak} />
      <Button onClick={() => inputRef.current?.focus()} className="min-h-12 w-full bg-slate-950 hover:bg-slate-800">入力フォーカスを戻す</Button>
    </section>
  </main>;
}
