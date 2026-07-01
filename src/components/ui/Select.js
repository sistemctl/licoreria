export default function Select({
  label,
  id,
  className = '',
  children,
  error,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`ui-field ${className}`.trim()}>
      {label && (
        <label htmlFor={selectId} className="label-field ui-label">
          {label}
        </label>
      )}
      <select id={selectId} className={`input-field ui-select ${error ? 'ui-input--error' : ''}`} {...props}>
        {children}
      </select>
      {error && <span className="ui-error">{error}</span>}
      <style jsx>{`
        .ui-field { display: flex; flex-direction: column; gap: 4px; width: 100%; }
        .ui-error { font-size: var(--text-xs); color: var(--color-danger); }
      `}</style>
    </div>
  );
}
