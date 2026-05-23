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

/**
 * 質問形式
 * - single-choice: 従来形式 (4択・正解1つ)
 * - multiple-choice: 複数選択 (複数正解)
 * - matching: マッチング (左列項目→右列項目の対応付け)
 * - hotspot: ポイント・アンド・クリック (画像/図上の領域選択)
 * - dropdown: プルダウン・リスト (複数のドロップダウン穴埋め)
 * - graphical: グラフで強化された選択肢 (グラフ/図つき)
 *
 * 出典: PMP_-_Lesson_12_-_Next_Steps-en_us-ja_jp-PE-C_.pdf P.7 (© 2025 PMI)
 * 検証日: 2026-05-20
 */
export type QuestionFormat =
  | 'single-choice'
  | 'multiple-choice'
  | 'matching'
  | 'hotspot'
  | 'dropdown'
  | 'graphical';

export interface MatchingItem {
  left: string;
  right: string;
}

export interface DropdownBlank {
  /** プレースホルダの ID (本文中の `{id}` で参照) */
  id: string;
  /** 選択肢 */
  options: string[];
  /** 正解 (options 内のインデックス) */
  correctIndex: number;
}

export interface HotspotRegion {
  /** 領域ラベル */
  label: string;
  /** SVG path や coord 等 (UI 実装時に詳細化) */
  region: string;
  /** 正解領域か */
  isCorrect: boolean;
}

export interface Question {
  id: string;
  domain: DomainId;
  chapter: string;
  /** 新 ECO 2025/2026 のタスク番号 (例: '1.2', '3.5') — 旧 chapter と併存 */
  eco2026Task?: string;
  difficulty: Difficulty;
  source: 'self' | 'owner-curated' | 'official-sample';
  reviewed: boolean;
  question: string;
  /** 質問形式 (デフォルト: single-choice) */
  format?: QuestionFormat;
  // single-choice / multiple-choice / graphical 用
  choices?: string[];
  /** single-choice/graphical: 'A'-'D' 単一 / multiple-choice: 'A,C' などカンマ区切り */
  correctAnswer?: string;
  // matching 用
  matchingPairs?: MatchingItem[];
  // dropdown 用
  dropdownBlanks?: DropdownBlank[];
  /** dropdown 用: 本文に {id} プレースホルダを埋め込む */
  questionTemplate?: string;
  // hotspot 用
  hotspotRegions?: HotspotRegion[];
  // graphical 用
  graphicSrc?: string;
  explanation: string;
  tags: string[];
  qualityScore: number;
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
