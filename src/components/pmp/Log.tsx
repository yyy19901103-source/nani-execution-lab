import { useEffect, useRef, useState } from 'react';
import { getDb } from './db';
import type { StudyLog, ExamLog } from '../../data/pmp/types';

// Chart.js を CDN から動的読込（既存ツール群と同じパターン・bundle size 抑制）
declare const Chart: any;

function loadChartJs(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).Chart) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-chartjs]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.async = true;
    s.dataset.chartjs = 'true';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Chart.js'));
    document.head.appendChild(s);
  });
}

export default function Log() {
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [exams, setExams] = useState<ExamLog[]>([]);
  const [loading, setLoading] = useState(true);
  const studyChartRef = useRef<HTMLCanvasElement>(null);
  const examChartRef = useRef<HTMLCanvasElement>(null);
  const domainChartRef = useRef<HTMLCanvasElement>(null);
  const chartsRef = useRef<any[]>([]);

  useEffect(() => {
    (async () => {
      const db = getDb();
      const ls = await db.studyLogs.orderBy('date').toArray();
      const es = await db.examLogs.orderBy('date').toArray();
      setLogs(ls.reverse());
      setExams(es.reverse());
      setLoading(false);

      try {
        await loadChartJs();
      } catch {
        return;
      }
      // 古いチャートを破棄
      chartsRef.current.forEach((c) => c.destroy?.());
      chartsRef.current = [];

      // === 学習時間推移 ===
      if (studyChartRef.current && ls.length > 0) {
        const last30 = ls.slice(-30);
        const ctx = studyChartRef.current.getContext('2d')!;
        const c = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: last30.map((l) => l.date.slice(5)),
            datasets: [
              {
                label: '学習分',
                data: last30.map((l) => l.studyMinutes),
                backgroundColor: 'rgba(200,169,110,0.6)',
                borderColor: '#c8a96e',
                borderWidth: 1,
                yAxisID: 'y',
              },
              {
                label: '正答率(%)',
                type: 'line',
                data: last30.map((l) => l.correctRate * 100),
                borderColor: '#6ec897',
                backgroundColor: 'rgba(110,200,151,0.1)',
                tension: 0.3,
                yAxisID: 'y1',
              },
            ],
          },
          options: chartOpts({
            y: { beginAtZero: true, title: { text: '学習時間(分)', display: true, color: '#c8a96e' } },
            y1: { position: 'right', beginAtZero: true, max: 100, title: { text: '正答率(%)', display: true, color: '#6ec897' }, grid: { display: false } },
          }),
        });
        chartsRef.current.push(c);
      }

      // === 模試スコア推移 ===
      if (examChartRef.current && es.length > 0) {
        const ctx = examChartRef.current.getContext('2d')!;
        const ordered = [...es].sort((a, b) => a.date.localeCompare(b.date));
        const c = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ordered.map((e) => e.date.slice(5)),
            datasets: [
              {
                label: '全体スコア(%)',
                data: ordered.map((e) => e.score * 100),
                borderColor: '#c8a96e',
                backgroundColor: 'rgba(200,169,110,0.1)',
                tension: 0.3,
                pointRadius: 5,
              },
              {
                label: '合格目安(70%)',
                data: ordered.map(() => 70),
                borderColor: 'rgba(232,110,110,0.5)',
                borderDash: [4, 4],
                pointRadius: 0,
              },
              {
                label: '余裕圏(80%)',
                data: ordered.map(() => 80),
                borderColor: 'rgba(110,200,151,0.5)',
                borderDash: [4, 4],
                pointRadius: 0,
              },
            ],
          },
          options: chartOpts({
            y: { min: 0, max: 100, title: { text: 'スコア(%)', display: true, color: '#c8a96e' } },
          }),
        });
        chartsRef.current.push(c);
      }

      // === ドメイン別模試成績 ===
      if (domainChartRef.current && es.length > 0) {
        const ctx = domainChartRef.current.getContext('2d')!;
        const ordered = [...es].sort((a, b) => a.date.localeCompare(b.date));
        const c = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ordered.map((e) => e.date.slice(5)),
            datasets: [
              {
                label: 'People',
                data: ordered.map((e) => e.domainScores.People * 100),
                borderColor: '#c8a96e',
                backgroundColor: 'transparent',
                tension: 0.3,
              },
              {
                label: 'Process',
                data: ordered.map((e) => e.domainScores.Process * 100),
                borderColor: '#6ec897',
                backgroundColor: 'transparent',
                tension: 0.3,
              },
              {
                label: 'Business Environment',
                data: ordered.map((e) => e.domainScores['Business Environment'] * 100),
                borderColor: '#9ecbe8',
                backgroundColor: 'transparent',
                tension: 0.3,
              },
            ],
          },
          options: chartOpts({
            y: { min: 0, max: 100, title: { text: 'ドメイン別スコア(%)', display: true, color: '#c8a96e' } },
          }),
        });
        chartsRef.current.push(c);
      }
    })();

    return () => {
      chartsRef.current.forEach((c) => c.destroy?.());
      chartsRef.current = [];
    };
  }, []);

  if (loading) return <div style={{ padding: '2rem', color: 'rgba(237,237,232,0.5)' }}>Loading...</div>;

  const totalMin = logs.reduce((s, l) => s + l.studyMinutes, 0);
  const totalQ = logs.reduce((s, l) => s + l.questionsAnswered, 0);
  const totalC = logs.reduce((s, l) => s + l.correctCount, 0);
  const avgRate = totalQ > 0 ? (totalC / totalQ) * 100 : 0;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
        <Stat label="学習日数" value={`${logs.length}日`} />
        <Stat label="累計時間" value={`${(totalMin / 60).toFixed(1)}h`} />
        <Stat label="累計演習数" value={`${totalQ}問`} />
        <Stat label="全体正答率" value={`${avgRate.toFixed(1)}%`} />
      </div>

      {/* グラフ群 */}
      {logs.length > 0 && (
        <ChartPanel title="STUDY TREND · 学習時間+正答率推移（直近30日）">
          <canvas ref={studyChartRef} height={120} />
        </ChartPanel>
      )}
      {exams.length > 0 && (
        <ChartPanel title="EXAM SCORE · 模試スコア推移">
          <canvas ref={examChartRef} height={120} />
        </ChartPanel>
      )}
      {exams.length > 0 && (
        <ChartPanel title="DOMAIN TREND · ドメイン別模試成績">
          <canvas ref={domainChartRef} height={120} />
        </ChartPanel>
      )}

      {/* 学習ログ表 */}
      <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <p style={{ color: '#c8a96e', fontSize: '0.62rem', letterSpacing: '0.35em', marginBottom: '1rem' }}>
          STUDY LOG · 学習ログ（直近30日）
        </p>
        {logs.length === 0 ? (
          <p style={{ color: 'rgba(237,237,232,0.5)', fontSize: '0.8rem' }}>まだ学習記録がありません。問題演習を開始してください。</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr>
                <th style={th}>日付</th>
                <th style={th}>学習時間</th>
                <th style={th}>演習数</th>
                <th style={th}>正答数</th>
                <th style={th}>正答率</th>
                <th style={th}>学習章数</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 30).map((l) => (
                <tr key={l.date}>
                  <td style={td}>{l.date}</td>
                  <td style={td}>{l.studyMinutes}分</td>
                  <td style={td}>{l.questionsAnswered}</td>
                  <td style={td}>{l.correctCount}</td>
                  <td style={td}>{(l.correctRate * 100).toFixed(1)}%</td>
                  <td style={td}>{l.chaptersStudied.length}章</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', padding: '1.25rem 1.5rem' }}>
        <p style={{ color: '#c8a96e', fontSize: '0.62rem', letterSpacing: '0.35em', marginBottom: '1rem' }}>
          EXAM LOG · 模試ログ
        </p>
        {exams.length === 0 ? (
          <p style={{ color: 'rgba(237,237,232,0.5)', fontSize: '0.8rem' }}>まだ模試の記録がありません。</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr>
                <th style={th}>日付</th>
                <th style={th}>種別</th>
                <th style={th}>スコア</th>
                <th style={th}>People</th>
                <th style={th}>Process</th>
                <th style={th}>Business</th>
                <th style={th}>所要時間</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => (
                <tr key={e.id}>
                  <td style={td}>{e.date}</td>
                  <td style={td}>{e.type === 'full' ? 'フル' : '短縮'}</td>
                  <td style={{ ...td, color: e.score >= 0.8 ? '#6ec897' : e.score >= 0.7 ? '#c8a96e' : '#e86e6e' }}>
                    {(e.score * 100).toFixed(1)}%
                  </td>
                  <td style={td}>{(e.domainScores.People * 100).toFixed(0)}%</td>
                  <td style={td}>{(e.domainScores.Process * 100).toFixed(0)}%</td>
                  <td style={td}>{(e.domainScores['Business Environment'] * 100).toFixed(0)}%</td>
                  <td style={td}>{e.durationMinutes}分</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
      <p style={{ color: '#c8a96e', fontSize: '0.62rem', letterSpacing: '0.35em', marginBottom: '1rem' }}>{title}</p>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}

function chartOpts(scales: any): any {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: 'rgba(237,237,232,0.8)', font: { size: 11 } } },
      tooltip: { backgroundColor: '#0a0a0c', borderColor: '#c8a96e', borderWidth: 1 },
    },
    scales: Object.fromEntries(
      Object.entries(scales).map(([k, v]: any) => [
        k,
        {
          ticks: { color: 'rgba(237,237,232,0.5)', font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.05)', ...(v.grid ?? {}) },
          ...v,
        },
      ]),
    ),
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#0f0f12', border: '1px solid rgba(200,169,110,0.15)', padding: '1rem 1.2rem' }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.62rem', letterSpacing: '0.25em', marginBottom: '0.4rem' }}>{label}</div>
      <div style={{ color: '#c8a96e', fontSize: '1.4rem', fontWeight: 300 }}>{value}</div>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  color: 'rgba(255,255,255,0.4)',
  fontSize: '0.65rem',
  letterSpacing: '0.1em',
  padding: '0.5rem 0.6rem',
  borderBottom: '1px solid rgba(255,255,255,0.07)',
  fontWeight: 400,
};

const td: React.CSSProperties = {
  padding: '0.55rem 0.6rem',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  color: 'rgba(237,237,232,0.85)',
};
