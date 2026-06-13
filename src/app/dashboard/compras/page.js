'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Header from '@/components/Header';
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
  const [modalSearchQuery, setModalSearchQuery] = useState('');

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
      <Modal isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="Registrar Compra (Entrada de Inventario)" size="xl">
        <form onSubmit={handleSubmit} className="form-modal-layout">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}

          <div className="compras-split-layout">
            {/* Columna Izquierda: Datos de Entrada de Factura */}
            <div className="metadata-section glass-panel" onClick={(e) => e.stopPropagation()}>
              <h5 className="section-title">Datos Generales</h5>
              
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="label-field">Proveedor</label>
                <div className="searchable-select-container">
                  <input 
                    type="text" 
                    className="input-field pd-select-wide"
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
              </div>

              <div className="form-group">
                <label className="label-field">Factura Proveedor # (Opcional)</label>
                <input 
                  type="text" 
                  value={numFacturaProveedor} 
                  onChange={(e) => setNumFacturaProveedor(e.target.value)} 
                  className="input-field" 
                />
              </div>

              <div className="form-group">
                <label className="label-field">Observaciones de Compra</label>
                <textarea 
                  value={observaciones} 
                  onChange={(e) => setObservaciones(e.target.value)} 
                  className="input-field" 
                  rows={3}
                  placeholder="Escribe observaciones aquí..."
                  style={{ resize: 'none', minHeight: '80px' }}
                />
              </div>

              <div className="form-buttons">
                <button type="button" onClick={() => setIsNewOpen(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Compra</button>
              </div>
            </div>

            {/* Columna Derecha: Productos Comprados */}
            <div className="ingredients-section" onClick={(e) => e.stopPropagation()} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
              <div className="ingredients-header">
                <h5>Productos Comprados</h5>
                <button 
                  type="button" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    addDetailRow(); 
                  }} 
                  className="btn btn-secondary compact-btn"
                >
                  + Agregar Fila
                </button>
              </div>

              <div className="table-container" style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid rgba(212, 168, 83, 0.15)', borderRadius: '8px' }}>
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(212, 168, 83, 0.08)' }}>
                      <th style={{ width: '38%', padding: '10px 8px', color: 'var(--text-secondary)' }}>Producto</th>
                      <th style={{ width: '10%', padding: '10px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cant.</th>
                      <th style={{ width: '14%', padding: '10px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>Costo U. ($)</th>
                      <th style={{ width: '13%', padding: '10px 8px', color: 'var(--text-secondary)' }}>Lote #</th>
                      <th style={{ width: '13%', padding: '10px 8px', color: 'var(--text-secondary)' }}>Vence</th>
                      <th style={{ width: '12%', padding: '10px 8px', textAlign: 'right', color: 'var(--text-secondary)' }}>Subtotal</th>
                      <th style={{ width: '5%', padding: '10px 8px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((det, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(212, 168, 83, 0.08)' }}>
                        <td style={{ padding: '6px 8px' }}>
                          <div 
                            className="input-field pd-select-wide"
                            style={{ 
                              padding: '8px 10px', 
                              fontSize: '13px', 
                              height: '36px', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              background: '#ffffff',
                              border: '1px solid rgba(0, 0, 0, 0.15)',
                              borderRadius: '6px',
                              userSelect: 'none'
                            }}
                            onClick={() => {
                              setActiveRowIdx(idx);
                              setModalSearchQuery('');
                              setIsProductModalOpen(true);
                            }}
                          >
                            <span style={{ 
                              color: det.prodSearch ? '#1e293b' : '#94a3b8', 
                              fontWeight: det.prodSearch ? '600' : 'normal', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap',
                              maxWidth: '85%' 
                            }}>
                              {det.prodSearch || "Seleccionar producto..."}
                            </span>
                            <Search size={14} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
                          </div>
                        </td>
                        <td style={{ padding: '6px 4px' }}>
                          <input
                            type="number"
                            min="1"
                            value={det.cantidad}
                            onChange={(e) => updateDetailRow(idx, 'cantidad', parseInt(e.target.value) || 1)}
                            className="input-field text-center"
                            style={{ padding: '6px 4px', fontSize: '13px', height: '36px' }}
                          />
                        </td>
                        <td style={{ padding: '6px 4px' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={det.precioUnitario}
                            onChange={(e) => updateDetailRow(idx, 'precioUnitario', parseFloat(e.target.value) || 0)}
                            className="input-field text-center font-mono"
                            style={{ padding: '6px 4px', fontSize: '13px', height: '36px' }}
                          />
                        </td>
                        <td style={{ padding: '6px 4px' }}>
                          <input
                            type="text"
                            placeholder="Lote"
                            value={det.numeroLote}
                            onChange={(e) => updateDetailRow(idx, 'numeroLote', e.target.value)}
                            className="input-field"
                            style={{ padding: '8px 10px', fontSize: '13px', height: '36px' }}
                          />
                        </td>
                        <td style={{ padding: '6px 4px' }}>
                          <input
                            type="date"
                            value={det.fechaVencimiento}
                            onChange={(e) => updateDetailRow(idx, 'fechaVencimiento', e.target.value)}
                            className="input-field"
                            style={{ padding: '8px 8px', fontSize: '12px', height: '36px' }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {formatCurrency(det.cantidad * det.precioUnitario)}
                        </td>
                        <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDetailRow(idx);
                            }} 
                            className="btn btn-danger" 
                            title="Eliminar fila"
                            style={{ padding: '6px', height: '32px', width: '32px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {detalles.length === 0 && (
                  <p className="no-data-text">No has agregado ningún producto todavía.</p>
                )}
              </div>

              {/* Total acumulado de la compra en tiempo real */}
              {detalles.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px', background: 'rgba(212, 168, 83, 0.05)', borderRadius: '6px', border: '1px solid rgba(212, 168, 83, 0.1)' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    Total Items Seleccionados: <strong style={{ color: 'var(--accent-gold)', fontSize: '16px', marginLeft: '6px' }}>{formatCurrency(detalles.reduce((sum, d) => sum + (d.cantidad * d.precioUnitario), 0))}</strong>
                  </span>
                </div>
              )}
            </div>
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

      {/* Selector de Producto Modal */}
      {isProductModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '16px'
        }} onClick={() => setIsProductModalOpen(false)}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(212, 168, 83, 0.2)',
            animation: 'modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fafafa'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Seleccionar Producto</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Elige un producto para agregarlo a la fila de compra</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsProductModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Buscador dentro del modal */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0, 0, 0, 0.05)', background: '#ffffff' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <input 
                  type="text"
                  placeholder="Buscar por nombre, marca o código de barras..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 48px',
                    fontSize: '14.5px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--accent-gold)',
                    outline: 'none',
                    boxShadow: '0 2px 8px rgba(212, 168, 83, 0.1)',
                    transition: 'border-color 0.2s'
                  }}
                />
                <Search size={18} style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--accent-gold)'
                }} />
                {modalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setModalSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Listado de Productos */}
            <div style={{
              flexGrow: 1,
              overflowY: 'auto',
              padding: '20px 24px',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {(() => {
                const filtered = productos.filter(p => 
                  p.nombre.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                  (p.marca && p.marca.toLowerCase().includes(modalSearchQuery.toLowerCase())) ||
                  (p.codigoBarras && p.codigoBarras.includes(modalSearchQuery))
                );

                if (filtered.length === 0) {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: '#64748b',
                      fontSize: '14px'
                    }}>
                      No se encontraron productos que coincidan con la búsqueda.
                    </div>
                  );
                }

                return filtered.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => {
                      setDetalles(detalles.map((d, i) => i === activeRowIdx ? {
                        ...d,
                        productoId: p.id,
                        prodSearch: p.nombre,
                        precioUnitario: parseFloat(p.precioCompra) || 0
                      } : d));
                      setIsProductModalOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#ffffff',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 18px',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                    className="modal-product-card"
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-gold)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 168, 83, 0.15)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    {/* Foto */}
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: 'rgba(212, 168, 83, 0.05)',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '20px',
                      flexShrink: 0
                    }}>
                      {p.imagenUrl ? (
                        <img 
                          src={p.imagenUrl} 
                          alt={p.nombre} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <svg 
                        style={{ 
                          width: '36px', 
                          height: '36px', 
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

                    {/* Detalle */}
                    <div style={{ flexGrow: 1, minWidth: 0, textAlign: 'left' }}>
                      <h4 style={{ margin: 0, fontSize: '16.5px', fontWeight: '700', color: '#1e293b' }}>{p.nombre}</h4>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px', fontSize: '12px' }}>
                        {p.marca && <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', color: '#475569', fontWeight: '500' }}>{p.marca}</span>}
                        {p.contenidoMl && <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', color: '#1e293b', fontWeight: '600' }}>{p.contenidoMl} ml</span>}
                        {p.stock !== undefined && (
                          <span style={{ 
                            background: p.stock <= p.stockMinimo ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', 
                            color: p.stock <= p.stockMinimo ? 'var(--error-red)' : '#16a34a',
                            padding: '2px 8px', 
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}>
                            Stock: {p.stock}
                          </span>
                        )}
                        {p.codigoBarras && <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>Cód: {p.codigoBarras}</span>}
                      </div>
                    </div>

                    {/* Costo */}
                    <div style={{ textAlign: 'right', marginLeft: '16px', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '2px' }}>Costo Compra</span>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-gold)' }}>{formatCurrency(p.precioCompra)}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .compras-split-layout {
          display: grid;
          grid-template-columns: 1fr 1.6fr;
          gap: 24px;
          align-items: start;
        }

        .metadata-section {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(212, 168, 83, 0.15);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
        }

        .section-title {
          font-size: 15px;
          color: var(--accent-gold);
          font-weight: 600;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

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
          background: rgba(212, 168, 83, 0.03);
          border: 1px solid rgba(212, 168, 83, 0.15);
          border-radius: 10px;
          padding: 16px;
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
          font-weight: 600;
        }

        .compact-btn {
          padding: 6px 12px;
          font-size: 12px;
        }

        .ingredients-rows {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 390px;
          overflow-y: auto;
          padding-right: 4px;
        }

        /* Purchase Detail Card Layout */
        .purchase-detail-card {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
        }

        .pd-card-row {
          display: flex;
          width: 100%;
        }

        .pd-select-wide {
          width: 100%;
          cursor: pointer;
        }

        .pd-card-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr 1fr 1.2fr auto;
          gap: 10px;
          align-items: flex-end;
        }

        .label-field-small {
          font-size: 10.5px;
          color: var(--text-secondary);
          margin-bottom: 2px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          font-weight: 600;
        }

        .delete-btn-group {
          display: flex;
          justify-content: center;
        }

        .compact-btn-icon-new {
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          width: 38px;
          border-radius: 6px;
        }

        .no-data-text {
          color: var(--text-secondary);
          font-size: 13px;
          text-align: center;
          font-style: italic;
          padding: 16px 0;
        }

        /* Searchable Select styles */
        .searchable-select-container {
          position: relative;
          width: 100%;
          z-index: 999;
        }

        .searchable-dropdown-portal {
          position: absolute;
          max-height: 220px;
          overflow-y: auto;
          z-index: 999999 !important;
          margin-top: 4px;
          padding: 4px 0;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(212, 168, 83, 0.25);
          background: #ffffff !important;
          border-radius: 8px;
        }

        .searchable-option {
          padding: 10px 14px;
          cursor: pointer;
          font-size: 13.5px;
          color: var(--text-primary);
          transition: background 0.15s, color 0.15s;
        }

        .searchable-option:hover {
          background: var(--accent-gold);
          color: #ffffff;
        }

        .no-options {
          padding: 8px 12px;
          font-size: 13px;
          color: var(--text-secondary);
          font-style: italic;
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

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
