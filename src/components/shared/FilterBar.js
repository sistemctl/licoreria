export default function FilterBar({ children, onClear, clearLabel = 'Limpiar filtros', className = '' }) {
  const classes = ['filter-bar', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
      {onClear ? (
        <div className="filter-bar__actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
            {clearLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
