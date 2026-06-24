'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Table from '@/components/Table';
import { formatDate } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

function renderFriendlyJSON(data) {
  if (!data || typeof data !== 'object') return '-';
  
  // Fields to exclude from display for cleaner view
  const excludedKeys = ['id', 'createdAt', 'updatedAt', 'passwordHash', 'password', 'usuarioId', 'registroId'];
  
  const entries = Object.entries(data).filter(([key]) => !excludedKeys.includes(key));
  if (entries.length === 0) {
    if (data.id) return <div className="friendly-json-wrapper"><div className="friendly-item"><span className="friendly-key">ID:</span> <span className="friendly-val">{data.id}</span></div></div>;
    return '-';
  }

  // Friendly key mapping
  const keyLabels = {
    clave: 'Parámetro',
    valor: 'Valor',
    descripcion: 'Descripción',
    nombre: 'Nombre',
    marca: 'Marca',
    contenido_ml: 'Contenido (ml)',
    grado_alcoholico: 'Grado Alcohólico',
    categoria_id: 'ID Categoría',
    precio_compra: 'Precio Compra',
    precio_venta_detal: 'Precio Detal',
    precio_venta_mayor: 'Precio Mayor',
    stock: 'Stock',
    stock_minimo: 'Stock Mínimo',
    unidad_medida: 'Unidad de Medida',
    unidades_por_caja: 'Unidades por Caja',
    es_combo: 'Es Combo',
    activo: 'Estado Activo',
    color_tema: 'Color del Tema',
    nombre_negocio: 'Nombre del Negocio',
    direccion: 'Dirección',
    telefono: 'Teléfono',
    rif_nit: 'RIF / NIT',
    moneda_simbolo: 'Moneda',
    impuesto_porcentaje: 'Impuesto (%)',
    prefijo_factura: 'Prefijo Factura',
    siguiente_num_factura: 'Siguiente Factura',
    dias_alerta_vencimiento: 'Alerta Vencimiento (Días)',
    logo_url: 'URL del Logo'
  };

  return (
    <div className="friendly-json-wrapper">
      {entries.map(([key, val]) => {
        const label = keyLabels[key] || key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
        let displayVal = String(val);
        if (typeof val === 'boolean') {
          displayVal = val ? 'Sí' : 'No';
        }
        
        // Show color preview if it's a hex color
        const isColor = typeof val === 'string' && val.startsWith('#') && val.length <= 9 && /#[0-9a-fA-F]{3,8}/.test(val);
        
        return (
          <div key={key} className="friendly-item">
            <span className="friendly-key">{label}</span>
            <span className="friendly-val-wrapper">
              {isColor && (
                <span className="color-preview" style={{ backgroundColor: val }} />
              )}
              <span className="friendly-val">{displayVal}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AuditoriaPage() {
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  async function loadLogs() {
    try {
      const res = await fetch('/api/auditoria');
      const json = await res.json();
      setLogs(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.rol?.permisos?.auditoria) {
      loadLogs();
    }
  }, [status, session]);

  const filteredLogs = logs.filter(l => 
    l.accion.toLowerCase().includes(searchVal.toLowerCase()) ||
    l.tablaAfectada.toLowerCase().includes(searchVal.toLowerCase()) ||
    l.usuario?.nombre.toLowerCase().includes(searchVal.toLowerCase())
  );

  const headers = ['ID', 'Fecha/Hora', 'Usuario', 'Acción', 'Tabla Afectada', 'Registro ID', 'Datos Anteriores', 'Datos Nuevos'];

  if (status === 'loading') {
    return (
      <div>
        <Header title="Bitácora de Auditoría del Sistema" />
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p>Cargando información de sesión...</p>
        </div>
      </div>
    );
  }

  const permisos = session?.user?.rol?.permisos || {};
  if (!permisos.auditoria) {
    return (
      <div>
        <Header title="Acceso Denegado" />
        <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
          <AlertTriangle size={48} className="text-warning" />
          <h2 style={{ color: 'var(--text-primary)', fontSize: '20px' }}>No tienes permiso para acceder a Auditoría</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', fontSize: '14px', lineHeight: '1.5' }}>
            Esta sección de bitácora de auditoría del sistema está restringida. Contacta a un superadministrador si necesitas permisos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Bitácora de Auditoría del Sistema" />

      <div className="glass-panel" style={{ marginTop: '20px' }}>
        {loading ? (
          <p>Cargando bitácora de auditoría...</p>
        ) : (
          <Table
            headers={headers}
            data={filteredLogs}
            searchVal={searchVal}
            onSearchChange={setSearchVal}
            searchPlaceholder="Buscar por usuario, acción..."
            renderRow={(log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{formatDate(log.fecha)}</td>
                <td><strong>{log.usuario?.nombre || 'Sistema'}</strong></td>
                <td>
                  <span className={`badge ${
                    log.accion.startsWith('LOGIN') ? 'badge-warning' : 
                    log.accion.startsWith('CREAR') ? 'badge-success' : 
                    log.accion.startsWith('DESACTIVAR') ? 'badge-danger' : 'badge-success'
                  }`}>
                    {log.accion}
                  </span>
                </td>
                <td><code>{log.tablaAfectada}</code></td>
                <td>{log.registroId || '-'}</td>
                <td>
                  {renderFriendlyJSON(log.datosAnteriores)}
                </td>
                <td>
                  {renderFriendlyJSON(log.datosNuevos)}
                </td>
              </tr>
            )}
          />
        )}
      </div>

      <style jsx global>{`
        .friendly-json-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-width: 250px;
          font-size: 11px;
        }
        .friendly-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 4px 8px;
          background: rgba(166, 124, 38, 0.05);
          border-radius: 4px;
          border: 1px solid rgba(166, 124, 38, 0.08);
        }
        .friendly-key {
          font-weight: 600;
          color: var(--accent-gold);
          font-size: 10px;
          text-transform: capitalize;
        }
        .friendly-val-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .friendly-val {
          color: var(--text-color);
          font-family: monospace;
          background: rgba(0, 0, 0, 0.04);
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 10px;
          word-break: break-all;
          max-width: 140px;
        }
        .color-preview {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}
