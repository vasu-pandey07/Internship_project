const LoadingSpinner = ({ text = 'Loading...' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
    gap: 'var(--space-4)',
  }}>
    <div style={{
      width: 40,
      height: 40,
      border: '3px solid var(--border-default)',
      borderTop: '3px solid var(--primary)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
    <span style={{
      fontSize: '0.82rem',
      color: 'var(--text-tertiary)',
      fontWeight: 500,
    }}>{text}</span>
  </div>
);

/** Skeleton card placeholder for loading states */
export const SkeletonCard = () => (
  <div className="skeleton skeleton-card" style={{ height: '320px' }} />
);

/** Skeleton row for list items */
export const SkeletonRow = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
    <div className="skeleton" style={{ width: 80, height: 56, borderRadius: 'var(--radius-md)' }} />
    <div style={{ flex: 1 }}>
      <div className="skeleton skeleton-text lg" style={{ width: '60%' }} />
      <div className="skeleton skeleton-text" style={{ width: '40%' }} />
    </div>
  </div>
);

export default LoadingSpinner;
