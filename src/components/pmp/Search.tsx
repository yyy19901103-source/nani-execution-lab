import { useEffect, useMemo, useState } from 'react';
import chaptersData from '../../data/pmp/chapters.json';
import contentData from '../../data/pmp/chapter-content.json';
import questionsData from '../../data/pmp/questions.json';
import glossaryData from '../../data/pmp/glossary.json';
import casesData from '../../data/pmp/case-studies.json';

interface SearchHit {
  type: 'chapter' | 'question' | 'term' | 'case';
  id: string;
  title: string;
  excerpt: string;
  url: string;
}

export default function Search({ base }: { base: string }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | SearchHit['type']>('all');

  const allItems: SearchHit[] = useMemo(() => {
    const items: SearchHit[] = [];

    // 章
    for (const ch of chaptersData.chapters) {
      const body = (contentData.contents as Record<string, string>)[ch.id] ?? '';
      items.push({
        type: 'chapter',
        id: ch.id,
        title: `章 ${ch.id} ${ch.titleJa} (${ch.title})`,
        excerpt: `${ch.summary} ${ch.keyConcepts.join(' ')} ${body}`,
        url: `${base}/ai-tools/pmp-study/study/${ch.id}`,
      });
    }

    // 問題
    for (const q of questionsData.questions) {
      items.push({
        type: 'question',
        id: q.id,
        title: `${q.id} (章${q.chapter} · ${q.domain})`,
        excerpt: `${q.question} ${q.choices.join(' ')} ${q.explanation} ${q.tags.join(' ')}`,
        url: `${base}/ai-tools/pmp-study/quiz?chapter=${q.chapter}`,
      });
    }

    // 用語
    for (const t of glossaryData.terms) {
      items.push({
        type: 'term',
        id: t.term,
        title: `${t.term} / ${t.termJa}`,
        excerpt: `${t.definition} ${t.category} ${(t.tags ?? []).join(' ')}`,
        url: `${base}/ai-tools/pmp-study/glossary`,
      });
    }

    // ケース
    for (const c of casesData.cases) {
      items.push({
        type: 'case',
        id: c.id,
        title: `${c.id} ${c.title}`,
        excerpt: `${c.scenario} ${c.decisionPoints.join(' ')} ${c.modelAnswer} ${c.principles.join(' ')}`,
        url: `${base}/ai-tools/pmp-study/cases`,
      });
    }

    return items;
  }, [base]);

  const hits: SearchHit[] = useMemo(() => {
    const query = q.toLowerCase().trim();
    if (!query) return [];
    const terms = query.split(/\s+/).filter(Boolean);
    return allItems
      .filter((it) => (filter === 'all' ? true : it.type === filter))
      .filter((it) => {
        const blob = `${it.title} ${it.excerpt}`.toLowerCase();
        return terms.every((t) => blob.includes(t));
      })
      .slice(0, 50);
  }, [q, filter, allItems]);

  const counts = useMemo(() => {
    const c = { all: 0, chapter: 0, question: 0, term: 0, case: 0 };
    if (!q.trim()) return c;
    const query = q.toLowerCase().trim();
    const terms = query.split(/\s+/).filter(Boolean);
    for (const it of allItems) {
      const blob = `${it.title} ${it.excerpt}`.toLowerCase();
      if (terms.every((t) => blob.includes(t))) {
        c.all++;
        c[it.type]++;
      }
    }
    return c;
  }, [q, allItems]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <div style={{ background: '#111114', border: '1px solid rgba(200,169,110,0.2)', padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
        <p style={{ color: '#c8a96e', fontSize: '0.62rem', letterSpacing: '0.35em', marginBottom: '0.75rem' }}>SEARCH ALL CONTENT</p>
        <input
          type="search"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔎 概念・用語・問題ID・キーワードを入力（スペース区切りで AND 検索）"
          style={{
            background: '#0a0a0c',
            color: '#edede8',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '0.7rem 1rem',
            fontSize: '0.95rem',
            fontFamily: 'inherit',
            width: '100%',
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          {(['all', 'chapter', 'question', 'term', 'case'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              style={{
                background: filter === k ? 'rgba(200,169,110,0.15)' : 'transparent',
                border: `1px solid ${filter === k ? '#c8a96e' : 'rgba(255,255,255,0.15)'}`,
                color: filter === k ? '#c8a96e' : 'rgba(237,237,232,0.7)',
                padding: '0.3rem 0.7rem',
                fontSize: '0.72rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              {LABELS[k]} ({counts[k]})
            </button>
          ))}
        </div>
      </div>

      {q.trim() && hits.length === 0 && (
        <div style={{ color: 'rgba(237,237,232,0.5)', textAlign: 'center', padding: '2rem', fontSize: '0.85rem' }}>
          ヒットなし。別のキーワードを試してください。
        </div>
      )}

      {hits.map((h) => (
        <a
          key={`${h.type}-${h.id}`}
          href={h.url}
          style={{
            display: 'block',
            background: '#111114',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '0.85rem 1.1rem',
            marginBottom: '0.5rem',
            textDecoration: 'none',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#c8a96e')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
        >
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', marginBottom: '0.3rem' }}>
            <span style={{ background: TYPE_COLORS[h.type].bg, color: TYPE_COLORS[h.type].fg, padding: '0.15rem 0.5rem', fontSize: '0.62rem', letterSpacing: '0.05em' }}>
              {LABELS[h.type]}
            </span>
            <span style={{ color: '#edede8', fontSize: '0.85rem', fontWeight: 500 }}>{h.title}</span>
          </div>
          <p style={{ color: 'rgba(237,237,232,0.6)', fontSize: '0.75rem', lineHeight: 1.6, margin: 0 }}>
            {highlight(h.excerpt, q).slice(0, 250)}
            {h.excerpt.length > 250 ? '…' : ''}
          </p>
        </a>
      ))}
    </div>
  );
}

const LABELS = { all: '全て', chapter: '章', question: '問題', term: '用語', case: 'ケース' };
const TYPE_COLORS = {
  chapter: { bg: 'rgba(110,200,151,0.1)', fg: '#6ec897' },
  question: { bg: 'rgba(200,169,110,0.1)', fg: '#c8a96e' },
  term: { bg: 'rgba(158,203,232,0.1)', fg: '#9ecbe8' },
  case: { bg: 'rgba(232,110,150,0.1)', fg: '#e86e96' },
};

function highlight(text: string, q: string): string {
  // Render-side highlighting is simplified — JSX を返さず純テキスト切り出しで対応
  return text.replace(/\s+/g, ' ').trim();
}
