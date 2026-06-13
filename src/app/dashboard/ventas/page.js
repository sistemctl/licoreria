'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Eye, Ban } from 'lucide-react';

export default function HistorialVentasPage() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  // Modales
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);

  async function loadVentas() {
    try {
      const res = await fetch('/api/ventas');
      const json = await res.json();
      setVentas(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVentas();
  }, []);

  const openDetailModal = async (id) => {
    try {
      const res = await fetch(`/api/ventas?id=${id}`);
      const json = await res.json();
      setSelectedVenta(json);
      setIsDetailOpen(true);
    } catch (err) {
      alert('Error al cargar detalle de venta.');
    }
  };

  const handleAnular = async (id) => {
    if (!confirm('¿Seguro que deseas ANULAR esta venta? Esto devolverá los productos al stock y cancelará los saldos a crédito asociados.')) return;

    try {
      const res = await fetch(`/api/ventas?id=${id}&action=anular`, {
        method: 'PUT'
      });
      const json = await res.json();
      if (json.error) {
        alert(json.error);
      } else {
        alert('Venta anulada con éxito.');
        loadVentas();
        if (selectedVenta && selectedVenta.id === id) {
          setIsDetailOpen(false);
        }
      }
    } catch (err) {
      alert('Error de red al anular la venta.');
    }
  };

  const filteredVentas = ventas.filter(v => 
    v.numFactura.toLowerCase().includes(searchVal.toLowerCase()) ||
    (v.cliente && v.cliente.nombre.toLowerCase().includes(searchVal.toLowerCase())) ||
    v.metodoPago.toLowerCase().includes(searchVal.toLowerCase())
  );

  const headers = ['Factura #', 'Fecha/Hora', 'Cliente', 'Cajero', 'Método Pago', 'Total', 'Estado', 'Acciones'];

  return (
    <div>
      <Header title="Historial y Registro de Facturación" />

      <div className="glass-panel" style={{ marginTop: '20px' }}>
        {loading ? (
          <p>Cargando ventas...</p>
        ) : (
          <Table
            headers={headers}
            data={filteredVentas}
            searchVal={searchVal}
            onSearchChange={setSearchVal}
            searchPlaceholder="Buscar por factura, cliente..."
            renderRow={(venta) => (
              <tr key={venta.id} className={venta.estado === 'anulada' ? 'low-stock-row' : ''}>
                <td><strong>{venta.numFactura}</strong></td>
                <td>{formatDate(venta.fecha)}</td>
                <td>{venta.cliente?.nombre || 'Particular (General)'}</td>
                <td>{venta.usuario?.nombre}</td>
                <td><span className="badge badge-success">{venta.metodoPago.toUpperCase()}</span></td>
                <td><strong>{formatCurrency(venta.total)}</strong></td>
                <td>
                  <span className={`badge ${venta.estado === 'completada' ? 'badge-success' : 'badge-danger'}`}>
                    {venta.estado === 'completada' ? 'Completada' : 'Anulada'}
                  </span>
                </td>
                <td className="table-row-actions">
                  <button onClick={() => openDetailModal(venta.id)} className="btn btn-secondary btn-icon" title="Ver Detalle">
                    <Eye size={14} />
                  </button>
                  {venta.estado === 'completada' && (
                    <button onClick={() => handleAnular(venta.id)} className="btn btn-danger btn-icon" title="Anular Factura">
                      <Ban size={14} />
                    </button>
                  )}
                </td>
              </tr>
            )}
          />
        )}
      </div>

      {/* Modal Detalle Venta */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detalle de Factura de Venta">
        {selectedVenta && (
          <div className="modal-details-layout">
            <div className="account-summary-row glass-panel">
              <div>
                <h5>Factura: {selectedVenta.numFactura}</h5>
                <p>Fecha: {formatDate(selectedVenta.fecha)}</p>
                <p>Cajero: {selectedVenta.usuario?.nombre}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p>Cliente: {selectedVenta.cliente?.nombre || 'Particular'}</p>
                <p>Método de Pago: <strong>{selectedVenta.metodoPago.toUpperCase()}</strong></p>
                <p>Estado: <strong className={selectedVenta.estado === 'anulada' ? 'text-danger' : 'text-success'}>
                  {selectedVenta.estado.toUpperCase()}
                </strong></p>
              </div>
            </div>

            <h4 style={{ marginTop: '16px', color: 'var(--accent-gold)' }}>Productos Vendidos</h4>
            <div className="table-container" style={{ marginTop: '8px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Desc. Línea</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedVenta.detalles.map((d) => (
                    <tr key={d.id}>
                      <td>{d.producto?.nombre}</td>
                      <td>{d.cantidad}</td>
                      <td>{formatCurrency(d.precioUnitario)}</td>
                      <td>{formatCurrency(d.descuentoLinea)}</td>
                      <td><strong>{formatCurrency(d.subtotal)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="checkout-summary-block">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedVenta.subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Descuento Aplicado:</span>
                <span className="text-danger">-{formatCurrency(selectedVenta.descuentoTotal)}</span>
              </div>
              <div className="summary-row total-row">
                <span>Total Facturado:</span>
                <span className="text-gold">{formatCurrency(selectedVenta.total)}</span>
              </div>
            </div>

            <div className="form-buttons" style={{ marginTop: '16px' }}>
              {selectedVenta.estado === 'completada' && (
                <button type="button" onClick={() => handleAnular(selectedVenta.id)} className="btn btn-danger" style={{ marginRight: 'auto' }}>
                  Anular Venta
                </button>
              )}
              <button type="button" onClick={() => setIsDetailOpen(false)} className="btn btn-secondary">Cerrar</button>
            </div>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .table-row-actions {
          display: flex;
          gap: 6px;
        }

        .low-stock-row td {
          background: rgba(239, 68, 68, 0.02);
          text-decoration: line-through;
        }

        .text-danger { color: var(--error-red); }
        .text-success { color: var(--success-green); }

        .account-summary-row {
          display: flex;
          justify-content: space-between;
          padding: 16px;
          font-size: 13px;
        }

        .checkout-summary-block {
          margin-top: 16px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .total-row {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          border-top: 1px dashed rgba(212, 168, 83, 0.2);
          padding-top: 6px;
          margin-top: 4px;
        }

        .text-gold { color: var(--accent-gold); }

        .modal-details-layout {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}
