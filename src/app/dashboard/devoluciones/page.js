'use client';

import { useEffect, useState } from 'react';
import { DashboardModule, ModulePanel, PanelToolbar } from '@/components/layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Eye, Trash2, Search } from 'lucide-react';

export default function DevolucionesPage() {
  const [devoluciones, setDevoluciones] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  // Modales
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDevolucion, setSelectedDevolucion] = useState(null);

  // Form
  const [ventaId, setVentaId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [detalles, setDetalles] = useState([]); // Array de { productoId, cantidad, razon }
  
  const [ventaSeleccionadaObj, setVentaSeleccionadaObj] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function loadData() {
    try {
      const devRes = await fetch('/api/devoluciones');
      const devJson = await devRes.json();
      setDevoluciones(devJson);

      const vtsRes = await fetch('/api/ventas');
      const vtsJson = await vtsRes.json();
      setVentas(vtsJson.filter(v => v.estado === 'completada')); // Solo ventas completas
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setVentaId('');
    setMotivo('');
    setDetalles([]);
    setVentaSeleccionadaObj(null);
    setErrorMsg('');
    setIsNewOpen(true);
  };

  const handleVentaChange = async (vId) => {
    setVentaId(vId);
    if (!vId) {
      setVentaSeleccionadaObj(null);
      setDetalles([]);
      return;
    }

    try {
      const res = await fetch(`/api/ventas?id=${vId}`);
      const json = await res.json();
      setVentaSeleccionadaObj(json);
      
      // Inicializar detalles de devolución vacíos o con cantidad 0
      setDetalles(
        json.detalles.map(d => ({
          productoId: d.productoId,
          nombre: d.producto.nombre,
          cantidadVendida: d.cantidad,
          cantidad: 0,
          razon: 'Mal estado'
        }))
      );
    } catch (e) {
      alert('Error al obtener los detalles de la venta.');
    }
  };

  const updateDetailQty = (productoId, val) => {
    setDetalles(
      detalles.map(item => {
        if (item.productoId === productoId) {
          const v = Math.min(item.cantidadVendida, Math.max(0, parseInt(val) || 0));
          return { ...item, cantidad: v };
        }
        return item;
      })
    );
  };

  const updateDetailReason = (productoId, val) => {
    setDetalles(
      detalles.map(item => {
        if (item.productoId === productoId) {
          return { ...item, razon: val };
        }
        return item;
      })
    );
  };

  const openDetailModal = async (devId) => {
    try {
      const res = await fetch(`/api/devoluciones?id=${devId}`);
      const json = await res.json();
      setSelectedDevolucion(json);
      setIsDetailOpen(true);
    } catch (e) {
      alert('Error de red al cargar el detalle.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Filtrar solo los detalles que tienen cantidad > 0 para devolver
    const detallesFiltrados = detalles.filter(d => d.cantidad > 0);

    if (detallesFiltrados.length === 0 || !motivo) {
      setErrorMsg('Debes especificar al menos un producto a devolver con cantidad mayor a 0, y el motivo.');
      return;
    }

    try {
      const res = await fetch('/api/devoluciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventaId,
          motivo,
          detalles: detallesFiltrados.map(d => ({
            productoId: d.productoId,
            cantidad: d.cantidad,
            razon: d.razon
          }))
        })
      });
      const json = await res.json();
      if (json.error) {
        setErrorMsg(json.error);
      } else {
        setIsNewOpen(false);
        loadData();
      }
    } catch (err) {
      setErrorMsg('Error al registrar la devolución.');
    }
  };

  const filteredDevoluciones = devoluciones.filter(d => 
    d.venta.numFactura.toLowerCase().includes(searchVal.toLowerCase()) ||
    d.motivo.toLowerCase().includes(searchVal.toLowerCase())
  );

  const headers = ['ID', 'Fecha', 'Factura de Venta', 'Cajero', 'Motivo', 'Total Reembolsado', 'Acciones'];

  return (
    <DashboardModule title="Devoluciones">
      <ModulePanel loading={loading} loadingMessage="Cargando devoluciones...">
        <PanelToolbar
          split
          filters={
            <div className="table-search-bar">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por factura, motivo..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="input-field search-input"
              />
            </div>
          }
          actions={
            <button onClick={openNewModal} className="btn btn-primary" disabled={ventas.length === 0}>
              <Plus size={18} />
              <span>Nueva devolución</span>
            </button>
          }
        />
        <Table
            headers={headers}
            data={filteredDevoluciones}
            renderRow={(dev) => (
              <tr key={dev.id}>
                <td>{dev.id}</td>
                <td>{formatDate(dev.fecha)}</td>
                <td><strong>{dev.venta.numFactura}</strong></td>
                <td>{dev.usuario?.nombre}</td>
                <td>{dev.motivo}</td>
                <td><strong className="text-danger">{formatCurrency(dev.totalReembolsado)}</strong></td>
                <td className="table-row-actions">
                  <button onClick={() => openDetailModal(dev.id)} className="btn btn-secondary btn-icon" title="Ver Detalle">
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            )}
          />
      </ModulePanel>

      {/* Modal Nueva Devolución */}
      <Modal isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="Registrar Nueva Devolución">
        <form onSubmit={handleSubmit} className="form-modal-layout">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}

          <div className="form-row">
            <div className="form-group half">
              <label className="label-field">Factura de Venta Asociada</label>
              <select 
                value={ventaId} 
                onChange={(e) => handleVentaChange(e.target.value)} 
                className="input-field"
              >
                <option value="">Selecciona una factura...</option>
                {ventas.map(v => (
                  <option key={v.id} value={v.id}>{v.numFactura} - {v.cliente?.nombre || 'Particular'} [Total: ${parseFloat(v.total).toFixed(2)}]</option>
                ))}
              </select>
            </div>
            <div className="form-group half">
              <label className="label-field">Motivo General de la Devolución</label>
              <input 
                type="text" 
                required
                value={motivo} 
                onChange={(e) => setMotivo(e.target.value)} 
                className="input-field" 
                placeholder="Ej. Producto en mal estado, vencido"
              />
            </div>
          </div>

          {/* Tabla de Productos de la Venta */}
          {ventaSeleccionadaObj && (
            <div className="ingredients-section">
              <h5>Selecciona Cantidad a Devolver</h5>
              <div className="table-container" style={{ marginTop: '8px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Comprado</th>
                      <th>Devolver</th>
                      <th>Razón Específica</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((det) => (
                      <tr key={det.productoId}>
                        <td>{det.nombre}</td>
                        <td>{det.cantidadVendida}</td>
                        <td>
                          <input 
                            type="number" 
                            min="0"
                            max={det.cantidadVendida}
                            value={det.cantidad}
                            onChange={(e) => updateDetailQty(det.productoId, e.target.value)}
                            className="input-field table-qty-input"
                          />
                        </td>
                        <td>
                          <select 
                            value={det.razon}
                            onChange={(e) => updateDetailReason(det.productoId, e.target.value)}
                            className="input-field table-select-input"
                          >
                            <option value="Mal estado">Mal estado</option>
                            <option value="Vencido">Vencido</option>
                            <option value="Error de compra">Error de compra</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="form-buttons">
            <button type="button" onClick={() => setIsNewOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={!ventaId}>Procesar Devolución</button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalle Devolución */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detalle de Devolución">
        {selectedDevolucion && (
          <div className="modal-details-layout">
            <div className="account-summary-row glass-panel">
              <div>
                <h5>Factura de Venta: {selectedDevolucion.venta.numFactura}</h5>
                <p>Fecha Devolución: {formatDate(selectedDevolucion.fecha)}</p>
                <p>Cajero: {selectedDevolucion.usuario?.nombre}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p>Motivo: <strong>{selectedDevolucion.motivo}</strong></p>
                <p>Total Reembolsado: <strong className="text-danger">{formatCurrency(selectedDevolucion.totalReembolsado)}</strong></p>
              </div>
            </div>

            <h4 style={{ marginTop: '16px', color: 'var(--accent-gold)' }}>Productos Devueltos</h4>
            <div className="table-container" style={{ marginTop: '8px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad Devuelta</th>
                    <th>Razón Específica</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDevolucion.detalles.map((d) => (
                    <tr key={d.id}>
                      <td>{d.producto?.nombre}</td>
                      <td>{d.cantidad}</td>
                      <td>{d.razon || 'No especificada'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="form-buttons" style={{ marginTop: '16px' }}>
              <button type="button" onClick={() => setIsDetailOpen(false)} className="btn btn-secondary">Cerrar</button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardModule>
  );
}
