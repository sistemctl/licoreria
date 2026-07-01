export default function Input({
  label,
  id,
  className = '',
  hint,
  error,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`ui-field ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="label-field ui-label">
          {label}
        </label>
      )}
      <input id={inputId} className={`input-field ui-input ${error ? 'ui-input--error' : ''}`} {...props} />
      {hint && !error && <span className="ui-hint">{hint}</span>}
      {error && <span className="ui-error">{error}</span>}
      <style jsx>{`
        .ui-field { display: flex; flex-direction: column; gap: 4px; width: 100%; }
        .ui-hint { font-size: var(--text-xs); color: var(--color-muted); }
        .ui-error { font-size: var(--text-xs); color: var(--color-danger); }
        :global(.ui-input--error) { border-color: var(--color-danger) !important; }
      `}</style>
    </div>
  );
}
