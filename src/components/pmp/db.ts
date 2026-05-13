/**
 * PMP学習アプリ IndexedDB レイヤ
 * Dexie.js ラッパー
 */
import Dexie, { type Table } from 'dexie';
import type {
  UserQuestionState,
  UserChapterState,
  StudyLog,
  ExamLog,
  UserSettings,
} from '../../data/pmp/types';

export interface PersonalNote {
  // refType:refId 形式の主キー（例: "chapter:1.1" "question:Q031" "case:CS01" "term:BATNA"）
  key: string;
  refType: 'chapter' | 'question' | 'case' | 'term';
  refId: string;
  note: string;
  updatedAt: string;
}

export interface Bookmark {
  key: string;
  refType: 'chapter' | 'question' | 'case' | 'term';
  refId: string;
  title: string;
  reason: string;       // ユーザーが任意で「なぜブックマーク」を残せる
  createdAt: string;
}

export class PmpDatabase extends Dexie {
  questionStates!: Table<UserQuestionState, string>;
  chapterStates!: Table<UserChapterState, string>;
  studyLogs!: Table<StudyLog, string>;
  examLogs!: Table<ExamLog, string>;
  settings!: Table<UserSettings & { id: string }, string>;
  notes!: Table<PersonalNote, string>;
  bookmarks!: Table<Bookmark, string>;

  constructor() {
    super('pmp-study-db');
    this.version(1).stores({
      questionStates: 'questionId, srsNextDate, consecutiveCorrect',
      chapterStates: 'chapterId, completed, lastReviewDate',
      studyLogs: 'date',
      examLogs: 'id, date, type',
      settings: 'id',
    });
    // v2: 個人ノート・ブックマーク追加
    this.version(2).stores({
      questionStates: 'questionId, srsNextDate, consecutiveCorrect',
      chapterStates: 'chapterId, completed, lastReviewDate',
      studyLogs: 'date',
      examLogs: 'id, date, type',
      settings: 'id',
      notes: 'key, refType, refId, updatedAt',
      bookmarks: 'key, refType, refId, createdAt',
    });
  }
}

export async function savePersonalNote(
  refType: 'chapter' | 'question' | 'case' | 'term',
  refId: string,
  note: string,
): Promise<void> {
  const db = getDb();
  const key = `${refType}:${refId}`;
  if (note.trim() === '') {
    await db.notes.delete(key);
    return;
  }
  await db.notes.put({ key, refType, refId, note, updatedAt: new Date().toISOString() });
}

export async function getPersonalNote(
  refType: 'chapter' | 'question' | 'case' | 'term',
  refId: string,
): Promise<string> {
  const db = getDb();
  const n = await db.notes.get(`${refType}:${refId}`);
  return n?.note ?? '';
}

export async function getAllNotes(): Promise<PersonalNote[]> {
  const db = getDb();
  return db.notes.toArray();
}

export async function toggleBookmark(
  refType: 'chapter' | 'question' | 'case' | 'term',
  refId: string,
  title: string,
  reason: string = '',
): Promise<boolean> {
  const db = getDb();
  const key = `${refType}:${refId}`;
  const existing = await db.bookmarks.get(key);
  if (existing) {
    await db.bookmarks.delete(key);
    return false;
  }
  await db.bookmarks.put({ key, refType, refId, title, reason, createdAt: new Date().toISOString() });
  return true;
}

export async function isBookmarked(refType: string, refId: string): Promise<boolean> {
  const db = getDb();
  return (await db.bookmarks.get(`${refType}:${refId}`)) !== undefined;
}

export async function getAllBookmarks(): Promise<Bookmark[]> {
  const db = getDb();
  return db.bookmarks.orderBy('createdAt').reverse().toArray();
}

let dbInstance: PmpDatabase | null = null;

export function getDb(): PmpDatabase {
  if (typeof window === 'undefined') {
    throw new Error('PMP DB can only be accessed in browser');
  }
  if (!dbInstance) {
    dbInstance = new PmpDatabase();
  }
  return dbInstance;
}

// 設定の取得（id="default"固定）
export async function getSettings(): Promise<UserSettings> {
  const db = getDb();
  const s = await db.settings.get('default');
  if (s) {
    const { id: _id, ...rest } = s;
    return rest;
  }
  return {
    examDate: null,
    dailyTargetMinutes: 130,
    totalTargetHours: 185,
    totalTargetQuestions: 3000,
    totalTargetDays: 80,
    startDate: null,
  };
}

