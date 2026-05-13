/**
 * PMP学習アプリ 型定義
 * NaNi Lab 内の独立ブロック（他資産と無関係）
 */

export type DomainId = 'People' | 'Process' | 'Business Environment';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type SrsResult = 'correct' | 'incorrect' | 'unsure';

export interface HistoryEntry {
  date: string;       // ISO date
  result: SrsResult;
  timeSec: number;
}

export interface Question {
  id: string;
  domain: DomainId;
  chapter: string;
  difficulty: Difficulty;
  source: 'self' | 'owner-curated';
  reviewed: boolean;
  question: string;
  choices: string[];        // length 4
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  tags: string[];
  qualityScore: number;     // 0.0 - 1.0
}

export interface UserQuestionState {
  questionId: string;
  userMemo: string;
  history: HistoryEntry[];
  consecutiveCorrect: number;
  srsNextDate: string | null;
  srsInterval: number;      // days
}

export interface Chapter {
  id: string;
  domain: DomainId;
  title: string;
  titleJa: string;
  summary: string;
  keyConcepts: string[];
  estimatedMinutes: number;
  order: number;
}

export interface UserChapterState {
  chapterId: string;
  completed: boolean;
  reviewCount: number;
  lastReviewDate: string | null;
}

export interface StudyLog {
  date: string;
  studyMinutes: number;
  questionsAnswered: number;
  correctCount: number;
  correctRate: number;
  chaptersStudied: string[];
}

export interface ExamLog {
  id: string;
  date: string;
  type: 'full' | 'short';
  totalQuestions: number;
  correctCount: number;
  score: number;
  domainScores: Record<DomainId, number>;
  durationMinutes: number;
}

export interface UserSettings {
  examDate: string | null;          // ISO date
  dailyTargetMinutes: number;       // default 130
  totalTargetHours: number;         // default 185
  totalTargetQuestions: number;     // default 3000
  totalTargetDays: number;          // default 80
  startDate: string | null;
}

export interface AchievementCriteria {
  category: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  achieved: boolean;
}
