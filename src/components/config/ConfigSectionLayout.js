'use client';

/**
 * Mismo patrón visual que Apariencia: columna principal + dock contextual.
 */
export default function ConfigSectionLayout({ children, aside, asideTitle = 'Vista previa', asideLabel }) {
  return (
    <div className="config-section-split">
      <div className="config-section-split__main">{children}</div>
      {aside ? (
        <aside className="config-section-split__dock" aria-label={asideLabel || asideTitle}>
          <div className="config-dock">
            <p className="config-dock__label">{asideTitle}</p>
            {aside}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
