'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import BarcodePrinter from '@/components/BarcodePrinter';
import { formatCurrency } from '@/lib/utils';
import { Plus, Edit2, Trash2, Printer, Search } from 'lucide-react';

export default function InventarioPage() {
  const [data, setData] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedStock, setSelectedStock] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');

  // Modales y formularios
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Nuevo Producto');
  const [editingId, setEditingId] = useState(null);

  // Campos del form
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

  // Código de barras para imprimir
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

  const openNewModal = () => {
    setModalTitle('Nuevo Producto');
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
    setModalTitle('Editar Producto');
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
      esCombo: false
    };

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/productos?id=${editingId}` : '/api/productos';

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
    } catch (err) {
      setErrorMsg('Error de red al procesar el producto.');
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('¿Seguro que deseas desactivar este producto?')) return;

    try {
      const res = await fetch(`/api/productos?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.error) {
        alert(json.error);
      } else {
        loadData();
      }
    } catch (err) {
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

  // Obtener marcas únicas presentes en los productos
  const brands = [...new Set(data.map(p => p.marca).filter(Boolean))];

  const filteredData = data.filter((p) => {
    if (p.esCombo) return false; // No mostrar combos aquí, se gestionan en su sección
    const matchesSearch = 
      p.nombre.toLowerCase().includes(searchVal.toLowerCase()) ||
      (p.codigoBarras && p.codigoBarras.includes(searchVal)) ||
      (p.marca && p.marca.toLowerCase().includes(searchVal.toLowerCase()));

    const matchesCat = selectedCat === '' || p.categoriaId === parseInt(selectedCat);
    const matchesBrand = selectedBrand === '' || p.marca === selectedBrand;
    const matchesStock = selectedStock === '' || 
      (selectedStock === 'bajo' && p.stock <= p.stockMinimo) || 
      (selectedStock === 'normal' && p.stock > p.stockMinimo);
    const matchesEstado = selectedEstado === '' ||
      (selectedEstado === 'activo' && p.activo) ||
      (selectedEstado === 'inactivo' && !p.activo);

    return matchesSearch && matchesCat && matchesBrand && matchesStock && matchesEstado;
  });

  const headers = ['Código', 'Nombre', 'Marca', 'Categoría', 'Pr. Compra', 'Pr. Venta', 'Stock', 'Estado', 'Acciones'];

  return (
    <div>
      <Header title="Inventario de Productos" />

      {/* Acciones principales y Filtros */}
      <div className="table-actions glass-panel">
        <div className="filters-container">
          <div className="search-wrapper-inline">
            <Search size={18} className="search-icon-inline" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, código..." 
              value={searchVal} 
              onChange={(e) => setSearchVal(e.target.value)} 
              className="input-field search-input-inline"
            />
          </div>

          <div className="filter-group">
            <select 
              value={selectedCat} 
              onChange={(e) => setSelectedCat(e.target.value)} 
              className="input-field compact-select"
            >
              <option value="">Categoría: Todas</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select 
              value={selectedBrand} 
              onChange={(e) => setSelectedBrand(e.target.value)} 
              className="input-field compact-select"
            >
              <option value="">Marca: Todas</option>
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select 
              value={selectedStock} 
              onChange={(e) => setSelectedStock(e.target.value)} 
              className="input-field compact-select"
            >
              <option value="">Stock: Todos</option>
              <option value="bajo">Stock Bajo</option>
              <option value="normal">Stock Normal</option>
            </select>
          </div>

          <div className="filter-group">
            <select 
              value={selectedEstado} 
              onChange={(e) => setSelectedEstado(e.target.value)} 
              className="input-field compact-select"
            >
              <option value="">Estado: Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
          </div>
        </div>

        <button onClick={openNewModal} className="btn btn-primary btn-add-product">
          <Plus size={18} />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Barcode Printer Panel */}
      {barcodePrintVal && (
        <div className="barcode-box glass-panel animate-fade-in">
          <h5>Generador de Código de Barras</h5>
          <BarcodePrinter value={barcodePrintVal} name={barcodePrintName} price={barcodePrintPrice} />
          <button onClick={() => setBarcodePrintVal('')} className="btn btn-secondary compact-btn">Cerrar</button>
        </div>
      )}

      {/* Tabla */}
      <div className="glass-panel" style={{ marginTop: '20px' }}>
        {loading ? (
          <p>Cargando productos...</p>
        ) : (
          <Table
            headers={headers}
            data={filteredData}
            renderRow={(prod) => (
              <tr key={prod.id} className={prod.stock <= prod.stockMinimo ? 'low-stock-row' : ''}>
                <td>{prod.codigoBarras || '-'}</td>
                <td>
                  <strong>{prod.nombre}</strong>
                  {prod.stock <= prod.stockMinimo && (
                    <span className="badge badge-danger low-stock-badge">Stock Bajo</span>
                  )}
                </td>
                <td>{prod.marca || '-'}</td>
                <td>{prod.categoria?.nombre}</td>
                <td>{formatCurrency(prod.precioCompra)}</td>
                <td>
                  <div className="prices-column">
                    <span>Detal: {formatCurrency(prod.precioVentaDetal)}</span>
                    {prod.precioVentaMayor && (
                      <span className="text-secondary text-xs">Mayor: {formatCurrency(prod.precioVentaMayor)}</span>
                    )}
                  </div>
                </td>
                <td>
                  <strong className={prod.stock <= prod.stockMinimo ? 'text-danger' : ''}>
                    {prod.stock} {prod.unidadMedida}(s)
                  </strong>
                </td>
                <td>
                  <span className={`badge ${prod.activo ? 'badge-success' : 'badge-danger'}`}>
                    {prod.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="table-row-actions">
                  <button onClick={() => openEditModal(prod)} className="btn btn-secondary btn-icon" title="Editar">
                    <Edit2 size={14} />
                  </button>
                  {prod.codigoBarras && (
                    <button onClick={() => selectForBarcodePrint(prod)} className="btn btn-secondary btn-icon" title="Generar Código">
                      <Printer size={14} />
                    </button>
                  )}
                  {prod.activo && (
                    <button onClick={() => handleDeactivate(prod.id)} className="btn btn-danger btn-icon" title="Desactivar">
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
        <form onSubmit={handleSubmit} className="form-grid-modal">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}

          <div className="form-group span-2">
            <label className="label-field">Nombre del Producto</label>
            <input 
              type="text" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              className="input-field" 
              placeholder="Ej. Ron Pampero Aniversario"
            />
          </div>

          <div className="form-group">
            <label className="label-field">Código de Barras (Opcional)</label>
            <input 
              type="text" 
              value={codigoBarras} 
              onChange={(e) => setCodigoBarras(e.target.value)} 
              className="input-field" 
              placeholder="Ej. 759100110011"
            />
          </div>

          <div className="form-group">
            <label className="label-field">Marca (Opcional)</label>
            <input 
              type="text" 
              value={marca} 
              onChange={(e) => setMarca(e.target.value)} 
              className="input-field" 
              placeholder="Ej. Pampero"
            />
          </div>

          <div className="form-group">
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

          <div className="form-group">
            <label className="label-field">Unidad de Medida</label>
            <select 
              value={unidadMedida} 
              onChange={(e) => setUnidadMedida(e.target.value)} 
              className="input-field"
            >
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
            <label className="label-field">Grado Alcohólico (%)</label>
            <input 
              type="number" 
              step="0.1"
              value={gradoAlcoholico} 
              onChange={(e) => setGradoAlcoholico(e.target.value)} 
              className="input-field" 
              placeholder="Ej. 40.0"
            />
          </div>

          <div className="form-group">
            <label className="label-field">Precio Compra ($)</label>
            <input 
              type="number" 
              step="0.01"
              value={precioCompra} 
              onChange={(e) => setPrecioCompra(e.target.value)} 
              className="input-field" 
            />
          </div>

          <div className="form-group">
            <label className="label-field">Precio Venta Detal ($)</label>
            <input 
              type="number" 
              step="0.01"
              value={precioVentaDetal} 
              onChange={(e) => setPrecioVentaDetal(e.target.value)} 
              className="input-field" 
            />
          </div>

          <div className="form-group">
            <label className="label-field">Precio Venta Mayor ($ - Opcional)</label>
            <input 
              type="number" 
              step="0.01"
              value={precioVentaMayor} 
              onChange={(e) => setPrecioVentaMayor(e.target.value)} 
              className="input-field" 
            />
          </div>

          <div className="form-group">
            <label className="label-field">Unidades por Caja (Opcional)</label>
            <input 
              type="number" 
              value={unidadesPorCaja} 
              onChange={(e) => setUnidadesPorCaja(e.target.value)} 
              className="input-field" 
              placeholder="Ej. 12"
            />
          </div>

          <div className="form-group">
            <label className="label-field">Stock Inicial</label>
            <input 
              type="number" 
              value={stock} 
              onChange={(e) => setStock(e.target.value)} 
              className="input-field" 
              disabled={!!editingId} // No editar stock desde aquí para evitar descuadres. Usar Compras/Mermas.
            />
          </div>

          <div className="form-group">
            <label className="label-field">Stock Mínimo Alerta</label>
            <input 
              type="number" 
              value={stockMinimo} 
              onChange={(e) => setStockMinimo(e.target.value)} 
              className="input-field" 
            />
          </div>

          <div className="form-group span-2">
            <label className="label-field">URL Imagen del Producto</label>
            <input 
              type="text" 
              value={imagenUrl} 
              onChange={(e) => setImagenUrl(e.target.value)} 
              className="input-field" 
              placeholder="https://enlace-imagen.com/foto.jpg"
            />
          </div>

          <div className="form-group span-2">
            <label className="label-field">Descripción Corta</label>
            <textarea 
              value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)} 
              className="input-field" 
              rows="2"
            />
          </div>

          {editingId && (
            <div className="form-group row-checkbox span-2">
              <input 
                type="checkbox" 
                id="prod-activo" 
                checked={activo} 
                onChange={(e) => setActivo(e.target.checked)} 
              />
              <label htmlFor="prod-activo">Producto Activo en Catálogo</label>
            </div>
          )}

          <div className="form-buttons span-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      <style jsx>{`
        .table-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          gap: 16px;
        }

        @media (max-width: 992px) {
          .table-actions {
            flex-direction: column;
            align-items: stretch;
          }
        }

        .filters-container {
          display: flex;
          align-items: center;
          background: rgba(212, 168, 83, 0.05);
          border: 1px solid rgba(212, 168, 83, 0.15);
          border-radius: 30px;
          padding: 2px 8px;
          gap: 4px;
          box-shadow: var(--shadow-sm);
          flex: 1;
          min-width: 0;
        }

        .btn-add-product {
          flex-shrink: 0;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 6px;
          border-left: 1px solid rgba(212, 168, 83, 0.15);
          padding-left: 10px;
          margin-left: 6px;
        }

        .compact-label {
          margin-bottom: 0;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .compact-select {
          padding: 6px 20px 6px 6px;
          border: none !important;
          background: transparent !important;
          color: var(--text-primary);
          font-size: 12.5px;
          cursor: pointer;
          width: auto;
          min-width: 75px;
          box-shadow: none !important;
        }

        .search-wrapper-inline {
          position: relative;
          display: flex;
          align-items: center;
          width: 140px;
        }

        .search-icon-inline {
          position: absolute;
          left: 8px;
          color: var(--text-secondary);
          pointer-events: none;
        }

        .search-input-inline {
          border: none !important;
          background: transparent !important;
          padding-left: 32px !important;
          font-size: 13px !important;
          box-shadow: none !important;
        }

        .table-row-actions {
          display: flex;
          gap: 6px;
        }

        .prices-column {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .price-label-small {
          font-size: 10px;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .product-info-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .product-name-title {
          font-size: 14px;
          color: var(--text-primary);
        }

        .product-meta-sub {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: var(--text-secondary);
        }

        .meta-item {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 1px 6px;
          border-radius: 4px;
        }

        .category-cell-text {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .stock-column {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stock-min-sub {
          font-size: 10px;
          color: var(--text-secondary);
        }

        .low-stock-badge-new {
          align-self: flex-start;
          font-size: 9px;
          margin-top: 2px;
        }

        .font-mono {
          font-family: monospace;
          font-size: 13px;
        }

        .text-xs { font-size: 11px; }
        .text-danger { color: var(--error-red); }
        .low-stock-row td {
          background: rgba(239, 68, 68, 0.02);
        }
        .low-stock-badge {
          margin-left: 8px;
          font-size: 9px;
        }

        .barcode-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          margin-top: 16px;
          border-color: var(--accent-gold);
        }

        .barcode-box h5 {
          color: var(--accent-gold);
        }

        .compact-btn {
          padding: 6px 12px;
          font-size: 12px;
        }

        /* Form Layout */
        .form-grid-modal {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .span-2 {
          grid-column: span 2;
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

        .form-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
        }

        .error-banner {
          grid-column: span 2;
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
