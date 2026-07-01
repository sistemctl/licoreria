export default function StatusPill({ status = 'closed', label, className = '' }) {
  const isOpen = status === 'open' || status === 'abierta';
  return (
    <span className={`status-pill ${isOpen ? 'status-pill--open' : 'status-pill--closed'} ${className}`.trim()}>
      <span className={`status-dot ${isOpen ? 'status-dot--live' : 'status-dot--off'}`} />
      <span>{label || (isOpen ? 'Caja abierta' : 'Caja cerrada')}</span>
    </span>
  );
}
