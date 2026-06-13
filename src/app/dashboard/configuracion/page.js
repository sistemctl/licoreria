'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Save, CheckCircle } from 'lucide-react';
import { useConfig } from '@/components/ConfigProvider';

export default function ConfiguracionPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { updateConfigState } = useConfig();
  
  // States para cada clave
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rifNit, setRifNit] = useState('');
  const [monedaSimbolo, setMonedaSimbolo] = useState('');
  const [impuestoPorcentaje, setImpuestoPorcentaje] = useState('');
  const [prefijoFactura, setPrefijoFactura] = useState('');
  const [siguienteNumFactura, setSiguienteNumFactura] = useState('');
  const [diasAlertaVencimiento, setDiasAlertaVencimiento] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [colorTema, setColorTema] = useState('#a67c26');

  const [mensajeExito, setMensajeExito] = useState('');
  const [cargandoGuardado, setCargandoGuardado] = useState(false);

  async function loadConfig() {
    try {
      const res = await fetch('/api/configuracion');
      const json = await res.json();
      
      const map = json.configMap;
      setNombreNegocio(map.nombre_negocio || '');
      setDireccion(map.direccion || '');
      setTelefono(map.telefono || '');
      setRifNit(map.rif_nit || '');
      setMonedaSimbolo(map.moneda_simbolo || '');
      setImpuestoPorcentaje(map.impuesto_porcentaje || '0');
      setPrefijoFactura(map.prefijo_factura || 'FAC-');
      setSiguienteNumFactura(map.siguiente_num_factura || '1');
      setDiasAlertaVencimiento(map.dias_alerta_vencimiento || '15');
      setLogoUrl(map.logo_url || '');
      setColorTema(map.color_tema || '#a67c26');

      setConfigs(json.configs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargandoGuardado(true);
    setMensajeExito('');

    const payload = {
      nombre_negocio: nombreNegocio,
      direccion,
      telefono,
      rif_nit: rifNit,
      moneda_simbolo: monedaSimbolo,
      impuesto_porcentaje: impuestoPorcentaje,
      prefijo_factura: prefijoFactura,
      siguiente_num_factura: siguienteNumFactura,
      dias_alerta_vencimiento: diasAlertaVencimiento,
      logo_url: logoUrl,
      color_tema: colorTema
    };

    try {
      const res = await fetch('/api/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json.error) {
        setMensajeExito('Ajustes del sistema guardados con éxito.');
        updateConfigState(payload); // Actualiza el contexto global al instante
        setTimeout(() => setMensajeExito(''), 4000);
      }
    } catch (err) {
      alert('Error de red al guardar los ajustes.');
    } finally {
      setCargandoGuardado(false);
    }
  };

  if (loading) {
    return (
      <div className="pos-loading">
        <div className="spinner"></div>
        <p>Cargando configuraciones...</p>
      </div>
    );
  }

  return (
    <div>
      <Header title="Configuración General del Sistema" />

      <div className="glass-panel config-panel animate-fade-in">
        <form onSubmit={handleSubmit} className="config-form">
          <div className="form-header-bar">
            <h4>Ajustes de la Licorería</h4>
            {mensajeExito && (
              <div className="success-badge">
                <CheckCircle size={16} />
                <span>{mensajeExito}</span>
              </div>
            )}
          </div>

          <div className="form-grid">
            <div className="form-group span-2">
              <label className="label-field">Nombre del Establecimiento</label>
              <input 
                type="text" 
                value={nombreNegocio} 
                onChange={(e) => setNombreNegocio(e.target.value)} 
                className="input-field" 
              />
            </div>

            <div className="form-group">
              <label className="label-field">RIF / NIT / Identificación Fiscal</label>
              <input 
                type="text" 
                value={rifNit} 
                onChange={(e) => setRifNit(e.target.value)} 
                className="input-field" 
              />
            </div>

            <div className="form-group">
              <label className="label-field">Teléfono de Contacto</label>
              <input 
                type="text" 
                value={telefono} 
                onChange={(e) => setTelefono(e.target.value)} 
                className="input-field" 
              />
            </div>

            <div className="form-group span-2">
              <label className="label-field">Dirección Física</label>
              <input 
                type="text" 
                value={direccion} 
                onChange={(e) => setDireccion(e.target.value)} 
                className="input-field" 
              />
            </div>

            <div className="form-divider span-2">Facturación e Impuestos</div>

            <div className="form-group">
              <label className="label-field">Símbolo de la Moneda</label>
              <input 
                type="text" 
                value={monedaSimbolo} 
                onChange={(e) => setMonedaSimbolo(e.target.value)} 
                className="input-field" 
                placeholder="Ej. $, B$, Bs, €"
              />
            </div>

            <div className="form-group">
              <label className="label-field">Porcentaje de Impuesto (%)</label>
              <input 
                type="number" 
                value={impuestoPorcentaje} 
                onChange={(e) => setImpuestoPorcentaje(e.target.value)} 
                className="input-field" 
              />
            </div>

            <div className="form-group">
              <label className="label-field">Prefijo de Factura</label>
              <input 
                type="text" 
                value={prefijoFactura} 
                onChange={(e) => setPrefijoFactura(e.target.value)} 
                className="input-field" 
              />
            </div>

            <div className="form-group">
              <label className="label-field">Siguiente Número de Factura</label>
              <input 
                type="number" 
                value={siguienteNumFactura} 
                onChange={(e) => setSiguienteNumFactura(e.target.value)} 
                className="input-field" 
              />
            </div>

            <div className="form-divider span-2">Alertas e Inventario</div>

            <div className="form-group">
              <label className="label-field">Días de Anticipación Alerta Vencimiento</label>
              <input 
                type="number" 
                value={diasAlertaVencimiento} 
                onChange={(e) => setDiasAlertaVencimiento(e.target.value)} 
                className="input-field" 
              />
            </div>

            <div className="form-divider span-2">Personalización Visual</div>

            <div className="form-group span-2">
              <label className="label-field">URL del Logo del Establecimiento</label>
              <input 
                type="text" 
                value={logoUrl} 
                onChange={(e) => setLogoUrl(e.target.value)} 
                className="input-field" 
                placeholder="Ej. https://tuservidor.com/logo.png"
              />
            </div>

            <div className="form-group">
              <label className="label-field">Color de Acento del Tema</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={colorTema} 
                  onChange={(e) => setColorTema(e.target.value)} 
                  style={{ width: '50px', height: '40px', border: '1px solid var(--panel-border)', borderRadius: '8px', cursor: 'pointer', background: 'transparent', padding: '2px' }}
                />
                <input 
                  type="text" 
                  value={colorTema} 
                  onChange={(e) => setColorTema(e.target.value)} 
                  className="input-field" 
                  placeholder="#a67c26"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          <div className="form-footer-actions">
            <button type="submit" disabled={cargandoGuardado} className="btn btn-primary">
              <Save size={18} />
              <span>{cargandoGuardado ? 'Guardando...' : 'GUARDAR CONFIGURACIÓN'}</span>
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .config-panel {
          border-color: var(--accent-gold);
          max-width: 800px;
          margin: 0 auto;
        }

        .form-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(212, 168, 83, 0.1);
          padding-bottom: 16px;
          margin-bottom: 24px;
        }

        .form-header-bar h4 {
          color: var(--accent-gold);
          font-size: 18px;
        }

        .success-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: var(--success-green);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .span-2 {
          grid-column: span 2;
        }

        .form-divider {
          font-size: 14px;
          font-weight: 600;
          color: var(--accent-gold);
          border-bottom: 1px dashed rgba(212, 168, 83, 0.2);
          padding-bottom: 6px;
          margin-top: 16px;
          margin-bottom: 8px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-footer-actions {
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid rgba(212, 168, 83, 0.1);
          padding-top: 20px;
          margin-top: 24px;
        }
      `}</style>
    </div>
  );
}
