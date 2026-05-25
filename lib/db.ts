import Dexie, { type Table } from 'dexie';
import type {
  InputEventRecord,
  KeyStat,
  MistakeStat,
  PersonalizationMode,
  PracticeSession,
  PracticeSessionOptions,
  PromptResult,
  RomanizationEfficiency,
  SessionSummary,
  UserSettings,
} from '@/lib/types';

export const MAX_LOCAL_DATA_IMPORT_BYTES = 10 * 1024 * 1024;
const MAX_IMPORT_SESSIONS = 2000;
const MAX_IMPORT_PROMPT_RESULTS = 100000;
const MAX_IMPORT_INPUT_EVENTS = 300000;
const MAX_STRING_LENGTH = 2000;

export const defaultSettings: UserSettings = {
  id: 'default',
  showKeyboardHints: true,
  strictMode: false,
  preferredRomanization: 'hepburn',
  personalizationMode: 'balanced',
  sound: false,
  animationPreference: 'minimal',
  focusModeDefault: false,
  resultCelebrationEnabled: false,
};

class TypingDatabase extends Dexie {
  sessions!: Table<PracticeSession, string>;
  promptResults!: Table<PromptResult, string>;
  inputEvents!: Table<InputEventRecord, string>;
  settings!: Table<UserSettings, string>;

  constructor() {
    super('jpTypingPracticeMvp');
    this.version(1).stores({
      sessions: 'id, endedAt, sentenceId',
      settings: 'id',
    });
    this.version(2).stores({
      sessions: 'id, endedAt, sentenceId, isFailed, strictMode',
      promptResults: 'id, sessionId, practiceTextId, questionIndex, failed',
      settings: 'id',
    });
    this.version(3).stores({
      sessions: 'id, endedAt, sentenceId, isFailed, strictMode',
      promptResults: 'id, sessionId, practiceTextId, questionIndex, failed',
      inputEvents: 'id, sessionId, promptResultId, practiceTextId, questionIndex, expectedKey, actualKey, isCorrect',
      settings: 'id',
    });
  }
}

export const db = new TypingDatabase();

export type LocalDataExport = {
  exportedAt: string;
  version: 1;
  sessions: PracticeSession[];
  promptResults: PromptResult[];
  inputEvents: InputEventRecord[];
  settings: UserSettings | null;
};

export async function saveSession(session: PracticeSession) {
  const sessionSummary: PracticeSession = { ...session, strokes: [], promptResults: undefined, inputEvents: undefined };
  await db.transaction('rw', db.sessions, db.promptResults, db.inputEvents, async () => {
    await db.sessions.put(sessionSummary);
    if (session.promptResults?.length) await db.promptResults.bulkPut(session.promptResults);
    if (session.inputEvents?.length) await db.inputEvents.bulkPut(session.inputEvents);
  });
  return session.id;
}

export async function getPromptResults(sessionId: string) {
  return db.promptResults.where('sessionId').equals(sessionId).sortBy('questionIndex');
}

export async function getInputEvents(sessionId: string) {
  return db.inputEvents.where('sessionId').equals(sessionId).sortBy('timestamp');
}

export async function getSession(id: string) {
  return db.sessions.get(id);
}

export async function getRecentSessions(limit = 20) {
  return db.sessions.orderBy('endedAt').reverse().limit(limit).toArray();
}

export async function getAllSessions() {
  return db.sessions.orderBy('endedAt').reverse().toArray();
}

export async function getAnalysisSessions(limit = 300) {
  return db.sessions.orderBy('endedAt').reverse().limit(limit).toArray();
}

export async function getSessionCount() {
  return db.sessions.count();
}

export async function getSettings() {
  const settings = await db.settings.get('default');
  if (settings) {
    return { ...defaultSettings, ...settings };
  }
  await db.settings.put(defaultSettings);
  return defaultSettings;
}

export async function updateSettings(next: UserSettings) {
  await db.settings.put(next);
  return next;
}

