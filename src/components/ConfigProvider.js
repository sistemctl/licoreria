'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  darkenHexColor,
  lightenHexColor,
  hexToRgba,
  normalizeHex,
  RADIUS_MAP,
  BUTTON_RADIUS_MAP,
  DEFAULT_THEME,
  parseAppearanceConfig,
} from '@/lib/theme';
import { parsePaymentMethods, serializePaymentMethods } from '@/lib/paymentMethods';

const ConfigContext = createContext();

const SHADOW_MAP = {
  ninguna: 'none',
  suave: '0 1px 3px rgba(28, 25, 23, 0.06), 0 4px 12px rgba(28, 25, 23, 0.04)',
  marcada: '0 4px 16px rgba(28, 25, 23, 0.12), 0 8px 24px rgba(28, 25, 23, 0.08)',
};

function parseConfigMap(configMap = {}) {
  const appearance = parseAppearanceConfig(configMap);
  return {
    nombre_negocio: configMap.nombre_negocio || DEFAULT_THEME.nombre_negocio,
    logo_url: configMap.logo_url || '',
    moneda_simbolo: configMap.moneda_simbolo || DEFAULT_THEME.moneda_simbolo,
    metodos_pago: serializePaymentMethods(parsePaymentMethods(configMap.metodos_pago)),
    ...appearance,
  };
}

export function ConfigProvider({ children }) {
  const [configs, setConfigs] = useState(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/configuracion', { cache: 'no-store' });
      const json = await res.json();
      if (json?.configMap) {
        const loaded = parseConfigMap(json.configMap);
        setConfigs(loaded);
        if (typeof window !== 'undefined') {
          localStorage.setItem('system_config', JSON.stringify(loaded));
        }
      }
    } catch (e) {
      console.error('Error fetching configurations:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('system_config');
      if (cached) {
        try {
          setConfigs(parseConfigMap(JSON.parse(cached)));
        } catch {
          /* ignore */
        }
      }
    }
    fetchConfigs();
  }, [fetchConfigs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.title = `${configs.nombre_negocio || 'Mi Licorería'} - Sistema de Gestión`;

    const logoUrl = configs.logo_url || '/favicon.ico';
    const links = document.querySelectorAll("link[rel*='icon']");
    if (links.length > 0) {
      links.forEach((link) => {
        link.href = logoUrl;
      });
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = logoUrl;
      document.head.appendChild(link);
    }

    const root = document.documentElement;
    root.setAttribute('data-theme', configs.modo_visual === 'oscuro' ? 'oscuro' : 'claro');
    root.setAttribute('data-density', configs.densidad_visual === 'compacta' ? 'compacta' : 'comoda');
    root.setAttribute('data-animations', configs.animaciones === 'reducidas' ? 'reducidas' : 'activas');
    root.setAttribute('data-button-style', configs.estilo_botones || 'solid');
    root.setAttribute('data-sidebar-style', configs.estilo_sidebar || 'walnut');
    root.setAttribute('data-shadow-ui', configs.sombra_ui || 'suave');
  }, [configs]);

  const updateConfigState = useCallback((newConfigs) => {
    setConfigs((prev) => {
      const merged = parseConfigMap({ ...prev, ...newConfigs });
      if (typeof window !== 'undefined') {
        localStorage.setItem('system_config', JSON.stringify(merged));
      }
      return merged;
    });
  }, []);

  const theme = useMemo(() => {
    const brand = normalizeHex(configs.color_tema);
    const secondary = normalizeHex(configs.color_secundario || configs.color_tema);
    const brandHover = darkenHexColor(brand, 12);
    const brandSoft = hexToRgba(brand, 0.1);
    const brandBorder = hexToRgba(brand, 0.22);
    const secondarySoft = hexToRgba(secondary, 0.12);
    const radius = RADIUS_MAP[configs.radio_bordes] || RADIUS_MAP.md;
    const buttonRadius = BUTTON_RADIUS_MAP[configs.radio_botones] || BUTTON_RADIUS_MAP.md;
    const cardShadow = SHADOW_MAP[configs.sombra_ui] || SHADOW_MAP.suave;

    return { brand, secondary, brandHover, brandSoft, brandBorder, secondarySoft, radius, buttonRadius, cardShadow };
  }, [configs]);

  return (
    <ConfigContext.Provider value={{ configs, updateConfigState, reloadConfigs: fetchConfigs, loading, theme }}>
      <style jsx global>{`
        :root {
          --color-brand: ${theme.brand} !important;
          --color-brand-hover: ${theme.brandHover} !important;
          --color-brand-soft: ${theme.brandSoft} !important;
          --color-brand-border: ${theme.brandBorder} !important;
          --color-brand-light: ${theme.secondary} !important;
          --color-accent-secondary: ${theme.secondary} !important;
          --accent-gold: ${theme.brand} !important;
          --accent-gold-hover: ${theme.brandHover} !important;
          --panel-border: ${theme.brandBorder} !important;
          --radius-sm: ${theme.radius === '0px' ? '0px' : '6px'} !important;
          --radius-md: ${theme.radius} !important;
          --radius-lg: ${theme.radius === '0px' ? '2px' : `calc(${theme.radius} + 2px)`} !important;
          --btn-radius: ${theme.buttonRadius} !important;
          --card-shadow: ${theme.cardShadow} !important;
          --shadow-sm: ${theme.cardShadow} !important;
        }
      `}</style>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}

export { lightenHexColor, darkenHexColor };
