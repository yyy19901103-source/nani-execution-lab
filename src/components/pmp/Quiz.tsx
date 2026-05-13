import { useEffect, useMemo, useState } from 'react';
import questionsData from '../../data/pmp/questions.json';
import chaptersData from '../../data/pmp/chapters.json';
import glossaryData from '../../data/pmp/glossary.json';
import type { Question, DomainId } from '../../data/pmp/types';
import { getDb, updateQuestionState, appendStudyLog } from './db';
import NoteBookmark from './NoteBookmark';
import { ToastContainer, showToast } from './Toast';

type Filter = {
  domain: DomainId | 'all';
  difficulty: number | 'all';
  mode: 'all' | 'srs' | 'unattempted' | 'incorrect';
  chapter: string | 'all';
  tag: string | 'all';
};

const ALL_QUESTIONS = questionsData.questions as Question[];
const ALL_CHAPTERS = chaptersData.chapters;

// 全タグの一意リスト
const ALL_TAGS = Array.from(
  new Set(ALL_QUESTIONS.flatMap((q) => q.tags))
).sort();

function getUrlChapter(): string {
  if (typeof window === 'undefined') return 'all';
  const params = new URLSearchParams(window.location.search);
  return params.get('chapter') || 'all';
}

function getUrlTag(): string {
  if (typeof window === 'undefined') return 'all';
  const params = new URLSearchParams(window.location.search);
  return params.get('tag') || 'all';
}

