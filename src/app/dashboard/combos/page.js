'use client';

import { useEffect, useState } from 'react';
import { DashboardModule, ModulePanel, PanelToolbar } from '@/components/layout';
import { ProductPicker } from '@/components/shared';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/utils';
import { Plus, Edit2, Trash2, Search, X, Package } from 'lucide-react';

export default function CombosPage() {
  const [combos, setCombos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Nuevo Combo');
  const [editingId, setEditingId] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeRowIdx, setActiveRowIdx] = useState(null);

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

  const costoEstimado = ingredientes.reduce((acc, ing) => {
    const prod = productos.find((p) => p.id === parseInt(ing.productoId));
    if (!prod) return acc;
    return acc + parseFloat(prod.precioCompra) * (parseInt(ing.cantidad, 10) || 0);
  }, 0);

  const precioNum = parseFloat(precioVentaDetal) || 0;
  const margenEstimado = precioNum - costoEstimado;

  const getProductoById = (productoId) =>
    productos.find((p) => p.id === parseInt(productoId, 10));

  const headers = ['Código', 'Nombre Combo', 'Categoría', 'Ingredientes', 'Costo Compra', 'Precio Venta', 'Estado', 'Acciones'];

  return (
    <DashboardModule title="Combos">
      <ModulePanel loading={loading} loadingMessage="Cargando combos...">
        <PanelToolbar
          actions={
            <button onClick={openNewModal} className="btn btn-primary">
              <Plus size={18} />
              <span>Nuevo combo</span>
            </button>
          }
        />
        <p className="combos-page-hint">
          <strong>Preparados y micheladas</strong> — define el precio de venta y qué ingredientes
          descuenta del inventario al cobrar en POS (ej. 1 cerveza Aguila por michelada).
        </p>
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
      </ModulePanel>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle} size="lg">
        <form onSubmit={handleSubmit} className="combo-form">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}

          <section className="combo-form__section">
            <p className="modal-section-title">Datos del preparado</p>
            <div className="combo-form__grid combo-form__grid--identity">
              <div className="combo-form__field combo-form__field--full">
                <label className="label-field" htmlFor="combo-nombre">Nombre</label>
                <input
                  id="combo-nombre"
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="input-field"
                  placeholder="Ej. Michelada con alcohol"
                />
              </div>

              <div className="combo-form__field">
                <label className="label-field" htmlFor="combo-codigo">Código</label>
                <input
                  id="combo-codigo"
                  type="text"
                  value={codigoBarras}
                  onChange={(e) => setCodigoBarras(e.target.value)}
                  className="input-field"
                  placeholder="Opcional"
                />
              </div>

              <div className="combo-form__field">
                <label className="label-field" htmlFor="combo-categoria">Categoría</label>
                <select
                  id="combo-categoria"
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="input-field"
                >
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="combo-form__field combo-form__field--full">
                <label className="label-field" htmlFor="combo-descripcion">Descripción</label>
                <textarea
                  id="combo-descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="input-field"
                  rows="2"
                  placeholder="Qué incluye este preparado"
                />
              </div>
            </div>
          </section>

          <section className="combo-form__section combo-form__section--recipe">
            <div className="combo-recipe__header">
              <div className="combo-recipe__intro">
                <p className="modal-section-title">Receta</p>
                <p className="combo-recipe__hint">
                  Ingredientes que se descuentan del inventario al vender en caja.
                </p>
              </div>
              <button type="button" onClick={addIngredientRow} className="btn btn-secondary">
                <Plus size={16} />
                <span>Agregar ingrediente</span>
              </button>
            </div>

            {ingredientes.length === 0 ? (
              <div className="combo-recipe__empty">
                <strong>Sin ingredientes</strong>
                Agrega al menos un producto del inventario, por ejemplo 1 cerveza.
              </div>
            ) : (
              <div className="combo-recipe__table">
                <div className="combo-recipe__colhead">
                  <span>Ingrediente</span>
                  <span>Cant.</span>
                  <span aria-hidden="true" />
                </div>
                <div className="combo-recipe__rows">
                  {ingredientes.map((ing, idx) => {
                    const prod = getProductoById(ing.productoId);
                    return (
                      <div key={idx} className="combo-recipe__row">
                        <button
                          type="button"
                          className="combo-recipe__picker"
                          onClick={() => {
                            setActiveRowIdx(idx);
                            setIsProductModalOpen(true);
                          }}
                        >
                          <span className={`combo-recipe__picker-name ${prod ? '' : 'is-placeholder'}`}>
                            {prod ? prod.nombre : 'Elegir producto…'}
                          </span>
                          {prod ? (
                            <span className="combo-recipe__picker-meta">Stock {prod.stock}</span>
                          ) : (
                            <Search size={14} aria-hidden="true" />
                          )}
                        </button>
                        <input
                          type="number"
                          min="1"
                          aria-label={`Cantidad de ${prod?.nombre || 'ingrediente'}`}
                          value={ing.cantidad}
                          onChange={(e) => updateIngredientRow(idx, 'cantidad', e.target.value)}
                          className="input-field combo-recipe__qty"
                        />
                        <button
                          type="button"
                          onClick={() => removeIngredientRow(idx)}
                          className="btn btn-danger combo-recipe__remove"
                          aria-label="Quitar ingrediente"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <section className="combo-form__section combo-form__section--pricing">
            <div className="combo-form__field combo-form__field--price">
              <label className="label-field" htmlFor="combo-precio">Precio de venta</label>
              <input
                id="combo-precio"
                type="number"
                step="0.01"
                required
                value={precioVentaDetal}
                onChange={(e) => setPrecioVentaDetal(e.target.value)}
                className="input-field"
                placeholder="0"
              />
            </div>

            <div className="combo-pricing__summary">
              <div className="combo-pricing__summary-row">
                <span>Costo receta</span>
                <strong>{formatCurrency(costoEstimado)}</strong>
              </div>
              <div className="combo-pricing__summary-row">
                <span>Precio venta</span>
                <strong>{formatCurrency(precioNum)}</strong>
              </div>
              <div className="combo-pricing__summary-row combo-pricing__summary-row--margin">
                <span>Margen estimado</span>
                <strong>{formatCurrency(margenEstimado)}</strong>
              </div>
            </div>
          </section>

          <footer className="combo-form__footer">
            {editingId ? (
              <div className="combo-form__status">
                <input
                  type="checkbox"
                  id="combo-activo"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                />
                <label htmlFor="combo-activo">Disponible en POS</label>
              </div>
            ) : (
              <div className="combo-form__status">
                <Package size={16} aria-hidden="true" />
                <span>Se guardará activo para venta en POS</span>
              </div>
            )}

            <div className="combo-form__actions">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar combo
              </button>
            </div>
          </footer>
        </form>
      </Modal>

      <ProductPicker
        open={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        products={productos}
        onSelect={(p) => {
          setIngredientes(ingredientes.map((d, i) => i === activeRowIdx ? { ...d, productoId: p.id } : d));
        }}
        title="Elegir ingrediente"
        subtitle="Producto del inventario que se descuenta al vender"
      />
    </DashboardModule>
  );
}