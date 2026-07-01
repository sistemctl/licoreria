import Header from '@/components/Header';

export default function DashboardModule({ title, children, className = '' }) {
  const classes = ['dashboard-page', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <Header title={title} />
      <div className="dashboard-page__body">{children}</div>
    </div>
  );
}