export default function Quiz() {
  const [filter, setFilter] = useState<Filter>(() => ({
    domain: 'all',
    difficulty: 'all',
    mode: 'all',
    chapter: getUrlChapter(),
    tag: getUrlTag(),
  }));
  const [queue, setQueue] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [sessionStats, setSessionStats] = useState({ answered: 0, correct: 0 });

  // フィルタ適用したキュー生成
  useEffect(() => {
    (async () => {
      const db = getDb();
      const states = await db.questionStates.toArray();
      const stateMap = new Map(states.map((s) => [s.questionId, s]));
      const today = new Date().toISOString().slice(0, 10);

      let pool = [...ALL_QUESTIONS];
      if (filter.domain !== 'all') pool = pool.filter((q) => q.domain === filter.domain);
      if (filter.difficulty !== 'all') pool = pool.filter((q) => q.difficulty === filter.difficulty);
      if (filter.chapter !== 'all') pool = pool.filter((q) => q.chapter === filter.chapter);
      if (filter.tag !== 'all') pool = pool.filter((q) => q.tags.includes(filter.tag));

      if (filter.mode === 'unattempted') {
        pool = pool.filter((q) => !stateMap.has(q.id));
      } else if (filter.mode === 'srs') {
        pool = pool.filter((q) => {
          const s = stateMap.get(q.id);
          return s && s.srsNextDate && s.srsNextDate <= today;
        });
      } else if (filter.mode === 'incorrect') {
        pool = pool.filter((q) => {
          const s = stateMap.get(q.id);
          return s && s.history.some((h) => h.result === 'incorrect');
        });
      }

      pool = pool.sort(() => Math.random() - 0.5);
      setQueue(pool);
      setIdx(0);
      reset();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function reset() {
    setSelected(null);
    setMemo('');
    setRevealed(false);
    setStartTime(Date.now());
  }

  const current = queue[idx];

  // キーボードショートカット
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (revealed) {
        if (e.key === 'Enter' || e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          next();
        }
        return;
      }
      if (['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        setSelected(['A', 'B', 'C', 'D'][parseInt(e.key) - 1]);
      } else if (['a', 'A', 'b', 'B', 'c', 'C', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
        setSelected(e.key.toUpperCase());
      } else if (e.key === 'Enter' && selected && memo.trim()) {
        e.preventDefault();
        handleSubmit();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, selected, memo, current]);

  async function handleSubmit() {
    if (!current || !selected) return;
    if (!memo.trim()) {
      showToast('根拠メモを記入してください（必須）', 'warn');
      return;
    }
    const timeSec = Math.round((Date.now() - startTime) / 1000);
    const isCorrect = selected === current.correctAnswer;
    await updateQuestionState(
      current.id,
      isCorrect ? 'correct' : 'incorrect',
      timeSec,
      memo,
    );
    const today = new Date().toISOString().slice(0, 10);
    await appendStudyLog({
      date: today,
      studyMinutes: Math.max(1, Math.round(timeSec / 60)),
      questionsAnswered: 1,
      correctCount: isCorrect ? 1 : 0,
      chaptersStudied: [current.chapter],
    });
    setSessionStats((s) => ({
      answered: s.answered + 1,
      correct: s.correct + (isCorrect ? 1 : 0),
    }));
    setRevealed(true);
    showToast(isCorrect ? '✓ 正解！' : '✗ 不正解 — 解説を確認', isCorrect ? 'success' : 'error');
  }

  function next() {
    if (idx + 1 < queue.length) {
      setIdx(idx + 1);
      reset();
    } else {
      showToast('プール終了。フィルタを変えるか、ダッシュボードに戻ってください。', 'info', 4000);
    }
  }

  // URL に章・タグの状態を反映（戻るボタン対応）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (filter.chapter !== 'all') params.set('chapter', filter.chapter);
    else params.delete('chapter');
    if (filter.tag !== 'all') params.set('tag', filter.tag);
    else params.delete('tag');
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [filter.chapter, filter.tag]);

  if (queue.length === 0) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
        <FilterBar filter={filter} setFilter={setFilter} count={0} />
        <div style={{ color: 'rgba(237,237,232,0.5)', textAlign: 'center', padding: '3rem 1rem' }}>
          条件に合致する問題がありません。フィルタを変更してください。
        </div>
      </div>
    );
  }

  if (!current) return null;
  const sessionAccuracy = sessionStats.answered > 0 ? Math.round((sessionStats.correct / sessionStats.answered) * 100) : 0;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <ToastContainer />
      <FilterBar filter={filter} setFilter={setFilter} count={queue.length} />

      <div style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.07)', padding: '0.6rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(237,237,232,0.7)', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span>{idx + 1} / {queue.length}</span>
        <span style={{ color: 'rgba(237,237,232,0.4)', fontSize: '0.68rem' }}>⌨ 1-4:選択 / Enter:解答 / N:次</span>
        <span>正答率 {sessionAccuracy}% ({sessionStats.correct}/{sessionStats.answered})</span>
      </div>

      <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem 1.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <Tag>{current.domain}</Tag>
          <Tag>章 {current.chapter}</Tag>
          <Tag>難易度 {'★'.repeat(current.difficulty)}</Tag>
          {current.tags.slice(0, 3).map((t) => (
            <button
              key={t}
              onClick={() => setFilter({ ...filter, tag: t })}
              style={{ background: 'rgba(110,200,151,0.06)', border: '1px solid rgba(110,200,151,0.2)', color: 'rgba(110,200,151,0.9)', padding: '0.2rem 0.5rem', fontSize: '0.62rem', letterSpacing: '0.05em', fontFamily: 'inherit', cursor: 'pointer' }}
            >
              #{t}
            </button>
          ))}
        </div>
        <p style={{ color: '#edede8', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
          {current.question}
        </p>

        <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {current.choices.map((choice, i) => {
            const letter = ['A', 'B', 'C', 'D'][i];
            const isCorrect = revealed && letter === current.correctAnswer;
            const isWrong = revealed && letter === selected && letter !== current.correctAnswer;
            return (
              <button
                key={letter}
                onClick={() => !revealed && setSelected(letter)}
                disabled={revealed}
                style={{
                  background: isCorrect ? 'rgba(110,200,151,0.12)' : isWrong ? 'rgba(232,110,110,0.12)' : selected === letter ? 'rgba(200,169,110,0.1)' : '#0a0a0c',
                  border: `1px solid ${isCorrect ? '#6ec897' : isWrong ? '#e86e6e' : selected === letter ? '#c8a96e' : 'rgba(255,255,255,0.1)'}`,
                  color: '#edede8',
                  padding: '0.85rem 1.1rem',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  cursor: revealed ? 'default' : 'pointer',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ color: '#c8a96e', fontWeight: 600, minWidth: 20 }}>{letter}.</span>
                <span style={{ flex: 1, lineHeight: 1.6 }}>{choice}</span>
                {isCorrect && <span style={{ color: '#6ec897' }}>✓</span>}
                {isWrong && <span style={{ color: '#e86e6e' }}>✗</span>}
              </button>
            );
          })}
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>
            根拠メモ（必須・なぜその答えを選んだか）<span style={{ color: '#e86e6e' }}>*</span>
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            disabled={revealed}
            rows={3}
            placeholder="例: 対立は『立場』でなく『利害』に焦点を当てるべきだから、両者の懸念を引き出すB が最適と判断した"
            style={{
              background: '#0a0a0c',
              color: '#edede8',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '0.6rem 0.8rem',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              width: '100%',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        {!revealed ? (
          <button
            onClick={handleSubmit}
            disabled={!selected || !memo.trim()}
            style={{
              background: selected && memo.trim() ? '#c8a96e' : 'rgba(200,169,110,0.3)',
              color: '#0c0c0e',
              border: 'none',
              padding: '0.7rem 2rem',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              cursor: selected && memo.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 700,
              letterSpacing: '0.1em',
            }}
          >
            解答する ▶
          </button>
        ) : (
          <>
            <div style={{ background: '#0a0a0c', borderLeft: `3px solid ${selected === current.correctAnswer ? '#6ec897' : '#e86e6e'}`, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
              <p style={{ color: selected === current.correctAnswer ? '#6ec897' : '#e86e6e', fontSize: '0.7rem', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>
                {selected === current.correctAnswer ? '✓ 正解' : '✗ 不正解'} · 正答 {current.correctAnswer}
              </p>
              <p style={{ color: '#edede8', fontSize: '0.85rem', lineHeight: 1.8 }}>
                {current.explanation}
              </p>
            </div>

            {/* 深掘り: 関連章・関連用語 */}
            <DeepDive question={current} />

            <NoteBookmark refType="question" refId={current.id} title={`${current.id} ${current.question.slice(0, 40)}...`} />
            <button
              onClick={next}
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
                marginTop: '1rem',
              }}
            >
              次の問題 ▶
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function FilterBar({ filter, setFilter, count }: { filter: Filter; setFilter: (f: Filter) => void; count: number }) {
  // 章は選択ドメインに応じて絞り込み
  const chaptersInDomain = useMemo(() => {
    if (filter.domain === 'all') return ALL_CHAPTERS;
    return ALL_CHAPTERS.filter((c) => c.domain === filter.domain);
  }, [filter.domain]);

  return (
    <div style={{ background: '#0a0a0c', border: '1px solid rgba(200,169,110,0.1)', padding: '0.7rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', marginBottom: '1rem' }}>
      <span style={{ color: 'rgba(200,169,110,0.7)', fontSize: '0.62rem', letterSpacing: '0.2em' }}>FILTER</span>
      <select
        value={filter.domain}
        onChange={(e) => setFilter({ ...filter, domain: e.target.value as DomainId | 'all', chapter: 'all' })}
        style={selectStyle}
        aria-label="ドメイン"
      >
        <option value="all">全ドメイン</option>
        <option value="People">People (42%)</option>
        <option value="Process">Process (50%)</option>
        <option value="Business Environment">Business Environment (8%)</option>
      </select>
      <select
        value={filter.chapter}
        onChange={(e) => setFilter({ ...filter, chapter: e.target.value })}
        style={selectStyle}
        aria-label="章"
      >
        <option value="all">全章</option>
        {chaptersInDomain.map((c) => (
          <option key={c.id} value={c.id}>{c.id} · {c.titleJa}</option>
        ))}
      </select>
      <select
        value={filter.difficulty}
        onChange={(e) => setFilter({ ...filter, difficulty: e.target.value === 'all' ? 'all' : Number(e.target.value) })}
        style={selectStyle}
        aria-label="難易度"
      >
        <option value="all">全難易度</option>
        {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>★{d}</option>)}
      </select>
      <select
        value={filter.tag}
        onChange={(e) => setFilter({ ...filter, tag: e.target.value })}
        style={selectStyle}
        aria-label="タグ"
      >
        <option value="all">全タグ</option>
        {ALL_TAGS.map((t) => <option key={t} value={t}>#{t}</option>)}
      </select>
      <select
        value={filter.mode}
        onChange={(e) => setFilter({ ...filter, mode: e.target.value as Filter['mode'] })}
        style={selectStyle}
        aria-label="モード"
      >
        <option value="all">全問題</option>
        <option value="unattempted">未着手のみ</option>
        <option value="srs">SRS本日対象</option>
        <option value="incorrect">過去誤答のみ</option>
      </select>
      <span style={{ marginLeft: 'auto', color: 'rgba(237,237,232,0.6)', fontSize: '0.72rem' }}>{count}問</span>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  background: '#0a0a0c',
  color: '#edede8',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: '0.3rem 0.6rem',
  fontSize: '0.75rem',
  fontFamily: 'inherit',
  outline: 'none',
  maxWidth: 200,
};

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.2)', color: '#c8a96e', padding: '0.2rem 0.6rem', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
      {children}
    </span>
  );
}

/**
 * 問題解答後の深掘り表示:
 * - 関連章へのリンク
 * - 関連用語（タグまたは解説内のキーワードから自動抽出）
 */
function DeepDive({ question }: { question: Question }) {
  const base = typeof window !== 'undefined' ? (location.pathname.includes('/nani-execution-lab') ? '/nani-execution-lab' : '') : '';
  const ch = (chaptersData.chapters as any[]).find((c) => c.id === question.chapter);

  // 関連用語の自動抽出（タグ + 解説内の用語マッチ）
  const matchedTerms = (() => {
    const found: any[] = [];
    const blob = `${question.explanation} ${question.tags.join(' ')}`.toLowerCase();
    for (const t of glossaryData.terms as any[]) {
      const key = t.term.toLowerCase();
      const keyJa = t.termJa;
      if ((key && blob.includes(key)) || (keyJa && (question.explanation + question.tags.join(' ')).includes(keyJa))) {
        found.push(t);
        if (found.length >= 6) break;
      }
    }
    return found;
  })();

  return (
    <div style={{ background: '#0f0f12', border: '1px solid rgba(110,200,151,0.2)', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
      <p style={{ color: '#6ec897', fontSize: '0.62rem', letterSpacing: '0.3em', marginBottom: '0.75rem' }}>
        🔗 DEEP DIVE · 深掘り
      </p>

      {ch && (
        <div style={{ marginBottom: '0.75rem' }}>
          <span style={{ color: 'rgba(237,237,232,0.6)', fontSize: '0.72rem', marginRight: '0.5rem' }}>📖 関連章:</span>
          <a href={`${base}/ai-tools/pmp-study/study/${ch.id}`} style={{ color: '#6ec897', fontSize: '0.78rem', textDecoration: 'none', borderBottom: '1px dotted rgba(110,200,151,0.4)' }}>
            章 {ch.id} {ch.titleJa} →
          </a>
        </div>
      )}

      {matchedTerms.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{ color: 'rgba(237,237,232,0.6)', fontSize: '0.72rem', display: 'block', marginBottom: '0.35rem' }}>📚 関連用語:</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {matchedTerms.map((t) => (
              <a
                key={t.term}
                href={`${base}/ai-tools/pmp-study/glossary#${encodeURIComponent(t.term)}`}
                title={t.definition.slice(0, 100)}
                style={{ background: 'rgba(158,203,232,0.08)', border: '1px solid rgba(158,203,232,0.25)', color: '#9ecbe8', padding: '0.2rem 0.5rem', fontSize: '0.68rem', textDecoration: 'none' }}
              >
                {t.term}
              </a>
            ))}
          </div>
        </div>
      )}

      {question.tags.length > 0 && (
        <div>
          <span style={{ color: 'rgba(237,237,232,0.6)', fontSize: '0.72rem', display: 'block', marginBottom: '0.35rem' }}>🏷 PMP 概念タグ:</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {question.tags.map((t) => (
              <span key={t} style={{ background: 'rgba(200,169,110,0.06)', color: 'rgba(200,169,110,0.85)', padding: '0.15rem 0.45rem', fontSize: '0.65rem' }}>#{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
