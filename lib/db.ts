import Dexie, { type Table } from 'dexie';
import type { InputEventRecord, PracticeSession, PromptResult, UserSettings } from '@/lib/types';

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

  await db.transaction('rw', db.sessions, db.promptResults, db.inputEvents, db.settings, async () => {
    if (exportData.sessions?.length) await db.sessions.bulkPut(exportData.sessions);
    if (exportData.promptResults?.length) await db.promptResults.bulkPut(exportData.promptResults);
    if (exportData.inputEvents?.length) await db.inputEvents.bulkPut(exportData.inputEvents);
    if (exportData.settings) await db.settings.put({ ...defaultSettings, ...exportData.settings, id: 'default' });
  });

  return {
    inputEvents: exportData.inputEvents.length,
    promptResults: exportData.promptResults.length,
    sessions: exportData.sessions.length,
  };
}
