export default function PageHeader({ title, subtitle, actions, className = '' }) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div>
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="action-bar">{actions}</div>}
    </header>
  );
}
