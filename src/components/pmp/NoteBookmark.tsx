import { useEffect, useState } from 'react';
import { savePersonalNote, getPersonalNote, toggleBookmark, isBookmarked } from './db';

interface Props {
  refType: 'chapter' | 'question' | 'case' | 'term';
  refId: string;
  title: string;
}

/**
 * 章・問題・ケース・用語に対する個人ノート + ブックマーク UI
 * 学習中のメモを残せる。データは IndexedDB に保存（端末ローカル）。
 */
export default function NoteBookmark({ refType, refId, title }: Props) {
  const [note, setNote] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkReason, setBookmarkReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string>('');
  const [showBookmarkInput, setShowBookmarkInput] = useState(false);

  useEffect(() => {
    (async () => {
      const n = await getPersonalNote(refType, refId);
      setNote(n);
      const b = await isBookmarked(refType, refId);
      setBookmarked(b);
    })();
  }, [refType, refId]);

  async function handleSave() {
    setSaving(true);
    await savePersonalNote(refType, refId, note);
    setSavedAt(new Date().toLocaleTimeString());
    setSaving(false);
  }

  async function handleBookmark() {
    if (!bookmarked && !showBookmarkInput) {
      setShowBookmarkInput(true);
      return;
    }
    const newState = await toggleBookmark(refType, refId, title, bookmarkReason);
    setBookmarked(newState);
    setShowBookmarkInput(false);
    setBookmarkReason('');
  }

  return (
    <div style={{ background: '#0a0a0c', border: '1px solid rgba(110,200,151,0.2)', padding: '1rem 1.25rem', marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <p style={{ color: '#6ec897', fontSize: '0.62rem', letterSpacing: '0.25em', margin: 0, flex: 1 }}>
          📝 PERSONAL NOTE · あなたのメモ
        </p>
        <button
          onClick={handleBookmark}
          style={{
            background: bookmarked ? 'rgba(200,169,110,0.15)' : 'transparent',
            border: `1px solid ${bookmarked ? '#c8a96e' : 'rgba(255,255,255,0.2)'}`,
            color: bookmarked ? '#c8a96e' : 'rgba(237,237,232,0.7)',
            padding: '0.3rem 0.7rem',
            fontSize: '0.7rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
          title="ブックマーク"
        >
          {bookmarked ? '⭐ ブックマーク中' : '☆ ブックマーク'}
        </button>
      </div>

      {showBookmarkInput && !bookmarked && (
        <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={bookmarkReason}
            onChange={(e) => setBookmarkReason(e.target.value)}
            placeholder="なぜブックマーク？（任意）"
            style={{ background: '#0a0a0c', color: '#edede8', border: '1px solid rgba(255,255,255,0.15)', padding: '0.35rem 0.6rem', fontSize: '0.75rem', fontFamily: 'inherit', flex: 1 }}
          />
          <button onClick={handleBookmark} style={{ background: '#c8a96e', color: '#0c0c0e', border: 'none', padding: '0.35rem 0.9rem', fontSize: '0.75rem', fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600 }}>追加</button>
        </div>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        placeholder="学習中の気付き・参考書のページ番号・自分の理解を残せます。データはあなたのブラウザに保存されます。"
        style={{
          background: '#0f0f12',
          color: '#edede8',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '0.6rem 0.8rem',
          fontSize: '0.82rem',
          fontFamily: 'inherit',
          width: '100%',
          outline: 'none',
          resize: 'vertical',
          lineHeight: 1.7,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <span style={{ color: 'rgba(237,237,232,0.4)', fontSize: '0.68rem' }}>
          {savedAt ? `✓ ${savedAt} に保存` : `${note.length} 文字`}
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving ? 'rgba(110,200,151,0.3)' : '#6ec897',
            color: '#0c0c0e',
            border: 'none',
            padding: '0.4rem 1rem',
            fontSize: '0.75rem',
            fontFamily: 'inherit',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            letterSpacing: '0.05em',
          }}
        >
          {saving ? '保存中...' : 'メモを保存'}
        </button>
      </div>
    </div>
  );
}
