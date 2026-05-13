import { useEffect, useState } from 'react';
import { usePmpStore, daysUntilExam, todayTargetMinutes, evaluateAchievements } from './store';
import { getDb, getSettings } from './db';
import { generateRecommendations, type Recommendation } from './curriculum';
import questionsData from '../../data/pmp/questions.json';
import chaptersData from '../../data/pmp/chapters.json';
import type { Question, Chapter } from '../../data/pmp/types';

export default function Dashboard({ base }: { base: string }) {
  const store = usePmpStore();
  const [loading, setLoading] = useState(true);
  const [examDateInput, setExamDateInput] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    (async () => {
      store.setQuestions(questionsData.questions as Question[]);
      store.setChapters(chaptersData.chapters as Chapter[]);

      const settings = await getSettings();
      store.setSettings(settings);
      setExamDateInput(settings.examDate ?? '');

      const db = getDb();
      const logs = await db.studyLogs.toArray();
      const exams = await db.examLogs.orderBy('date').reverse().toArray();
      const states = await db.questionStates.toArray();

      const totalMin = logs.reduce((s, l) => s + l.studyMinutes, 0);
      const totalAns = logs.reduce((s, l) => s + l.questionsAnswered, 0);
      const totalCor = logs.reduce((s, l) => s + l.correctCount, 0);

      store.setStats({
        totalQuestionsAnswered: totalAns,
        totalCorrect: totalCor,
        totalStudyMinutes: totalMin,
        studyDays: logs.length,
        recentLogs: logs.slice(-30),
        recentExams: exams.slice(0, 10),
      });

      // カリキュラム推奨
      const completedChapters: string[] = JSON.parse(localStorage.getItem('pmp-completed-chapters') || '[]');
      const recs = generateRecommendations({
        questions: questionsData.questions as Question[],
        chapters: chaptersData.chapters as Chapter[],
        states,
        completedChapters,
        logs,
        exams,
        base,
      });
      setRecommendations(recs);

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div style={{ color: 'rgba(237,237,232,0.5)', padding: '2rem', textAlign: 'center' }}>
        Loading dashboard...
      </div>
    );
  }

  const daysLeft = daysUntilExam(store.settings.examDate);
  const todayMin = todayTargetMinutes(
    store.settings.examDate,
    store.settings.totalTargetHours,
    store.totalStudyMinutes,
  );
  const achievements = evaluateAchievements(store);
  const achievedCount = achievements.filter((a) => a.achieved).length;

  if (!store.settings.examDate) {
    return (
      <div style={{ maxWidth: 600, margin: '3rem auto', padding: '0 1rem' }}>
        <div style={{ background: '#111114', border: '1px solid rgba(200,169,110,0.2)', padding: '2rem 2.5rem' }}>
          <p style={{ color: '#c8a96e', fontSize: '0.65rem', letterSpacing: '0.35em', marginBottom: '1rem' }}>
            STEP 1 · WELCOME
          </p>
          <h2 style={{ color: '#edede8', fontSize: '1.4rem', fontWeight: 200, marginBottom: '0.75rem', letterSpacing: '0.1em' }}>
            試験日を設定してください
          </h2>
          <p style={{ color: 'rgba(237,237,232,0.6)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            試験日から逆算した90日プランで学習を組み立てます。試験日は後で変更できます。
          </p>
          <input
            type="date"
            value={examDateInput}
            onChange={(e) => setExamDateInput(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            style={{
              background: '#0a0a0c',
              color: '#edede8',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '0.7rem 1rem',
              fontSize: '1rem',
              fontFamily: 'inherit',
              width: '100%',
              marginBottom: '1.25rem',
            }}
          />
          <button
            onClick={async () => {
              if (!examDateInput) return;
              const today = new Date().toISOString().slice(0, 10);
              const next = { ...store.settings, examDate: examDateInput, startDate: today };
              const { saveSettings } = await import('./db');
              await saveSettings(next);
              store.setSettings(next);
            }}
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
            }}
          >
            学習開始 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      {/* KPIカード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <KpiCard label="試験まで" value={daysLeft !== null ? `${daysLeft}日` : '—'} accent="#c8a96e" />
        <KpiCard label="本日の目標学習" value={`${todayMin}分`} accent="#6ec897" />
        <KpiCard label="累計学習時間" value={`${(store.totalStudyMinutes / 60).toFixed(1)}h`} sub={`目標 ${store.settings.totalTargetHours}h`} />
        <KpiCard label="達成条件充足" value={`${achievedCount} / ${achievements.length}`} sub="14.2 達成条件" accent={achievedCount >= achievements.length - 1 ? '#6ec897' : '#c8a96e'} />
      </div>

      {/* 推奨アクション（カリキュラム engine） */}
      {recommendations.length > 0 && (
        <div style={{ background: '#111114', border: '1px solid rgba(110,200,151,0.25)', padding: '1.5rem 1.75rem', marginBottom: '1.5rem' }}>
          <p style={{ color: '#6ec897', fontSize: '0.62rem', letterSpacing: '0.35em', marginBottom: '1rem' }}>
            🎯 NEXT ACTIONS · 今やるべきこと（個別カリキュラム）
          </p>
          {recommendations.map((r, i) => (
            <a
              key={i}
              href={r.actionUrl}
              style={{
                display: 'flex',
                gap: '1rem',
                padding: '0.85rem 1rem',
                borderRadius: 0,
                background: '#0a0a0c',
                border: `1px solid ${r.priority === 1 ? 'rgba(232,110,110,0.3)' : r.priority === 2 ? 'rgba(200,169,110,0.25)' : 'rgba(255,255,255,0.1)'}`,
                marginBottom: '0.5rem',
                textDecoration: 'none',
                transition: 'transform 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(4px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
            >
              <span style={{ color: r.priority === 1 ? '#e86e6e' : r.priority === 2 ? '#c8a96e' : 'rgba(237,237,232,0.5)', fontSize: '0.65rem', letterSpacing: '0.1em', minWidth: 30, paddingTop: 2 }}>
                P{r.priority}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#edede8', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>{r.title}</div>
                <div style={{ color: 'rgba(237,237,232,0.6)', fontSize: '0.72rem', lineHeight: 1.6 }}>{r.reason}</div>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>→</span>
            </a>
          ))}
        </div>
      )}

      {/* 達成条件 */}
      <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem 1.75rem', marginBottom: '1.5rem' }}>
        <p style={{ color: '#c8a96e', fontSize: '0.62rem', letterSpacing: '0.35em', marginBottom: '1rem' }}>
          ACHIEVEMENT CRITERIA · 達成条件
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
          {achievements.map((a) => (
            <AchievementBar key={a.label} {...a} />
          ))}
        </div>
      </div>

      {/* ナビカード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <NavCard href={`${base}/ai-tools/pmp-study/quiz`} icon="📝" label="問題演習" desc={`${store.questions.length}問プール`} />
        <NavCard href={`${base}/ai-tools/pmp-study/study`} icon="📚" label="体系学習" desc={`${store.chapters.length}章（要検証）`} />
        <NavCard href={`${base}/ai-tools/pmp-study/exam`} icon="🎯" label="模試モード" desc="180問 / 230分" />
        <NavCard href={`${base}/ai-tools/pmp-study/mindset`} icon="🧭" label="PMBOK 7 原則" desc="12公式+Mindset 8" highlight />
        <NavCard href={`${base}/ai-tools/pmp-study/audit`} icon="🔍" label="監査レポート" desc="公開資料照合済" />
        <NavCard href={`${base}/ai-tools/pmp-study/glossary`} icon="📖" label="用語集" desc="120語（要検証）" />
        <NavCard href={`${base}/ai-tools/pmp-study/cases`} icon="🎭" label="ケーススタディ" desc="10シナリオ" />
        <NavCard href={`${base}/ai-tools/pmp-study/search`} icon="🔎" label="横断検索" desc="全コンテンツ" />
        <NavCard href={`${base}/ai-tools/pmp-study/bookmarks`} icon="⭐" label="ブックマーク" desc="個人メモ一覧" />
        <NavCard href={`${base}/ai-tools/pmp-study/log`} icon="📊" label="学習ログ" desc={`${store.studyDays}日記録`} />
        <NavCard href={`${base}/ai-tools/pmp-study/settings`} icon="⚙️" label="設定" desc="エクスポート" />
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, accent = '#c8a96e' }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: '#0f0f12', border: `1px solid ${accent}33`, padding: '1.1rem 1.3rem' }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.62rem', letterSpacing: '0.25em', marginBottom: '0.4rem' }}>
        {label}
      </div>
      <div style={{ color: accent, fontSize: '1.55rem', fontWeight: 300, letterSpacing: '0.05em' }}>
        {value}
      </div>
      {sub && <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', marginTop: '0.25rem' }}>{sub}</div>}
    </div>
  );
}

function AchievementBar({ label, current, target, unit, achieved }: { label: string; current: number; target: number; unit: string; achieved: boolean }) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
        <span style={{ color: achieved ? '#6ec897' : 'rgba(237,237,232,0.7)' }}>
          {achieved ? '✓' : '·'} {label}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem' }}>
          {current} / {target} {unit}
        </span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: achieved ? '#6ec897' : '#c8a96e', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function NavCard({ href, icon, label, desc, highlight }: { href: string; icon: string; label: string; desc: string; highlight?: boolean }) {
  return (
    <a
      href={href}
      style={{
        background: highlight ? 'rgba(200,169,110,0.06)' : '#0f0f12',
        border: highlight ? '1px solid rgba(200,169,110,0.35)' : '1px solid rgba(255,255,255,0.07)',
        padding: '1rem 1.2rem',
        textDecoration: 'none',
        transition: 'border-color 0.15s',
        display: 'block',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#c8a96e')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = highlight ? 'rgba(200,169,110,0.35)' : 'rgba(255,255,255,0.07)')}
    >
      <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>{icon}</div>
      <div style={{ color: '#edede8', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem' }}>{desc}</div>
    </a>
  );
}
