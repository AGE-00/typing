import { describe, expect, it } from 'vitest';
import { practiceTexts } from '@/lib/typing/practice-texts';
import type { KeyStroke, PracticeText } from '@/lib/types';
import { buildInputEventRecords, buildPracticePlan, buildWeaknessPracticeSource, getTargetSegmentAtPosition, hasDifficultRomanizationPattern } from '@/lib/typing/practice-selection';
import { getPrimaryRomanization } from '@/lib/typing/romanization';

describe('practice text dataset', () => {
  it('contains a large built-in prompt set with metadata', () => {
    expect(practiceTexts.length).toBeGreaterThanOrEqual(1800);
    expect(new Set(practiceTexts.map((text) => text.text)).size).toBe(practiceTexts.length);
    expect(practiceTexts.every((text) => text.estimatedKeyCount > 0)).toBe(true);
    expect(practiceTexts.some((text) => text.lengthType === 'word')).toBe(true);
    expect(practiceTexts.some((text) => text.lengthType === 'short')).toBe(true);
    expect(practiceTexts.some((text) => text.lengthType === 'medium')).toBe(true);
    const longPrompts = practiceTexts.filter((text) => text.lengthType === 'long');
    expect(longPrompts.length).toBeGreaterThanOrEqual(8);
    expect(longPrompts.length).toBeLessThanOrEqual(12);
    expect(practiceTexts.some((text) => text.difficulty === 'technical')).toBe(true);
    expect(practiceTexts.every((text) => text.estimatedKeyCount === getPrimaryRomanization(text.reading ?? text.text).length)).toBe(true);
    expect(practiceTexts.some((text) => /ます|ました|ません|ましょう|ください|です|でした/.test(text.text))).toBe(false);
  });

  it('flags difficult romanization patterns', () => {
    expect(hasDifficultRomanizationPattern('がっこうでしゅくだいをします')).toBe(true);
    expect(hasDifficultRomanizationPattern('今日は早く寝ます')).toBe(false);
  });
});

describe('practice option selection', () => {
  it('selects unique prompts matching count, length, difficulty, and category', () => {
    const plan = buildPracticePlan({
      questionCount: 10,
      lengthType: 'short',
      difficulty: 'beginner',
      category: 'daily',
      strictMode: false,
      durationSec: null,
      focusMode: false,
    }, practiceTexts, 123);

    expect(plan).toHaveLength(10);
    expect(new Set(plan.map((text) => text.id)).size).toBe(10);
    expect(plan.every((text) => text.lengthType === 'short')).toBe(true);
    expect(plan.every((text) => text.difficulty === 'beginner')).toBe(true);
    expect(plan.every((text) => text.category === 'daily')).toBe(true);
  });

  it('keeps long mode to the curated long variations instead of relaxing into short prompts', () => {
    const longPromptCount = practiceTexts.filter((text) => text.lengthType === 'long').length;
    const plan = buildPracticePlan({
      questionCount: 50,
      lengthType: 'long',
      difficulty: 'normal',
      category: 'all',
      strictMode: true,
      durationSec: 60,
      focusMode: true,
    }, practiceTexts, 456);

    expect(plan).toHaveLength(longPromptCount);
    expect(new Set(plan.map((text) => text.id)).size).toBe(longPromptCount);
    expect(plan.every((text) => text.lengthType === 'long')).toBe(true);
  });

  it('does not relax length or difficulty when the requested count exceeds exact matches', () => {
    const exactMatches = practiceTexts.filter((text) => text.lengthType === 'word' && text.difficulty === 'technical');
    const plan = buildPracticePlan({
      questionCount: exactMatches.length + 10,
      lengthType: 'word',
      difficulty: 'technical',
      category: 'all',
      strictMode: false,
      durationSec: null,
      focusMode: false,
    }, practiceTexts, 789);

    expect(plan).toHaveLength(exactMatches.length);
    expect(plan.every((text) => text.lengthType === 'word')).toBe(true);
    expect(plan.every((text) => text.difficulty === 'technical')).toBe(true);
  });

  it('prioritizes exact-match prompts that contain configured weak keys', () => {
    const source: PracticeText[] = [
      { id: 'a', text: 'かさ', reading: 'かさ', lengthType: 'word', difficulty: 'normal', category: 'daily', tags: [], estimatedKeyCount: 4, containsDifficultPatterns: false },
      { id: 'b', text: 'ざざざ', reading: 'ざざざ', lengthType: 'word', difficulty: 'normal', category: 'daily', tags: [], estimatedKeyCount: 6, containsDifficultPatterns: false },
      { id: 'c', text: 'そら', reading: 'そら', lengthType: 'word', difficulty: 'normal', category: 'daily', tags: [], estimatedKeyCount: 4, containsDifficultPatterns: false },
      { id: 'd', text: 'ざる', reading: 'ざる', lengthType: 'word', difficulty: 'normal', category: 'daily', tags: [], estimatedKeyCount: 4, containsDifficultPatterns: false },
    ];

    const plan = buildPracticePlan({
      questionCount: 2,
      lengthType: 'word',
      difficulty: 'normal',
      category: 'all',
      personalizationMode: 'intensive',
      preferredWeakKeys: ['z'],
      strictMode: false,
      durationSec: null,
      focusMode: false,
    }, source, 123);

    expect(plan.map((text) => text.id)).toEqual(['b', 'd']);
  });

  it('prioritizes prompts that contain a weak key in their romanized target', () => {
    const source = buildWeaknessPracticeSource('z', practiceTexts);

    expect(source.length).toBeGreaterThan(0);
    expect(source[0].reading ?? source[0].text).toBeTruthy();
  });

  it('maps a romaji position to the target Japanese character and segment for strict failures', () => {
    const info = getTargetSegmentAtPosition('がっこう', 'gakkou', 2);

    expect(info).toEqual({ targetChar: 'っ', targetRomaji: 'k' });
  });

  it('maps keystrokes to normalized input event records for persistence', () => {
    const strokes: KeyStroke[] = [
      {
        key: 'x',
        expected: 's',
        correct: false,
        timestamp: 1000,
        reactionMs: 240,
        position: 0,
        targetChar: 'しゅ',
        targetRomaji: 'shu',
        questionIndex: 2,
        practiceTextId: 'text-1',
      },
    ];

    const records = buildInputEventRecords('session-1', strokes);

    expect(records).toEqual([
      {
        id: 'session-1-2-0-1000',
        sessionId: 'session-1',
        promptResultId: 'session-1-2',
        practiceTextId: 'text-1',
        questionIndex: 2,
        expectedKey: 's',
        actualKey: 'x',
        isCorrect: false,
        targetChar: 'しゅ',
        targetRomaji: 'shu',
        position: 0,
        reactionTimeMs: 240,
        timestamp: '1970-01-01T00:00:01.000Z',
      },
    ]);
  });
});