export async function deleteSession(sessionId: string) {
  await db.transaction('rw', db.sessions, db.promptResults, db.inputEvents, async () => {
    await db.sessions.delete(sessionId);
    await db.promptResults.where('sessionId').equals(sessionId).delete();
    await db.inputEvents.where('sessionId').equals(sessionId).delete();
  });
}

export async function clearLocalData() {
  await db.transaction('rw', db.sessions, db.promptResults, db.inputEvents, async () => {
    await db.sessions.clear();
    await db.promptResults.clear();
    await db.inputEvents.clear();
  });
}

export async function exportLocalData(): Promise<LocalDataExport> {
  const [sessions, promptResults, inputEvents, settings] = await Promise.all([
    db.sessions.toArray(),
    db.promptResults.toArray(),
    db.inputEvents.toArray(),
    db.settings.get('default'),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    sessions,
    promptResults,
    inputEvents,
    settings: settings ?? null,
  };
}

export async function importLocalData(data: unknown) {
  if (!data || typeof data !== 'object') throw new Error('Invalid export data');
  const exportData = data as Partial<LocalDataExport>;
  if (exportData.version !== 1) throw new Error('Unsupported export version');
  if (!Array.isArray(exportData.sessions) || !Array.isArray(exportData.promptResults) || !Array.isArray(exportData.inputEvents)) {
    throw new Error('Invalid export data');
  }
  if (exportData.sessions.length > MAX_IMPORT_SESSIONS || exportData.promptResults.length > MAX_IMPORT_PROMPT_RESULTS || exportData.inputEvents.length > MAX_IMPORT_INPUT_EVENTS) {
    throw new Error('Import data is too large');
  }

  const sessions = exportData.sessions.map(sanitizePracticeSession);
  const promptResults = exportData.promptResults.map(sanitizePromptResult);
  const inputEvents = exportData.inputEvents.map(sanitizeInputEventRecord);
  const settings = exportData.settings ? sanitizeUserSettings(exportData.settings) : null;

  await db.transaction('rw', db.sessions, db.promptResults, db.inputEvents, db.settings, async () => {
    if (sessions.length) await db.sessions.bulkPut(sessions);
    if (promptResults.length) await db.promptResults.bulkPut(promptResults);
    if (inputEvents.length) await db.inputEvents.bulkPut(inputEvents);
    if (settings) await db.settings.put(settings);
  });

  return {
    inputEvents: inputEvents.length,
    promptResults: promptResults.length,
    sessions: sessions.length,
  };
}

function sanitizePracticeSession(value: unknown): PracticeSession {
  const record = requireRecord(value);
  const summary = sanitizeSummary(record.summary);
  return {
    id: requiredString(record.id),
    sentenceId: requiredString(record.sentenceId),
    japanese: requiredString(record.japanese),
    reading: requiredString(record.reading),
    targetRomanized: requiredString(record.targetRomanized),
    acceptedRomanizations: stringArray(record.acceptedRomanizations),
    typed: requiredString(record.typed),
    startedAt: requiredNumber(record.startedAt),
    endedAt: requiredNumber(record.endedAt),
    strokes: [],
    summary,
    mode: optionalOneOf(record.mode, ['normal', 'weakness', 'short', 'random'] as const),
    durationSec: optionalNumberOrNull(record.durationSec),
    questionCount: optionalInteger(record.questionCount),
    completedQuestionCount: optionalInteger(record.completedQuestionCount),
    strictMode: optionalBoolean(record.strictMode),
    isFailed: optionalBoolean(record.isFailed),
    failureReason: optionalOneOf(record.failureReason, ['mistake', 'manual_end', 'time_limit'] as const),
    failedAtQuestionIndex: optionalInteger(record.failedAtQuestionIndex),
    failedPosition: optionalInteger(record.failedPosition),
    failedQuestion: optionalString(record.failedQuestion),
    failedExpectedKey: optionalString(record.failedExpectedKey),
    failedActualKey: optionalString(record.failedActualKey),
    failedTargetChar: optionalString(record.failedTargetChar),
    failedTargetRomaji: optionalString(record.failedTargetRomaji),
    totalInputs: optionalInteger(record.totalInputs),
    correctInputs: optionalInteger(record.correctInputs),
    mistakes: optionalInteger(record.mistakes),
    accuracy: optionalNumber(record.accuracy),
    kpm: optionalNumber(record.kpm),
    wpm: optionalNumber(record.wpm),
    options: sanitizeOptions(record.options),
  };
}

function sanitizePromptResult(value: unknown): PromptResult {
  const record = requireRecord(value);
  return {
    id: requiredString(record.id),
    sessionId: requiredString(record.sessionId),
    practiceTextId: requiredString(record.practiceTextId),
    questionIndex: requiredInteger(record.questionIndex),
    text: requiredString(record.text),
    reading: requiredString(record.reading),
    targetRomanized: requiredString(record.targetRomanized),
    typed: requiredString(record.typed),
    startedAt: requiredNumber(record.startedAt),
    endedAt: requiredNumber(record.endedAt),
    totalInputs: requiredInteger(record.totalInputs),
    correctInputs: requiredInteger(record.correctInputs),
    mistakes: requiredInteger(record.mistakes),
    accuracy: requiredNumber(record.accuracy),
    kpm: requiredNumber(record.kpm),
    completed: requiredBoolean(record.completed),
    failed: requiredBoolean(record.failed),
  };
}

function sanitizeInputEventRecord(value: unknown): InputEventRecord {
  const record = requireRecord(value);
  return {
    id: requiredString(record.id),
    sessionId: requiredString(record.sessionId),
    promptResultId: requiredString(record.promptResultId),
    practiceTextId: requiredString(record.practiceTextId),
    questionIndex: requiredInteger(record.questionIndex),
    expectedKey: requiredString(record.expectedKey),
    actualKey: requiredString(record.actualKey),
    isCorrect: requiredBoolean(record.isCorrect),
    targetChar: requiredString(record.targetChar),
    targetRomaji: requiredString(record.targetRomaji),
    position: requiredInteger(record.position),
    reactionTimeMs: requiredNumber(record.reactionTimeMs),
    timestamp: requiredString(record.timestamp),
  };
}

function sanitizeUserSettings(value: unknown): UserSettings {
  const record = requireRecord(value);
  return {
    ...defaultSettings,
    showKeyboardHints: optionalBoolean(record.showKeyboardHints) ?? defaultSettings.showKeyboardHints,
    strictMode: optionalBoolean(record.strictMode) ?? defaultSettings.strictMode,
    preferredRomanization: optionalOneOf(record.preferredRomanization, ['hepburn', 'kunrei'] as const) ?? defaultSettings.preferredRomanization,
    personalizationMode: optionalOneOf(record.personalizationMode, ['off', 'balanced', 'intensive'] as const) ?? defaultSettings.personalizationMode,
    sound: optionalBoolean(record.sound) ?? defaultSettings.sound,
    animationPreference: optionalOneOf(record.animationPreference, ['off', 'minimal', 'standard'] as const) ?? defaultSettings.animationPreference,
    focusModeDefault: optionalBoolean(record.focusModeDefault) ?? defaultSettings.focusModeDefault,
    resultCelebrationEnabled: optionalBoolean(record.resultCelebrationEnabled) ?? defaultSettings.resultCelebrationEnabled,
    id: 'default',
  };
}

function sanitizeSummary(value: unknown): SessionSummary {
  const record = requireRecord(value);
  return {
    totalTyped: requiredInteger(record.totalTyped),
    correctTyped: requiredInteger(record.correctTyped),
    mistakesCount: requiredInteger(record.mistakesCount),
    accuracy: requiredNumber(record.accuracy),
    wpm: requiredNumber(record.wpm),
    kpm: requiredNumber(record.kpm),
    durationMs: requiredNumber(record.durationMs),
    weakKeys: statArray(record.weakKeys),
    keyStats: statArray(record.keyStats),
    slowKeys: statArray(record.slowKeys),
    mistakes: mistakeArray(record.mistakes),
    romanizationEfficiency: sanitizeRomanizationEfficiency(record.romanizationEfficiency),
  };
}

function sanitizeOptions(value: unknown): PracticeSessionOptions | undefined {
  if (value === undefined) return undefined;
  const record = requireRecord(value);
  return {
    questionCount: requiredInteger(record.questionCount),
    lengthType: requiredOneOf(record.lengthType, ['word', 'short', 'medium', 'long', 'mixed'] as const),
    difficulty: requiredOneOf(record.difficulty, ['beginner', 'normal', 'advanced', 'technical'] as const),
    category: optionalOneOf(record.category, ['daily', 'school', 'work', 'programming', 'internet', 'news', 'conversation', 'random', 'all'] as const),
    personalizationMode: optionalOneOf<PersonalizationMode>(record.personalizationMode, ['off', 'balanced', 'intensive'] as const),
    preferredWeakKeys: value === undefined ? undefined : optionalStringArray(record.preferredWeakKeys),
    strictMode: requiredBoolean(record.strictMode),
    durationSec: record.durationSec === null ? null : requiredOneOf(record.durationSec, [30, 60, 120] as const),
    focusMode: requiredBoolean(record.focusMode),
  };
}

function sanitizeRomanizationEfficiency(value: unknown): RomanizationEfficiency | undefined {
  if (value === undefined) return undefined;
  const record = requireRecord(value);
  return {
    typed: requiredString(record.typed),
    optimal: requiredString(record.optimal),
    extraKeystrokes: requiredInteger(record.extraKeystrokes),
    efficiency: requiredNumber(record.efficiency),
  };
}

function statArray(value: unknown): KeyStat[] {
  if (!Array.isArray(value)) throw new Error('Invalid import data');
  return value.map((item) => {
    const record = requireRecord(item);
    return {
      key: requiredString(record.key),
      attempts: requiredInteger(record.attempts),
      mistakes: requiredInteger(record.mistakes),
      accuracy: requiredNumber(record.accuracy),
      averageReactionMs: requiredNumber(record.averageReactionMs),
    };
  });
}

function mistakeArray(value: unknown): MistakeStat[] {
  if (!Array.isArray(value)) throw new Error('Invalid import data');
  return value.map((item) => {
    const record = requireRecord(item);
    return {
      expected: requiredString(record.expected),
      actual: requiredString(record.actual),
      count: requiredInteger(record.count),
    };
  });
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) throw new Error('Invalid import data');
  return value.map(requiredString);
}

