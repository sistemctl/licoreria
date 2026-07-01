export function normalizeHex(hex) {
  if (!hex) return '#a67c26';
  let h = String(hex).replace(/^\s*#|\s*$/g, '');
  if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return '#a67c26';
  return `#${h}`;
}

export function hexToRgb(hex) {
  const h = normalizeHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function darkenHexColor(hex, percent = 15) {
  try {
    const { r, g, b } = hexToRgb(hex);
    const factor = 1 - percent / 100;
    const dr = Math.max(0, Math.floor(r * factor));
    const dg = Math.max(0, Math.floor(g * factor));
    const db = Math.max(0, Math.floor(b * factor));
    return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
  } catch {
    return '#8f671d';
  }
}

export function lightenHexColor(hex, percent = 88) {
  try {
    const { r, g, b } = hexToRgb(hex);
    const factor = percent / 100;
    const lr = Math.min(255, Math.floor(r + (255 - r) * factor));
    const lg = Math.min(255, Math.floor(g + (255 - g) * factor));
    const lb = Math.min(255, Math.floor(b + (255 - b) * factor));
    return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
  } catch {
    return '#f5efe3';
  }
}

export function hexToRgba(hex, alpha = 1) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const RADIUS_MAP = { sm: '6px', md: '10px', lg: '14px', xl: '18px', none: '0px' };

export const BUTTON_RADIUS_MAP = { sm: '6px', md: '10px', lg: '14px', full: '9999px' };

/** Estilos visuales predefinidos — identidad de bodega/licorería */
export const VISUAL_PRESETS = {
  bodega: {
    id: 'bodega',
    name: 'Bodega clásica',
    tagline: 'Walnut y ámbar',
    description: 'Sidebar oscuro tipo anaquel y acento dorado. El estilo operativo por defecto.',
    swatch: ['#2A231C', '#8B6914', '#E8E5E0'],
    color_tema: '#8B6914',
    color_secundario: '#C9A03D',
    modo_visual: 'claro',
    estilo_sidebar: 'walnut',
    estilo_botones: 'solid',
    radio_bordes: 'md',
    radio_botones: 'md',
    densidad_visual: 'comoda',
    animaciones: 'activas',
    sombra_ui: 'suave',
  },
  noche: {
    id: 'noche',
    name: 'Noche premium',
    tagline: 'Turno nocturno',
    description: 'Modo oscuro con dorado cálido. Ideal para operación en horario nocturno.',
    swatch: ['#0E0C0A', '#D4A853', '#1C1916'],
    color_tema: '#D4A853',
    color_secundario: '#F0C878',
    modo_visual: 'oscuro',
    estilo_sidebar: 'walnut',
    estilo_botones: 'soft',
    radio_bordes: 'lg',
    radio_botones: 'lg',
    densidad_visual: 'comoda',
    animaciones: 'activas',
    sombra_ui: 'marcada',
  },
  lienzo: {
    id: 'lienzo',
    name: 'Lienzo claro',
    tagline: 'Máxima legibilidad',
    description: 'Sidebar claro, bordes definidos y botones outline. Limpio para el día.',
    swatch: ['#FFFFFF', '#6B5B4F', '#F3F1ED'],
    color_tema: '#6B5B4F',
    color_secundario: '#9C8B7A',
    modo_visual: 'claro',
    estilo_sidebar: 'claro',
    estilo_botones: 'outline',
    radio_bordes: 'sm',
    radio_botones: 'sm',
    densidad_visual: 'compacta',
    animaciones: 'reducidas',
    sombra_ui: 'ninguna',
  },
  operativo: {
    id: 'operativo',
    name: 'Caja rápida',
    tagline: 'Alto contraste',
    description: 'Densidad compacta y botones sólidos. Pensado para POS y turnos intensos.',
    swatch: ['#1E293B', '#2563EB', '#F1F5F9'],
    color_tema: '#2563EB',
    color_secundario: '#3B82F6',
    modo_visual: 'claro',
    estilo_sidebar: 'contraste',
    estilo_botones: 'solid',
    radio_bordes: 'sm',
    radio_botones: 'sm',
    densidad_visual: 'compacta',
    animaciones: 'reducidas',
    sombra_ui: 'suave',
  },
  vino: {
    id: 'vino',
    name: 'Cava reserva',
    tagline: 'Tonos burdeos',
    description: 'Paleta vino tinto y crema. Distintivo para licorerías premium.',
    swatch: ['#2C1810', '#7C2D3E', '#F5EDE4'],
    color_tema: '#7C2D3E',
    color_secundario: '#B45309',
    modo_visual: 'claro',
    estilo_sidebar: 'walnut',
    estilo_botones: 'solid',
    radio_bordes: 'md',
    radio_botones: 'md',
    densidad_visual: 'comoda',
    animaciones: 'activas',
    sombra_ui: 'suave',
  },
};

export const PRESET_IDS = [...Object.keys(VISUAL_PRESETS), 'personalizado'];

export const DEFAULT_THEME = {
  nombre_negocio: 'Mi Licorería',
  logo_url: '',
  color_tema: '#8B6914',
  color_secundario: '#C9A03D',
  moneda_simbolo: '$',
  preset_visual: 'bodega',
  radio_bordes: 'md',
  radio_botones: 'md',
  densidad_visual: 'comoda',
  modo_visual: 'claro',
  animaciones: 'activas',
  estilo_botones: 'solid',
  estilo_sidebar: 'walnut',
  sombra_ui: 'suave',
};

export function applyPreset(presetId) {
  const preset = VISUAL_PRESETS[presetId];
  if (!preset) return null;
  const { id, name, tagline, description, swatch, ...values } = preset;
  return { ...values, preset_visual: id };
}

export function parseAppearanceConfig(configMap = {}) {
  const preset = configMap.preset_visual || DEFAULT_THEME.preset_visual;
  const base = VISUAL_PRESETS[preset] ? applyPreset(preset) : {};

  return {
    color_tema: normalizeHex(configMap.color_tema || base.color_tema || DEFAULT_THEME.color_tema),
    color_secundario: normalizeHex(configMap.color_secundario || base.color_secundario || DEFAULT_THEME.color_secundario),
    preset_visual: PRESET_IDS.includes(configMap.preset_visual) ? configMap.preset_visual : preset,
    radio_bordes: configMap.radio_bordes || base.radio_bordes || DEFAULT_THEME.radio_bordes,
    radio_botones: configMap.radio_botones || base.radio_botones || DEFAULT_THEME.radio_botones,
    densidad_visual: configMap.densidad_visual || base.densidad_visual || DEFAULT_THEME.densidad_visual,
    modo_visual: configMap.modo_visual || base.modo_visual || DEFAULT_THEME.modo_visual,
    animaciones: configMap.animaciones || base.animaciones || DEFAULT_THEME.animaciones,
    estilo_botones: configMap.estilo_botones || base.estilo_botones || DEFAULT_THEME.estilo_botones,
    estilo_sidebar: configMap.estilo_sidebar || base.estilo_sidebar || DEFAULT_THEME.estilo_sidebar,
    sombra_ui: configMap.sombra_ui || base.sombra_ui || DEFAULT_THEME.sombra_ui,
  };
}
