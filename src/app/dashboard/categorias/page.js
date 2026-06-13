'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function CategoriasPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  // Modales y formularios
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Nueva Categoría');
  const [editingId, setEditingId] = useState(null);
  
  // Campos del form
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

  const openNewModal = () => {
    setModalTitle('Nueva Categoría');
    setEditingId(null);
    setNombre('');
    setDescripcion('');
    setActivo(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setModalTitle('Editar Categoría');
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

    if (!nombre) {
      setErrorMsg('El nombre es obligatorio.');
      return;
    }

    const payload = { nombre, descripcion, activo };
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/categorias?id=${editingId}` : '/api/categorias';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resJson = await res.json();

      if (resJson.error) {
        setErrorMsg(resJson.error);
      } else {
        setIsModalOpen(false);
        loadCategorias();
      }
    } catch (err) {
      setErrorMsg('Error de red al procesar la categoría.');
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('¿Seguro que deseas desactivar esta categoría?')) return;

    try {
      const res = await fetch(`/api/categorias?id=${id}`, {
        method: 'DELETE'
      });
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

  const filteredData = data.filter(c => 
    c.nombre.toLowerCase().includes(searchVal.toLowerCase()) ||
    (c.descripcion && c.descripcion.toLowerCase().includes(searchVal.toLowerCase()))
  );

  const headers = ['ID', 'Nombre', 'Descripción', 'Estado', 'Acciones'];

  return (
    <div>
      <Header title="Categorías de Inventario" />

      <div className="table-actions glass-panel">
        <button onClick={openNewModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Nueva Categoría</span>
        </button>
      </div>

      <div className="glass-panel" style={{ marginTop: '20px' }}>
        {loading ? (
          <p>Cargando categorías...</p>
        ) : (
          <Table 
            headers={headers}
            data={filteredData}
            searchVal={searchVal}
            onSearchChange={setSearchVal}
            searchPlaceholder="Buscar categorías..."
            renderRow={(cat) => (
              <tr key={cat.id}>
                <td>{cat.id}</td>
                <td><strong>{cat.nombre}</strong></td>
                <td>{cat.descripcion || '-'}</td>
                <td>
                  <span className={`badge ${cat.activo ? 'badge-success' : 'badge-danger'}`}>
                    {cat.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="table-row-actions">
                  <button onClick={() => openEditModal(cat)} className="btn btn-secondary btn-icon" title="Editar">
                    <Edit2 size={14} />
                  </button>
                  {cat.activo && (
                    <button onClick={() => handleDeactivate(cat.id)} className="btn btn-danger btn-icon" title="Desactivar">
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            )}
          />
        )}
      </div>

      {/* Modal de formulario */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <form onSubmit={handleSubmit} className="form-modal-layout">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}

          <div className="form-group">
            <label className="label-field">Nombre de la Categoría</label>
            <input 
              type="text" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              className="input-field" 
              placeholder="Ej. Rones, Whiskys"
            />
          </div>

          <div className="form-group">
            <label className="label-field">Descripción (Opcional)</label>
            <textarea 
              value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)} 
              className="input-field" 
              rows="3"
              placeholder="Ej. Rones añejos y nacionales"
            />
          </div>

          {editingId && (
            <div className="form-group row-checkbox">
              <input 
                type="checkbox" 
                id="cat-activo" 
                checked={activo} 
                onChange={(e) => setActivo(e.target.checked)} 
              />
              <label htmlFor="cat-activo">Categoría Activa</label>
            </div>
          )}

          <div className="form-buttons">
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
          justify-content: flex-end;
          padding: 16px;
        }

        .table-row-actions {
          display: flex;
          gap: 8px;
        }

        :global(.btn-icon) {
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .form-modal-layout {
          display: flex;
          flex-direction: column;
          gap: 16px;
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
