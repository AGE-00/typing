import { describe, expect, it } from 'vitest';
import {
  buildAcceptedRomanizations,
  chooseBestRomanization,
  chooseRomanizationForText,
  getPrimaryRomanization,
  getRomanizationEfficiency,
} from '@/lib/typing/romanization';
import { aggregateKeyStats, analyzeSession, aggregateRomanizationHabits } from '@/lib/typing/analysis';
import type { KeyStroke, PracticeSentence } from '@/lib/types';

describe('romanization', () => {
  it('builds a primary romanized input for Japanese kana text', () => {
    expect(getPrimaryRomanization('こんにちは')).toBe('konnichiha');
    expect(getPrimaryRomanization('がっこう')).toBe('gakkou');
    expect(getPrimaryRomanization('タイピング')).toBe('taipingu');
  });

  it('accepts common alternate romanization habits', () => {
    const accepted = buildAcceptedRomanizations('しんぶんをよむ');
    expect(accepted).toContain('shinbunwoyomu');
    expect(accepted).toContain('sinbunwoyomu');
    expect(accepted).toContain('shinbunoyomu');
  });

  it('keeps the primary display in hepburn while accepting incremental alternates', () => {
    expect(getPrimaryRomanization('しんぶんをよむ')).toBe('shinbunwoyomu');
    expect(chooseRomanizationForText('しんぶんをよむ', '')).toMatchObject({
      target: 'shinbunwoyomu',
      nextExpected: 's',
    });
    expect(chooseRomanizationForText('しんぶんをよむ', 'si')).toMatchObject({
      target: 'sinbunwoyomu',
      nextExpected: 'n',
    });

    const accepted = buildAcceptedRomanizations('しんぶんをよむ');
    expect(chooseBestRomanization('sinbunoyomu', accepted)).toMatchObject({
      target: 'sinbunoyomu',
      complete: true,
      nextExpected: '',
    });
    expect(chooseBestRomanization('x', accepted)).toBeNull();
  });

  it('handles ambiguous n before vowels and y-row kana', () => {
    expect(getPrimaryRomanization('ほんや')).toBe('honnya');
    expect(buildAcceptedRomanizations('ほんや')).toContain("hon'ya");
    expect(chooseRomanizationForText('ほんや', 'honnya')).toMatchObject({ complete: true });
    expect(chooseRomanizationForText('ほんや', "hon'ya")).toMatchObject({ complete: true });
    expect(chooseRomanizationForText('んあ', 'na')).toBeNull();
  });

  it('scores inefficient romanization habits against the shortest accepted input', () => {
    const accepted = buildAcceptedRomanizations('しんぶんをよむ');

    expect(getRomanizationEfficiency('sinbunoyomu', accepted)).toMatchObject({
      typed: 'sinbunoyomu',
      optimal: 'sinbunoyomu',
      extraKeystrokes: 0,
    });
    expect(getRomanizationEfficiency('shinbunwoyomu', accepted)).toMatchObject({
      typed: 'shinbunwoyomu',
      optimal: 'sinbunoyomu',
      extraKeystrokes: 2,
    });
  });
});

describe('session analysis', () => {
  it('summarizes speed, accuracy, weak keys, slow keys, and mistakes', () => {
    const sentence: PracticeSentence = {
      id: 's1',
      japanese: 'あい',
      reading: 'あい',
      romanized: 'ai',
      category: 'basic',
    };
    const strokes: KeyStroke[] = [
      { key: 'a', expected: 'a', correct: true, timestamp: 1000, reactionMs: 300, position: 0 },
      { key: 'u', expected: 'i', correct: false, timestamp: 1800, reactionMs: 800, position: 1 },
      { key: 'i', expected: 'i', correct: true, timestamp: 2400, reactionMs: 600, position: 1 },
    ];

    const summary = analyzeSession({ sentence, strokes, startedAt: 0, endedAt: 30000 });

    expect(summary.totalTyped).toBe(3);
    expect(summary.correctTyped).toBe(2);
    expect(summary.accuracy).toBeCloseTo(66.67, 1);
    expect(summary.wpm).toBeCloseTo(0.8, 1);
    expect(summary.weakKeys[0].key).toBe('i');
    expect(summary.slowKeys[0].key).toBe('i');
    expect(summary.mistakes[0]).toMatchObject({ expected: 'i', actual: 'u', count: 1 });
    expect(summary.keyStats.find((key) => key.key === 'i')).toMatchObject({ attempts: 2, mistakes: 1 });
  });

  it('uses an explicit active duration when pause time should be excluded', () => {
    const summary = analyzeSession({
      sentence: { romanized: 'ai' },
      strokes: [
        { key: 'a', expected: 'a', correct: true, timestamp: 1000, reactionMs: 300, position: 0 },
        { key: 'i', expected: 'i', correct: true, timestamp: 4000, reactionMs: 300, position: 1 },
      ],
      startedAt: 0,
      endedAt: 60000,
      activeDurationMs: 30000,
    });

    expect(summary.kpm).toBeCloseTo(4, 1);
  });

  it('aggregates long-term key stats from full keyStats without double-counting overlap', () => {
    const sessions = [{
      summary: {
        keyStats: [{ key: 'a', attempts: 2, mistakes: 1, accuracy: 50, averageReactionMs: 200 }],
        weakKeys: [{ key: 'a', attempts: 2, mistakes: 1, accuracy: 50, averageReactionMs: 200 }],
        slowKeys: [{ key: 'a', attempts: 2, mistakes: 1, accuracy: 50, averageReactionMs: 200 }],
      },
    } as never];

    expect(aggregateKeyStats(sessions)[0]).toMatchObject({ key: 'a', attempts: 2, mistakes: 1 });
  });

  it('aggregates inefficient romanization habits across sessions', () => {
    const habits = aggregateRomanizationHabits([
      {
        typed: 'shinbunwoyomu',
        acceptedRomanizations: buildAcceptedRomanizations('しんぶんをよむ'),
        summary: {} as never,
      },
      {
        typed: 'shimbunwoyomu',
        acceptedRomanizations: buildAcceptedRomanizations('しんぶんをよむ'),
        summary: {} as never,
      },
    ]);

    expect(habits[0]).toMatchObject({
      typed: 'shinbunwoyomu',
      optimal: 'sinbunoyomu',
      count: 1,
      extraKeystrokes: 2,
    });
  });
});
