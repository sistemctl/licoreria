'use client';

import { VISUAL_PRESETS } from '@/lib/theme';
import ColorPaletteEditor from './ColorPaletteEditor';

const BUTTON_STYLES = [
  { id: 'solid', label: 'Sólido', desc: 'Relleno completo. Máxima visibilidad en acciones principales.' },
  { id: 'soft', label: 'Suave', desc: 'Fondo tenue con texto de color. Menos peso visual.' },
  { id: 'outline', label: 'Contorno', desc: 'Solo borde. Ideal para acciones secundarias.' },
];

const SIDEBAR_STYLES = [
  { id: 'walnut', label: 'Walnut', desc: 'Oscuro tipo anaquel de bodega.' },
  { id: 'claro', label: 'Claro', desc: 'Blanco crema, más luminoso.' },
  { id: 'contraste', label: 'Contraste', desc: 'Gris pizarra para alto contraste.' },
];

const SHADOW_OPTIONS = [
  { id: 'ninguna', label: 'Sin sombra' },
  { id: 'suave', label: 'Suave' },
  { id: 'marcada', label: 'Marcada' },
];

export default function AppearanceSettings({
  logoUrl,
  onLogoUrlChange,
  colorTema,
  onColorTemaChange,
  colorSecundario,
  onColorSecundarioChange,
  presetVisual,
  onPresetChange,
  onManualChange,
  radioBordes,
  onRadioBordesChange,
  radioBotones,
  onRadioBotonesChange,
  densidadVisual,
  onDensidadChange,
  modoVisual,
  onModoVisualChange,
  animaciones,
  onAnimacionesChange,
  estiloBotones,
  onEstiloBotonesChange,
  estiloSidebar,
  onEstiloSidebarChange,
  sombraUi,
  onSombraUiChange,
  nombreNegocio,
  monedaSimbolo,
}) {
  const handlePresetSelect = (presetId) => {
    onPresetChange(presetId);
  };

  const handleManual = (setter) => (value) => {
    onManualChange();
    setter(value);
  };

  const previewPanel = (
    <div
      className="theme-preview theme-preview--live theme-preview--dock"
      data-preview-mode={modoVisual}
      data-preview-sidebar={estiloSidebar}
      data-preview-buttons={estiloBotones}
      aria-label="Vista previa del tema"
    >
      <div>
        <p className="preview-label">Menú lateral</p>
        <div className={`theme-preview__sidebar theme-preview__sidebar--${estiloSidebar}`}>
          <div className="theme-preview__brand">{nombreNegocio || 'Mi Licorería'}</div>
          <div
            className="theme-preview__item theme-preview__item--active"
            style={{ borderLeftColor: colorTema, color: colorTema }}
          >
            Punto de venta
          </div>
          <div className="theme-preview__item">Inventario</div>
          <div className="theme-preview__item">Caja</div>
        </div>
      </div>
      <div>
        <p className="preview-label">Componentes</p>
        <div className="preview-components glass-panel">
          <div className="preview-row">
            <button
              type="button"
              className={`btn btn-primary btn-sm preview-btn preview-btn--${estiloBotones}`}
              style={{ '--preview-brand': colorTema }}
            >
              Guardar
            </button>
            <button type="button" className="btn btn-secondary btn-sm">
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-sm preview-btn-secondary"
              style={{ '--preview-secondary': colorSecundario }}
            >
              Destacado
            </button>
          </div>
          <div
            className="preview-card-sample"
            style={{ borderColor: `color-mix(in srgb, ${colorTema} 25%, transparent)` }}
          >
            <span className="preview-card-label">Ventas del día</span>
            <span className="preview-card-value data-money" style={{ color: colorTema }}>
              {monedaSimbolo || '$'}1,240.00
            </span>
          </div>
          <table className="custom-table preview-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ron premium</td>
                <td className="data-code">24</td>
                <td>
                  <span className="badge badge-success">OK</span>
                </td>
              </tr>
              <tr>
                <td>Vino tinto</td>
                <td className="data-code">8</td>
                <td>
                  <span className="badge preview-badge-warn" style={{ '--preview-secondary': colorSecundario }}>
                    Bajo
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="preview-color-strip" aria-hidden="true">
        <span style={{ background: colorTema }} title="Principal" />
        <span style={{ background: colorSecundario }} title="Secundario" />
      </div>
    </div>
  );

  return (
    <div className="appearance-split">
      <div className="appearance-split__main">
      {/* Estilos predefinidos */}
      <section className="config-block" aria-labelledby="config-presets-title">
        <div className="config-block__head">
          <h3 id="config-presets-title" className="config-block__title">Estilos predefinidos</h3>
          <p className="config-block__desc">Elige un punto de partida. Puedes ajustar cada detalle después.</p>
        </div>
        <div className="preset-grid">
          {Object.values(VISUAL_PRESETS).map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`preset-card ${presetVisual === preset.id ? 'preset-card--active' : ''}`}
              onClick={() => handlePresetSelect(preset.id)}
            >
              <div className="preset-card__swatches">
                {preset.swatch.map((color) => (
                  <span key={color} className="preset-card__swatch" style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="preset-card__body">
                <span className="preset-card__name">{preset.name}</span>
                <span className="preset-card__tag">{preset.tagline}</span>
                <p className="preset-card__desc">{preset.description}</p>
              </div>
              {presetVisual === preset.id && <span className="preset-card__badge">Activo</span>}
            </button>
          ))}
          <button
            type="button"
            className={`preset-card preset-card--custom ${presetVisual === 'personalizado' ? 'preset-card--active' : ''}`}
            onClick={() => handlePresetSelect('personalizado')}
          >
            <div className="preset-card__swatches preset-card__swatches--custom">
              <span className="preset-card__swatch" style={{ background: colorTema }} />
              <span className="preset-card__swatch" style={{ background: colorSecundario }} />
              <span className="preset-card__swatch preset-card__swatch--dashed" />
            </div>
            <div className="preset-card__body">
              <span className="preset-card__name">Personalizado</span>
              <span className="preset-card__tag">Tu combinación</span>
              <p className="preset-card__desc">Ajusta colores, botones y sidebar manualmente.</p>
            </div>
            {presetVisual === 'personalizado' && <span className="preset-card__badge">Activo</span>}
          </button>
        </div>
      </section>

      {/* Identidad */}
      <section className="config-block" aria-labelledby="config-brand-title">
        <div className="config-block__head">
          <h3 id="config-brand-title" className="config-block__title">Identidad</h3>
          <p className="config-block__desc">Logo y elementos que identifican tu negocio en el sistema.</p>
        </div>
        <div className="form-grid">
          <div className="form-group span-2">
            <label className="label-field">URL del logo</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => handleManual(onLogoUrlChange)(e.target.value)}
              className="input-field"
              placeholder="https://..."
            />
          </div>
        </div>
      </section>

      {/* Paleta */}
      <section className="config-block config-block--palette" aria-labelledby="config-colors-title">
        <div className="config-block__head">
          <h3 id="config-colors-title" className="config-block__title">Paleta de colores</h3>
          <p className="config-block__desc">
            Elige una combinación rápida o ajusta cada color. La franja de arriba muestra el resultado al instante.
          </p>
        </div>
        <ColorPaletteEditor
          colorTema={colorTema}
          onColorTemaChange={onColorTemaChange}
          colorSecundario={colorSecundario}
          onColorSecundarioChange={onColorSecundarioChange}
          modoVisual={modoVisual}
          onModoVisualChange={onModoVisualChange}
          estiloBotones={estiloBotones}
          onManualChange={onManualChange}
        />
      </section>

      {/* Botones */}
      <section className="config-block" aria-labelledby="config-buttons-title">
        <div className="config-block__head">
          <h3 id="config-buttons-title" className="config-block__title">Botones</h3>
          <p className="config-block__desc">Estilo y forma de los controles de acción en todo el sistema.</p>
        </div>
        <div className="option-cards option-cards--3">
          {BUTTON_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              className={`option-card option-card--tall ${estiloBotones === style.id ? 'option-card--active' : ''}`}
              onClick={() => handleManual(onEstiloBotonesChange)(style.id)}
            >
              <span className={`option-card__btn-demo option-card__btn-demo--${style.id}`} style={{ '--demo-brand': colorTema }}>
                Guardar
              </span>
              <span className="option-card__label">{style.label}</span>
              <span className="option-card__hint">{style.desc}</span>
            </button>
          ))}
        </div>
        <div className="form-grid" style={{ marginTop: 16 }}>
          <div className="form-group">
            <label className="label-field">Radio de botones</label>
            <select value={radioBotones} onChange={(e) => handleManual(onRadioBotonesChange)(e.target.value)} className="input-field">
              <option value="sm">Compacto (6px)</option>
              <option value="md">Estándar (10px)</option>
              <option value="lg">Suave (14px)</option>
              <option value="full">Píldora</option>
            </select>
          </div>
        </div>
      </section>

      {/* Sidebar y layout */}
      <section className="config-block" aria-labelledby="config-layout-title">
        <div className="config-block__head">
          <h3 id="config-layout-title" className="config-block__title">Menú y espaciado</h3>
          <p className="config-block__desc">Apariencia del sidebar, bordes de paneles y densidad de la interfaz.</p>
        </div>
        <div className="option-cards option-cards--3">
          {SIDEBAR_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              className={`option-card option-card--tall ${estiloSidebar === style.id ? 'option-card--active' : ''}`}
              onClick={() => handleManual(onEstiloSidebarChange)(style.id)}
            >
              <span className={`option-card__sidebar-demo option-card__sidebar-demo--${style.id}`} />
              <span className="option-card__label">{style.label}</span>
              <span className="option-card__hint">{style.desc}</span>
            </button>
          ))}
        </div>
        <div className="form-grid" style={{ marginTop: 16 }}>
          <div className="form-group">
            <label className="label-field">Radio de paneles</label>
            <select value={radioBordes} onChange={(e) => handleManual(onRadioBordesChange)(e.target.value)} className="input-field">
              <option value="sm">Compacto (6px)</option>
              <option value="md">Estándar (10px)</option>
              <option value="lg">Suave (14px)</option>
              <option value="xl">Redondeado (18px)</option>
              <option value="none">Sin redondeo</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label-field">Densidad visual</label>
            <select value={densidadVisual} onChange={(e) => handleManual(onDensidadChange)(e.target.value)} className="input-field">
              <option value="comoda">Cómoda</option>
              <option value="compacta">Compacta</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label-field">Sombras en paneles</label>
            <select value={sombraUi} onChange={(e) => handleManual(onSombraUiChange)(e.target.value)} className="input-field">
              {SHADOW_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label-field">Animaciones</label>
            <select value={animaciones} onChange={(e) => handleManual(onAnimacionesChange)(e.target.value)} className="input-field">
              <option value="activas">Activas</option>
              <option value="reducidas">Reducidas</option>
            </select>
          </div>
        </div>
      </section>
      </div>

      <aside className="appearance-split__dock" aria-labelledby="config-preview-title">
        <div className="appearance-dock">
          <div className="appearance-dock__head">
            <h3 id="config-preview-title" className="appearance-dock__title">Vista previa en vivo</h3>
            <p className="appearance-dock__desc">Se actualiza al mover los controles.</p>
          </div>
          {previewPanel}
        </div>
      </aside>
    </div>
  );
}
