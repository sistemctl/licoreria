import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Sin registros',
  description = 'No hay datos para mostrar en este momento.',
  action,
  className = '',
}) {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <Icon size={40} strokeWidth={1.25} style={{ opacity: 0.35 }} />
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__desc">{description}</p>
      {action}
    </div>
  );
}
