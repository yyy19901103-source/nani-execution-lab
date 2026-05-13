import { useEffect, useState } from 'react';

type ToastKind = 'success' | 'error' | 'info' | 'warn';

interface ToastItem {
  id: number;
  kind: ToastKind;
  msg: string;
}

// グローバルストア（モジュールスコープでシンプルに）
let listeners: ((items: ToastItem[]) => void)[] = [];
let items: ToastItem[] = [];
let nextId = 1;

export function showToast(msg: string, kind: ToastKind = 'success', durationMs = 2400): void {
  if (typeof window === 'undefined') return;
  const id = nextId++;
  items = [...items, { id, kind, msg }];
  listeners.forEach((fn) => fn(items));
  window.setTimeout(() => {
    items = items.filter((i) => i.id !== id);
    listeners.forEach((fn) => fn(items));
  }, durationMs);
}

export function ToastContainer() {
  const [list, setList] = useState<ToastItem[]>([]);
  useEffect(() => {
    const fn = (items: ToastItem[]) => setList([...items]);
    listeners.push(fn);
    return () => { listeners = listeners.filter((l) => l !== fn); };
  }, []);
  if (list.length === 0) return null;
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '90vw' }}>
      {list.map((t) => (
        <div
          key={t.id}
          style={{
            background: COLORS[t.kind].bg,
            border: `1px solid ${COLORS[t.kind].fg}`,
            color: COLORS[t.kind].fg,
            padding: '0.75rem 1.1rem',
            fontSize: '0.82rem',
            fontFamily: 'inherit',
            minWidth: 200,
            animation: 'pmp-toast-in 0.18s ease-out',
          }}
        >
          {ICONS[t.kind]} {t.msg}
        </div>
      ))}
      <style>{`@keyframes pmp-toast-in { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}

const COLORS: Record<ToastKind, { bg: string; fg: string }> = {
  success: { bg: 'rgba(110,200,151,0.15)', fg: '#6ec897' },
  error: { bg: 'rgba(232,110,110,0.15)', fg: '#e86e6e' },
  info: { bg: 'rgba(158,203,232,0.15)', fg: '#9ecbe8' },
  warn: { bg: 'rgba(232,180,110,0.15)', fg: '#e8b46e' },
};

const ICONS: Record<ToastKind, string> = {
  success: '✓',
  error: '✗',
  info: 'ℹ',
  warn: '⚠',
};
