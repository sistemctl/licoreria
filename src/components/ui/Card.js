export default function Card({
  children,
  className = '',
  interactive = false,
  padding = true,
  ...props
}) {
  const classes = [
    'glass-panel',
    interactive ? 'ui-panel--interactive' : '',
    !padding ? 'ui-panel--flat' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
      <style jsx>{`
        .ui-panel--flat {
          padding: 0 !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
