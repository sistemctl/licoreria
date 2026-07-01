'use client';

import { useEffect, useState } from 'react';
import { DashboardModule, ModulePanel } from '@/components/layout';
import { FilterBar } from '@/components/shared';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { formatCurrency, formatDateTimeCompact } from '@/lib/utils';
import { Eye, Ban } from 'lucide-react';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';

export default function HistorialVentasPage() {
  const { posMethods, labelFor } = usePaymentMethods();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  // Filtros de Utilidad
  const [filterFechaInicio, setFilterFechaInicio] = useState('');
  const [filterFechaFin, setFilterFechaFin] = useState('');
  const [filterMetodoPago, setFilterMetodoPago] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterCajero, setFilterCajero] = useState('todos');

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

  // Extraer cajeros únicos de la lista de ventas
  const cajeros = Array.from(new Set(ventas.map(v => v.usuario?.nombre).filter(Boolean)));

  const filteredVentas = ventas.filter(v => {
    // 1. Buscador texto libre
    const matchesText = v.numFactura.toLowerCase().includes(searchVal.toLowerCase()) ||
      (v.cliente && v.cliente.nombre.toLowerCase().includes(searchVal.toLowerCase())) ||
      v.metodoPago.toLowerCase().includes(searchVal.toLowerCase());
    
    if (!matchesText) return false;

    // 2. Filtro Fecha Inicio
    if (filterFechaInicio) {
      const vDate = new Date(v.fecha);
      const startDate = new Date(filterFechaInicio + 'T00:00:00');
      if (vDate < startDate) return false;
    }

    // 3. Filtro Fecha Fin
    if (filterFechaFin) {
      const vDate = new Date(v.fecha);
      const endDate = new Date(filterFechaFin + 'T23:59:59');
      if (vDate > endDate) return false;
    }

    // 4. Filtro Método de Pago
    if (filterMetodoPago !== 'todos') {
      if (v.metodoPago.toLowerCase() !== filterMetodoPago.toLowerCase()) return false;
    }

    // 5. Filtro Estado
    if (filterEstado !== 'todos') {
      if (v.estado.toLowerCase() !== filterEstado.toLowerCase()) return false;
    }

    // 6. Filtro Cajero
    if (filterCajero !== 'todos') {
      if (v.usuario?.nombre !== filterCajero) return false;
    }

    return true;
  });

  const headers = ['Factura #', 'Fecha/Hora', 'Cliente', 'Cajero', 'Método Pago', 'Total', 'Estado', 'Acciones'];

  return (
    <DashboardModule title="Ventas">
      <ModulePanel loading={loading} loadingMessage="Cargando ventas...">
        <FilterBar
          onClear={() => {
            setFilterFechaInicio('');
            setFilterFechaFin('');
            setFilterMetodoPago('todos');
            setFilterEstado('todos');
            setFilterCajero('todos');
            setSearchVal('');
          }}
        >
          <div>
            <label className="label-field">Fecha inicio</label>
            <input
              type="date"
              value={filterFechaInicio}
              onChange={(e) => setFilterFechaInicio(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Fecha fin</label>
            <input
              type="date"
              value={filterFechaFin}
              onChange={(e) => setFilterFechaFin(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Método de pago</label>
            <select
              value={filterMetodoPago}
              onChange={(e) => setFilterMetodoPago(e.target.value)}
              className="input-field"
            >
              <option value="todos">Todos</option>
              {posMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Estado</label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="input-field"
            >
              <option value="todos">Todos</option>
              <option value="completada">Completada</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>
          <div>
            <label className="label-field">Cajero</label>
            <select
              value={filterCajero}
              onChange={(e) => setFilterCajero(e.target.value)}
              className="input-field"
            >
              <option value="todos">Todos</option>
              {cajeros.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </FilterBar>

        <Table
              headers={headers}
              data={filteredVentas}
              searchVal={searchVal}
              onSearchChange={setSearchVal}
              searchPlaceholder="Buscar por factura, cliente..."
              renderRow={(venta) => (
              <tr key={venta.id} className={venta.estado === 'anulada' ? 'low-stock-row' : ''}>
                <td className="col-code"><strong>{venta.numFactura}</strong></td>
                <td className="col-datetime">{formatDateTimeCompact(venta.fecha)}</td>
                <td>{venta.cliente?.nombre || 'Particular (General)'}</td>
                <td>{venta.usuario?.nombre}</td>
                <td><span className="badge badge-success">{labelFor(venta.metodoPago)}</span></td>
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
      </ModulePanel>

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
                <p>Método de Pago: <strong>{labelFor(selectedVenta.metodoPago)}</strong></p>
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
    </DashboardModule>
  );
}
