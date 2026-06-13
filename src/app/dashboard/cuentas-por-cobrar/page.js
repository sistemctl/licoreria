'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/utils';
import { Plus, Check, Eye } from 'lucide-react';

export default function CuentasPorCobrarPage() {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  // Modales
  const [isAbonoOpen, setIsAbonoOpen] = useState(false);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState(null);

  // Form
  const [montoAbono, setMontoAbono] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [errorMsg, setErrorMsg] = useState('');

  async function loadCuentas() {
    try {
      const res = await fetch('/api/cuentas-por-cobrar');
      const json = await res.json();
      setCuentas(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCuentas();
  }, []);

  const openAbonoModal = (cuenta) => {
    setSelectedCuenta(cuenta);
    setMontoAbono(parseFloat(cuenta.saldoPendiente).toFixed(2));
    setMetodoPago('efectivo');
    setErrorMsg('');
    setIsAbonoOpen(true);
  };

  const openDetalleModal = (cuenta) => {
    setSelectedCuenta(cuenta);
    setIsDetalleOpen(true);
  };

  const handleRegistrarAbono = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!montoAbono || parseFloat(montoAbono) <= 0) {
      setErrorMsg('Monto de abono debe ser mayor a 0.');
      return;
    }

    try {
      const res = await fetch('/api/cuentas-por-cobrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuentaId: selectedCuenta.id,
          monto: montoAbono,
          metodoPago
        })
      });
      const json = await res.json();
      if (json.error) {
        setErrorMsg(json.error);
      } else {
        setIsAbonoOpen(false);
        loadCuentas();
      }
    } catch (err) {
      setErrorMsg('Error de red al registrar abono.');
    }
  };

  const filteredCuentas = cuentas.filter(c => 
    c.cliente.nombre.toLowerCase().includes(searchVal.toLowerCase()) ||
    c.venta.numFactura.includes(searchVal)
  );

  const headers = ['ID', 'Cliente', 'Factura', 'Fecha Límite', 'Monto Total', 'Saldo Pendiente', 'Estado', 'Acciones'];

  return (
    <div>
      <Header title="Cuentas por Cobrar e Historial de Abonos" />

      <div className="glass-panel" style={{ marginTop: '20px' }}>
        {loading ? (
          <p>Cargando cuentas...</p>
        ) : (
          <Table
            headers={headers}
            data={filteredCuentas}
            searchVal={searchVal}
            onSearchChange={setSearchVal}
            searchPlaceholder="Buscar por cliente, factura..."
            renderRow={(cuenta) => (
              <tr key={cuenta.id}>
                <td>{cuenta.id}</td>
                <td><strong>{cuenta.cliente.nombre}</strong></td>
                <td>{cuenta.venta.numFactura}</td>
                <td>
                  <span className={new Date(cuenta.fechaLimite) < new Date() && cuenta.estado !== 'pagada' ? 'text-danger font-bold' : ''}>
                    {formatDateShort(cuenta.fechaLimite)}
                  </span>
                </td>
                <td>{formatCurrency(cuenta.montoTotal)}</td>
                <td>
                  <strong className={cuenta.estado === 'pagada' ? 'text-success' : 'text-danger'}>
                    {formatCurrency(cuenta.saldoPendiente)}
                  </strong>
                </td>
                <td>
                  <span className={`badge ${
                    cuenta.estado === 'pagada' ? 'badge-success' : 
                    new Date(cuenta.fechaLimite) < new Date() ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {cuenta.estado === 'pagada' ? 'Pagada' : 
                     new Date(cuenta.fechaLimite) < new Date() ? 'Vencida' : 'Pendiente'}
                  </span>
                </td>
                <td className="table-row-actions">
                  <button onClick={() => openDetalleModal(cuenta)} className="btn btn-secondary btn-icon" title="Ver Abonos">
                    <Eye size={14} />
                  </button>
                  {cuenta.estado !== 'pagada' && (
                    <button onClick={() => openAbonoModal(cuenta)} className="btn btn-primary btn-icon" title="Abonar">
                      <Plus size={14} />
                    </button>
                  )}
                </td>
              </tr>
            )}
          />
        )}
      </div>

      {/* Modal Registrar Abono */}
      <Modal isOpen={isAbonoOpen} onClose={() => setIsAbonoOpen(false)} title="Registrar Abono / Pago">
        {selectedCuenta && (
          <form onSubmit={handleRegistrarAbono} className="form-modal-layout">
            {errorMsg && <div className="error-banner">{errorMsg}</div>}
            
            <div className="account-details-box">
              <p>Cliente: <strong>{selectedCuenta.cliente.nombre}</strong></p>
              <p>Factura: <strong>{selectedCuenta.venta.numFactura}</strong></p>
              <p>Saldo Pendiente: <strong className="text-danger">{formatCurrency(selectedCuenta.saldoPendiente)}</strong></p>
            </div>

            <div className="form-group">
              <label className="label-field">Monto del Abono ($)</label>
              <input 
                type="number" 
                step="0.01" 
                max={parseFloat(selectedCuenta.saldoPendiente)}
                required
                value={montoAbono} 
                onChange={(e) => setMontoAbono(e.target.value)} 
                className="input-field" 
              />
            </div>

            <div className="form-group">
              <label className="label-field">Método de Pago</label>
              <select 
                value={metodoPago} 
                onChange={(e) => setMetodoPago(e.target.value)} 
                className="input-field"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta (Débito/Crédito)</option>
                <option value="transferencia">Transferencia Bancaria</option>
              </select>
            </div>

            <div className="form-buttons">
              <button type="button" onClick={() => setIsAbonoOpen(false)} className="btn btn-secondary">Cancelar</button>
              <button type="submit" className="btn btn-primary">Registrar Abono</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Ver Abonos */}
      <Modal isOpen={isDetalleOpen} onClose={() => setIsDetalleOpen(false)} title="Detalle de Abonos y Pagos">
        {selectedCuenta && (
          <div className="modal-details-layout">
            <div className="account-summary-row glass-panel">
              <div>
                <h5>{selectedCuenta.cliente.nombre}</h5>
                <p>Factura: {selectedCuenta.venta.numFactura}</p>
                <p>Fecha Factura: {formatDate(selectedCuenta.venta.fecha)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p>Total Crédito: <strong>{formatCurrency(selectedCuenta.montoTotal)}</strong></p>
                <p>Saldo Pendiente: <strong className="text-danger">{formatCurrency(selectedCuenta.saldoPendiente)}</strong></p>
              </div>
            </div>

            <h4 style={{ marginTop: '16px', color: 'var(--accent-gold)' }}>Historial de Abonos</h4>
            <div className="table-container" style={{ marginTop: '8px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Registrado por</th>
                    <th>Método Pago</th>
                    <th>Monto Abono</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCuenta.abonos && selectedCuenta.abonos.length > 0 ? (
                    selectedCuenta.abonos.map((abono) => (
                      <tr key={abono.id}>
                        <td>{formatDate(abono.fecha)}</td>
                        <td>{abono.usuario?.nombre}</td>
                        <td><span className="badge badge-success">{abono.metodoPago.toUpperCase()}</span></td>
                        <td><strong>{formatCurrency(abono.monto)}</strong></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center italic text-secondary">No se han registrado abonos para esta cuenta.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="form-buttons" style={{ marginTop: '16px' }}>
              <button type="button" onClick={() => setIsDetalleOpen(false)} className="btn btn-secondary">Cerrar</button>
            </div>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .table-row-actions {
          display: flex;
          gap: 6px;
        }

        .text-danger { color: var(--error-red); }
        .text-success { color: var(--success-green); }
        .font-bold { font-weight: 600; }

        .account-details-box {
          background: rgba(0, 0, 0, 0.2);
          border: 1px dashed var(--panel-border);
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .account-summary-row {
          display: flex;
          justify-content: space-between;
          padding: 16px;
          font-size: 13px;
        }

        .modal-details-layout {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-modal-layout {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .error-banner {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--error-red);
          color: var(--error-red);
          padding: 10px;
          border-radius: 6px;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
