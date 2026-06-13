'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Table from '@/components/Table';
import { formatDate } from '@/lib/utils';

export default function AuditoriaPage() {
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
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.accion.toLowerCase().includes(searchVal.toLowerCase()) ||
    l.tablaAfectada.toLowerCase().includes(searchVal.toLowerCase()) ||
    l.usuario?.nombre.toLowerCase().includes(searchVal.toLowerCase())
  );

  const headers = ['ID', 'Fecha/Hora', 'Usuario', 'Acción', 'Tabla Afectada', 'Registro ID', 'Datos Anteriores', 'Datos Nuevos'];

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
                  {log.datosAnteriores ? (
                    <pre className="json-pre">{JSON.stringify(log.datosAnteriores, null, 2)}</pre>
                  ) : '-'}
                </td>
                <td>
                  {log.datosNuevos ? (
                    <pre className="json-pre">{JSON.stringify(log.datosNuevos, null, 2)}</pre>
                  ) : '-'}
                </td>
              </tr>
            )}
          />
        )}
      </div>

      <style jsx>{`
        .json-pre {
          max-width: 200px;
          max-height: 80px;
          overflow: auto;
          font-size: 10px;
          background: rgba(0, 0, 0, 0.4);
          padding: 6px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
