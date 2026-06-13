'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Eye, Trash2 } from 'lucide-react';

export default function ComprasPage() {
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  // Modales
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState(null);

  // Form
  const [proveedorId, setProveedorId] = useState('');
  const [numFacturaProveedor, setNumFacturaProveedor] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [detalles, setDetalles] = useState([]); // Array de { productoId, cantidad, precioUnitario, numeroLote, fechaVencimiento }
  
  const [errorMsg, setErrorMsg] = useState('');

  async function loadData() {
    try {
      const compRes = await fetch('/api/compras');
      const compJson = await compRes.json();
      setCompras(compJson);

      const provRes = await fetch('/api/proveedores?activeOnly=true');
      const provJson = await provRes.json();
      setProveedores(provJson);

      const prodRes = await fetch('/api/productos?activeOnly=true');
      const prodJson = await prodRes.json();
      setProductos(prodJson.filter(p => !p.esCombo)); // Solo productos, no combos
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
    setProveedorId(proveedores[0]?.id || '');
    setNumFacturaProveedor('');
    setObservaciones('');
    setDetalles([]);
    setErrorMsg('');
    setIsNewOpen(true);
  };

  const openDetailModal = async (compraId) => {
    try {
      const res = await fetch(`/api/compras?id=${compraId}`);
      const json = await res.json();
      setSelectedCompra(json);
      setIsDetailOpen(true);
    } catch (e) {
      alert('Error de red al cargar el detalle de compra.');
    }
  };

  const addDetailRow = () => {
    setDetalles([...detalles, { 
      productoId: productos[0]?.id || '', 
      cantidad: 1, 
      precioUnitario: productos[0]?.precioCompra ? parseFloat(productos[0].precioCompra) : 0, 
      numeroLote: '', 
      fechaVencimiento: '' 
    }]);
  };

  const removeDetailRow = (idx) => {
    setDetalles(detalles.filter((_, i) => i !== idx));
  };

  const updateDetailRow = (idx, field, val) => {
    setDetalles(
      detalles.map((item, i) => {
        if (i === idx) {
          const updated = { ...item, [field]: val };
          // Auto-fill price purchase if product changed
          if (field === 'productoId') {
            const p = productos.find(prod => prod.id === parseInt(val));
            if (p) {
              updated.precioUnitario = parseFloat(p.precioCompra);
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!proveedorId || detalles.length === 0) {
      setErrorMsg('Proveedor e ítems de compra son obligatorios.');
      return;
    }

    try {
      const res = await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedorId,
          numFacturaProveedor,
          observaciones,
          detalles
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
      setErrorMsg('Error al registrar la compra.');
    }
  };

  const filteredCompras = compras.filter(c => 
    c.proveedor.nombre.toLowerCase().includes(searchVal.toLowerCase()) ||
    (c.numFacturaProveedor && c.numFacturaProveedor.includes(searchVal))
  );

  const headers = ['ID', 'Fecha', 'Proveedor', 'Factura Prov.', 'Registrado Por', 'Total Compra', 'Acciones'];

  return (
    <div>
      <Header title="Registro y Control de Compras (Entradas)" />

      <div className="table-actions glass-panel">
        <button onClick={openNewModal} className="btn btn-primary" disabled={proveedores.length === 0}>
          <Plus size={18} />
          <span>Registrar Compra</span>
        </button>
      </div>

      <div className="glass-panel" style={{ marginTop: '20px' }}>
        {loading ? (
          <p>Cargando compras...</p>
        ) : (
          <Table
            headers={headers}
            data={filteredCompras}
            searchVal={searchVal}
            onSearchChange={setSearchVal}
            searchPlaceholder="Buscar por proveedor, factura..."
            renderRow={(comp) => (
              <tr key={comp.id}>
                <td>{comp.id}</td>
                <td>{formatDate(comp.fecha)}</td>
                <td><strong>{comp.proveedor.nombre}</strong></td>
                <td>{comp.numFacturaProveedor || '-'}</td>
                <td>{comp.usuario?.nombre}</td>
                <td><strong>{formatCurrency(comp.total)}</strong></td>
                <td className="table-row-actions">
                  <button onClick={() => openDetailModal(comp.id)} className="btn btn-secondary btn-icon" title="Ver Detalle">
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            )}
          />
        )}
      </div>

      {/* Modal Registrar Compra */}
      <Modal isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="Registrar Compra (Entrada de Inventario)">
        <form onSubmit={handleSubmit} className="form-modal-layout">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}

          <div className="form-row">
            <div className="form-group half">
              <label className="label-field">Proveedor</label>
              <select 
                value={proveedorId} 
                onChange={(e) => setProveedorId(e.target.value)} 
                className="input-field"
              >
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-group half">
              <label className="label-field">Factura Proveedor # (Opcional)</label>
              <input 
                type="text" 
                value={numFacturaProveedor} 
                onChange={(e) => setNumFacturaProveedor(e.target.value)} 
                className="input-field" 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label-field">Observaciones de Compra</label>
            <input 
              type="text" 
              value={observaciones} 
              onChange={(e) => setObservaciones(e.target.value)} 
              className="input-field" 
            />
          </div>

          {/* Detalles de Compra */}
          <div className="ingredients-section">
            <div className="ingredients-header">
              <h5>Productos Comprados</h5>
              <button type="button" onClick={addDetailRow} className="btn btn-secondary compact-btn">
                + Agregar Fila
              </button>
            </div>

            <div className="ingredients-rows">
              {detalles.map((det, idx) => (
                <div key={idx} className="purchase-detail-row">
                  <select
                    value={det.productoId}
                    onChange={(e) => updateDetailRow(idx, 'productoId', e.target.value)}
                    className="input-field pd-select"
                  >
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} [Costo actual: ${parseFloat(p.precioCompra).toFixed(2)}]</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    placeholder="Cant."
                    value={det.cantidad}
                    onChange={(e) => updateDetailRow(idx, 'cantidad', e.target.value)}
                    className="input-field pd-qty"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Costo u."
                    value={det.precioUnitario}
                    onChange={(e) => updateDetailRow(idx, 'precioUnitario', e.target.value)}
                    className="input-field pd-price"
                  />
                  <input
                    type="text"
                    placeholder="Lote #"
                    value={det.numeroLote}
                    onChange={(e) => updateDetailRow(idx, 'numeroLote', e.target.value)}
                    className="input-field pd-lote"
                  />
                  <input
                    type="date"
                    value={det.fechaVencimiento}
                    onChange={(e) => updateDetailRow(idx, 'fechaVencimiento', e.target.value)}
                    className="input-field pd-vence"
                  />
                  <button type="button" onClick={() => removeDetailRow(idx)} className="btn btn-danger compact-btn-icon">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-buttons">
            <button type="button" onClick={() => setIsNewOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary">Registrar Compra</button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalle Compra */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detalle de Compra">
        {selectedCompra && (
          <div className="modal-details-layout">
            <div className="account-summary-row glass-panel">
              <div>
                <h5>Proveedor: {selectedCompra.proveedor.nombre}</h5>
                <p>Factura: {selectedCompra.numFacturaProveedor || 'N/A'}</p>
                <p>Fecha: {formatDate(selectedCompra.fecha)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p>Registrado por: {selectedCompra.usuario?.nombre}</p>
                <p>Total Compra: <strong>{formatCurrency(selectedCompra.total)}</strong></p>
              </div>
            </div>

            <h4 style={{ marginTop: '16px', color: 'var(--accent-gold)' }}>Productos Ingresados</h4>
            <div className="table-container" style={{ marginTop: '8px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Costo Unitario</th>
                    <th>Lote # / Vence</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCompra.detalles.map((d) => (
                    <tr key={d.id}>
                      <td>{d.producto?.nombre}</td>
                      <td>{d.cantidad}</td>
                      <td>{formatCurrency(d.precioUnitario)}</td>
                      <td>
                        {d.lotes && d.lotes.length > 0 ? (
                          d.lotes.map(l => (
                            <div key={l.id}>
                              <span>Lote: {l.numeroLote || 'N/A'}</span>
                              {l.fechaVencimiento && (
                                <span className="text-secondary text-xs"> (Vence: {new Date(l.fechaVencimiento).toLocaleDateString()})</span>
                              )}
                            </div>
                          ))
                        ) : 'Sin lote'}
                      </td>
                      <td><strong>{formatCurrency(d.subtotal)}</strong></td>
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

      <style jsx>{`
        .table-actions {
          display: flex;
          justify-content: flex-end;
          padding: 16px;
        }

        .table-row-actions {
          display: flex;
          gap: 6px;
        }

        .form-modal-layout {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .half {
          flex: 1;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ingredients-section {
          background: rgba(0, 0, 0, 0.15);
          border: 1px solid var(--panel-border);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ingredients-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ingredients-header h5 {
          color: var(--accent-gold);
        }

        .compact-btn {
          padding: 6px 12px;
          font-size: 12px;
        }

        .ingredients-rows {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
        }

        .purchase-detail-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .pd-select { flex: 2.5; }
        .pd-qty { width: 70px; text-align: center; }
        .pd-price { width: 90px; text-align: center; }
        .pd-lote { width: 90px; }
        .pd-vence { width: 120px; }

        .compact-btn-icon {
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .form-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
        }

        .error-banner {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--error-red);
          color: var(--error-red);
          padding: 10px;
          border-radius: 6px;
          font-size: 13px;
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

        .text-xs { font-size: 11px; }
      `}</style>
    </div>
  );
}
