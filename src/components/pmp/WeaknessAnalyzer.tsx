import { useEffect, useMemo, useState } from 'react';
import { getDb } from './db';
import questionsData from '../../data/pmp/questions.json';
import chaptersData from '../../data/pmp/chapters.json';
import knowledgeGraph from '../../data/pmp/knowledge-graph.json';
import type { Question, UserQuestionState } from '../../data/pmp/types';

/**
 * CODEX 新優先#2 対応: 誤答原因レポート
 * 学習者の誤答履歴を knowledge-graph と結合し、
 * 『Business Environment が弱い』ではなく
 * 『Governance / Benefit / Compliance / Stakeholder expectation が弱い』
 * のように概念単位で弱点を特定する。
 */

interface WeaknessEntry {
  conceptId: string;
  conceptLabel: string;
  conceptType: 'eco2026Task' | 'chapter' | 'tag';
  wrongCount: number;
  totalCount: number;
  accuracy: number;
  relatedQuestionIds: string[];
  recommendedActions: string[];
}

export default function WeaknessAnalyzer({ base }: { base: string }) {
  const [states, setStates] = useState<UserQuestionState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const db = getDb();
      const s = await db.questionStates.toArray();
      setStates(s);
      setLoading(false);
    })();
  }, []);

  const analysis = useMemo(() => {
    if (states.length === 0) return null;
    return analyzeWeaknesses(states);
  }, [states]);

  if (loading) return <div style={{ padding: '2rem', color: 'rgba(237,237,232,0.5)' }}>分析中...</div>;
  if (!analysis || analysis.length === 0) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem 1.75rem', textAlign: 'center', color: 'rgba(237,237,232,0.6)' }}>
          まだ十分な解答履歴がありません。<a href={`${base}/ai-tools/pmp-study/quiz`} style={{ color: '#c8a96e' }}>問題演習</a>を始めて誤答が蓄積されると、ここに弱点分析が表示されます。
        </div>
      </div>
    );
  }

  const top10 = analysis.slice(0, 10);
  const totalQuestions = states.reduce((s, st) => s + st.history.length, 0);
  const totalWrong = states.reduce((s, st) => s + st.history.filter((h) => h.result === 'incorrect').length, 0);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <div style={{ background: 'rgba(232,180,110,0.06)', borderLeft: '3px solid #e8b46e', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <p style={{ color: '#e8b46e', fontSize: '0.62rem', letterSpacing: '0.25em', marginBottom: '0.5rem' }}>
          🔍 WEAKNESS DIAGNOSIS · 概念単位の弱点診断
        </p>
        <p style={{ color: 'rgba(237,237,232,0.85)', fontSize: '0.82rem', lineHeight: 1.7 }}>
          解答 {totalQuestions} 問 / 誤答 {totalWrong} 問 / 全体正答率 {totalQuestions > 0 ? (((totalQuestions - totalWrong) / totalQuestions) * 100).toFixed(1) : 0}%
          <br />
          <strong>概念別の弱点トップ {top10.length}</strong> を表示します。ドメイン単位ではなく、新 ECO タスク / 章 / タグ単位で診断。
        </p>
      </div>

      {top10.map((w, i) => (
        <div key={w.conceptId} style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', padding: '1.1rem 1.4rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'baseline', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(232,110,110,0.1)', color: '#e86e6e', padding: '0.2rem 0.55rem', fontSize: '0.65rem', letterSpacing: '0.05em', fontWeight: 600 }}>
              #{i + 1}
            </span>
            <span style={{ background: 'rgba(158,203,232,0.08)', color: '#9ecbe8', padding: '0.15rem 0.45rem', fontSize: '0.6rem' }}>
              {w.conceptType}
            </span>
            <h3 style={{ color: '#edede8', fontSize: '0.95rem', margin: 0, flex: 1 }}>{w.conceptLabel}</h3>
            <span style={{ color: '#e86e6e', fontSize: '0.85rem', fontWeight: 600 }}>
              {(w.accuracy * 100).toFixed(0)}%
            </span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: '0.6rem' }}>
            <div style={{ width: `${w.accuracy * 100}%`, height: '100%', background: w.accuracy < 0.5 ? '#e86e6e' : w.accuracy < 0.7 ? '#e8b46e' : '#6ec897' }} />
          </div>
          <p style={{ color: 'rgba(237,237,232,0.7)', fontSize: '0.78rem', margin: '0 0 0.5rem 0' }}>
            正答 {w.totalCount - w.wrongCount}/{w.totalCount} · 誤答 {w.wrongCount} 回
          </p>
          {w.recommendedActions.length > 0 && (
            <div>
              <p style={{ color: 'rgba(110,200,151,0.85)', fontSize: '0.65rem', letterSpacing: '0.15em', margin: '0.6rem 0 0.35rem 0' }}>
                ✓ 推奨アクション
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'rgba(237,237,232,0.85)', fontSize: '0.78rem', lineHeight: 1.7 }}>
                {w.recommendedActions.map((a, j) => (<li key={j}>{a}</li>))}
              </ul>
            </div>
          )}
          {w.relatedQuestionIds.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
              <span style={{ color: 'rgba(237,237,232,0.5)', fontSize: '0.7rem' }}>関連問題:</span>
              {w.relatedQuestionIds.slice(0, 5).map((qid) => (
                <a key={qid} href={`${base}/ai-tools/pmp-study/quiz?q=${qid}`} style={{ background: 'rgba(200,169,110,0.06)', border: '1px solid rgba(200,169,110,0.2)', color: '#c8a96e', padding: '0.15rem 0.45rem', fontSize: '0.65rem', textDecoration: 'none' }}>
                  {qid}
                </a>
              ))}
              {w.relatedQuestionIds.length > 5 && (
                <span style={{ color: 'rgba(237,237,232,0.4)', fontSize: '0.65rem', alignSelf: 'center' }}>
                  他 {w.relatedQuestionIds.length - 5} 問
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function analyzeWeaknesses(states: UserQuestionState[]): WeaknessEntry[] {
  const allQuestions = questionsData.questions as Question[];
  const questionsById = new Map(allQuestions.map((q) => [q.id, q]));
  const chaptersById = new Map(chaptersData.chapters.map((c) => [c.id, c]));
  const eco2026Lookup = (knowledgeGraph as any).edges.chapter_to_eco2026Task.lookupTable as Record<string, string>;
  const eco2026Terms = (knowledgeGraph as any).edges.eco2026Task_to_keyTerms.lookupTable as Record<string, string[]>;

  // 概念ごとに wrongCount / totalCount を集計
  const ecoStats: Record<string, { wrong: number; total: number; questionIds: Set<string> }> = {};
  const chapterStats: Record<string, { wrong: number; total: number; questionIds: Set<string> }> = {};
  const tagStats: Record<string, { wrong: number; total: number; questionIds: Set<string> }> = {};

  for (const state of states) {
    const q = questionsById.get(state.questionId);
    if (!q || state.history.length === 0) continue;
    const wrongInHistory = state.history.filter((h) => h.result === 'incorrect').length;
    const total = state.history.length;

    // 新 ECO タスク
    const ecoTask = (q as any).eco2026Task || lookupEcoTask(q.chapter, eco2026Lookup);
    if (ecoTask) {
      if (!ecoStats[ecoTask]) ecoStats[ecoTask] = { wrong: 0, total: 0, questionIds: new Set() };
      ecoStats[ecoTask].wrong += wrongInHistory;
      ecoStats[ecoTask].total += total;
      ecoStats[ecoTask].questionIds.add(q.id);
    }

    // 章
    if (!chapterStats[q.chapter]) chapterStats[q.chapter] = { wrong: 0, total: 0, questionIds: new Set() };
    chapterStats[q.chapter].wrong += wrongInHistory;
    chapterStats[q.chapter].total += total;
    chapterStats[q.chapter].questionIds.add(q.id);

    // タグ
    for (const tag of q.tags ?? []) {
      if (!tagStats[tag]) tagStats[tag] = { wrong: 0, total: 0, questionIds: new Set() };
      tagStats[tag].wrong += wrongInHistory;
      tagStats[tag].total += total;
      tagStats[tag].questionIds.add(q.id);
    }
  }

  const entries: WeaknessEntry[] = [];

  // ECO 2026 タスクの弱点 (3問以上回答かつ正答率 < 70%)
  for (const [taskId, s] of Object.entries(ecoStats)) {
    if (s.total < 3) continue;
    const accuracy = (s.total - s.wrong) / s.total;
    if (accuracy >= 0.7) continue;
    const relatedTerms = eco2026Terms[taskId] ?? Object.entries(eco2026Terms).find(([k]) => k.startsWith(taskId + ' '))?.[1] ?? [];
    entries.push({
      conceptId: `eco2026:${taskId}`,
      conceptLabel: `ECO 2026 タスク ${taskId}`,
      conceptType: 'eco2026Task',
      wrongCount: s.wrong,
      totalCount: s.total,
      accuracy,
      relatedQuestionIds: Array.from(s.questionIds),
      recommendedActions: [
        `関連用語を学習: ${relatedTerms.slice(0, 5).join(' / ') || '(未マッピング)'}`,
        '関連章を復習し、ミニチェック演習で正答率を上げる',
      ],
    });
  }

  // 章の弱点
  for (const [chapterId, s] of Object.entries(chapterStats)) {
    if (s.total < 3) continue;
    const accuracy = (s.total - s.wrong) / s.total;
    if (accuracy >= 0.7) continue;
    const chapter = chaptersById.get(chapterId);
    entries.push({
      conceptId: `chapter:${chapterId}`,
      conceptLabel: `章 ${chapterId} ${chapter?.titleJa ?? ''}`,
      conceptType: 'chapter',
      wrongCount: s.wrong,
      totalCount: s.total,
      accuracy,
      relatedQuestionIds: Array.from(s.questionIds),
      recommendedActions: [
        `章 ${chapterId} の本文を再読: ${chapter?.summary?.slice(0, 80) ?? ''}...`,
      ],
    });
  }

  // タグの弱点 (5問以上回答)
  for (const [tag, s] of Object.entries(tagStats)) {
    if (s.total < 5) continue;
    const accuracy = (s.total - s.wrong) / s.total;
    if (accuracy >= 0.65) continue;
    entries.push({
      conceptId: `tag:${tag}`,
      conceptLabel: `概念タグ「${tag}」`,
      conceptType: 'tag',
      wrongCount: s.wrong,
      totalCount: s.total,
      accuracy,
      relatedQuestionIds: Array.from(s.questionIds),
      recommendedActions: [
        `タグ「${tag}」付き問題を再演習`,
        '用語集でこの概念に関連する定義を確認',
      ],
    });
  }

  // 弱点順 (accuracy 昇順) + 同点は totalCount 降順
  return entries.sort((a, b) => {
    if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
    return b.totalCount - a.totalCount;
  });
}

function lookupEcoTask(chapter: string, lookup: Record<string, string>): string | null {
  // chapter '1.1 (コンフリクト)' のようなキー文字列を chapter '1.1' から推定
  for (const [k, v] of Object.entries(lookup)) {
    if (k.startsWith(chapter + ' ') || k === chapter) {
      // v は '1.2 (コンフリクトの管理)' 形式から番号のみ抽出
      const m = v.match(/^(\d+\.\d+)/);
      if (m) return m[1];
    }
  }
  return null;
}
