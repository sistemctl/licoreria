'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/utils';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';

export default function CombosPage() {
  const [combos, setCombos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Nuevo Combo');
  const [editingId, setEditingId] = useState(null);
  
  // Modal de selección de producto para ingredientes
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeRowIdx, setActiveRowIdx] = useState(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // Campos
  const [nombre, setNombre] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [precioVentaDetal, setPrecioVentaDetal] = useState('');
  const [ingredientes, setIngredientes] = useState([]); // Array de { productoId: int, cantidad: int }
  const [activo, setActivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  async function loadData() {
    try {
      const comRes = await fetch('/api/combos?activeOnly=false');
      const comJson = await comRes.json();
      setCombos(comJson);

      const prodRes = await fetch('/api/productos?activeOnly=true');
      const prodJson = await prodRes.json();
      // Filtrar para que los combos no sean ingredientes de otros combos recursivamente
      setProductos(prodJson.filter(p => !p.esCombo));

      const catRes = await fetch('/api/categorias?activeOnly=true');
      const catJson = await catRes.json();
      setCategorias(catJson);
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
    setModalTitle('Nuevo Combo');
    setEditingId(null);
    setNombre('');
    setCodigoBarras('');
    setDescripcion('');
    setCategoriaId(categorias[0]?.id || '');
    setPrecioVentaDetal('');
    setIngredientes([]);
    setActivo(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (combo) => {
    setModalTitle('Editar Combo');
    setEditingId(combo.id);
    setNombre(combo.nombre);
    setCodigoBarras(combo.codigoBarras || '');
    setDescripcion(combo.descripcion || '');
    setCategoriaId(combo.categoriaId);
    setPrecioVentaDetal(parseFloat(combo.precioVentaDetal));
    setIngredientes(
      combo.comboComoCombo.map(c => ({
        productoId: c.productoId,
        cantidad: c.cantidad
      }))
    );
    setActivo(combo.activo);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const addIngredientRow = () => {
    setIngredientes([...ingredientes, { productoId: '', cantidad: 1 }]);
  };

  const removeIngredientRow = (idx) => {
    setIngredientes(ingredientes.filter((_, i) => i !== idx));
  };

  const updateIngredientRow = (idx, field, val) => {
    setIngredientes(
      ingredientes.map((item, i) => {
        if (i === idx) {
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre || !categoriaId || !precioVentaDetal || ingredientes.length === 0) {
      setErrorMsg('Nombre, categoría, precio de venta e ingredientes son obligatorios.');
      return;
    }

    const payload = {
      nombre,
      codigoBarras,
      descripcion,
      categoriaId,
      precioVentaDetal,
      ingredientes,
      activo
    };

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/combos?id=${editingId}` : '/api/combos';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.error) {
        setErrorMsg(json.error);
      } else {
        setIsModalOpen(false);
        loadData();
      }
    } catch (e) {
      setErrorMsg('Error al guardar el combo.');
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('¿Seguro que deseas desactivar este combo?')) return;

    try {
      const res = await fetch(`/api/combos?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.error) {
        alert(json.error);
      } else {
        loadData();
      }
    } catch (e) {
      alert('Error de red al desactivar el combo.');
    }
  };

  const filteredCombos = combos.filter(c => 
    c.nombre.toLowerCase().includes(searchVal.toLowerCase()) ||
    (c.descripcion && c.descripcion.toLowerCase().includes(searchVal.toLowerCase()))
  );

  const headers = ['Código', 'Nombre Combo', 'Categoría', 'Ingredientes', 'Costo Compra', 'Precio Venta', 'Estado', 'Acciones'];

  return (
    <div>
      <Header title="Gestión de Combos (Promociones)" />

      <div className="table-actions glass-panel">
        <button onClick={openNewModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Nuevo Combo</span>
        </button>
      </div>

      <div className="glass-panel" style={{ marginTop: '20px' }}>
        {loading ? (
          <p>Cargando combos...</p>
        ) : (
          <Table
            headers={headers}
            data={filteredCombos}
            searchVal={searchVal}
            onSearchChange={setSearchVal}
            searchPlaceholder="Buscar combos..."
            renderRow={(combo) => (
              <tr key={combo.id}>
                <td>{combo.codigoBarras || '-'}</td>
                <td><strong>{combo.nombre}</strong></td>
                <td>{combo.categoria?.nombre}</td>
                <td>
                  <ul className="ingredients-list">
                    {combo.comboComoCombo.map((det) => (
                      <li key={det.id}>
                        {det.cantidad}x {det.producto?.nombre}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>{formatCurrency(combo.precioCompra)}</td>
                <td><strong className="text-gold">{formatCurrency(combo.precioVentaDetal)}</strong></td>
                <td>
                  <span className={`badge ${combo.activo ? 'badge-success' : 'badge-danger'}`}>
                    {combo.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="table-row-actions">
                  <button onClick={() => openEditModal(combo)} className="btn btn-secondary btn-icon" title="Editar">
                    <Edit2 size={14} />
                  </button>
                  {combo.activo && (
                    <button onClick={() => handleDeactivate(combo.id)} className="btn btn-danger btn-icon" title="Desactivar">
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            )}
          />
        )}
      </div>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <form onSubmit={handleSubmit} className="form-modal-layout">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}

          <div className="form-group">
            <label className="label-field">Nombre del Combo</label>
            <input 
              type="text" 
              required
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              className="input-field" 
              placeholder="Ej. Combo Rumbero Cacique"
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label className="label-field">Código (Opcional)</label>
              <input 
                type="text" 
                value={codigoBarras} 
                onChange={(e) => setCodigoBarras(e.target.value)} 
                className="input-field" 
              />
            </div>
            <div className="form-group half">
              <label className="label-field">Categoría</label>
              <select 
                value={categoriaId} 
                onChange={(e) => setCategoriaId(e.target.value)} 
                className="input-field"
              >
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="label-field">Precio Venta Detal del Combo ($)</label>
            <input 
              type="number" 
              step="0.01" 
              required
              value={precioVentaDetal} 
              onChange={(e) => setPrecioVentaDetal(e.target.value)} 
              className="input-field" 
            />
          </div>

          <div className="form-group">
            <label className="label-field">Descripción Corta</label>
            <textarea 
              value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)} 
              className="input-field" 
              rows="2"
            />
          </div>

          {/* Gestión Ingredientes */}
          <div className="ingredients-section">
            <div className="ingredients-header">
              <h5>Productos Incluidos en el Combo</h5>
              <button type="button" onClick={addIngredientRow} className="btn btn-secondary compact-btn">
                + Agregar Producto
              </button>
            </div>
            
            <div className="ingredients-rows">
              {ingredientes.map((ing, idx) => (
                <div key={idx} className="ingredient-row">
                  <div 
                    className="input-field ing-select"
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
                      color: ing.productoId ? '#1e293b' : '#94a3b8', 
                      fontWeight: ing.productoId ? '600' : 'normal', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      maxWidth: '85%' 
                    }}>
                      {(() => {
                        const prod = productos.find(p => p.id === parseInt(ing.productoId));
                        return prod ? `${prod.nombre} [Stock: ${prod.stock}]` : "Seleccionar producto...";
                      })()}
                    </span>
                    <Search size={14} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={ing.cantidad}
                    onChange={(e) => updateIngredientRow(idx, 'cantidad', e.target.value)}
                    className="input-field ing-qty"
                  />
                  <button type="button" onClick={() => removeIngredientRow(idx)} className="btn btn-danger compact-btn-icon">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {editingId && (
            <div className="form-group row-checkbox">
              <input 
                type="checkbox" 
                id="combo-activo" 
                checked={activo} 
                onChange={(e) => setActivo(e.target.checked)} 
              />
              <label htmlFor="combo-activo">Combo Activo</label>
            </div>
          )}

          <div className="form-buttons">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Combo</button>
          </div>
        </form>
      </Modal>

      {/* Selector de Producto Modal para Ingredientes de Combo */}
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
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Elige un ingrediente para agregarlo a este combo</p>
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
                      setIngredientes(ingredientes.map((d, i) => i === activeRowIdx ? {
                        ...d,
                        productoId: p.id
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
        .table-actions {
          display: flex;
          justify-content: flex-end;
          padding: 16px;
        }

        .table-row-actions {
          display: flex;
          gap: 6px;
        }

        .ingredients-list {
          padding-left: 16px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .text-gold { color: var(--accent-gold); }

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

        .row-checkbox {
          flex-direction: row;
          align-items: center;
          gap: 10px;
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
        }

        .ingredient-row {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .ing-select {
          flex-grow: 1;
        }

        .ing-qty {
          width: 80px;
          text-align: center;
        }

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