export async function saveSettings(s: UserSettings): Promise<void> {
  const db = getDb();
  await db.settings.put({ ...s, id: 'default' });
}

// 学習ログの追記（日次集約）
export async function appendStudyLog(entry: {
  date: string;
  studyMinutes: number;
  questionsAnswered: number;
  correctCount: number;
  chaptersStudied: string[];
}): Promise<void> {
  const db = getDb();
  const existing = await db.studyLogs.get(entry.date);
  if (existing) {
    const newAnswered = existing.questionsAnswered + entry.questionsAnswered;
    const newCorrect = existing.correctCount + entry.correctCount;
    await db.studyLogs.put({
      date: entry.date,
      studyMinutes: existing.studyMinutes + entry.studyMinutes,
      questionsAnswered: newAnswered,
      correctCount: newCorrect,
      correctRate: newAnswered > 0 ? newCorrect / newAnswered : 0,
      chaptersStudied: Array.from(
        new Set([...existing.chaptersStudied, ...entry.chaptersStudied]),
      ),
    });
  } else {
    await db.studyLogs.put({
      ...entry,
      correctRate:
        entry.questionsAnswered > 0
          ? entry.correctCount / entry.questionsAnswered
          : 0,
    });
  }
}

// SRS 間隔計算（エビングハウス忘却曲線ベース）
// 連続正答数 → 次回まで日数: 0=1, 1=3, 2=7, 3=14, 4=30, 5+=60
export function calcSrsInterval(consecutiveCorrect: number): number {
  const intervals = [1, 3, 7, 14, 30, 60];
  return intervals[Math.min(consecutiveCorrect, intervals.length - 1)];
}

export function addDays(dateIso: string, days: number): string {
  const d = new Date(dateIso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// 問題ステートの更新（演習後）
export async function updateQuestionState(
  questionId: string,
  result: 'correct' | 'incorrect' | 'unsure',
  timeSec: number,
  userMemo: string,
): Promise<void> {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const existing = await db.questionStates.get(questionId);

  const newConsecutive =
    result === 'correct' ? (existing?.consecutiveCorrect ?? 0) + 1 : 0;
  const interval = calcSrsInterval(newConsecutive);
  const srsNextDate = addDays(today, interval);

  await db.questionStates.put({
    questionId,
    userMemo,
    history: [
      ...(existing?.history ?? []),
      { date: today, result, timeSec },
    ],
    consecutiveCorrect: newConsecutive,
    srsInterval: interval,
    srsNextDate,
  });
}

// 全データのエクスポート
export async function exportAll(): Promise<string> {
  const db = getDb();
  const data = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    questionStates: await db.questionStates.toArray(),
    chapterStates: await db.chapterStates.toArray(),
    studyLogs: await db.studyLogs.toArray(),
    examLogs: await db.examLogs.toArray(),
    settings: await db.settings.toArray(),
    notes: await db.notes.toArray(),
    bookmarks: await db.bookmarks.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importAll(jsonStr: string): Promise<void> {
  const db = getDb();
  const data = JSON.parse(jsonStr);
  await db.transaction(
    'rw',
    [db.questionStates, db.chapterStates, db.studyLogs, db.examLogs, db.settings, db.notes, db.bookmarks],
    async () => {
      await Promise.all([
        db.questionStates.clear(),
        db.chapterStates.clear(),
        db.studyLogs.clear(),
        db.examLogs.clear(),
        db.settings.clear(),
        db.notes.clear(),
        db.bookmarks.clear(),
      ]);
      if (data.questionStates) await db.questionStates.bulkPut(data.questionStates);
      if (data.chapterStates) await db.chapterStates.bulkPut(data.chapterStates);
      if (data.studyLogs) await db.studyLogs.bulkPut(data.studyLogs);
      if (data.examLogs) await db.examLogs.bulkPut(data.examLogs);
      if (data.settings) await db.settings.bulkPut(data.settings);
      if (data.notes) await db.notes.bulkPut(data.notes);
      if (data.bookmarks) await db.bookmarks.bulkPut(data.bookmarks);
    },
  );
}
