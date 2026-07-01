'use client';

import { useEffect, useState } from 'react';
import { DashboardModule, ModulePanel, PanelToolbar } from '@/components/layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function ProveedoresPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Nuevo Proveedor');
  const [editingId, setEditingId] = useState(null);

  // Campos
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rifNit, setRifNit] = useState('');
  const [direccion, setDireccion] = useState('');
  const [email, setEmail] = useState('');
  const [contacto, setContacto] = useState('');
  const [activo, setActivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  async function loadProveedores() {
    try {
      const res = await fetch('/api/proveedores?activeOnly=false');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProveedores();
  }, []);

  const openNewModal = () => {
    setModalTitle('Nuevo Proveedor');
    setEditingId(null);
    setNombre('');
    setTelefono('');
    setRifNit('');
    setDireccion('');
    setEmail('');
    setContacto('');
    setActivo(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (prov) => {
    setModalTitle('Editar Proveedor');
    setEditingId(prov.id);
    setNombre(prov.nombre);
    setTelefono(prov.telefono || '');
    setRifNit(prov.rifNit || '');
    setDireccion(prov.direccion || '');
    setEmail(prov.email || '');
    setContacto(prov.contacto || '');
    setActivo(prov.activo);
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

    const payload = {
      nombre,
      telefono,
      rifNit,
      direccion,
      email,
      contacto,
      activo
    };

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/proveedores?id=${editingId}` : '/api/proveedores';

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
        loadProveedores();
      }
    } catch (err) {
      setErrorMsg('Error de red al procesar el proveedor.');
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('¿Seguro que deseas desactivar este proveedor?')) return;

    try {
      const res = await fetch(`/api/proveedores?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.error) {
        alert(json.error);
      } else {
        loadProveedores();
      }
    } catch (err) {
      alert('Error de red al desactivar el proveedor.');
    }
  };

  const filteredData = data.filter(p => 
    p.nombre.toLowerCase().includes(searchVal.toLowerCase()) ||
    (p.rifNit && p.rifNit.includes(searchVal)) ||
    (p.contacto && p.contacto.toLowerCase().includes(searchVal.toLowerCase()))
  );

  const headers = ['ID', 'RIF / NIT', 'Razón Social', 'Contacto', 'Persona Contacto', 'Estado', 'Acciones'];

  return (
    <DashboardModule title="Proveedores">
      <ModulePanel loading={loading} loadingMessage="Cargando proveedores...">
        <PanelToolbar
          actions={
            <button onClick={openNewModal} className="btn btn-primary">
              <Plus size={18} />
              <span>Nuevo Proveedor</span>
            </button>
          }
        />
        <Table
            headers={headers}
            data={filteredData}
            searchVal={searchVal}
            onSearchChange={setSearchVal}
            searchPlaceholder="Buscar por nombre, RIF..."
            renderRow={(prov) => (
              <tr key={prov.id}>
                <td>{prov.id}</td>
                <td>{prov.rifNit || '-'}</td>
                <td><strong>{prov.nombre}</strong></td>
                <td>
                  <div className="contact-details">
                    <span>{prov.telefono || '-'}</span>
                    <span className="text-secondary text-xs">{prov.email}</span>
                  </div>
                </td>
                <td>{prov.contacto || '-'}</td>
                <td>
                  <span className={`badge ${prov.activo ? 'badge-success' : 'badge-danger'}`}>
                    {prov.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="table-row-actions">
                  <button onClick={() => openEditModal(prov)} className="btn btn-secondary btn-icon" title="Editar">
                    <Edit2 size={14} />
                  </button>
                  {prov.activo && (
                    <button onClick={() => handleDeactivate(prov.id)} className="btn btn-danger btn-icon" title="Desactivar">
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
        <form onSubmit={handleSubmit} className="form-modal-layout">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}

          <div className="form-group">
            <label className="label-field">Nombre / Razón Social del Proveedor</label>
            <input 
              type="text" 
              required
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              className="input-field" 
              placeholder="Ej. Distribuidora Polar C.A."
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label className="label-field">RIF / NIT</label>
              <input 
                type="text" 
                value={rifNit} 
                onChange={(e) => setRifNit(e.target.value)} 
                className="input-field" 
                placeholder="Ej. J-12345678-0"
              />
            </div>
            <div className="form-group half">
              <label className="label-field">Teléfono</label>
              <input 
                type="text" 
                value={telefono} 
                onChange={(e) => setTelefono(e.target.value)} 
                className="input-field" 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label className="label-field">Correo Electrónico</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="input-field" 
              />
            </div>
            <div className="form-group half">
              <label className="label-field">Persona de Contacto</label>
              <input 
                type="text" 
                value={contacto} 
                onChange={(e) => setContacto(e.target.value)} 
                className="input-field" 
                placeholder="Ej. Carlos Mendoza (Vendedor)"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label-field">Dirección Física</label>
            <textarea 
              value={direccion} 
              onChange={(e) => setDireccion(e.target.value)} 
              className="input-field" 
              rows="2"
            />
          </div>

          {editingId && (
            <div className="form-group row-checkbox">
              <input 
                type="checkbox" 
                id="prov-activo" 
                checked={activo} 
                onChange={(e) => setActivo(e.target.checked)} 
              />
              <label htmlFor="prov-activo">Proveedor Activo</label>
            </div>
          )}

          <div className="form-buttons">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Proveedor</button>
          </div>
        </form>
      </Modal>
    </DashboardModule>
  );
}
