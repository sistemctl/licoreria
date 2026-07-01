export default function ActionBar({ children, className = '' }) {
  return <div className={`action-bar ${className}`.trim()}>{children}</div>;
}