function optionalStringArray(value: unknown) {
  if (value === undefined) return undefined;
  return stringArray(value);
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid import data');
  return value as Record<string, unknown>;
}

function requiredString(value: unknown) {
  if (typeof value !== 'string' || value.length > MAX_STRING_LENGTH) throw new Error('Invalid import data');
  return value;
}

function optionalString(value: unknown) {
  if (value === undefined) return undefined;
  return requiredString(value);
}

function requiredBoolean(value: unknown) {
  if (typeof value !== 'boolean') throw new Error('Invalid import data');
  return value;
}

function optionalBoolean(value: unknown) {
  if (value === undefined) return undefined;
  return requiredBoolean(value);
}

function requiredNumber(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid import data');
  return value;
}

function optionalNumber(value: unknown) {
  if (value === undefined) return undefined;
  return requiredNumber(value);
}

function optionalNumberOrNull(value: unknown) {
  if (value === undefined || value === null) return value;
  return requiredNumber(value);
}

function requiredInteger(value: unknown) {
  const number = requiredNumber(value);
  if (!Number.isInteger(number)) throw new Error('Invalid import data');
  return number;
}

function optionalInteger(value: unknown) {
  if (value === undefined) return undefined;
  return requiredInteger(value);
}

function requiredOneOf<T extends string | number>(value: unknown, allowed: readonly T[]) {
  if (!allowed.includes(value as T)) throw new Error('Invalid import data');
  return value as T;
}

function optionalOneOf<T extends string | number>(value: unknown, allowed: readonly T[]) {
  if (value === undefined) return undefined;
  return requiredOneOf(value, allowed);
}
