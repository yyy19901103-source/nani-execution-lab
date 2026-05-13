interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="breadcrumb" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', fontSize: '0.72rem', padding: '0.5rem 0' }}>
      {items.map((c, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {c.href ? (
            <a href={c.href} style={{ color: 'rgba(237,237,232,0.6)', textDecoration: 'none', letterSpacing: '0.05em' }}>
              {c.label}
            </a>
          ) : (
            <span style={{ color: '#c8a96e', letterSpacing: '0.05em' }}>{c.label}</span>
          )}
          {i < items.length - 1 && <span style={{ color: 'rgba(255,255,255,0.25)' }}>/</span>}
        </span>
      ))}
    </nav>
  );
}
