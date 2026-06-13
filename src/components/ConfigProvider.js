'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ConfigContext = createContext();

function darkenHexColor(hex, percent = 15) {
  try {
    hex = hex.replace(/^\s*#|\s*$/g, '');
    if (hex.length === 3) {
      hex = hex.replace(/(.)/g, '$1$1');
    }
    let r = parseInt(hex.substr(0, 2), 16),
        g = parseInt(hex.substr(2, 2), 16),
        b = parseInt(hex.substr(4, 2), 16);

    r = Math.max(0, Math.floor(r * (1 - percent / 100)));
    g = Math.max(0, Math.floor(g * (1 - percent / 100)));
    b = Math.max(0, Math.floor(b * (1 - percent / 100)));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch (e) {
    return '#8f671d';
  }
}

export function ConfigProvider({ children }) {
  const [configs, setConfigs] = useState({
    nombre_negocio: 'Mi Licorería',
    logo_url: '',
    color_tema: '#a67c26',
    moneda_simbolo: '$'
  });
  const [loading, setLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/configuracion', { cache: 'no-store' });
      const json = await res.json();
      if (json && json.configMap) {
        setConfigs({
          nombre_negocio: json.configMap.nombre_negocio || 'Mi Licorería',
          logo_url: json.configMap.logo_url || '',
          color_tema: json.configMap.color_tema || '#a67c26',
          moneda_simbolo: json.configMap.moneda_simbolo || '$'
        });
      }
    } catch (e) {
      console.error('Error fetching configurations:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const updateConfigState = (newConfigs) => {
    setConfigs(prev => ({ ...prev, ...newConfigs }));
  };

  const themeColor = configs.color_tema || '#a67c26';
  const themeColorHover = darkenHexColor(themeColor, 15);

  return (
    <ConfigContext.Provider value={{ configs, updateConfigState, reloadConfigs: fetchConfigs, loading }}>
      <style jsx global>{`
        :root {
          --accent-gold: ${themeColor} !important;
          --accent-gold-hover: ${themeColorHover} !important;
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
