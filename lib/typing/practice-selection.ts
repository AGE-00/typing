import type { InputEventRecord, KeyStroke, PracticeSessionOptions, PracticeText } from '@/lib/types';
import { getPrimaryRomanization, toHiragana } from './romanization';

const difficultPattern = /(っ|ゃ|ゅ|ょ|しゃ|しゅ|しょ|ちゃ|ちゅ|ちょ|りゃ|りゅ|りょ|じ|ぢ|ず|づ|ー|ん[あいうえおやゆよ])/;

export function hasDifficultRomanizationPattern(text: string) {
  return difficultPattern.test(toHiragana(text));
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function shuffle<T>(items: T[], seed: number) {
  const result = [...items];
  const random = seededRandom(seed);
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function byLength(options: PracticeSessionOptions, text: PracticeText) {
  if (options.lengthType === 'mixed') return text.lengthType !== 'long';
  return text.lengthType === options.lengthType;
}

function byCategory(options: PracticeSessionOptions, text: PracticeText) {
  return !options.category || options.category === 'all' || text.category === options.category;
}

function uniqueById(items: PracticeText[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function weakKeyScore(text: PracticeText, keys: string[]) {
  if (!keys.length) return 0;
  const romanized = getPrimaryRomanization(text.reading ?? text.text).toLowerCase();
  return keys.reduce((score, key) => {
    const normalized = key.trim().toLowerCase();
    if (!normalized) return score;
    return score + romanized.split(normalized).length - 1;
  }, 0);
}

function personalizeCandidates(candidates: PracticeText[], options: PracticeSessionOptions, seed: number) {
  const keys = (options.preferredWeakKeys ?? []).map((key) => key.trim().toLowerCase()).filter(Boolean).slice(0, 5);
  if (!keys.length || options.personalizationMode === 'off') return shuffle(candidates, seed);

  const ranked = shuffle(candidates, seed).map((text) => ({ text, score: weakKeyScore(text, keys) }));
  const focused = ranked.filter((item) => item.score > 0).sort((a, b) => b.score - a.score).map((item) => item.text);
  const regular = ranked.filter((item) => item.score <= 0).map((item) => item.text);
  if (options.personalizationMode === 'intensive') return [...focused, ...regular];

  const mixed: PracticeText[] = [];
  let focusedIndex = 0;
  let regularIndex = 0;
  while (focusedIndex < focused.length || regularIndex < regular.length) {
    for (let i = 0; i < 2 && focusedIndex < focused.length; i += 1) {
      mixed.push(focused[focusedIndex]);
      focusedIndex += 1;
    }
    if (regularIndex < regular.length) {
      mixed.push(regular[regularIndex]);
      regularIndex += 1;
    }
  }
  return mixed;
}

export function buildPracticePlan(options: PracticeSessionOptions, source: PracticeText[], seed = Date.now()) {
  if (options.lengthType === 'long') {
    const longPrompts = source.filter((text) => text.lengthType === 'long');
    const categoryScoped = longPrompts.filter((text) => byCategory(options, text));
    const scoped = categoryScoped.length ? categoryScoped : longPrompts;
    const preferred = scoped.filter((text) => text.difficulty === options.difficulty);
    const preferredIds = new Set(preferred.map((text) => text.id));
    const relaxed = scoped.filter((text) => !preferredIds.has(text.id));
    return uniqueById([...shuffle(preferred, seed), ...shuffle(relaxed, seed + 1)]).slice(0, Math.min(options.questionCount, scoped.length));
  }

  const exact = source.filter((text) => byLength(options, text) && text.difficulty === options.difficulty && byCategory(options, text));
  return uniqueById(personalizeCandidates(exact, options, seed)).slice(0, Math.min(options.questionCount, exact.length));
}

export function buildWeaknessPracticeSource(target: string | null | undefined, source: PracticeText[]) {
  const normalized = (target ?? '').trim().toLowerCase();
  if (!normalized) return source;
  const matching = source.filter((text) => getPrimaryRomanization(text.reading ?? text.text).toLowerCase().includes(normalized));
  if (!matching.length) return source;
  const matchingIds = new Set(matching.map((text) => text.id));
  return [...matching, ...source.filter((text) => !matchingIds.has(text.id))];
}

function splitReadingSegments(reading: string) {
  const source = toHiragana(reading).replace(/[\s、。,.!?！？「」『』（）()]/g, '');
  const segments: { targetChar: string; targetRomaji: string }[] = [];
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const pair = source.slice(i, i + 2);
    if (char === 'っ') {
      const next = getPrimaryRomanization(source.slice(i + 1, i + 3))[0] ?? getPrimaryRomanization(source[i + 1] ?? '')[0] ?? '';
      segments.push({ targetChar: char, targetRomaji: next });
      continue;
    }
    if (['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ'].includes(source[i + 1] ?? '')) {
      segments.push({ targetChar: pair, targetRomaji: getPrimaryRomanization(pair) });
      i += 1;
      continue;
    }
    segments.push({ targetChar: char, targetRomaji: getPrimaryRomanization(char) });
  }
  return segments;
}

export function getTargetSegmentAtPosition(reading: string, romanized: string, position: number) {
  let cursor = 0;
  for (const segment of splitReadingSegments(reading)) {
    const start = cursor;
    const end = cursor + segment.targetRomaji.length;
    if (position >= start && position < end) return segment;
    cursor = end;
  }
  return { targetChar: reading[0] ?? '', targetRomaji: romanized[position] ?? '' };
}

export function buildInputEventRecords(sessionId: string, strokes: KeyStroke[]): InputEventRecord[] {
  return strokes.map((stroke) => {
    const questionIndex = stroke.questionIndex ?? 0;
    const timestamp = Number.isFinite(stroke.timestamp) ? stroke.timestamp : 0;
    return {
      id: `${sessionId}-${questionIndex}-${stroke.position}-${timestamp}`,
      sessionId,
      promptResultId: `${sessionId}-${questionIndex}`,
      practiceTextId: stroke.practiceTextId ?? '',
      questionIndex,
      expectedKey: stroke.expected,
      actualKey: stroke.key,
      isCorrect: stroke.correct,
      targetChar: stroke.targetChar ?? '',
      targetRomaji: stroke.targetRomaji ?? stroke.expected,
      position: stroke.position,
      reactionTimeMs: stroke.reactionMs,
      timestamp: new Date(timestamp).toISOString(),
    };
  });
}
