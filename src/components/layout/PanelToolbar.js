export default function PanelToolbar({ filters, actions, split }) {
  const isSplit = split ?? Boolean(filters);

  return (
    <div className={`panel-header-row${isSplit ? ' panel-header-row--split' : ''}`}>
      {filters}
      {actions ? <div className="panel-header-row__actions">{actions}</div> : null}
    </div>
  );
}
