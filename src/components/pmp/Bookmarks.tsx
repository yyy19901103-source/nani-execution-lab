import { useEffect, useState } from 'react';
import { getAllBookmarks, toggleBookmark, getAllNotes, type Bookmark, type PersonalNote } from './db';
import chaptersData from '../../data/pmp/chapters.json';

const URL_PREFIX: Record<Bookmark['refType'], (base: string, id: string) => string> = {
  chapter: (b, id) => `${b}/ai-tools/pmp-study/study/${id}`,
  question: (b) => `${b}/ai-tools/pmp-study/quiz`,
  case: (b) => `${b}/ai-tools/pmp-study/cases`,
  term: (b) => `${b}/ai-tools/pmp-study/glossary`,
};

const TYPE_LABEL: Record<Bookmark['refType'], string> = {
  chapter: '章',
  question: '問題',
  case: 'ケース',
  term: '用語',
};

export default function Bookmarks({ base }: { base: string }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [tab, setTab] = useState<'bookmarks' | 'notes'>('bookmarks');

  useEffect(() => {
    (async () => {
      setBookmarks(await getAllBookmarks());
      setNotes(await getAllNotes());
    })();
  }, []);

  async function removeBookmark(b: Bookmark) {
    await toggleBookmark(b.refType, b.refId, b.title, b.reason);
    setBookmarks(await getAllBookmarks());
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <TabBtn active={tab === 'bookmarks'} onClick={() => setTab('bookmarks')}>
          ⭐ ブックマーク ({bookmarks.length})
        </TabBtn>
        <TabBtn active={tab === 'notes'} onClick={() => setTab('notes')}>
          📝 個人メモ ({notes.length})
        </TabBtn>
      </div>

      {tab === 'bookmarks' && (
        <>
          {bookmarks.length === 0 ? (
            <Empty msg="ブックマークなし。章・問題・ケース・用語ページで☆ボタンを押すと追加されます。" />
          ) : (
            bookmarks.map((b) => (
              <div key={b.key} style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', padding: '1rem 1.25rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(200,169,110,0.1)', color: '#c8a96e', padding: '0.15rem 0.5rem', fontSize: '0.62rem' }}>
                    {TYPE_LABEL[b.refType]}
                  </span>
                  <a href={URL_PREFIX[b.refType](base, b.refId)} style={{ color: '#edede8', fontSize: '0.85rem', textDecoration: 'none', flex: 1 }}>
                    {b.title} →
                  </a>
                  <button onClick={() => removeBookmark(b)} style={{ background: 'transparent', border: '1px solid rgba(232,110,110,0.3)', color: '#e86e6e', padding: '0.2rem 0.55rem', fontSize: '0.68rem', fontFamily: 'inherit', cursor: 'pointer' }}>
                    削除
                  </button>
                </div>
                {b.reason && <p style={{ color: 'rgba(237,237,232,0.65)', fontSize: '0.75rem', margin: '0.3rem 0 0 0' }}>💭 {b.reason}</p>}
                <p style={{ color: 'rgba(237,237,232,0.35)', fontSize: '0.65rem', margin: '0.3rem 0 0 0' }}>
                  {new Date(b.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </>
      )}

      {tab === 'notes' && (
        <>
          {notes.length === 0 ? (
            <Empty msg="個人メモなし。章・問題・ケース・用語ページでメモ欄に記入できます。" />
          ) : (
            notes.map((n) => (
              <div key={n.key} style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', padding: '1rem 1.25rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                  <span style={{ background: 'rgba(110,200,151,0.1)', color: '#6ec897', padding: '0.15rem 0.5rem', fontSize: '0.62rem' }}>
                    {TYPE_LABEL[n.refType]}
                  </span>
                  <a href={URL_PREFIX[n.refType](base, n.refId)} style={{ color: '#edede8', fontSize: '0.85rem', textDecoration: 'none', flex: 1 }}>
                    {n.refId} →
                  </a>
                </div>
                <p style={{ color: 'rgba(237,237,232,0.85)', fontSize: '0.8rem', lineHeight: 1.7, margin: '0.4rem 0', whiteSpace: 'pre-wrap' }}>{n.note}</p>
                <p style={{ color: 'rgba(237,237,232,0.35)', fontSize: '0.65rem', margin: 0 }}>
                  最終更新: {new Date(n.updatedAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(200,169,110,0.15)' : '#0a0a0c',
        border: `1px solid ${active ? '#c8a96e' : 'rgba(255,255,255,0.1)'}`,
        color: active ? '#c8a96e' : 'rgba(237,237,232,0.7)',
        padding: '0.5rem 1.1rem',
        fontSize: '0.82rem',
        fontFamily: 'inherit',
        cursor: 'pointer',
        letterSpacing: '0.05em',
      }}
    >
      {children}
    </button>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div style={{ color: 'rgba(237,237,232,0.5)', textAlign: 'center', padding: '2.5rem 1rem', fontSize: '0.85rem' }}>{msg}</div>;
}
