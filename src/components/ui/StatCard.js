export default function StatCard({
  label,
  value,
  icon: Icon,
  iconTone = 'brand',
  onClick,
  className = '',
}) {
  const clickable = Boolean(onClick);
  const tones = {
    brand: 'stat-card__icon--brand',
    success: 'stat-card__icon--success',
    danger: 'stat-card__icon--danger',
    warning: 'stat-card__icon--warning',
  };

  const Wrapper = clickable ? 'button' : 'div';
  const wrapperProps = clickable
    ? { type: 'button', onClick, className: `stat-card glass-panel stat-card--clickable ${className}`.trim() }
    : { className: `stat-card glass-panel ${className}`.trim() };

  return (
    <Wrapper {...wrapperProps}>
      {Icon && (
        <div className={`stat-card__icon ${tones[iconTone] || tones.brand}`}>
          <Icon size={18} />
        </div>
      )}
      <div className="stat-card__body">
        {label && <p className="stat-card__label">{label}</p>}
        <p className="stat-card__value data-money">{value}</p>
      </div>
    </Wrapper>
  );
}
