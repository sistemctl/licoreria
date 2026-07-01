/** Claves de configuración visibles sin autenticación (login, branding). */
export const PUBLIC_CONFIG_KEYS = new Set([
  'nombre_negocio',
  'logo_url',
  'moneda_simbolo',
  'color_tema',
  'color_secundario',
  'preset_visual',
  'radio_bordes',
  'radio_botones',
  'densidad_visual',
  'modo_visual',
  'animaciones',
  'estilo_botones',
  'estilo_sidebar',
  'sombra_ui',
]);

export function filterPublicConfig(configMap = {}) {
  const filtered = {};
  for (const key of PUBLIC_CONFIG_KEYS) {
    if (configMap[key] !== undefined) {
      filtered[key] = configMap[key];
    }
  }
  return filtered;
}
