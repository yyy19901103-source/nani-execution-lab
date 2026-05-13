/**
 * 個別カリキュラム生成エンジン
 * 学習進捗・誤答パターン・章完了状況から「次に学ぶべきこと」を推奨
 */
import type { Question, UserQuestionState, StudyLog, ExamLog, Chapter } from '../../data/pmp/types';

export interface ChapterScore {
  chapterId: string;
  attempted: number;
  correct: number;
  accuracy: number;
  lastAttemptDate: string | null;
  weakness: number; // 0-1, 高いほど弱点
}

export interface Recommendation {
  type: 'study-chapter' | 'review-srs' | 'practice-weak-domain' | 'take-exam' | 'review-mindset' | 'study-glossary';
  priority: 1 | 2 | 3; // 1=最優先
  title: string;
  reason: string;
  actionUrl: string;
  targetCount?: number;
}

/**
 * 章別パフォーマンス計算
 */
export function computeChapterScores(
  questions: Question[],
  states: UserQuestionState[],
  completedChapters: string[],
): ChapterScore[] {
  const stateMap = new Map(states.map((s) => [s.questionId, s]));
  const byChapter: Record<string, { attempted: number; correct: number; lastDate: string | null }> = {};

  for (const q of questions) {
    const s = stateMap.get(q.id);
    if (!s || s.history.length === 0) continue;
    if (!byChapter[q.chapter]) byChapter[q.chapter] = { attempted: 0, correct: 0, lastDate: null };
    s.history.forEach((h) => {
      byChapter[q.chapter].attempted++;
      if (h.result === 'correct') byChapter[q.chapter].correct++;
      if (!byChapter[q.chapter].lastDate || h.date > byChapter[q.chapter].lastDate!) {
        byChapter[q.chapter].lastDate = h.date;
      }
    });
  }

  const scores: ChapterScore[] = Object.entries(byChapter).map(([chapterId, v]) => {
    const accuracy = v.attempted > 0 ? v.correct / v.attempted : 0;
    // 弱点スコア: 未学習なら 0.7、学習済で正答率低いと高い
    let weakness = 0;
    if (v.attempted < 3) weakness = 0.7;
    else if (accuracy < 0.5) weakness = 1.0;
    else if (accuracy < 0.7) weakness = 0.6;
    else if (accuracy < 0.85) weakness = 0.3;
    else weakness = 0.1;
    return {
      chapterId,
      attempted: v.attempted,
      correct: v.correct,
      accuracy,
      lastAttemptDate: v.lastDate,
      weakness,
    };
  });

  return scores.sort((a, b) => b.weakness - a.weakness);
}

/**
 * メイン推奨エンジン
 */
