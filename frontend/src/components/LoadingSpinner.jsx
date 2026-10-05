// LoadingSpinner.jsx
export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const s = size === 'sm' ? '16px' : size === 'lg' ? '40px' : '24px';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </svg>
      {text && <span style={{ fontSize: '0.875rem' }}>{text}</span>}
    </div>
  );
}
