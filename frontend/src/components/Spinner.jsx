export default function Spinner({ size = 'md', white = false, className = '' }) {
  const sizes = { sm: 'spinner-sm', md: 'spinner-md', lg: 'spinner-lg' };
  return (
    <div
      className={`spinner ${sizes[size]} ${white ? 'spinner-white' : ''} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageSpinner() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size="lg" />
    </div>
  );
}
