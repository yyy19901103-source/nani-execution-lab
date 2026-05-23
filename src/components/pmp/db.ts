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

/**
 * インポート前の事前検証 (CODEX 重点#18 対応)
 * 壊れたバックアップで全 clear+bulkPut すると既存データが失われるため、
 * インポート実行前に JSON 構造を検証してエラーを早期返却する。
 */
export interface ImportValidationResult {
  ok: boolean;
  errors: string[];
  summary: { questionStates: number; chapterStates: number; studyLogs: number; examLogs: number; settings: number; notes: number; bookmarks: number };
}

export function validateImportJson(jsonStr: string): ImportValidationResult {
  const errors: string[] = [];
  const summary = { questionStates: 0, chapterStates: 0, studyLogs: 0, examLogs: 0, settings: 0, notes: 0, bookmarks: 0 };

  let data: any;
  try {
    data = JSON.parse(jsonStr);
  } catch (e) {
    return { ok: false, errors: [`JSON パースエラー: ${(e as Error).message}`], summary };
  }
  if (!data || typeof data !== 'object') {
    return { ok: false, errors: ['JSON はオブジェクトである必要があります'], summary };
  }
  if (!data.version) errors.push('version フィールドが欠落');
  if (!data.exportedAt) errors.push('exportedAt フィールドが欠落');

  // 各ストアの形式チェック (配列であること・必須キー存在)
  const requireArray = (key: string, requiredFields?: string[]) => {
    if (data[key] === undefined) return; // 存在しないのは OK (一部のみのバックアップ等)
    if (!Array.isArray(data[key])) {
      errors.push(`${key} は配列である必要があります`);
      return;
    }
    summary[key as keyof typeof summary] = data[key].length;
    if (requiredFields && data[key].length > 0) {
      const sample = data[key][0];
      const missing = requiredFields.filter((f) => !(f in sample));
      if (missing.length > 0) errors.push(`${key}[0] に必須フィールド欠落: ${missing.join(', ')}`);
    }
  };
  requireArray('questionStates', ['questionId']);
  requireArray('chapterStates', ['chapterId']);
  requireArray('studyLogs', ['date']);
  requireArray('examLogs', ['id', 'date']);
  requireArray('settings', ['id']);
  requireArray('notes', ['key', 'refType', 'refId']);
  requireArray('bookmarks', ['key', 'refType', 'refId']);

  return { ok: errors.length === 0, errors, summary };
}

export async function importAll(jsonStr: string, options?: { skipValidation?: boolean }): Promise<{ imported: number; errors: string[] }> {
  // CODEX 重点#18 対応: 事前検証
  if (!options?.skipValidation) {
    const validation = validateImportJson(jsonStr);
    if (!validation.ok) {
      throw new Error(
        `インポートデータの検証に失敗しました。データは変更されていません。\n\nエラー:\n` +
        validation.errors.map((e) => `  - ${e}`).join('\n'),
      );
    }
  }

  const db = getDb();
  const data = JSON.parse(jsonStr);
  let imported = 0;
  const errors: string[] = [];

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
      const tryBulk = async (key: string, table: any) => {
        if (!data[key] || !Array.isArray(data[key])) return;
        try {
          await table.bulkPut(data[key]);
          imported += data[key].length;
        } catch (e) {
          errors.push(`${key} のインポート失敗: ${(e as Error).message}`);
        }
      };
      await tryBulk('questionStates', db.questionStates);
      await tryBulk('chapterStates', db.chapterStates);
      await tryBulk('studyLogs', db.studyLogs);
      await tryBulk('examLogs', db.examLogs);
      await tryBulk('settings', db.settings);
      await tryBulk('notes', db.notes);
      await tryBulk('bookmarks', db.bookmarks);
    },
  );
  return { imported, errors };
}
