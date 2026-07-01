export default function LoadingState({ message = 'Cargando...' }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="ui-spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
