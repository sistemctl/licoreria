'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardModule, ModulePanel } from '@/components/layout';
import Modal from '@/components/Modal';
import { Plus, Edit2, Trash2, Search, Tags } from 'lucide-react';

const STATUS_FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Activas' },
  { id: 'inactive', label: 'Inactivas' },
];

function getCategoryInitial(nombre) {
  const trimmed = (nombre || '').trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

export default function CategoriasPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Nueva categoría');
  const [editingId, setEditingId] = useState(null);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  async function loadCategorias() {
    try {
      const res = await fetch('/api/categorias?activeOnly=false');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategorias();
  }, []);

  const stats = useMemo(() => {
    const activas = data.filter((c) => c.activo).length;
    const productos = data.reduce((acc, c) => acc + (c._count?.productos || 0), 0);
    return { total: data.length, activas, productos };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((c) => {
      const q = searchVal.toLowerCase();
      const matchesSearch =
        c.nombre.toLowerCase().includes(q) ||
        (c.descripcion && c.descripcion.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && c.activo) ||
        (statusFilter === 'inactive' && !c.activo);

      return matchesSearch && matchesStatus;
    });
  }, [data, searchVal, statusFilter]);

  const openNewModal = () => {
    setModalTitle('Nueva categoría');
    setEditingId(null);
    setNombre('');
    setDescripcion('');
    setActivo(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setModalTitle('Editar categoría');
    setEditingId(cat.id);
    setNombre(cat.nombre);
    setDescripcion(cat.descripcion || '');
    setActivo(cat.activo);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre.trim()) {
      setErrorMsg('El nombre es obligatorio.');
      return;
    }

    const payload = { nombre: nombre.trim(), descripcion: descripcion.trim(), activo };
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/categorias?id=${editingId}` : '/api/categorias';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const resJson = await res.json();

      if (resJson.error) {
        setErrorMsg(resJson.error);
      } else {
        setIsModalOpen(false);
        loadCategorias();
      }
    } catch (err) {
      setErrorMsg('Error de red al guardar la categoría.');
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('¿Desactivar esta categoría? Los productos asignados no se eliminan.')) return;

    try {
      const res = await fetch(`/api/categorias?id=${id}`, { method: 'DELETE' });
      const resJson = await res.json();
      if (resJson.error) {
        alert(resJson.error);
      } else {
        loadCategorias();
      }
    } catch (err) {
      alert('Error al desactivar la categoría.');
    }
  };

  return (
    <DashboardModule title="Categorías">
      <ModulePanel loading={loading} loadingMessage="Cargando categorías...">
        <div className="categorias-page">
          <p className="categorias-page__hint">
            <strong>Anaqueles del inventario</strong> — agrupa productos y preparados para
            filtrarlos rápido en POS (Cervezas, Preparados, Micheladas, etc.).
          </p>

          <div className="categorias-page__summary">
            <div className="categorias-stats">
              <div className="categorias-stat">
                <span className="categorias-stat__value">{stats.total}</span>
                <span className="categorias-stat__label">Categorías</span>
              </div>
              <span className="categorias-stat__divider" aria-hidden="true" />
              <div className="categorias-stat">
                <span className="categorias-stat__value">{stats.activas}</span>
                <span className="categorias-stat__label">Activas</span>
              </div>
              <span className="categorias-stat__divider" aria-hidden="true" />
              <div className="categorias-stat">
                <span className="categorias-stat__value">{stats.productos}</span>
                <span className="categorias-stat__label">Productos</span>
              </div>
            </div>

            <button type="button" onClick={openNewModal} className="btn btn-primary">
              <Plus size={18} />
              <span>Nueva categoría</span>
            </button>
          </div>

          <div className="categorias-page__toolbar">
            <div className="categorias-search">
              <Search size={18} className="search-icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="Buscar categorías..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="input-field search-input"
                aria-label="Buscar categorías"
              />
            </div>

            <div className="categorias-filters" role="group" aria-label="Filtrar por estado">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`categorias-filter-btn${statusFilter === filter.id ? ' is-active' : ''}`}
                  onClick={() => setStatusFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="categorias-grid">
            {filteredData.length > 0 ? (
              filteredData.map((cat) => {
                const productCount = cat._count?.productos ?? 0;
                const hasDesc = Boolean(cat.descripcion?.trim());

                return (
                  <article
                    key={cat.id}
                    className={`categoria-card${cat.activo ? '' : ' is-inactive'}`}
                  >
                    <div className="categoria-card__head">
                      <span className="categoria-card__mark" aria-hidden="true">
                        {getCategoryInitial(cat.nombre)}
                      </span>
                      <div className="categoria-card__title-block">
                        <h3 className="categoria-card__name">{cat.nombre}</h3>
                        <p className={`categoria-card__desc${hasDesc ? '' : ' is-empty'}`}>
                          {hasDesc ? cat.descripcion : 'Sin descripción'}
                        </p>
                      </div>
                    </div>

                    <div className="categoria-card__meta">
                      <span className="categoria-card__count">
                        <strong>{productCount}</strong>{' '}
                        {productCount === 1 ? 'producto' : 'productos'}
                      </span>

                      <div className="categoria-card__actions">
                        <span
                          className={`badge ${cat.activo ? 'badge-success' : 'badge-danger'}`}
                        >
                          {cat.activo ? 'Activa' : 'Inactiva'}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="btn btn-secondary btn-icon"
                          title="Editar categoría"
                          aria-label={`Editar ${cat.nombre}`}
                        >
                          <Edit2 size={14} />
                        </button>
                        {cat.activo && (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(cat.id)}
                            className="btn btn-danger btn-icon"
                            title="Desactivar categoría"
                            aria-label={`Desactivar ${cat.nombre}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="categorias-empty">
                <strong>No hay categorías que coincidan</strong>
                Prueba otro término de búsqueda o crea una nueva categoría.
              </div>
            )}
          </div>
        </div>
      </ModulePanel>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <form onSubmit={handleSubmit} className="categoria-form">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}

          <div className="form-group">
            <label className="label-field" htmlFor="cat-nombre">Nombre</label>
            <input
              id="cat-nombre"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input-field"
              placeholder="Ej. Preparados, Cervezas"
            />
          </div>

          <div className="form-group">
            <label className="label-field" htmlFor="cat-descripcion">Descripción</label>
            <textarea
              id="cat-descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="input-field"
              rows="3"
              placeholder="Para qué sirve esta categoría en el inventario"
            />
          </div>

          <footer className="categoria-form__footer">
            {editingId ? (
              <div className="categoria-form__status">
                <input
                  type="checkbox"
                  id="cat-activo"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                />
                <label htmlFor="cat-activo">Visible en inventario y POS</label>
              </div>
            ) : (
              <div className="categoria-form__status">
                <Tags size={16} aria-hidden="true" />
                <span>Se creará activa para usar de inmediato</span>
              </div>
            )}

            <div className="categoria-form__actions">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar categoría
              </button>
            </div>
          </footer>
        </form>
      </Modal>
    </DashboardModule>
  );
}