export function generateRecommendations({
  questions,
  chapters,
  states,
  completedChapters,
  logs,
  exams,
  base,
}: {
  questions: Question[];
  chapters: Chapter[];
  states: UserQuestionState[];
  completedChapters: string[];
  logs: StudyLog[];
  exams: ExamLog[];
  base: string;
}): Recommendation[] {
  const recs: Recommendation[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // 1. SRS 対象問題があれば最優先
  const dueSrsCount = states.filter((s) => s.srsNextDate && s.srsNextDate <= today).length;
  if (dueSrsCount > 0) {
    recs.push({
      type: 'review-srs',
      priority: 1,
      title: `SRS 復習 ${dueSrsCount}問`,
      reason: '誤答・要復習問題が本日復習期限です。記憶定着のため最優先で取り組みましょう。',
      actionUrl: `${base}/ai-tools/pmp-study/quiz?mode=srs`,
      targetCount: dueSrsCount,
    });
  }

  // 2. 未学習章の中で順序が早いものを推奨
  const unstudied = chapters.filter((c) => !completedChapters.includes(c.id));
  if (unstudied.length > 0) {
    const next = unstudied.sort((a, b) => a.order - b.order)[0];
    recs.push({
      type: 'study-chapter',
      priority: unstudied.length > 25 ? 1 : 2,
      title: `次の章: ${next.id} ${next.titleJa}`,
      reason: `未学習の章が ${unstudied.length} 章あります。順序通り進めると効率的です（推定 ${next.estimatedMinutes} 分）。`,
      actionUrl: `${base}/ai-tools/pmp-study/study#${next.id}`,
    });
  }

  // 3. 弱点章の演習推奨
  const chapterScores = computeChapterScores(questions, states, completedChapters);
  const weakChapters = chapterScores.filter((s) => s.weakness >= 0.6 && s.attempted >= 3).slice(0, 3);
  for (const w of weakChapters) {
    const ch = chapters.find((c) => c.id === w.chapterId);
    if (!ch) continue;
    recs.push({
      type: 'practice-weak-domain',
      priority: 2,
      title: `弱点演習: 章${w.chapterId} ${ch.titleJa}`,
      reason: `正答率 ${(w.accuracy * 100).toFixed(0)}% (${w.correct}/${w.attempted})。この章を集中演習しましょう。`,
      actionUrl: `${base}/ai-tools/pmp-study/quiz?chapter=${w.chapterId}`,
    });
  }

  // 4. ドメイン別弱点（模試結果から）
  if (exams.length > 0) {
    const latest = exams[0];
    Object.entries(latest.domainScores).forEach(([domain, score]) => {
      if (score < 0.7) {
        recs.push({
          type: 'practice-weak-domain',
          priority: 2,
          title: `弱点ドメイン演習: ${domain}`,
          reason: `直近模試で ${(score * 100).toFixed(0)}% (合格目安70%未満)。集中演習が必要です。`,
          actionUrl: `${base}/ai-tools/pmp-study/quiz?domain=${encodeURIComponent(domain)}`,
        });
      }
    });
  }

  // 5. 模試推奨（学習進捗に応じて）
  const totalAttempted = states.reduce((s, st) => s + st.history.length, 0);
  const lastExamDate = exams.length > 0 ? exams[0].date : null;
  const daysSinceExam = lastExamDate
    ? Math.floor((Date.now() - new Date(lastExamDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  if (totalAttempted >= 30 && (exams.length === 0 || daysSinceExam >= 14)) {
    recs.push({
      type: 'take-exam',
      priority: exams.length === 0 ? 2 : 3,
      title: exams.length === 0 ? '初回模試を受ける' : `模試（前回から ${daysSinceExam}日経過）`,
      reason: exams.length === 0 ? '十分な演習量に達しました。現在の実力を測りましょう。' : '定期模試で進捗確認しましょう。',
      actionUrl: `${base}/ai-tools/pmp-study/exam`,
    });
  }

  // 6. Mindset 復習推奨（一度も見てない場合）
  if (!localStorageHas('pmp-mindset-viewed')) {
    recs.push({
      type: 'review-mindset',
      priority: 1,
      title: 'PMP Mindset 8原則を確認',
      reason: 'PMP試験の判断軸となる8原則を最初に理解すると正答率が大きく上がります。',
      actionUrl: `${base}/ai-tools/pmp-study/mindset`,
    });
  }

  // 7. 用語集（学習日数が少ない場合）
  if (logs.length < 5 && !localStorageHas('pmp-glossary-viewed')) {
    recs.push({
      type: 'study-glossary',
      priority: 3,
      title: 'PMP用語集を確認',
      reason: '頻出120語を一度ざっと眺めると、問題演習でスムーズに理解できます。',
      actionUrl: `${base}/ai-tools/pmp-study/glossary`,
    });
  }

  // 優先度順ソート（同優先度内は配列順）
  return recs.sort((a, b) => a.priority - b.priority).slice(0, 5);
}

function localStorageHas(key: string): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(key) !== null;
}

export function markViewed(key: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, new Date().toISOString());
  }
}
