'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DashboardModule, ModulePanel, PanelToolbar } from '@/components/layout';
import { ProductPicker } from '@/components/shared';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Eye, Trash2, Search, X } from 'lucide-react';

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
  
  // Modal de selección de producto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeRowIdx, setActiveRowIdx] = useState(null);

  // Form
  const [proveedorId, setProveedorId] = useState('');
  const [provSearch, setProvSearch] = useState('');
  const [showProvDropdown, setShowProvDropdown] = useState(false);
  const [numFacturaProveedor, setNumFacturaProveedor] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [detalles, setDetalles] = useState([]); // Array de { productoId, cantidad, precioUnitario, numeroLote, fechaVencimiento }
  
  const [errorMsg, setErrorMsg] = useState('');

  // Portal Dropdown States
  const [mounted, setMounted] = useState(false);
  const [activeDropdownIdx, setActiveDropdownIdx] = useState(null);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 0 });

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

  useEffect(() => {
    setMounted(true);
    const handleScrollOrClick = (e) => {
      if (e.target.closest('.searchable-dropdown-portal') || e.target.closest('.pd-select-wide')) {
        return;
      }
      setActiveDropdownIdx(null);
    };
    window.addEventListener('scroll', handleScrollOrClick, true);
    window.addEventListener('click', handleScrollOrClick);
    return () => {
      window.removeEventListener('scroll', handleScrollOrClick, true);
      window.removeEventListener('click', handleScrollOrClick);
    };
  }, []);

  const openNewModal = () => {
    setProveedorId(proveedores[0]?.id || '');
    setProvSearch(proveedores[0]?.nombre || '');
    setShowProvDropdown(false);
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
      productoId: '', 
      prodSearch: '',
      cantidad: 1, 
      precioUnitario: 0, 
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

  const handleSelectProduct = (p, idx) => {
    setDetalles(detalles.map((d, i) => i === idx ? {
      ...d,
      productoId: p.id,
      prodSearch: p.nombre,
      precioUnitario: parseFloat(p.precioCompra) || 0
    } : d));
    setActiveDropdownIdx(null);
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

  const filteredProveedores = proveedores.filter(p => {
    if (!provSearch) return true;
    return p.nombre.toLowerCase().includes(provSearch.toLowerCase());
  });

  const headers = ['ID', 'Fecha', 'Proveedor', 'Factura Prov.', 'Registrado Por', 'Total Compra', 'Acciones'];

  return (
    <DashboardModule title="Compras">
      <ModulePanel loading={loading} loadingMessage="Cargando compras...">
        <PanelToolbar
          actions={
            <button onClick={openNewModal} className="btn btn-primary" disabled={proveedores.length === 0}>
              <Plus size={18} />
              <span>Registrar compra</span>
            </button>
          }
        />
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
      </ModulePanel>

      {/* Modal Registrar Compra */}
      <Modal isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="Registrar compra" size="xl">
        <form onSubmit={handleSubmit} className="form-modal-layout compras-form">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}

          <div className="compras-split-layout">
            <div className="compras-form-panel" onClick={(e) => e.stopPropagation()}>
              <h5 className="modal-block__title">Datos generales</h5>

              <div className="form-group searchable-select-container">
                <label className="label-field">Proveedor</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Buscar proveedor..."
                  value={provSearch}
                  onFocus={(e) => {
                    const rect = e.target.getBoundingClientRect();
                    setDropdownCoords({
                      top: rect.bottom + window.scrollY,
                      left: rect.left + window.scrollX,
                      width: rect.width
                    });
                    setActiveDropdownIdx('proveedor');
                    setDropdownSearch('');
                    setProvSearch('');
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProvSearch(val);
                    setDropdownSearch(val);
                    const rect = e.target.getBoundingClientRect();
                    setDropdownCoords({
                      top: rect.bottom + window.scrollY,
                      left: rect.left + window.scrollX,
                      width: rect.width
                    });
                  }}
                />
              </div>

              <div className="form-group">
                <label className="label-field">Factura proveedor # (opcional)</label>
                <input
                  type="text"
                  value={numFacturaProveedor}
                  onChange={(e) => setNumFacturaProveedor(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="label-field">Observaciones</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Notas sobre esta entrada..."
                />
              </div>
            </div>

            <div className="compras-items-panel" onClick={(e) => e.stopPropagation()}>
              <div className="compras-items-panel__header">
                <h5>Productos comprados</h5>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addDetailRow();
                  }}
                  className="btn btn-secondary compact-btn"
                >
                  + Agregar fila
                </button>
              </div>

              <div className="compras-lines-scroll">
                <p className="field-hint" style={{ marginBottom: '8px' }}>
                  Los lotes son informativos para alertas de vencimiento; las ventas descuentan stock general del producto.
                </p>
                <table className="compras-lines-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th style={{ width: '72px', textAlign: 'center' }}>Cant.</th>
                      <th style={{ width: '96px', textAlign: 'center' }}>Costo U.</th>
                      <th style={{ width: '88px' }}>Lote #</th>
                      <th style={{ width: '120px' }}>Vence</th>
                      <th style={{ width: '96px', textAlign: 'right' }}>Subtotal</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((det, idx) => (
                      <tr key={idx}>
                        <td>
                          <div
                            className="product-select-trigger"
                            onClick={() => {
                              setActiveRowIdx(idx);
                              setModalSearchQuery('');
                              setIsProductModalOpen(true);
                            }}
                          >
                            <span className={`product-select-trigger__label ${det.prodSearch ? 'product-select-trigger__label--filled' : 'product-select-trigger__label--empty'}`}>
                              {det.prodSearch || 'Seleccionar producto...'}
                            </span>
                            <Search size={14} />
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={det.cantidad}
                            onChange={(e) => updateDetailRow(idx, 'cantidad', parseInt(e.target.value) || 1)}
                            className="input-field compras-line-input compras-line-input--qty"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={det.precioUnitario}
                            onChange={(e) => updateDetailRow(idx, 'precioUnitario', parseFloat(e.target.value) || 0)}
                            className="input-field compras-line-input compras-line-input--qty data-money"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Lote"
                            value={det.numeroLote}
                            onChange={(e) => updateDetailRow(idx, 'numeroLote', e.target.value)}
                            className="input-field compras-line-input"
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            value={det.fechaVencimiento}
                            onChange={(e) => updateDetailRow(idx, 'fechaVencimiento', e.target.value)}
                            className="input-field compras-line-input"
                          />
                        </td>
                        <td className="data-money" style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(det.cantidad * det.precioUnitario)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDetailRow(idx);
                            }}
                            className="btn btn-danger btn-icon"
                            title="Eliminar fila"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {detalles.length === 0 && (
                  <p className="no-data-text">Agrega al menos un producto con «Agregar fila».</p>
                )}
              </div>

              {detalles.length > 0 && (
                <div className="compras-total-bar">
                  Total de la entrada:
                  <strong>{formatCurrency(detalles.reduce((sum, d) => sum + (d.cantidad * d.precioUnitario), 0))}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="modal-form-footer">
            <button type="button" onClick={() => setIsNewOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary">Registrar compra</button>
          </div>

          {mounted && activeDropdownIdx !== null && createPortal(
            <div 
              className="searchable-dropdown-portal"
              style={{
                position: 'absolute',
                top: `${dropdownCoords.top}px`,
                left: `${
                  activeDropdownIdx === 'proveedor' 
                    ? dropdownCoords.left 
                    : Math.max(10, Math.min(typeof window !== 'undefined' ? window.innerWidth - 670 : 1000, dropdownCoords.left - (650 - dropdownCoords.width) / 2))
                }px`,
                width: activeDropdownIdx === 'proveedor' ? `${dropdownCoords.width}px` : '650px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {activeDropdownIdx === 'proveedor' ? (
                (() => {
                  const filtered = proveedores.filter(p => 
                    p.nombre.toLowerCase().includes(dropdownSearch.toLowerCase())
                  );
                  return filtered.length > 0 ? (
                    filtered.map(p => (
                      <div 
                        key={p.id} 
                        className="searchable-option"
                        onClick={() => {
                          setProveedorId(p.id);
                          setProvSearch(p.nombre);
                          setActiveDropdownIdx(null);
                        }}
                      >
                        {p.nombre}
                      </div>
                    ))
                  ) : (
                    <div className="no-options">No se encontraron proveedores</div>
                  );
                })()
              ) : (
                (() => {
                  const filtered = productos.filter(p => 
                    p.nombre.toLowerCase().includes(dropdownSearch.toLowerCase()) ||
                    (p.codigoBarras && p.codigoBarras.includes(dropdownSearch))
                  );
                  return filtered.length > 0 ? (
                    filtered.map(p => (
                      <div 
                        key={p.id} 
                        className="searchable-option"
                        onClick={() => handleSelectProduct(p, activeDropdownIdx)}
                        style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}
                      >
                        {/* Image / Fallback Container */}
                        <div style={{ 
                          width: '72px', 
                          height: '72px', 
                          borderRadius: '8px', 
                          overflow: 'hidden', 
                          background: 'rgba(212, 168, 83, 0.08)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          marginRight: '16px',
                          flexShrink: 0,
                          border: '1px solid rgba(212, 168, 83, 0.2)',
                          position: 'relative'
                        }}>
                          {p.imagenUrl ? (
                            <img 
                              src={p.imagenUrl} 
                              alt={p.nombre} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'block';
                                }
                              }}
                            />
                          ) : null}
                          <svg 
                            style={{ 
                              width: '32px', 
                              height: '32px', 
                              color: 'var(--accent-gold)', 
                              display: p.imagenUrl ? 'none' : 'block' 
                            }} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>

                        {/* Product Details */}
                        <div style={{ flexGrow: 1, minWidth: 0, paddingRight: '16px', textAlign: 'left' }}>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15.5px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {p.nombre}
                          </div>
                          <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {p.marca && <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: '500', color: '#334155' }}>{p.marca}</span>}
                            {p.contenidoMl && <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', color: '#1e293b' }}>{p.contenidoMl} ml</span>}
                            {p.codigoBarras && <span style={{ color: '#64748b' }}>Cód: {p.codigoBarras}</span>}
                          </div>
                        </div>

                        {/* Cost */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.05em' }}>Costo</div>
                          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-gold)' }}>
                            {formatCurrency(p.precioCompra)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-options">No se encontraron productos</div>
                  );
                })()
              )}
            </div>,
            document.body
          )}
        </form>
      </Modal>

      {/* Modal Detalle Compra */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detalle de Compra" size="xl">
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

      <ProductPicker
        open={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        products={productos}
        onSelect={(p) => {
          setDetalles(detalles.map((d, i) => i === activeRowIdx ? {
            ...d,
            productoId: p.id,
            prodSearch: p.nombre,
            precioUnitario: parseFloat(p.precioCompra) || 0
          } : d));
        }}
        subtitle="Elige un producto para esta fila de compra"
      />
    </DashboardModule>
  );
}
