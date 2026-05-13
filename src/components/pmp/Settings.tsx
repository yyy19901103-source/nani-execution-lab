import { useEffect, useState } from 'react';
import { getSettings, saveSettings, exportAll, importAll, getDb } from './db';
import type { UserSettings } from '../../data/pmp/types';

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSettings(s);
    })();
  }, []);

  if (!settings) return <div style={{ padding: '2rem', color: 'rgba(237,237,232,0.5)' }}>Loading...</div>;

  async function save(next: UserSettings) {
    await saveSettings(next);
    setSettings(next);
    setStatus('✓ 保存しました');
    setTimeout(() => setStatus(''), 2000);
  }

  async function handleExport() {
    const json = await exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pmp-study-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('✓ エクスポート完了');
    setTimeout(() => setStatus(''), 2000);
  }

  async function handleImport(file: File) {
    const text = await file.text();
    if (!confirm('現在のデータは全て上書きされます。続行しますか？')) return;
    try {
      await importAll(text);
      const s = await getSettings();
      setSettings(s);
      setStatus('✓ インポート完了');
      setTimeout(() => setStatus(''), 2000);
    } catch (e) {
      alert('インポート失敗: ' + (e as Error).message);
    }
  }

  async function handleReset() {
    if (!confirm('全データを削除します。この操作は取り消せません。続行しますか？')) return;
    if (!confirm('本当によろしいですか？')) return;
    const db = getDb();
    await Promise.all([
      db.questionStates.clear(),
      db.chapterStates.clear(),
      db.studyLogs.clear(),
      db.examLogs.clear(),
      db.settings.clear(),
    ]);
    localStorage.removeItem('pmp-completed-chapters');
    location.reload();
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <Section title="試験日と目標">
        <FieldRow label="試験予定日">
          <input
            type="date"
            value={settings.examDate ?? ''}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => save({ ...settings, examDate: e.target.value || null })}
            style={input}
          />
        </FieldRow>
        <FieldRow label="1日の目標学習時間（分）">
          <input
            type="number"
            min={30}
            max={480}
            value={settings.dailyTargetMinutes}
            onChange={(e) => save({ ...settings, dailyTargetMinutes: Number(e.target.value) })}
            style={input}
          />
        </FieldRow>
        <FieldRow label="総学習時間目標（時間）">
          <input
            type="number"
            min={50}
            max={500}
            value={settings.totalTargetHours}
            onChange={(e) => save({ ...settings, totalTargetHours: Number(e.target.value) })}
            style={input}
          />
        </FieldRow>
        <FieldRow label="問題演習総数目標">
          <input
            type="number"
            min={100}
            max={10000}
            value={settings.totalTargetQuestions}
            onChange={(e) => save({ ...settings, totalTargetQuestions: Number(e.target.value) })}
            style={input}
          />
        </FieldRow>
        <FieldRow label="学習継続日数目標">
          <input
            type="number"
            min={30}
            max={365}
            value={settings.totalTargetDays}
            onChange={(e) => save({ ...settings, totalTargetDays: Number(e.target.value) })}
            style={input}
          />
        </FieldRow>
      </Section>

      <Section title="データ管理">
        <p style={{ color: 'rgba(237,237,232,0.55)', fontSize: '0.78rem', lineHeight: 1.7, marginBottom: '1rem' }}>
          全データはあなたのブラウザの IndexedDB に保存されます。別端末への移行・バックアップには JSON エクスポートを使用してください。
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button onClick={handleExport} style={btnGhost}>📥 全データをJSONでエクスポート</button>
          <label style={{ ...btnGhost, cursor: 'pointer' }}>
            📤 JSONをインポート
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
              }}
            />
          </label>
          <button onClick={handleReset} style={{ ...btnGhost, borderColor: 'rgba(232,110,110,0.3)', color: '#e86e6e' }}>
            🗑 全データリセット
          </button>
        </div>
      </Section>

      {status && (
        <div style={{ background: 'rgba(110,200,151,0.1)', border: '1px solid rgba(110,200,151,0.3)', color: '#6ec897', padding: '0.6rem 1rem', fontSize: '0.78rem', marginBottom: '1rem' }}>
          {status}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem 1.75rem', marginBottom: '1.25rem' }}>
      <p style={{ color: '#c8a96e', fontSize: '0.62rem', letterSpacing: '0.35em', marginBottom: '1.25rem' }}>
        {title.toUpperCase()}
      </p>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1rem', alignItems: 'center', marginBottom: '0.85rem' }}>
      <label style={{ color: 'rgba(237,237,232,0.75)', fontSize: '0.82rem' }}>{label}</label>
      {children}
    </div>
  );
}

const input: React.CSSProperties = {
  background: '#0a0a0c',
  color: '#edede8',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: '0.45rem 0.6rem',
  fontSize: '0.85rem',
  fontFamily: 'inherit',
  outline: 'none',
};

const btnGhost: React.CSSProperties = {
  background: '#0a0a0c',
  color: '#edede8',
  border: '1px solid rgba(255,255,255,0.15)',
  padding: '0.5rem 1.1rem',
  fontSize: '0.78rem',
  fontFamily: 'inherit',
  cursor: 'pointer',
  letterSpacing: '0.05em',
  display: 'inline-block',
};
