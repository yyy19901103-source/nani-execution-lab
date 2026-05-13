import { useEffect, useMemo, useState } from 'react';
import questionsData from '../../data/pmp/questions.json';
import type { Question, DomainId } from '../../data/pmp/types';
import { getDb, appendStudyLog } from './db';

const ALL = questionsData.questions as Question[];

type ExamMode = 'full' | 'short';
type Phase = 'setup' | 'running' | 'result';

export default function Exam() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [mode, setMode] = useState<ExamMode>('short');
  const [examQs, setExamQs] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [endedAt, setEndedAt] = useState<number>(0);

  function build(modeArg: ExamMode) {
    const total = modeArg === 'full' ? 180 : 60;
    // 各ドメイン比率（People 42% / Process 50% / Business 8%）
    const targetPeople = Math.round(total * 0.42);
    const targetProcess = Math.round(total * 0.50);
    const targetBiz = total - targetPeople - targetProcess;

    function pick(domain: DomainId, n: number): Question[] {
      const pool = ALL.filter((q) => q.domain === domain);
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const out: Question[] = [];
      // 不足時は重複あり許容（プールが小さい場合の現実対応）
      let i = 0;
      while (out.length < n) {
        out.push(shuffled[i % shuffled.length]);
        i++;
      }
      return out;
    }
    const built = [
      ...pick('People', targetPeople),
      ...pick('Process', targetProcess),
      ...pick('Business Environment', targetBiz),
    ].sort(() => Math.random() - 0.5);

    setExamQs(built);
    setAnswers({});
    setIdx(0);
    setStartedAt(Date.now());
    setPhase('running');
  }

  async function finish() {
    setEndedAt(Date.now());
    setPhase('result');
    const durationMinutes = Math.round((Date.now() - startedAt) / 60000);
    const correctCount = examQs.reduce(
      (s, q) => (answers[q.id] === q.correctAnswer ? s + 1 : s),
      0,
    );
    const domainScores: Record<DomainId, number> = {
      People: 0,
      Process: 0,
      'Business Environment': 0,
    };
    (['People', 'Process', 'Business Environment'] as DomainId[]).forEach((d) => {
      const inDom = examQs.filter((q) => q.domain === d);
      if (inDom.length === 0) return;
      const cor = inDom.filter((q) => answers[q.id] === q.correctAnswer).length;
      domainScores[d] = cor / inDom.length;
    });
    const db = getDb();
    const id = `exam-${Date.now()}`;
    await db.examLogs.put({
      id,
      date: new Date().toISOString().slice(0, 10),
      type: mode,
      totalQuestions: examQs.length,
      correctCount,
      score: correctCount / examQs.length,
      domainScores,
      durationMinutes,
    });
    await appendStudyLog({
      date: new Date().toISOString().slice(0, 10),
      studyMinutes: durationMinutes,
      questionsAnswered: examQs.length,
      correctCount,
      chaptersStudied: Array.from(new Set(examQs.map((q) => q.chapter))),
    });
  }

  // ===== Setup =====
  if (phase === 'setup') {
    const limited = ALL.length;
    return (
      <div style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', padding: '1.75rem 2rem' }}>
          <p style={{ color: '#c8a96e', fontSize: '0.62rem', letterSpacing: '0.35em', marginBottom: '1rem' }}>
            EXAM MODE · 模試
          </p>
          <p style={{ color: 'rgba(237,237,232,0.7)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            現プールは{limited}問。本試験形式の構成比率（People 42% / Process 50% / Business 8%）で出題します。
            問題プールが小さい場合、同じ問題が複数回出題されます。
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <ModeCard
              active={mode === 'short'}
              label="短縮版"
              detail="60問 / 約75分"
              onClick={() => setMode('short')}
            />
            <ModeCard
              active={mode === 'full'}
              label="フル模試"
              detail="180問 / 230分"
              onClick={() => setMode('full')}
            />
          </div>
          <button
            onClick={() => build(mode)}
            style={{
              background: '#c8a96e',
              color: '#0c0c0e',
              border: 'none',
              padding: '0.7rem 2rem',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              cursor: 'pointer',
              fontWeight: 700,
              letterSpacing: '0.1em',
              width: '100%',
            }}
          >
            模試開始 ▶
          </button>
        </div>
      </div>
    );
  }

  // ===== Running =====
  if (phase === 'running') {
    const current = examQs[idx];
    const answered = Object.keys(answers).length;
    const elapsedMin = Math.floor((Date.now() - startedAt) / 60000);
    const total = examQs.length;
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '1rem' }}>
        <div style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.07)', padding: '0.6rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(237,237,232,0.7)' }}>
          <span>{idx + 1} / {total}</span>
          <span>回答済 {answered}/{total}</span>
          <span>経過 {elapsedMin}分</span>
        </div>

        <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem 1.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <Tag>{current.domain}</Tag>
            <Tag>章 {current.chapter}</Tag>
          </div>
          <p style={{ color: '#edede8', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '1.25rem' }}>
            {current.question}
          </p>
          <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {current.choices.map((c, i) => {
              const letter = ['A', 'B', 'C', 'D'][i];
              const sel = answers[current.id] === letter;
              return (
                <button
                  key={letter}
                  onClick={() => setAnswers({ ...answers, [current.id]: letter })}
                  style={{
                    background: sel ? 'rgba(200,169,110,0.12)' : '#0a0a0c',
                    border: `1px solid ${sel ? '#c8a96e' : 'rgba(255,255,255,0.1)'}`,
                    color: '#edede8',
                    padding: '0.75rem 1rem',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '0.6rem',
                  }}
                >
                  <span style={{ color: '#c8a96e', fontWeight: 600 }}>{letter}.</span>
                  <span style={{ lineHeight: 1.6 }}>{c}</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIdx(Math.max(0, idx - 1))}
              disabled={idx === 0}
              style={btnGhost}
            >
              ← 前
            </button>
            {idx < total - 1 ? (
              <button
                onClick={() => setIdx(idx + 1)}
                style={btnPrimary}
              >
                次 →
              </button>
            ) : (
              <button
                onClick={() => {
                  if (answered < total && !confirm(`未回答が${total - answered}問あります。提出しますか？`)) return;
                  finish();
                }}
                style={{ ...btnPrimary, background: '#6ec897' }}
              >
                提出 ▶
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== Result =====
  const correctCount = examQs.reduce((s, q) => (answers[q.id] === q.correctAnswer ? s + 1 : s), 0);
  const score = correctCount / examQs.length;
  const domainScores: Record<DomainId, number> = { People: 0, Process: 0, 'Business Environment': 0 };
  (['People', 'Process', 'Business Environment'] as DomainId[]).forEach((d) => {
    const inDom = examQs.filter((q) => q.domain === d);
    if (inDom.length > 0) {
      domainScores[d] = inDom.filter((q) => answers[q.id] === q.correctAnswer).length / inDom.length;
    }
  });
  const durMin = Math.round((endedAt - startedAt) / 60000);

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', padding: '1.75rem 2rem', marginBottom: '1.25rem' }}>
        <p style={{ color: '#c8a96e', fontSize: '0.62rem', letterSpacing: '0.35em', marginBottom: '0.5rem' }}>
          RESULT · 結果
        </p>
        <div style={{ color: score >= 0.8 ? '#6ec897' : score >= 0.7 ? '#c8a96e' : '#e86e6e', fontSize: '3rem', fontWeight: 200, marginBottom: '0.3rem' }}>
          {(score * 100).toFixed(1)}%
        </div>
        <div style={{ color: 'rgba(237,237,232,0.6)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          {correctCount} / {examQs.length} 問正解 · 所要 {durMin}分
        </div>

        <p style={{ color: '#c8a96e', fontSize: '0.62rem', letterSpacing: '0.25em', marginBottom: '0.75rem' }}>
          DOMAIN BREAKDOWN
        </p>
        {(['People', 'Process', 'Business Environment'] as DomainId[]).map((d) => {
          const inDom = examQs.filter((q) => q.domain === d);
          const cor = inDom.filter((q) => answers[q.id] === q.correctAnswer).length;
          const pct = inDom.length > 0 ? (cor / inDom.length) * 100 : 0;
          return (
            <div key={d} style={{ marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'rgba(237,237,232,0.8)' }}>{d}</span>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{cor}/{inDom.length} ({pct.toFixed(0)}%)</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.07)' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 75 ? '#6ec897' : '#c8a96e' }} />
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.6rem' }}>
          <button onClick={() => setPhase('setup')} style={btnPrimary}>もう一度</button>
          <a href="./" style={{ ...btnGhost, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            ダッシュボードへ
          </a>
        </div>
      </div>

      <ReviewSection examQs={examQs} answers={answers} />
      <FilterControls examQs={examQs} answers={answers} />

      <details style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.07)', padding: '1rem 1.25rem' }}>
        <summary style={{ color: '#c8a96e', fontSize: '0.78rem', cursor: 'pointer', letterSpacing: '0.05em' }}>
          全問レビュー（{examQs.length}問）▼
        </summary>
        <div style={{ marginTop: '1rem' }}>
          {examQs.map((q, i) => (
            <ReviewItem key={`${q.id}-${i}`} q={q} ans={answers[q.id]} index={i} />
          ))}
        </div>
      </details>
    </div>
  );
}

function ReviewSection({ examQs, answers }: { examQs: Question[]; answers: Record<string, string> }) {
  const wrongQs = examQs.filter((q) => answers[q.id] !== q.correctAnswer);
  if (wrongQs.length === 0) {
    return (
      <div style={{ background: 'rgba(110,200,151,0.06)', border: '1px solid rgba(110,200,151,0.25)', color: '#6ec897', padding: '1rem 1.25rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
        ✓ 全問正解です。素晴らしい！
      </div>
    );
  }
  return (
    <div style={{ background: '#111114', border: '1px solid rgba(232,110,110,0.2)', padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
      <p style={{ color: '#e86e6e', fontSize: '0.62rem', letterSpacing: '0.35em', marginBottom: '0.85rem' }}>
        REVIEW · 復習対象 {wrongQs.length}問
      </p>
      {wrongQs.map((q, i) => (
        <ReviewItem key={`wr-${q.id}-${i}`} q={q} ans={answers[q.id]} index={i} defaultOpen />
      ))}
    </div>
  );
}

function FilterControls({ examQs, answers }: { examQs: Question[]; answers: Record<string, string> }) {
  const wrong = examQs.filter((q) => answers[q.id] !== q.correctAnswer);
  if (wrong.length === 0) return null;

  // ドメイン別誤答数
  const byDomain: Record<string, number> = {};
  wrong.forEach((q) => (byDomain[q.domain] = (byDomain[q.domain] ?? 0) + 1));

  // 章別誤答数Top5
  const byChapter: Record<string, number> = {};
  wrong.forEach((q) => (byChapter[q.chapter] = (byChapter[q.chapter] ?? 0) + 1));
  const topChapters = Object.entries(byChapter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.07)', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
      <p style={{ color: '#c8a96e', fontSize: '0.62rem', letterSpacing: '0.35em', marginBottom: '0.85rem' }}>
        弱点傾向 · 次の演習へ
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {Object.entries(byDomain).map(([d, count]) => (
          <a
            key={d}
            href={`./quiz?domain=${encodeURIComponent(d)}`}
            style={{ background: 'rgba(232,110,110,0.08)', border: '1px solid rgba(232,110,110,0.3)', color: '#e86e6e', padding: '0.3rem 0.7rem', fontSize: '0.7rem', textDecoration: 'none' }}
          >
            {d} ({count}問)
          </a>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {topChapters.map(([ch, count]) => (
          <a
            key={ch}
            href={`./quiz?chapter=${ch}`}
            style={{ background: 'rgba(200,169,110,0.06)', border: '1px solid rgba(200,169,110,0.25)', color: '#c8a96e', padding: '0.25rem 0.6rem', fontSize: '0.68rem', textDecoration: 'none' }}
          >
            章{ch} ×{count}
          </a>
        ))}
      </div>
    </div>
  );
}

function ReviewItem({ q, ans, index, defaultOpen = false }: { q: Question; ans: string | undefined; index: number; defaultOpen?: boolean }) {
  const correct = ans === q.correctAnswer;
  return (
    <details open={defaultOpen} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem 0' }}>
      <summary style={{ cursor: 'pointer', listStyle: 'none' }}>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.4rem' }}>
          <span style={{ color: correct ? '#6ec897' : '#e86e6e', fontSize: '0.8rem' }}>
            {correct ? '✓' : '✗'}
          </span>
          <span style={{ color: 'rgba(237,237,232,0.6)', fontSize: '0.7rem' }}>
            Q{index + 1} · {q.domain} · 章{q.chapter} · 難易度{'★'.repeat(q.difficulty)}
          </span>
          <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
            あなた: {ans ?? '—'} / 正答: {q.correctAnswer}
          </span>
        </div>
        <p style={{ color: 'rgba(237,237,232,0.85)', fontSize: '0.78rem', lineHeight: 1.6, marginBottom: '0.4rem' }}>{q.question}</p>
      </summary>
      <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: `2px solid ${correct ? '#6ec897' : '#e86e6e'}` }}>
        <div style={{ marginBottom: '0.5rem' }}>
          {q.choices.map((c, i) => {
            const letter = ['A', 'B', 'C', 'D'][i];
            const isCorrect = letter === q.correctAnswer;
            const isYour = letter === ans;
            return (
              <div key={letter} style={{ display: 'flex', gap: '0.5rem', padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: isCorrect ? '#6ec897' : isYour ? '#e86e6e' : 'rgba(237,237,232,0.6)', background: isCorrect ? 'rgba(110,200,151,0.05)' : isYour && !isCorrect ? 'rgba(232,110,110,0.05)' : 'transparent' }}>
                <span style={{ fontWeight: 600 }}>{letter}.</span>
                <span style={{ flex: 1 }}>{c}</span>
                {isCorrect && <span>✓正答</span>}
                {isYour && !isCorrect && <span>✗あなた</span>}
              </div>
            );
          })}
        </div>
        <p style={{ color: '#edede8', fontSize: '0.78rem', lineHeight: 1.75, padding: '0.5rem 0.75rem', background: '#0a0a0c', borderLeft: '2px solid #c8a96e', marginTop: '0.5rem' }}>
          {q.explanation}
        </p>
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          {q.tags.map((t) => (
            <span key={t} style={{ background: 'rgba(200,169,110,0.06)', color: 'rgba(200,169,110,0.85)', padding: '0.15rem 0.45rem', fontSize: '0.62rem' }}>#{t}</span>
          ))}
        </div>
      </div>
    </details>
  );
}

function ModeCard({ active, label, detail, onClick }: { active: boolean; label: string; detail: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(200,169,110,0.1)' : '#0a0a0c',
        border: `1px solid ${active ? '#c8a96e' : 'rgba(255,255,255,0.1)'}`,
        color: '#edede8',
        padding: '1rem 1.2rem',
        fontFamily: 'inherit',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div style={{ color: '#c8a96e', fontSize: '0.62rem', letterSpacing: '0.25em', marginBottom: '0.4rem' }}>{label.toUpperCase()}</div>
      <div style={{ color: '#edede8', fontSize: '1rem', fontWeight: 300 }}>{label}</div>
      <div style={{ color: 'rgba(237,237,232,0.55)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{detail}</div>
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.2)', color: '#c8a96e', padding: '0.2rem 0.5rem', fontSize: '0.62rem', letterSpacing: '0.05em' }}>
      {children}
    </span>
  );
}

const btnPrimary: React.CSSProperties = {
  background: '#c8a96e',
  color: '#0c0c0e',
  border: 'none',
  padding: '0.55rem 1.4rem',
  fontSize: '0.78rem',
  fontFamily: 'inherit',
  cursor: 'pointer',
  fontWeight: 700,
  letterSpacing: '0.05em',
};

const btnGhost: React.CSSProperties = {
  background: '#0a0a0c',
  color: '#edede8',
  border: '1px solid rgba(255,255,255,0.15)',
  padding: '0.5rem 1.2rem',
  fontSize: '0.78rem',
  fontFamily: 'inherit',
  cursor: 'pointer',
  letterSpacing: '0.05em',
};
