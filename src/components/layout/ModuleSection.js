export default function ModuleSection({ title, meta, actions, children, className = '' }) {
  const classes = ['dashboard-section', className].filter(Boolean).join(' ');

  return (
    <section className={classes}>
      <div className="dashboard-section__head">
        <h2 className="dashboard-section__title">{title}</h2>
        {meta ? <span className="dashboard-section__meta">{meta}</span> : null}
        {actions ? <div className="dashboard-section__actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
