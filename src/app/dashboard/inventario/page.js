'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DashboardModule, ModulePanel } from '@/components/layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import BarcodePrinter from '@/components/BarcodePrinter';
import { formatCurrency } from '@/lib/utils';
import { Plus, Edit2, Trash2, Printer, Search, Package, AlertTriangle, Archive, X } from 'lucide-react';

function StockMeter({ stock, min }) {
  const safeMin = Math.max(min, 1);
  const pct = Math.min(100, Math.round((stock / (safeMin * 2)) * 100));
  const tone = stock <= min ? 'critical' : stock <= min * 1.5 ? 'warn' : 'ok';

  return (
    <div className={`stock-meter stock-meter--${tone}`} role="presentation">
      <div className="stock-meter__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function InventarioPage() {
  const [data, setData] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedStock, setSelectedStock] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Nuevo Producto');
  const [editingId, setEditingId] = useState(null);

  const [codigoBarras, setCodigoBarras] = useState('');
  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [contenidoMl, setContenidoMl] = useState('');
  const [gradoAlcoholico, setGradoAlcoholico] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [precioCompra, setPrecioCompra] = useState(0);
  const [precioVentaDetal, setPrecioVentaDetal] = useState(0);
  const [precioVentaMayor, setPrecioVentaMayor] = useState('');
  const [stock, setStock] = useState(0);
  const [stockMinimo, setStockMinimo] = useState(5);
  const [unidadMedida, setUnidadMedida] = useState('unidad');
  const [unidadesPorCaja, setUnidadesPorCaja] = useState('');
  const [activo, setActivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [barcodePrintVal, setBarcodePrintVal] = useState('');
  const [barcodePrintName, setBarcodePrintName] = useState('');
  const [barcodePrintPrice, setBarcodePrintPrice] = useState('');

  async function loadData() {
    try {
      const prodRes = await fetch('/api/productos?activeOnly=false');
      const prodJson = await prodRes.json();
      setData(prodJson);

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

  const products = useMemo(() => data.filter((p) => !p.esCombo), [data]);

  const brands = useMemo(() => [...new Set(products.map((p) => p.marca).filter(Boolean))], [products]);

  const stats = useMemo(() => {
    const low = products.filter((p) => p.stock <= p.stockMinimo).length;
    const inactive = products.filter((p) => !p.activo).length;
    return { total: products.length, low, inactive, active: products.length - inactive };
  }, [products]);

  const filteredData = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.nombre.toLowerCase().includes(searchVal.toLowerCase()) ||
        (p.codigoBarras && p.codigoBarras.includes(searchVal)) ||
        (p.marca && p.marca.toLowerCase().includes(searchVal.toLowerCase()));

      const matchesCat = selectedCat === '' || p.categoriaId === parseInt(selectedCat, 10);
      const matchesBrand = selectedBrand === '' || p.marca === selectedBrand;
      const matchesStock =
        selectedStock === '' ||
        (selectedStock === 'bajo' && p.stock <= p.stockMinimo) ||
        (selectedStock === 'normal' && p.stock > p.stockMinimo);
      const matchesEstado = !activeOnly || p.activo;

      return matchesSearch && matchesCat && matchesBrand && matchesStock && matchesEstado;
    });
  }, [products, searchVal, selectedCat, selectedBrand, selectedStock, activeOnly]);

  const hasActiveFilters = Boolean(
    searchVal || selectedCat || selectedBrand || selectedStock || !activeOnly
  );

  const activeChips = useMemo(() => {
    const chips = [];
    if (searchVal.trim()) {
      chips.push({ id: 'search', label: `“${searchVal.trim()}”`, onRemove: () => setSearchVal('') });
    }
    if (selectedCat) {
      const cat = categorias.find((c) => c.id === parseInt(selectedCat, 10));
      if (cat) chips.push({ id: 'cat', label: cat.nombre, onRemove: () => setSelectedCat('') });
    }
    if (selectedBrand) {
      chips.push({ id: 'brand', label: selectedBrand, onRemove: () => setSelectedBrand('') });
    }
    if (selectedStock === 'bajo') {
      chips.push({ id: 'stock', label: 'Bajo mínimo', onRemove: () => setSelectedStock('') });
    }
    if (selectedStock === 'normal') {
      chips.push({ id: 'stock', label: 'Stock normal', onRemove: () => setSelectedStock('') });
    }
    if (!activeOnly) {
      chips.push({ id: 'estado', label: 'Incluye inactivos', onRemove: () => setActiveOnly(true) });
    }
    return chips;
  }, [searchVal, selectedCat, selectedBrand, selectedStock, activeOnly, categorias]);

  const showingLabel =
    hasActiveFilters && filteredData.length !== stats.total
      ? `Mostrando ${filteredData.length} de ${stats.total}`
      : `${stats.total} ${stats.total === 1 ? 'producto' : 'productos'}`;

  const clearFilters = () => {
    setSearchVal('');
    setSelectedCat('');
    setSelectedBrand('');
    setSelectedStock('');
    setActiveOnly(true);
  };

  const openNewModal = () => {
    setModalTitle('Nuevo producto');
    setEditingId(null);
    setCodigoBarras('');
    setNombre('');
    setMarca('');
    setDescripcion('');
    setContenidoMl('');
    setGradoAlcoholico('');
    setImagenUrl('');
    setCategoriaId(categorias[0]?.id || '');
    setPrecioCompra(0);
    setPrecioVentaDetal(0);
    setPrecioVentaMayor('');
    setStock(0);
    setStockMinimo(5);
    setUnidadMedida('unidad');
    setUnidadesPorCaja('');
    setActivo(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setModalTitle('Editar producto');
    setEditingId(prod.id);
    setCodigoBarras(prod.codigoBarras || '');
    setNombre(prod.nombre);
    setMarca(prod.marca || '');
    setDescripcion(prod.descripcion || '');
    setContenidoMl(prod.contenidoMl || '');
    setGradoAlcoholico(prod.gradoAlcoholico || '');
    setImagenUrl(prod.imagenUrl || '');
    setCategoriaId(prod.categoriaId);
    setPrecioCompra(parseFloat(prod.precioCompra));
    setPrecioVentaDetal(parseFloat(prod.precioVentaDetal));
    setPrecioVentaMayor(prod.precioVentaMayor ? parseFloat(prod.precioVentaMayor) : '');
    setStock(prod.stock);
    setStockMinimo(prod.stockMinimo);
    setUnidadMedida(prod.unidadMedida);
    setUnidadesPorCaja(prod.unidadesPorCaja || '');
    setActivo(prod.activo);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre || !categoriaId || precioCompra === undefined || precioVentaDetal === undefined) {
      setErrorMsg('Nombre, categoría, precio compra y precio venta detal son requeridos.');
      return;
    }

    const payload = {
      codigoBarras,
      nombre,
      marca,
      descripcion,
      contenidoMl,
      gradoAlcoholico,
      imagenUrl,
      categoriaId,
      precioCompra,
      precioVentaDetal,
      precioVentaMayor,
      stock,
      stockMinimo,
      unidadMedida,
      unidadesPorCaja,
      activo,
      esCombo: false,
    };

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/productos?id=${editingId}` : '/api/productos';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.error) {
        setErrorMsg(json.error);
      } else {
        setIsModalOpen(false);
        loadData();
      }
    } catch {
      setErrorMsg('Error de red al procesar el producto.');
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('¿Seguro que deseas desactivar este producto?')) return;

    try {
      const res = await fetch(`/api/productos?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.error) {
        alert(json.error);
      } else {
        loadData();
      }
    } catch {
      alert('Error al desactivar el producto.');
    }
  };

  const selectForBarcodePrint = (prod) => {
    if (!prod.codigoBarras) {
      alert('Este producto no tiene asignado un código de barras.');
      return;
    }
    setBarcodePrintVal(prod.codigoBarras);
    setBarcodePrintName(prod.nombre);
    setBarcodePrintPrice(prod.precioVentaDetal);
  };

  const toggleLowStockFilter = () => {
    setSelectedStock((prev) => (prev === 'bajo' ? '' : 'bajo'));
  };

  const toggleInactiveFilter = () => {
    setActiveOnly((prev) => !prev);
  };

  const productMetaLine = (prod) => {
    const parts = [
      prod.marca,
      prod.contenidoMl ? `${prod.contenidoMl} ml` : null,
      prod.codigoBarras,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : null;
  };

  const headers = ['Producto', 'Categoría', 'Precio venta', 'Stock', ''];

  return (
    <DashboardModule title="Inventario" className="inventory-page">
      {barcodePrintVal && (
        <div className="barcode-box glass-panel animate-fade-in">
          <div>
            <h5>Código de barras</h5>
            <p className="barcode-box__hint">{barcodePrintName}</p>
          </div>
          <BarcodePrinter value={barcodePrintVal} name={barcodePrintName} price={barcodePrintPrice} />
          <button type="button" onClick={() => setBarcodePrintVal('')} className="btn btn-secondary btn-sm">
            Cerrar
          </button>
        </div>
      )}

      <ModulePanel loading={loading} loadingMessage="Cargando productos...">
        <div className="inventory-panel">
          <header className="inventory-deck__head">
            <div className="inventory-deck__intro">
              <div className="inventory-deck__title-row">
                <h2 className="inventory-deck__title">Catálogo</h2>
                <span className="inventory-deck__count">{showingLabel}</span>
              </div>
              <div className="inventory-deck__metrics" aria-label="Resumen de inventario">
                <span className="inv-metric">
                  <Package size={13} aria-hidden="true" />
                  <span>{stats.total} en catálogo</span>
                </span>
                <button
                  type="button"
                  className={`inv-metric inv-metric--action ${stats.low > 0 ? 'inv-metric--alert' : ''} ${selectedStock === 'bajo' ? 'inv-metric--active' : ''}`}
                  onClick={toggleLowStockFilter}
                  aria-pressed={selectedStock === 'bajo'}
                >
                  <AlertTriangle size={13} aria-hidden="true" />
                  <span>{stats.low} bajo mínimo</span>
                </button>
                {stats.inactive > 0 && (
                  <button
                    type="button"
                    className={`inv-metric inv-metric--action ${!activeOnly ? 'inv-metric--active' : ''}`}
                    onClick={toggleInactiveFilter}
                    aria-pressed={!activeOnly}
                  >
                    <Archive size={13} aria-hidden="true" />
                    <span>{stats.inactive} inactivos</span>
                  </button>
                )}
              </div>
            </div>
            <Link href="/dashboard/mermas" className="btn btn-secondary inventory-deck__cta">
              <Archive size={16} />
              <span>Mermas</span>
            </Link>
            <button type="button" onClick={openNewModal} className="btn btn-primary inventory-deck__cta">
              <Plus size={18} />
              <span>Nuevo producto</span>
            </button>
          </header>

          <div className="inventory-deck__filters" role="search" aria-label="Filtrar productos">
            <div className="inv-search">
              <Search size={18} className="inv-search__icon" aria-hidden="true" />
              <input
                id="inv-search"
                type="search"
                autoComplete="off"
                autoFocus
                placeholder="Buscar por nombre o escanear código de barras…"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="input-field inv-search__input"
              />
              {searchVal && (
                <button
                  type="button"
                  className="inv-search__clear"
                  onClick={() => setSearchVal('')}
                  aria-label="Borrar búsqueda"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <select
              id="inv-cat"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="input-field inv-filter-select"
              aria-label="Categoría"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
            <select
              id="inv-brand"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="input-field inv-filter-select"
              aria-label="Marca"
            >
              <option value="">Todas las marcas</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <label className="inv-toggle">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
              />
              <span>Solo activos</span>
            </label>
            {hasActiveFilters && (
              <button type="button" className="btn btn-ghost btn-sm inv-filter-clear" onClick={clearFilters}>
                Limpiar
              </button>
            )}
          </div>

          {activeChips.length > 0 && (
            <div className="inventory-deck__chips" aria-label="Filtros activos">
              {activeChips.map((chip) => (
                <button key={chip.id} type="button" className="inv-chip" onClick={chip.onRemove}>
                  <span>{chip.label}</span>
                  <X size={12} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}

          <Table
            headers={headers}
            data={filteredData}
            emptyTitle="Sin productos"
            emptyDescription="No hay productos que coincidan con los filtros."
            renderRow={(prod) => {
              const isLow = prod.stock <= prod.stockMinimo;
              const isOut = prod.stock === 0;
              const meta = productMetaLine(prod);

              return (
                <tr
                  key={prod.id}
                  className={[
                    isOut && prod.activo ? 'inventory-row--out' : '',
                    isLow && !isOut && prod.activo ? 'inventory-row--low' : '',
                    !prod.activo ? 'inventory-row--inactive' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <td className="col-product">
                    <div className="product-cell">
                      <span className="product-cell__name">{prod.nombre}</span>
                      {meta && <span className="product-cell__meta">{meta}</span>}
                      {!prod.activo && <span className="product-cell__status">Inactivo</span>}
                    </div>
                  </td>
                  <td className="col-category">
                    <span className="category-tag">{prod.categoria?.nombre || '—'}</span>
                  </td>
                  <td className="col-prices">
                    <div className="price-cell">
                      <span className="price-cell__main data-money">{formatCurrency(prod.precioVentaDetal)}</span>
                      {prod.precioVentaMayor ? (
                        <span className="price-cell__sub">Mayor {formatCurrency(prod.precioVentaMayor)}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="col-stock">
                    <div className="stock-cell">
                      <div className="stock-cell__row">
                        {isOut && prod.activo ? (
                          <span className="stock-cell__label stock-cell__label--out">Agotado</span>
                        ) : isLow && prod.activo ? (
                          <span className="stock-cell__flag" title="Bajo mínimo" aria-label="Bajo mínimo" />
                        ) : null}
                        <span
                          className={`stock-cell__qty data-code ${isOut || isLow ? 'stock-cell__qty--low' : ''}`}
                        >
                          {prod.stock}
                        </span>
                        <span className="stock-cell__unit">
                          {prod.unidadMedida}
                          {prod.stock !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {isLow && prod.activo && (
                        <div className="stock-cell__foot">
                          <StockMeter stock={prod.stock} min={prod.stockMinimo} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="col-actions">
                    <div className="inventory-actions">
                      <button type="button" onClick={() => openEditModal(prod)} className="btn btn-ghost btn-icon" title="Editar">
                        <Edit2 size={15} />
                      </button>
                      {prod.codigoBarras && (
                        <button
                          type="button"
                          onClick={() => selectForBarcodePrint(prod)}
                          className="btn btn-ghost btn-icon"
                          title="Imprimir código"
                        >
                          <Printer size={15} />
                        </button>
                      )}
                      {prod.activo && (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(prod.id)}
                          className="btn btn-ghost btn-icon inventory-actions__danger"
                          title="Desactivar"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }}
          />
        </div>
      </ModulePanel>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <form onSubmit={handleSubmit} className="inventory-form">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}

          <fieldset className="inventory-form__section">
            <legend className="inventory-form__legend">Identificación</legend>
            <div className="form-grid-modal">
              <div className="form-group span-2">
                <label className="label-field">Nombre del producto</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="input-field"
                  placeholder="Ej. Ron Pampero Aniversario"
                />
              </div>
              <div className="form-group">
                <label className="label-field">Código de barras</label>
                <input
                  type="text"
                  value={codigoBarras}
                  onChange={(e) => setCodigoBarras(e.target.value)}
                  className="input-field"
                  placeholder="Opcional"
                />
              </div>
              <div className="form-group">
                <label className="label-field">Marca</label>
                <input
                  type="text"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  className="input-field"
                  placeholder="Opcional"
                />
              </div>
              <div className="form-group">
                <label className="label-field">Categoría</label>
                <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className="input-field">
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label-field">Unidad de medida</label>
                <select value={unidadMedida} onChange={(e) => setUnidadMedida(e.target.value)} className="input-field">
                  <option value="unidad">Unidad</option>
                  <option value="caja">Caja</option>
                  <option value="botella">Botella</option>
                  <option value="lata">Lata</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label-field">Contenido (ml)</label>
                <input
                  type="number"
                  value={contenidoMl}
                  onChange={(e) => setContenidoMl(e.target.value)}
                  className="input-field"
                  placeholder="Ej. 750"
                />
              </div>
              <div className="form-group">
                <label className="label-field">Grado alcohólico (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={gradoAlcoholico}
                  onChange={(e) => setGradoAlcoholico(e.target.value)}
                  className="input-field"
                  placeholder="Ej. 40"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="inventory-form__section">
            <legend className="inventory-form__legend">Precios</legend>
            <div className="form-grid-modal">
              <div className="form-group">
                <label className="label-field">Precio compra</label>
                <input
                  type="number"
                  step="0.01"
                  value={precioCompra}
                  onChange={(e) => setPrecioCompra(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="form-group">
                <label className="label-field">Precio venta detal</label>
                <input
                  type="number"
                  step="0.01"
                  value={precioVentaDetal}
                  onChange={(e) => setPrecioVentaDetal(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="form-group">
                <label className="label-field">Precio venta mayor</label>
                <input
                  type="number"
                  step="0.01"
                  value={precioVentaMayor}
                  onChange={(e) => setPrecioVentaMayor(e.target.value)}
                  className="input-field"
                  placeholder="Opcional"
                />
              </div>
              <div className="form-group">
                <label className="label-field">Unidades por caja</label>
                <input
                  type="number"
                  value={unidadesPorCaja}
                  onChange={(e) => setUnidadesPorCaja(e.target.value)}
                  className="input-field"
                  placeholder="Opcional"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="inventory-form__section">
            <legend className="inventory-form__legend">Stock y estado</legend>
            <div className="form-grid-modal">
              <div className="form-group">
                <label className="label-field">Stock inicial</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="input-field"
                  disabled={!!editingId}
                />
                {editingId && <p className="field-hint">Ajusta stock desde Compras o movimientos.</p>}
              </div>
              <div className="form-group">
                <label className="label-field">Stock mínimo</label>
                <input
                  type="number"
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="form-group span-2">
                <label className="label-field">URL de imagen</label>
                <input
                  type="text"
                  value={imagenUrl}
                  onChange={(e) => setImagenUrl(e.target.value)}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>
              <div className="form-group span-2">
                <label className="label-field">Descripción</label>
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="input-field" rows="2" />
              </div>
              {editingId && (
                <div className="form-group row-checkbox span-2">
                  <input type="checkbox" id="prod-activo" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
                  <label htmlFor="prod-activo">Producto activo en catálogo</label>
                </div>
              )}
            </div>
          </fieldset>

          <div className="inventory-form__footer">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar producto
            </button>
          </div>
        </form>
      </Modal>
    </DashboardModule>
  );
}
