'use client';

import { normalizeHex, lightenHexColor } from '@/lib/theme';

const QUICK_PALETTES = [
  { id: 'ambre', name: 'Ámbar bodega', primary: '#8B6914', secondary: '#C9A03D' },
  { id: 'oro', name: 'Oro clásico', primary: '#A67C26', secondary: '#D4A853' },
  { id: 'azul', name: 'Azul operativo', primary: '#2563EB', secondary: '#3B82F6' },
  { id: 'burdeos', name: 'Burdeos cava', primary: '#7C2D3E', secondary: '#B45309' },
  { id: 'verde', name: 'Verde botella', primary: '#15803D', secondary: '#4ADE80' },
  { id: 'grafito', name: 'Grafito', primary: '#475569', secondary: '#94A3B8' },
];

const PRIMARY_USES = ['Botones', 'Menú activo', 'Enlaces'];
const SECONDARY_USES = ['Badges', 'Iconos', 'Destacados'];

function ColorCard({ role, label, uses, value, onChange, onPick }) {
  const safeValue = normalizeHex(value);

  const handleHexInput = (raw) => {
    onChange(raw);
  };

  const handleHexBlur = (raw) => {
    onChange(normalizeHex(raw));
  };

  return (
    <div className={`palette-color-card palette-color-card--${role}`}>
      <label className="palette-color-card__label" htmlFor={`color-${role}`}>
        {label}
      </label>
      <div className="palette-color-card__body">
        <label className="palette-color-card__swatch-wrap" htmlFor={`color-${role}`}>
          <span className="palette-color-card__swatch" style={{ backgroundColor: safeValue }} />
          <span className="palette-color-card__swatch-hint">Elegir color</span>
          <input
            id={`color-${role}`}
            type="color"
            value={safeValue}
            onChange={(e) => onPick(e.target.value)}
            className="palette-color-card__input-native"
            aria-label={label}
          />
        </label>
        <div className="palette-color-card__fields">
          <div className="palette-color-card__hex-row">
            <span className="palette-color-card__hex-prefix">#</span>
            <input
              type="text"
              value={safeValue.replace('#', '')}
              onChange={(e) => handleHexInput(`#${e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)}`)}
              onBlur={(e) => handleHexBlur(`#${e.target.value}`)}
              className="palette-color-card__hex"
              maxLength={6}
              spellCheck={false}
              aria-label={`Código hex ${label}`}
            />
          </div>
          <ul className="palette-color-card__uses">
            {uses.map((use) => (
              <li key={use}>{use}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ColorPaletteEditor({
  colorTema,
  onColorTemaChange,
  colorSecundario,
  onColorSecundarioChange,
  modoVisual,
  onModoVisualChange,
  estiloBotones,
  onManualChange,
}) {
  const primary = normalizeHex(colorTema);
  const secondary = normalizeHex(colorSecundario);

  const handleManual = (setter) => (value) => {
    onManualChange();
    setter(value);
  };

  const applyPair = (primaryColor, secondaryColor) => {
    onManualChange();
    onColorTemaChange(primaryColor);
    onColorSecundarioChange(secondaryColor);
  };

  const swapColors = () => {
    onManualChange();
    onColorTemaChange(secondary);
    onColorSecundarioChange(primary);
  };

  const suggestSecondary = () => {
    onManualChange();
    onColorSecundarioChange(lightenHexColor(primary, 42));
  };

  const isQuickActive = (pair) =>
    normalizeHex(pair.primary).toLowerCase() === primary.toLowerCase() &&
    normalizeHex(pair.secondary).toLowerCase() === secondary.toLowerCase();

  return (
    <div className="palette-editor">
      <div className="palette-editor__quick">
        <span className="palette-editor__quick-label">Combinaciones rápidas</span>
        <div className="palette-quick-picks">
          {QUICK_PALETTES.map((pair) => (
            <button
              key={pair.id}
              type="button"
              className={`palette-quick-pick ${isQuickActive(pair) ? 'palette-quick-pick--active' : ''}`}
              onClick={() => applyPair(pair.primary, pair.secondary)}
              title={pair.name}
            >
              <span className="palette-quick-pick__dots">
                <span style={{ background: pair.primary }} />
                <span style={{ background: pair.secondary }} />
              </span>
              <span className="palette-quick-pick__name">{pair.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="palette-live-strip"
        style={{
          '--strip-primary': primary,
          '--strip-secondary': secondary,
        }}
      >
        <div className="palette-live-strip__gradient" />
        <div className="palette-live-strip__samples">
          <button
            type="button"
            tabIndex={-1}
            className={`palette-live-strip__btn palette-live-strip__btn--primary palette-live-strip__btn--${estiloBotones}`}
          >
            Guardar
          </button>
          <span className="palette-live-strip__badge">Badge</span>
          <span className="palette-live-strip__link">Enlace activo</span>
        </div>
      </div>

      <div className="palette-cards">
        <ColorCard
          role="primary"
          label="Color principal"
          uses={PRIMARY_USES}
          value={primary}
          onChange={handleManual(onColorTemaChange)}
          onPick={handleManual(onColorTemaChange)}
        />
        <div className="palette-cards__actions">
          <button type="button" className="palette-action-btn" onClick={swapColors} title="Intercambiar colores">
            ⇄
          </button>
          <button type="button" className="palette-action-btn" onClick={suggestSecondary} title="Sugerir secundario">
            ✦
          </button>
        </div>
        <ColorCard
          role="secondary"
          label="Color secundario"
          uses={SECONDARY_USES}
          value={secondary}
          onChange={handleManual(onColorSecundarioChange)}
          onPick={handleManual(onColorSecundarioChange)}
        />
      </div>

      <div className="palette-editor__mode">
        <span className="palette-editor__quick-label">Modo visual</span>
        <div className="option-cards option-cards--2">
          <button
            type="button"
            className={`option-card ${modoVisual === 'claro' ? 'option-card--active' : ''}`}
            onClick={() => handleManual(onModoVisualChange)('claro')}
          >
            <span className="option-card__preview option-card__preview--light" />
            <span className="option-card__label">Claro</span>
            <span className="option-card__hint">Fondo crema, texto oscuro</span>
          </button>
          <button
            type="button"
            className={`option-card ${modoVisual === 'oscuro' ? 'option-card--active' : ''}`}
            onClick={() => handleManual(onModoVisualChange)('oscuro')}
          >
            <span className="option-card__preview option-card__preview--dark" />
            <span className="option-card__label">Oscuro</span>
            <span className="option-card__hint">Fondo profundo, texto claro</span>
          </button>
        </div>
      </div>
    </div>
  );
}
