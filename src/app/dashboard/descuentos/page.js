'use client';

import { useEffect, useState } from 'react';
import { DashboardModule, ModulePanel, PanelToolbar } from '@/components/layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function DescuentosPage() {
  const [descuentos, setDescuentos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Nuevo Descuento');
  const [editingId, setEditingId] = useState(null);

  // Campos
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('porcentaje');
  const [valor, setValor] = useState('');
  const [cantidadRequerida, setCantidadRequerida] = useState('');
  const [cantidadCobrada, setCantidadCobrada] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [selectedProductoIds, setSelectedProductoIds] = useState([]);
  const [activo, setActivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  async function loadData() {
    try {
      const res = await fetch('/api/descuentos?activeOnly=false');
      const json = await res.json();
      setDescuentos(json);

      const prodRes = await fetch('/api/productos?activeOnly=true');
      const prodJson = await prodRes.json();
      setProductos(prodJson.filter(p => !p.esCombo));
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
    setModalTitle('Nuevo Descuento');
    setEditingId(null);
    setNombre('');
    setTipo('porcentaje');
    setValor('');
    setCantidadRequerida('');
    setCantidadCobrada('');
    setFechaInicio('');
    setFechaFin('');
    setSelectedProductoIds([]);
    setActivo(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (desc) => {
    setModalTitle('Editar Descuento');
    setEditingId(desc.id);
    setNombre(desc.nombre);
    setTipo(desc.tipo);
    setValor(parseFloat(desc.valor));
    setCantidadRequerida(desc.cantidadRequerida || '');
    setCantidadCobrada(desc.cantidadCobrada || '');
    setFechaInicio(new Date(desc.fechaInicio).toISOString().split('T')[0]);
    setFechaFin(new Date(desc.fechaFin).toISOString().split('T')[0]);
    setSelectedProductoIds(desc.descuentoProductos.map(dp => dp.productoId));
    setActivo(desc.activo);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleProductToggle = (pId) => {
    setSelectedProductoIds(prev => {
      if (prev.includes(pId)) {
        return prev.filter(id => id !== pId);
      } else {
        return [...prev, pId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre || !tipo || valor === undefined || !fechaInicio || !fechaFin) {
      setErrorMsg('Faltan campos obligatorios para registrar la promoción.');
      return;
    }

    const payload = {
      nombre,
      tipo,
      valor,
      cantidadRequerida: cantidadRequerida ? parseInt(cantidadRequerida) : null,
      cantidadCobrada: cantidadCobrada ? parseInt(cantidadCobrada) : null,
      fechaInicio,
      fechaFin,
      productoIds: selectedProductoIds,
      activo
    };

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/descuentos?id=${editingId}` : '/api/descuentos';

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
      setErrorMsg('Error de red al procesar el descuento.');
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('¿Seguro que deseas desactivar esta promoción?')) return;

    try {
      const res = await fetch(`/api/descuentos?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.error) {
        alert(json.error);
      } else {
        loadData();
      }
    } catch (e) {
      alert('Error de red al desactivar la promoción.');
    }
  };

  const filteredDescuentos = descuentos.filter(d => 
    d.nombre.toLowerCase().includes(searchVal.toLowerCase()) ||
    d.tipo.toLowerCase().includes(searchVal.toLowerCase())
  );

  const headers = ['ID', 'Nombre Descuento', 'Tipo', 'Valor', 'Aplicable a', 'Vigencia', 'Estado', 'Acciones'];

  return (
    <DashboardModule title="Descuentos">
      <ModulePanel loading={loading} loadingMessage="Cargando promociones...">
        <PanelToolbar
          actions={
            <button onClick={openNewModal} className="btn btn-primary" disabled={productos.length === 0}>
              <Plus size={18} />
              <span>Nueva promoción</span>
            </button>
          }
        />
        <Table
            headers={headers}
            data={filteredDescuentos}
            searchVal={searchVal}
            onSearchChange={setSearchVal}
            searchPlaceholder="Buscar promociones..."
            renderRow={(desc) => (
              <tr key={desc.id}>
                <td>{desc.id}</td>
                <td><strong>{desc.nombre}</strong></td>
                <td>
                  <span className="badge badge-success">{desc.tipo.toUpperCase()}</span>
                </td>
                <td>
                  <strong>
                    {desc.tipo === 'porcentaje' ? `${parseFloat(desc.valor)}%` : formatCurrency(desc.valor)}
                  </strong>
                </td>
                <td>
                  {desc.descuentoProductos && desc.descuentoProductos.length > 0 ? (
                    <div className="products-cell">
                      <span>{desc.descuentoProductos.length} producto(s)</span>
                    </div>
                  ) : 'Todos los productos'}
                </td>
                <td>
                  <span className="text-secondary text-xs">
                    {formatDateShort(desc.fechaInicio)} al {formatDateShort(desc.fechaFin)}
                  </span>
                </td>
                <td>
                  <span className={`badge ${desc.activo ? 'badge-success' : 'badge-danger'}`}>
                    {desc.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="table-row-actions">
                  <button onClick={() => openEditModal(desc)} className="btn btn-secondary btn-icon" title="Editar">
                    <Edit2 size={14} />
                  </button>
                  {desc.activo && (
                    <button onClick={() => handleDeactivate(desc.id)} className="btn btn-danger btn-icon" title="Desactivar">
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            )}
          />
      </ModulePanel>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <form onSubmit={handleSubmit} className="form-modal-layout animate-fade-in">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}

          <div className="form-group">
            <label className="label-field">Nombre de la Promoción</label>
            <input 
              type="text" 
              required
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              className="input-field" 
              placeholder="Ej. Descuento del 10% en Rones"
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label className="label-field">Tipo de Descuento</label>
              <select 
                value={tipo} 
                onChange={(e) => setTipo(e.target.value)} 
                className="input-field"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto_fijo">Monto Fijo ($)</option>
              </select>
            </div>
            <div className="form-group half">
              <label className="label-field">Valor del Descuento</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={valor} 
                onChange={(e) => setValor(e.target.value)} 
                className="input-field" 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label className="label-field">Fecha Inicio</label>
              <input 
                type="date" 
                required
                value={fechaInicio} 
                onChange={(e) => setFechaInicio(e.target.value)} 
                className="input-field" 
              />
            </div>
            <div className="form-group half">
              <label className="label-field">Fecha Fin</label>
              <input 
                type="date" 
                required
                value={fechaFin} 
                onChange={(e) => setFechaFin(e.target.value)} 
                className="input-field" 
              />
            </div>
          </div>

          {/* Selección de productos */}
          <div className="ingredients-section">
            <h5>Selecciona Productos que califican para el descuento</h5>
            <div className="products-checkboxes-grid">
              {productos.map(p => {
                const isSelected = selectedProductoIds.includes(p.id);
                return (
                  <div 
                    key={p.id} 
                    onClick={() => handleProductToggle(p.id)}
                    className={`product-chk-card ${isSelected ? 'selected' : ''}`}
                  >
                    <span>{p.nombre}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {editingId && (
            <div className="form-group row-checkbox">
              <input 
                type="checkbox" 
                id="desc-activo" 
                checked={activo} 
                onChange={(e) => setActivo(e.target.checked)} 
              />
              <label htmlFor="desc-activo">Promoción Activa</label>
            </div>
          )}

          <div className="form-buttons">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Promoción</button>
          </div>
        </form>
      </Modal>
    </DashboardModule>
  );
}
