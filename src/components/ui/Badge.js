export default function Badge({ variant = 'brand', className = '', children }) {
  return (
    <span className={`badge badge-${variant} ui-badge ui-badge--${variant} ${className}`.trim()}>
      {children}
    </span>
  );
}
