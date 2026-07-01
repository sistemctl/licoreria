import LoadingState from '@/components/ui/LoadingState';

export default function ModulePanel({
  loading = false,
  loadingMessage = 'Cargando...',
  children,
  className = '',
}) {
  const classes = ['glass-panel', 'dashboard-page__panel', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {loading ? <LoadingState message={loadingMessage} /> : children}
    </div>
  );
}
