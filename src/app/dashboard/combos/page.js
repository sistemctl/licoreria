'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/utils';
import { Plus, Edit2, Trash2 } from 'lucide-react';

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
    setIngredientes([...ingredientes, { productoId: productos[0]?.id || '', cantidad: 1 }]);
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
                  <select
                    value={ing.productoId}
                    onChange={(e) => updateIngredientRow(idx, 'productoId', e.target.value)}
                    className="input-field ing-select"
                  >
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} [Stock: {p.stock}]</option>
                    ))}
                  </select>
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
      `}</style>
    </div>
  );
}
