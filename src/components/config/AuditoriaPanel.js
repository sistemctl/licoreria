'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ModulePanel } from '@/components/layout';
import Table from '@/components/Table';
import { formatDate } from '@/lib/utils';

function renderFriendlyJSON(data) {
  if (!data || typeof data !== 'object') return '-';

  const excludedKeys = ['id', 'createdAt', 'updatedAt', 'passwordHash', 'password', 'usuarioId', 'registroId'];
  const entries = Object.entries(data).filter(([key]) => !excludedKeys.includes(key));

  if (entries.length === 0) {
    if (data.id) {
      return (
        <div className="friendly-json-wrapper">
          <div className="friendly-item">
            <span className="friendly-key">ID:</span>{' '}
            <span className="friendly-val">{data.id}</span>
          </div>
        </div>
      );
    }
    return '-';
  }

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
    logo_url: 'URL del Logo',
  };

  return (
    <div className="friendly-json-wrapper">
      {entries.map(([key, val]) => {
        const label = keyLabels[key] || key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
        let displayVal = String(val);
        if (typeof val === 'boolean') {
          displayVal = val ? 'Sí' : 'No';
        }
        const isColor = typeof val === 'string' && val.startsWith('#') && val.length <= 9 && /#[0-9a-fA-F]{3,8}/.test(val);

        return (
          <div key={key} className="friendly-item">
            <span className="friendly-key">{label}</span>
            <span className="friendly-val-wrapper">
              {isColor && <span className="color-preview" style={{ backgroundColor: val }} />}
              <span className="friendly-val">{displayVal}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AuditoriaPanel() {
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

  const filteredLogs = logs.filter(
    (l) =>
      l.accion.toLowerCase().includes(searchVal.toLowerCase()) ||
      l.tablaAfectada.toLowerCase().includes(searchVal.toLowerCase()) ||
      l.usuario?.nombre.toLowerCase().includes(searchVal.toLowerCase())
  );

  const headers = ['ID', 'Fecha/Hora', 'Usuario', 'Acción', 'Tabla Afectada', 'Registro ID', 'Datos Anteriores', 'Datos Nuevos'];

  return (
    <ModulePanel loading={loading} loadingMessage="Cargando bitácora..." className="config-admin-panel__surface">
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
            <td>
              <strong>{log.usuario?.nombre || 'Sistema'}</strong>
            </td>
            <td>
              <span
                className={`badge ${
                  log.accion.startsWith('LOGIN')
                    ? 'badge-warning'
                    : log.accion.startsWith('CREAR')
                      ? 'badge-success'
                      : log.accion.startsWith('DESACTIVAR')
                        ? 'badge-danger'
                        : 'badge-success'
                }`}
              >
                {log.accion}
              </span>
            </td>
            <td>
              <code>{log.tablaAfectada}</code>
            </td>
            <td>{log.registroId || '-'}</td>
            <td>{renderFriendlyJSON(log.datosAnteriores)}</td>
            <td>{renderFriendlyJSON(log.datosNuevos)}</td>
          </tr>
        )}
      />
    </ModulePanel>
  );
}
