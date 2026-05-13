/**
 * PMP学習アプリ Zustand ストア
 * 揮発性UI状態のみ管理。永続データはIndexedDBへ。
 */
import { create } from 'zustand';
import type {
  Question,
  Chapter,
  UserSettings,
  StudyLog,
  ExamLog,
} from '../../data/pmp/types';

interface PmpStore {
  // 静的データ（起動時ロード）
  questions: Question[];
  chapters: Chapter[];

  // ユーザー設定（IndexedDBと同期）
  settings: UserSettings;

  // 計算済み統計（UI表示用キャッシュ）
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalStudyMinutes: number;
  studyDays: number;
  recentLogs: StudyLog[];
  recentExams: ExamLog[];

  // アクション
  setQuestions: (qs: Question[]) => void;
  setChapters: (cs: Chapter[]) => void;
  setSettings: (s: UserSettings) => void;
  setStats: (stats: {
    totalQuestionsAnswered: number;
    totalCorrect: number;
    totalStudyMinutes: number;
    studyDays: number;
    recentLogs: StudyLog[];
    recentExams: ExamLog[];
  }) => void;
}

export const usePmpStore = create<PmpStore>((set) => ({
  questions: [],
  chapters: [],
  settings: {
    examDate: null,
    dailyTargetMinutes: 130,
    totalTargetHours: 185,
    totalTargetQuestions: 3000,
    totalTargetDays: 80,
    startDate: null,
  },
  totalQuestionsAnswered: 0,
  totalCorrect: 0,
  totalStudyMinutes: 0,
  studyDays: 0,
  recentLogs: [],
  recentExams: [],

  setQuestions: (questions) => set({ questions }),
  setChapters: (chapters) => set({ chapters }),
  setSettings: (settings) => set({ settings }),
  setStats: (stats) => set(stats),
}));

// 達成条件チェッカー
export function evaluateAchievements(s: PmpStore) {
  const dailyHours = s.totalStudyMinutes / 60;
  const correctRate =
    s.totalQuestionsAnswered > 0 ? s.totalCorrect / s.totalQuestionsAnswered : 0;

  const latestExamScore =
    s.recentExams.length > 0 ? s.recentExams[0].score : 0;
  const examCount = s.recentExams.length;

  return [
    {
      category: '学習量',
      label: '総学習時間',
      current: Math.round(dailyHours * 10) / 10,
      target: s.settings.totalTargetHours,
      unit: '時間',
      achieved: dailyHours >= s.settings.totalTargetHours,
    },
    {
      category: '学習量',
      label: '問題演習総数',
      current: s.totalQuestionsAnswered,
      target: s.settings.totalTargetQuestions,
      unit: '問',
      achieved: s.totalQuestionsAnswered >= s.settings.totalTargetQuestions,
    },
    {
      category: '学習量',
      label: '学習継続日数',
      current: s.studyDays,
      target: s.settings.totalTargetDays,
      unit: '日',
      achieved: s.studyDays >= s.settings.totalTargetDays,
    },
    {
      category: 'カバー率',
      label: '全体正答率',
      current: Math.round(correctRate * 1000) / 10,
      target: 75,
      unit: '%',
      achieved: correctRate >= 0.75,
    },
    {
      category: '模試',
      label: '模試実施回数',
      current: examCount,
      target: 6,
      unit: '回',
      achieved: examCount >= 6,
    },
    {
      category: '模試',
      label: '直近模試スコア',
      current: Math.round(latestExamScore * 1000) / 10,
      target: 80,
      unit: '%',
      achieved: latestExamScore >= 0.8,
    },
  ];
}

// 試験日から残日数計算
export function daysUntilExam(examDate: string | null): number | null {
  if (!examDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  return Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// 今日の必要学習量
export function todayTargetMinutes(
  examDate: string | null,
  totalTargetHours: number,
  currentTotalMinutes: number,
): number {
  const days = daysUntilExam(examDate);
  if (days === null || days <= 0) return 0;
  const remainingMinutes = totalTargetHours * 60 - currentTotalMinutes;
  if (remainingMinutes <= 0) return 0;
  return Math.ceil(remainingMinutes / days);
}
