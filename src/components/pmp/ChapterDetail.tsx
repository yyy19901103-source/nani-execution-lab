import { useEffect, useMemo, useState } from 'react';
import chaptersData from '../../data/pmp/chapters.json';
import contentData from '../../data/pmp/chapter-content.json';
import questionsData from '../../data/pmp/questions.json';
import glossaryData from '../../data/pmp/glossary.json';
import casesData from '../../data/pmp/case-studies.json';
import type { Chapter, Question } from '../../data/pmp/types';
import NoteBookmark from './NoteBookmark';
import Breadcrumb from './Breadcrumb';
import { ToastContainer, showToast } from './Toast';

export default function ChapterDetail({ chapterId, base }: { chapterId: string; base: string }) {
  const [completed, setCompleted] = useState(false);
  const chapter = (chaptersData.chapters as Chapter[]).find((c) => c.id === chapterId);
  const content = (contentData.contents as Record<string, string>)[chapterId];
  const questions = (questionsData.questions as Question[]).filter((q) => q.chapter === chapterId);
  const glossaryTerms = useMemo(
    () => (glossaryData.terms as any[]).filter((t) => t.relatedChapter === chapterId),
    [chapterId],
  );
  const relatedCases = (casesData.cases as any[]).filter((c) => c.relatedChapters.includes(chapterId));

  // 前後章ナビゲーション
  const sortedChapters = [...(chaptersData.chapters as Chapter[])].sort((a, b) => a.order - b.order);
  const curIdx = sortedChapters.findIndex((c) => c.id === chapterId);
  const prevCh = curIdx > 0 ? sortedChapters[curIdx - 1] : null;
  const nextCh = curIdx < sortedChapters.length - 1 ? sortedChapters[curIdx + 1] : null;

  // キーボードナビ
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft' && prevCh) location.href = `${base}/ai-tools/pmp-study/study/${prevCh.id}`;
      if (e.key === 'ArrowRight' && nextCh) location.href = `${base}/ai-tools/pmp-study/study/${nextCh.id}`;
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [base, prevCh, nextCh]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('pmp-completed-chapters') || '[]');
    setCompleted(stored.includes(chapterId));
  }, [chapterId]);

  function toggle() {
    const stored: string[] = JSON.parse(localStorage.getItem('pmp-completed-chapters') || '[]');
    if (completed) {
      const i = stored.indexOf(chapterId);
      if (i >= 0) stored.splice(i, 1);
      showToast('完了マークを外しました', 'info');
    } else {
      if (!stored.includes(chapterId)) stored.push(chapterId);
      showToast('✓ 学習完了としてマークしました', 'success');
    }
    localStorage.setItem('pmp-completed-chapters', JSON.stringify(stored));
    setCompleted(!completed);
  }

  if (!chapter) {
    return <div style={{ padding: '2rem', color: '#e86e6e' }}>章 {chapterId} が見つかりません</div>;
  }

  // 用語集の全用語マップ（自動リンク用）
  const termsByTerm = new Map<string, any>();
  for (const t of glossaryData.terms as any[]) {
    termsByTerm.set(t.term.toLowerCase(), t);
    if (t.termJa) termsByTerm.set(t.termJa, t);
  }

  return (
    <div className="pmp-chapter-detail" style={{ maxWidth: 900, margin: '0 auto', padding: '1rem 1rem 4rem' }}>
      <ToastContainer />
      <Breadcrumb items={[
        { label: 'PMP学習', href: `${base}/ai-tools/pmp-study/` },
        { label: '体系学習', href: `${base}/ai-tools/pmp-study/study` },
        { label: `章 ${chapter.id} ${chapter.titleJa}` },
      ]} />

      {/* ヘッダー */}
      <div style={{ background: '#111114', border: '1px solid rgba(200,169,110,0.2)', padding: '1.5rem 1.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
          <span style={{ background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.3)', color: '#c8a96e', padding: '0.25rem 0.7rem', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
            {chapter.domain}
          </span>
          <span style={{ color: 'rgba(237,237,232,0.6)', fontSize: '0.75rem', alignSelf: 'center' }}>
            章 {chapter.id} · 推定 {chapter.estimatedMinutes} 分
          </span>
        </div>
        <h1 style={{ color: '#edede8', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 200, letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
          {chapter.titleJa}
        </h1>
        <p style={{ color: 'rgba(237,237,232,0.5)', fontSize: '0.8rem', marginBottom: '1rem' }}>{chapter.title}</p>
        <p style={{ color: 'rgba(237,237,232,0.75)', fontSize: '0.85rem', lineHeight: 1.7 }}>{chapter.summary}</p>
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          {chapter.keyConcepts.map((c) => (
            <span key={c} style={{ background: 'rgba(200,169,110,0.06)', border: '1px solid rgba(200,169,110,0.2)', color: 'rgba(200,169,110,0.9)', padding: '0.2rem 0.5rem', fontSize: '0.65rem' }}>
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* 注意書き */}
      <div style={{ background: 'rgba(232,180,110,0.06)', borderLeft: '3px solid #e8b46e', padding: '0.7rem 1rem', fontSize: '0.72rem', color: 'rgba(237,237,232,0.7)', marginBottom: '1rem', lineHeight: 1.6 }}>
        ⚠ 本章の内容は AI 生成オリジナル素材で、PMI 公式資料との照合は未実施です。誤りに気付いたら下のメモ欄に訂正記録を残してください。
      </div>

      {/* 本文（用語自動リンク付き） */}
      <div style={{ background: '#0f0f12', border: '1px solid rgba(255,255,255,0.07)', padding: 'clamp(1rem, 3vw, 1.75rem) clamp(1rem, 3vw, 2rem)', marginBottom: '1.25rem' }}>
        <p style={{ color: '#c8a96e', fontSize: '0.62rem', letterSpacing: '0.35em', marginBottom: '1rem' }}>LESSON · 学習内容</p>
        {content ? (
          <div
            className="md-content"
            style={{ color: 'rgba(237,237,232,0.85)', fontSize: '0.88rem', lineHeight: 1.85 }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content, termsByTerm, base) }}
          />
        ) : (
          <p style={{ color: 'rgba(237,237,232,0.5)', fontSize: '0.8rem' }}>本文準備中。</p>
        )}
      </div>

      {/* 関連用語 */}
      {glossaryTerms.length > 0 && (
        <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
          <p style={{ color: '#c8a96e', fontSize: '0.62rem', letterSpacing: '0.35em', marginBottom: '1rem' }}>
            📖 関連用語 ({glossaryTerms.length})
          </p>
          {glossaryTerms.map((t) => (
            <div key={t.term} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '0.6rem 0' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                <span style={{ color: '#c8a96e', fontWeight: 600, fontSize: '0.82rem' }}>{t.term}</span>
                <span style={{ color: 'rgba(237,237,232,0.6)', fontSize: '0.78rem' }}>{t.termJa}</span>
              </div>
              <p style={{ color: 'rgba(237,237,232,0.75)', fontSize: '0.78rem', lineHeight: 1.7 }}>{t.definition}</p>
            </div>
          ))}
        </div>
      )}

      {/* 関連ケース */}
      {relatedCases.length > 0 && (
        <div style={{ background: '#111114', border: '1px solid rgba(232,110,150,0.2)', padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
          <p style={{ color: '#e86e96', fontSize: '0.62rem', letterSpacing: '0.35em', marginBottom: '0.85rem' }}>
            🎭 関連ケーススタディ ({relatedCases.length})
          </p>
          {relatedCases.map((c) => (
            <a key={c.id} href={`${base}/ai-tools/pmp-study/cases#${c.id}`} style={{ display: 'block', padding: '0.5rem 0', color: 'rgba(237,237,232,0.85)', fontSize: '0.8rem', textDecoration: 'none' }}>
              <span style={{ color: '#e86e96', fontSize: '0.7rem', marginRight: '0.5rem' }}>{c.id}</span>
              {c.title} →
            </a>
          ))}
        </div>
      )}

      {/* ミニチェック */}
      <div style={{ background: '#111114', border: '1px solid rgba(110,200,151,0.25)', padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
        <p style={{ color: '#6ec897', fontSize: '0.62rem', letterSpacing: '0.35em', marginBottom: '0.85rem' }}>
          📝 MINI-CHECK · この章のミニチェック ({questions.length}問)
        </p>
        <p style={{ color: 'rgba(237,237,232,0.65)', fontSize: '0.82rem', lineHeight: 1.7, marginBottom: '1rem' }}>
          学習内容の理解度を確認しましょう。SRS で間隔反復しながら定着させます。
        </p>
        <a
          href={`${base}/ai-tools/pmp-study/quiz?chapter=${chapterId}`}
          style={{ background: '#6ec897', color: '#0c0c0e', padding: '0.6rem 1.5rem', fontSize: '0.85rem', fontFamily: 'inherit', textDecoration: 'none', fontWeight: 700, letterSpacing: '0.05em', display: 'inline-block' }}
        >
          この章を演習 ▶
        </a>
      </div>

      {/* 個人ノート & ブックマーク */}
      <NoteBookmark refType="chapter" refId={chapterId} title={`章 ${chapter.id} ${chapter.titleJa}`} />

      {/* 完了チェック */}
      <div style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.07)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', marginTop: '1rem' }}>
        <input type="checkbox" checked={completed} onChange={toggle} style={{ width: 18, height: 18, accentColor: '#c8a96e', cursor: 'pointer' }} />
        <span style={{ color: completed ? '#6ec897' : 'rgba(237,237,232,0.8)', fontSize: '0.85rem' }}>
          {completed ? '✓ この章を学習完了としてマーク' : 'この章を学習完了としてマーク'}
        </span>
      </div>

      {/* 前後章ナビ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
        {prevCh ? (
          <a href={`${base}/ai-tools/pmp-study/study/${prevCh.id}`} style={navBtn} title="← キー: 前章">
            <div style={{ color: 'rgba(237,237,232,0.5)', fontSize: '0.62rem', letterSpacing: '0.2em', marginBottom: '0.25rem' }}>← 前章 ({prevCh.id})</div>
            <div style={{ fontSize: '0.82rem' }}>{prevCh.titleJa}</div>
          </a>
        ) : <span />}
        {nextCh ? (
          <a href={`${base}/ai-tools/pmp-study/study/${nextCh.id}`} style={{ ...navBtn, textAlign: 'right' as const }} title="→ キー: 次章">
            <div style={{ color: 'rgba(237,237,232,0.5)', fontSize: '0.62rem', letterSpacing: '0.2em', marginBottom: '0.25rem' }}>次章 → ({nextCh.id})</div>
            <div style={{ fontSize: '0.82rem' }}>{nextCh.titleJa}</div>
          </a>
        ) : <span />}
      </div>

      <p style={{ color: 'rgba(237,237,232,0.3)', fontSize: '0.65rem', textAlign: 'center' }}>
        ⌨ 左右キーで前後章を移動
      </p>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  background: '#0a0a0c',
  color: 'rgba(237,237,232,0.85)',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: '0.85rem 1.1rem',
  textDecoration: 'none',
  display: 'block',
  transition: 'border-color 0.15s',
};

/**
 * Markdown レンダラー（用語自動リンク付き）
 */
function renderMarkdown(md: string, terms: Map<string, any>, base: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const lines = md.split('\n');
  const out: string[] = [];
  let inTable = false;
  let inList = false;
  let inCode = false;
  let codeBuffer: string[] = [];

  function flushList() {
    if (inList) { out.push('</ul>'); inList = false; }
  }
  function flushTable() {
    if (inTable) { out.push('</tbody></table>'); inTable = false; }
  }

  // 用語の自動リンク化（大文字小文字を考慮しつつ単語境界で）
  function linkifyTerms(html: string): string {
    if (terms.size === 0) return html;
    // 長い用語を先にマッチさせる
    const keys = Array.from(terms.keys()).sort((a, b) => b.length - a.length);
    let result = html;
    // 既にHTMLタグ内のテキストにはマッチさせないよう、簡易的にタグ外のテキストノードのみを置換
    // ここでは過剰一致を避けるため、用語の前後に空白/句読点/改行があるケースのみ
    for (const k of keys) {
      const term = terms.get(k);
      if (!term) continue;
      const safe = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // 既にリンク化された箇所は除外（負の先読み）
      const re = new RegExp(`(^|[\\s\\u3000、。「」（）\\(\\)：。])(${safe})(?![^<]*</a>)`, 'gi');
      result = result.replace(re, (_m, p1, p2) => {
        return `${p1}<a href="${base}/ai-tools/pmp-study/glossary#${encodeURIComponent(term.term)}" style="color:#c8a96e;border-bottom:1px dotted rgba(200,169,110,0.5);text-decoration:none;" title="${escape(term.definition).slice(0, 80)}...">${p2}</a>`;
      });
    }
    return result;
  }

  const inlineFormat = (s: string): string => {
    const escaped = escape(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
    return linkifyTerms(escaped);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (!inCode) {
        flushList(); flushTable();
        inCode = true; codeBuffer = [];
      } else {
        out.push(`<pre style="background:#0a0a0c;padding:0.75rem 1rem;border-left:2px solid #c8a96e;overflow-x:auto;font-size:0.78rem;color:rgba(237,237,232,0.85)"><code>${escape(codeBuffer.join('\n'))}</code></pre>`);
        inCode = false;
      }
      continue;
    }
    if (inCode) { codeBuffer.push(line); continue; }

    if (line.startsWith('### ')) {
      flushList(); flushTable();
      out.push(`<h4 style="color:#c8a96e;font-size:0.95rem;margin-top:1.5rem;margin-bottom:0.5rem;letter-spacing:0.05em;">${inlineFormat(line.slice(4))}</h4>`);
    } else if (line.startsWith('## ')) {
      flushList(); flushTable();
      out.push(`<h3 style="color:#edede8;font-size:1.1rem;margin-top:2rem;margin-bottom:0.75rem;border-bottom:1px solid rgba(200,169,110,0.2);padding-bottom:0.3rem;">${inlineFormat(line.slice(3))}</h3>`);
    } else if (line.startsWith('# ')) {
      flushList(); flushTable();
      out.push(`<h2 style="color:#edede8;font-size:1.3rem;margin-top:2rem;margin-bottom:0.75rem;">${inlineFormat(line.slice(2))}</h2>`);
    } else if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        flushList();
        const nextLine = lines[i + 1] ?? '';
        if (nextLine.match(/^\|[\s\-:|]+\|$/)) {
          inTable = true;
          const cells = line.slice(1, -1).split('|').map((c) => c.trim());
          out.push('<table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:0.8rem;"><thead><tr>' +
            cells.map((c) => `<th style="text-align:left;color:#c8a96e;border-bottom:1px solid rgba(200,169,110,0.3);padding:0.5rem 0.6rem;">${inlineFormat(c)}</th>`).join('') +
            '</tr></thead><tbody>');
          i++;
          continue;
        }
      } else {
        const cells = line.slice(1, -1).split('|').map((c) => c.trim());
        out.push('<tr>' + cells.map((c) => `<td style="border-bottom:1px solid rgba(255,255,255,0.05);padding:0.45rem 0.6rem;color:rgba(237,237,232,0.85);">${inlineFormat(c)}</td>`).join('') + '</tr>');
      }
    } else if (line.startsWith('- ') || line.match(/^\d+\.\s/)) {
      flushTable();
      if (!inList) {
        out.push('<ul style="margin:0.6rem 0 0.6rem 1.5rem;color:rgba(237,237,232,0.85);">');
        inList = true;
      }
      const itemText = line.startsWith('- ') ? line.slice(2) : line.replace(/^\d+\.\s/, '');
      out.push(`<li style="margin-bottom:0.25rem;">${inlineFormat(itemText)}</li>`);
    } else if (line.trim() === '') {
      flushList(); flushTable();
    } else {
      flushList(); flushTable();
      out.push(`<p style="margin:0.6rem 0;color:rgba(237,237,232,0.85);">${inlineFormat(line)}</p>`);
    }
  }
  flushList(); flushTable();
  return out.join('\n');
}
