'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';

export default function UsuariosPage() {
  const { data: session, status } = useSession();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Nuevo Usuario');
  const [editingId, setEditingId] = useState(null);

  // Campos
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rolId, setRolId] = useState('');
  const [activo, setActivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  async function loadUsuarios() {
    try {
      const res = await fetch('/api/usuarios');
      const json = await res.json();
      setUsuarios(json.usuarios);
      setRoles(json.roles);
      if (json.roles && json.roles.length > 0 && !rolId) {
        setRolId(json.roles[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.rol?.permisos?.usuarios) {
      loadUsuarios();
    }
  }, [status, session]);

  const openNewModal = () => {
    setModalTitle('Nuevo Usuario');
    setEditingId(null);
    setNombre('');
    setUsername('');
    setPassword('');
    setRolId(roles[0]?.id || '');
    setActivo(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalTitle('Editar Usuario');
    setEditingId(user.id);
    setNombre(user.nombre);
    setUsername(user.username);
    setPassword(''); // Dejar en blanco a menos que se desee cambiar
    setRolId(user.rolId);
    setActivo(user.activo);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre || !username || (!editingId && !password) || !rolId) {
      setErrorMsg('Nombre, usuario, rol y contraseña (para nuevos usuarios) son obligatorios.');
      return;
    }

    const payload = {
      nombre,
      username,
      rolId,
      activo
    };

    if (password) {
      payload.password = password;
    }

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/usuarios?id=${editingId}` : '/api/usuarios';

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
        loadUsuarios();
      }
    } catch (err) {
      setErrorMsg('Error de red al registrar el usuario.');
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('¿Seguro que deseas desactivar este usuario?')) return;

    try {
      const res = await fetch(`/api/usuarios?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.error) {
        alert(json.error);
      } else {
        loadUsuarios();
      }
    } catch (err) {
      alert('Error de red al desactivar el usuario.');
    }
  };

  const filteredUsers = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(searchVal.toLowerCase()) ||
    u.username.toLowerCase().includes(searchVal.toLowerCase()) ||
    u.rol?.nombre.toLowerCase().includes(searchVal.toLowerCase())
  );

  const headers = ['ID', 'Nombre', 'Nombre de Usuario', 'Rol', 'Último Login', 'Estado', 'Acciones'];

  if (status === 'loading') {
    return (
      <div>
        <Header title="Gestión de Usuarios y Accesos" />
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p>Cargando información de sesión...</p>
        </div>
      </div>
    );
  }

  const permisos = session?.user?.rol?.permisos || {};
  if (!permisos.usuarios) {
    return (
      <div>
        <Header title="Acceso Denegado" />
        <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
          <AlertTriangle size={48} className="text-warning" />
          <h2 style={{ color: 'var(--text-primary)', fontSize: '20px' }}>No tienes permiso para acceder a Usuarios</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', fontSize: '14px', lineHeight: '1.5' }}>
            Esta sección de administración de Usuarios y Accesos está restringida. Contacta a un superadministrador si necesitas permisos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Gestión de Usuarios y Accesos" />

      <div className="table-actions glass-panel">
        <button onClick={openNewModal} className="btn btn-primary" disabled={roles.length === 0}>
          <Plus size={18} />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="glass-panel" style={{ marginTop: '20px' }}>
        {loading ? (
          <p>Cargando usuarios...</p>
        ) : (
          <Table
            headers={headers}
            data={filteredUsers}
            searchVal={searchVal}
            onSearchChange={setSearchVal}
            searchPlaceholder="Buscar por nombre, correo..."
            renderRow={(user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td><strong>{user.nombre}</strong></td>
                <td>{user.username}</td>
                <td><span className="badge badge-warning">{user.rol?.nombre}</span></td>
                <td>{user.ultimoLogin ? new Date(user.ultimoLogin).toLocaleString() : 'Nunca'}</td>
                <td>
                  <span className={`badge ${user.activo ? 'badge-success' : 'badge-danger'}`}>
                    {user.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="table-row-actions">
                  <button onClick={() => openEditModal(user)} className="btn btn-secondary btn-icon" title="Editar">
                    <Edit2 size={14} />
                  </button>
                  {user.activo && (
                    <button onClick={() => handleDeactivate(user.id)} className="btn btn-danger btn-icon" title="Desactivar">
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
            <label className="label-field">Nombre del Usuario</label>
            <input 
              type="text" 
              required
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              className="input-field" 
              placeholder="Ej. Pedro Pérez"
            />
          </div>

          <div className="form-group">
            <label className="label-field">Nombre de Usuario</label>
            <input 
              type="text" 
              required
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="input-field" 
              placeholder="Ej. pperez"
            />
          </div>

          <div className="form-group">
            <label className="label-field">Contraseña {editingId && '(Dejar en blanco para mantener actual)'}</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="input-field" 
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label className="label-field">Rol asignado</label>
            <select 
              value={rolId} 
              onChange={(e) => setRolId(e.target.value)} 
              className="input-field"
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>

          {editingId && (
            <div className="form-group row-checkbox">
              <input 
                type="checkbox" 
                id="user-activo" 
                checked={activo} 
                onChange={(e) => setActivo(e.target.checked)} 
              />
              <label htmlFor="user-activo">Usuario Activo</label>
            </div>
          )}

          <div className="form-buttons">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Usuario</button>
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
