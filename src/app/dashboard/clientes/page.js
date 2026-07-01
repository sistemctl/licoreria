'use client';

import { useEffect, useState } from 'react';
import { DashboardModule, ModulePanel, PanelToolbar } from '@/components/layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/utils';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function ClientesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Nuevo Cliente');
  const [editingId, setEditingId] = useState(null);

  // Campos
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cedulaRif, setCedulaRif] = useState('');
  const [direccion, setDireccion] = useState('');
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('particular');
  const [limiteCredito, setLimiteCredito] = useState(0);
  const [activo, setActivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  async function loadClientes() {
    try {
      const res = await fetch('/api/clientes?activeOnly=false');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClientes();
  }, []);

  const openNewModal = () => {
    setModalTitle('Nuevo Cliente');
    setEditingId(null);
    setNombre('');
    setTelefono('');
    setCedulaRif('');
    setDireccion('');
    setEmail('');
    setTipo('particular');
    setLimiteCredito(0);
    setActivo(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (cli) => {
    setModalTitle('Editar Cliente');
    setEditingId(cli.id);
    setNombre(cli.nombre);
    setTelefono(cli.telefono || '');
    setCedulaRif(cli.cedulaRif || '');
    setDireccion(cli.direccion || '');
    setEmail(cli.email || '');
    setTipo(cli.tipo);
    setLimiteCredito(parseFloat(cli.limiteCredito));
    setActivo(cli.activo);
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
      cedulaRif,
      direccion,
      email,
      tipo,
      limiteCredito,
      activo
    };

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/clientes?id=${editingId}` : '/api/clientes';

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
        loadClientes();
      }
    } catch (err) {
      setErrorMsg('Error de red al procesar el cliente.');
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('¿Seguro que deseas desactivar este cliente?')) return;

    try {
      const res = await fetch(`/api/clientes?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.error) {
        alert(json.error);
      } else {
        loadClientes();
      }
    } catch (err) {
      alert('Error de red al desactivar el cliente.');
    }
  };

  const filteredData = data.filter(c => 
    c.nombre.toLowerCase().includes(searchVal.toLowerCase()) ||
    (c.cedulaRif && c.cedulaRif.includes(searchVal)) ||
    (c.email && c.email.toLowerCase().includes(searchVal.toLowerCase()))
  );

  const headers = ['ID', 'Cédula / RIF', 'Nombre', 'Contacto', 'Tipo', 'Límite Crédito', 'Saldo Pendiente', 'Estado', 'Acciones'];

  return (
    <DashboardModule title="Clientes">
      <ModulePanel loading={loading} loadingMessage="Cargando clientes...">
        <PanelToolbar
          actions={
            <button onClick={openNewModal} className="btn btn-primary">
              <Plus size={18} />
              <span>Nuevo Cliente</span>
            </button>
          }
        />
        <Table
            headers={headers}
            data={filteredData}
            searchVal={searchVal}
            onSearchChange={setSearchVal}
            searchPlaceholder="Buscar por nombre, documento..."
            renderRow={(cli) => (
              <tr key={cli.id}>
                <td>{cli.id}</td>
                <td>{cli.cedulaRif || '-'}</td>
                <td><strong>{cli.nombre}</strong></td>
                <td>
                  <div className="contact-details">
                    <span>{cli.telefono || '-'}</span>
                    <span className="text-secondary text-xs">{cli.email}</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${cli.tipo === 'negocio' ? 'badge-warning' : 'badge-success'}`}>
                    {cli.tipo === 'negocio' ? 'Negocio' : 'Particular'}
                  </span>
                </td>
                <td>{formatCurrency(cli.limiteCredito)}</td>
                <td>
                  <strong className={parseFloat(cli.saldoPendiente) > 0 ? 'text-danger' : 'text-success'}>
                    {formatCurrency(cli.saldoPendiente)}
                  </strong>
                </td>
                <td>
                  <span className={`badge ${cli.activo ? 'badge-success' : 'badge-danger'}`}>
                    {cli.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="table-row-actions">
                  <button onClick={() => openEditModal(cli)} className="btn btn-secondary btn-icon" title="Editar">
                    <Edit2 size={14} />
                  </button>
                  {cli.activo && (
                    <button onClick={() => handleDeactivate(cli.id)} className="btn btn-danger btn-icon" title="Desactivar">
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
            <label className="label-field">Nombre o Razón Social</label>
            <input 
              type="text" 
              required
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              className="input-field" 
              placeholder="Ej. Juan Pérez / Bodegón Central"
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label className="label-field">Cédula / RIF</label>
              <input 
                type="text" 
                value={cedulaRif} 
                onChange={(e) => setCedulaRif(e.target.value)} 
                className="input-field" 
                placeholder="Ej. V-12345678"
              />
            </div>
            <div className="form-group half">
              <label className="label-field">Teléfono</label>
              <input 
                type="text" 
                value={telefono} 
                onChange={(e) => setTelefono(e.target.value)} 
                className="input-field" 
                placeholder="Ej. +58 412 1234567"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label-field">Correo Electrónico</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="input-field" 
              placeholder="juan@email.com"
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label className="label-field">Tipo de Cliente</label>
              <select 
                value={tipo} 
                onChange={(e) => setTipo(e.target.value)} 
                className="input-field"
              >
                <option value="particular">Particular</option>
                <option value="negocio">Negocio</option>
              </select>
            </div>
            <div className="form-group half">
              <label className="label-field">Límite de Crédito ($)</label>
              <input 
                type="number" 
                value={limiteCredito} 
                onChange={(e) => setLimiteCredito(e.target.value)} 
                className="input-field" 
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
                id="cli-activo" 
                checked={activo} 
                onChange={(e) => setActivo(e.target.checked)} 
              />
              <label htmlFor="cli-activo">Cliente Activo</label>
            </div>
          )}

          <div className="form-buttons">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Cliente</button>
          </div>
        </form>
      </Modal>
    </DashboardModule>
  );
}
