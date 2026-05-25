export type PracticeTextLengthType = 'word' | 'short' | 'medium' | 'long';
export type PracticeTextDifficulty = 'beginner' | 'normal' | 'advanced' | 'technical';
export type PracticeTextCategory = 'daily' | 'school' | 'work' | 'programming' | 'internet' | 'news' | 'conversation' | 'random';

export type PracticeText = {
  id: string;
  text: string;
  reading?: string;
  lengthType: PracticeTextLengthType;
  difficulty: PracticeTextDifficulty;
  category: PracticeTextCategory;
  tags: string[];
  estimatedKeyCount: number;
  containsDifficultPatterns: boolean;
};

export type PracticeSessionOptions = {
  questionCount: number;
  lengthType: PracticeTextLengthType | 'mixed';
  difficulty: PracticeTextDifficulty;
  category?: PracticeTextCategory | 'all';
  personalizationMode?: PersonalizationMode;
  preferredWeakKeys?: string[];
  strictMode: boolean;
  durationSec: 30 | 60 | 120 | null;
  focusMode: boolean;
};

export type PracticeSentence = {
  id: string;
  japanese: string;
  reading: string;
  romanized: string;
  category: PracticeTextCategory | 'basic' | 'business';
};

export type KeyStroke = {
  key: string;
  expected: string;
  correct: boolean;
  timestamp: number;
  reactionMs: number;
  position: number;
  targetChar?: string;
  targetRomaji?: string;
  questionIndex?: number;
  practiceTextId?: string;
};

export type KeyStat = {
  key: string;
  attempts: number;
  mistakes: number;
  accuracy: number;
  averageReactionMs: number;
};

export type MistakeStat = {
  expected: string;
  actual: string;
  count: number;
};

export type RomanizationEfficiency = {
  typed: string;
  optimal: string;
  extraKeystrokes: number;
  efficiency: number;
};

export type RomanizationHabit = RomanizationEfficiency & {
  count: number;
};

export type SessionSummary = {
  totalTyped: number;
  correctTyped: number;
  mistakesCount: number;
  accuracy: number;
  wpm: number;
  kpm: number;
  durationMs: number;
  weakKeys: KeyStat[];
  keyStats: KeyStat[];
  slowKeys: KeyStat[];
  mistakes: MistakeStat[];
  romanizationEfficiency?: RomanizationEfficiency;
};

export type PromptResult = {
  id: string;
  sessionId: string;
  practiceTextId: string;
  questionIndex: number;
  text: string;
  reading: string;
  targetRomanized: string;
  typed: string;
  startedAt: number;
  endedAt: number;
  totalInputs: number;
  correctInputs: number;
  mistakes: number;
  accuracy: number;
  kpm: number;
  completed: boolean;
  failed: boolean;
};

export type InputEventRecord = {
  id: string;
  sessionId: string;
  promptResultId: string;
  practiceTextId: string;
  questionIndex: number;
  expectedKey: string;
  actualKey: string;
  isCorrect: boolean;
  targetChar: string;
  targetRomaji: string;
  position: number;
  reactionTimeMs: number;
  timestamp: string;
};

export type PracticeSession = {
  id: string;
  sentenceId: string;
  japanese: string;
  reading: string;
  targetRomanized: string;
  acceptedRomanizations: string[];
  typed: string;
  startedAt: number;
  endedAt: number;
  strokes: KeyStroke[];
  summary: SessionSummary;
  mode?: 'normal' | 'weakness' | 'short' | 'random';
  durationSec?: number | null;
  questionCount?: number;
  completedQuestionCount?: number;
  strictMode?: boolean;
  isFailed?: boolean;
  failureReason?: 'mistake' | 'manual_end' | 'time_limit';
  failedAtQuestionIndex?: number;
  failedPosition?: number;
  failedQuestion?: string;
  failedExpectedKey?: string;
  failedActualKey?: string;
  failedTargetChar?: string;
  failedTargetRomaji?: string;
  totalInputs?: number;
  correctInputs?: number;
  mistakes?: number;
  accuracy?: number;
  kpm?: number;
  wpm?: number;
  promptResults?: PromptResult[];
  inputEvents?: InputEventRecord[];
  options?: PracticeSessionOptions;
};

export type AnimationPreference = 'off' | 'minimal' | 'standard';
export type PersonalizationMode = 'off' | 'balanced' | 'intensive';

export type UserSettings = {
  id: 'default';
  showKeyboardHints: boolean;
  strictMode: boolean;
  preferredRomanization: 'hepburn' | 'kunrei';
  personalizationMode: PersonalizationMode;
  sound: boolean;
  animationPreference: AnimationPreference;
  focusModeDefault: boolean;
  resultCelebrationEnabled: boolean;
};
