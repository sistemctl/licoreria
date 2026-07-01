'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ModulePanel } from '@/components/layout';
import Modal from '@/components/Modal';
import {
  Plus,
  Edit2,
  UserX,
  Search,
  Shield,
  Users,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import {
  PERMISSION_GROUPS,
  SENSITIVE_PERMISSIONS,
  countActivePermissions,
  getActivePermissionLabels,
  getPermissionLabel,
  getUserSecurityLabel,
  getUserSecurityState,
  normalizePermissions,
} from '@/lib/permissions';

const SECTIONS = [
  { id: 'personal', label: 'Personal' },
  { id: 'roles', label: 'Roles y permisos' },
];

const STATUS_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'Activos' },
  { id: 'inactive', label: 'Inactivos' },
  { id: 'blocked', label: 'Bloqueados' },
  { id: 'never', label: 'Sin ingreso' },
];

const STALE_LOGIN_DAYS = 30;

function getInitials(nombre) {
  const parts = (nombre || '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (nombre || '?').charAt(0).toUpperCase();
}

function formatLastLogin(date) {
  if (!date) return 'Nunca';
  return new Date(date).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isStaleLogin(date) {
  if (!date) return true;
  const diff = Date.now() - new Date(date).getTime();
  return diff > STALE_LOGIN_DAYS * 24 * 60 * 60 * 1000;
}

function getRolUserCount(rol, usuarios) {
  return rol._count?.usuarios ?? usuarios.filter((u) => u.rolId === rol.id).length;
}

function SecurityBadge({ user }) {
  const state = getUserSecurityState(user);
  const classMap = {
    active: 'usuarios-badge--active',
    inactive: 'usuarios-badge--inactive',
    blocked: 'usuarios-badge--blocked',
    risk: 'usuarios-badge--risk',
    never: 'usuarios-badge--never',
  };
  return (
    <span className={`usuarios-badge ${classMap[state] || ''}`}>
      {getUserSecurityLabel(state)}
    </span>
  );
}

function PermissionKeyringGroups({ permisos }) {
  const normalized = normalizePermissions(permisos);

  return (
    <div className="keyring-groups">
      {PERMISSION_GROUPS.map((group) => {
        const activeKeys = group.keys.filter((k) => normalized[k]);
        if (activeKeys.length === 0) return null;
        return (
          <div key={group.id} className="keyring-groups__block">
            <span className="keyring-groups__label">{group.label}</span>
            <div className="keyring-groups__chips">
              {activeKeys.map((key) => (
                <span
                  key={key}
                  className={`usuarios-keyring__chip ${SENSITIVE_PERMISSIONS.has(key) ? 'usuarios-keyring__chip--sensitive' : ''}`}
                >
                  {getPermissionLabel(key)}
                </span>
              ))}
            </div>
          </div>
        );
      })}
      {countActivePermissions(permisos) === 0 && (
        <span className="usuarios-keyring__chip usuarios-keyring__chip--empty">Sin accesos configurados</span>
      )}
    </div>
  );
}

function PermissionMatrix({ permisos, onChange, readOnly = false }) {
  const normalized = normalizePermissions(permisos);

  return (
    <div className="perm-matrix">
      {PERMISSION_GROUPS.map((group) => (
        <fieldset key={group.id} className="perm-matrix__group">
          <legend className="perm-matrix__legend">
            <span className="perm-matrix__group-label">{group.label}</span>
            <span className="perm-matrix__group-desc">{group.description}</span>
          </legend>
          <div className="perm-matrix__items">
            {group.keys.map((key) => {
              const sensitive = SENSITIVE_PERMISSIONS.has(key);
              const checked = normalized[key];
              return (
                <label
                  key={key}
                  className={`perm-matrix__item ${sensitive ? 'perm-matrix__item--sensitive' : ''} ${checked ? 'perm-matrix__item--on' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={readOnly}
                    onChange={(e) => onChange?.(key, e.target.checked)}
                  />
                  <span className="perm-matrix__item-label">{getPermissionLabel(key)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export default function UsuariosPanel() {
  const { data: session, status } = useSession();
  const currentUserId = session?.user?.id ? parseInt(session.user.id) : null;

  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rolFilter, setRolFilter] = useState('all');
  const [selectedRolId, setSelectedRolId] = useState(null);
  const [activeSection, setActiveSection] = useState('personal');

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalTitle, setUserModalTitle] = useState('Nuevo usuario');
  const [editingId, setEditingId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rolId, setRolId] = useState('');
  const [activo, setActivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [isRolModalOpen, setIsRolModalOpen] = useState(false);
  const [editingRol, setEditingRol] = useState(null);
  const [rolNombre, setRolNombre] = useState('');
  const [rolPermisos, setRolPermisos] = useState({});
  const [rolErrorMsg, setRolErrorMsg] = useState('');
  const [savingRol, setSavingRol] = useState(false);

  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [actionError, setActionError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([fetch('/api/usuarios'), fetch('/api/roles')]);
      const usersJson = await usersRes.json();
      const rolesJson = await rolesRes.json();

      if (usersJson.usuarios) setUsuarios(usersJson.usuarios);
      if (rolesJson.roles) {
        setRoles(rolesJson.roles);
        setSelectedRolId((prev) => prev || rolesJson.roles[0]?.id || null);
      } else if (usersJson.roles) {
        setRoles(usersJson.roles.map((r) => ({ ...r, permisos: normalizePermissions(r.permisos), _count: { usuarios: 0 } })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.rol?.permisos?.usuarios) {
      loadData();
    }
  }, [status, session, loadData]);

  const stats = useMemo(() => {
    const activos = usuarios.filter((u) => u.activo && getUserSecurityState(u) === 'active').length;
    const inactivos = usuarios.filter((u) => !u.activo).length;
    const bloqueados = usuarios.filter((u) => getUserSecurityState(u) === 'blocked').length;
    const sinLogin = usuarios.filter((u) => !u.ultimoLogin && u.activo).length;
    const staleLogin = usuarios.filter((u) => u.activo && isStaleLogin(u.ultimoLogin)).length;
    return {
      total: usuarios.length,
      activos,
      inactivos,
      bloqueados,
      sinLogin,
      staleLogin,
      roles: roles.length,
    };
  }, [usuarios, roles]);

  const filteredUsers = useMemo(() => {
    return usuarios.filter((u) => {
      const q = searchVal.toLowerCase();
      const matchesSearch =
        u.nombre.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.rol?.nombre?.toLowerCase().includes(q);

      const securityState = getUserSecurityState(u);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && securityState === 'active') ||
        (statusFilter === 'inactive' && !u.activo) ||
        (statusFilter === 'blocked' && securityState === 'blocked') ||
        (statusFilter === 'never' && securityState === 'never');

      const matchesRol = rolFilter === 'all' || String(u.rolId) === String(rolFilter);

      return matchesSearch && matchesStatus && matchesRol;
    });
  }, [usuarios, searchVal, statusFilter, rolFilter]);

  const selectedRol = useMemo(
    () => roles.find((r) => r.id === selectedRolId) || roles[0],
    [roles, selectedRolId]
  );

  const attentionUsers = useMemo(() => {
    return usuarios.filter((u) => {
      if (!u.activo) return false;
      const state = getUserSecurityState(u);
      return state === 'blocked' || state === 'risk' || state === 'never' || isStaleLogin(u.ultimoLogin);
    });
  }, [usuarios]);

  const applyAttentionFilter = (user) => {
    setActiveSection('personal');
    setSearchVal(user.username);
    setStatusFilter('all');
    setRolFilter(String(user.rolId));
  };

  const openNewModal = () => {
    setUserModalTitle('Nuevo usuario');
    setEditingId(null);
    setNombre('');
    setUsername('');
    setPassword('');
    setRolId(String(roles[0]?.id || ''));
    setActivo(true);
    setErrorMsg('');
    setIsUserModalOpen(true);
  };

  const openEditModal = (user) => {
    setUserModalTitle('Editar usuario');
    setEditingId(user.id);
    setNombre(user.nombre);
    setUsername(user.username);
    setPassword('');
    setRolId(String(user.rolId));
    setActivo(user.activo);
    setErrorMsg('');
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre || !username || (!editingId && !password) || !rolId) {
      setErrorMsg('Nombre, usuario, rol y contraseña (para cuentas nuevas) son obligatorios.');
      return;
    }

    const payload = { nombre, username, rolId, activo };
    if (password) payload.password = password;

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/usuarios?id=${editingId}` : '/api/usuarios';

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
        setIsUserModalOpen(false);
        loadData();
      }
    } catch {
      setErrorMsg('Error de red al guardar el usuario.');
    }
  };

  const requestDeactivate = (user) => {
    setActionError('');
    setConfirmDeactivate(user);
  };

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return;
    setActionError('');

    try {
      const res = await fetch(`/api/usuarios?id=${confirmDeactivate.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.error) {
        setActionError(json.error);
      } else {
        setConfirmDeactivate(null);
        loadData();
      }
    } catch {
      setActionError('Error de red al desactivar el acceso.');
    }
  };

  const openRolModal = (rol) => {
    setEditingRol(rol);
    setRolNombre(rol.nombre);
    setRolPermisos(normalizePermissions(rol.permisos));
    setRolErrorMsg('');
    setIsRolModalOpen(true);
  };

  const handleRolPermChange = (key, value) => {
    setRolPermisos((prev) => ({ ...prev, [key]: value }));
  };

  const handleRolSubmit = async (e) => {
    e.preventDefault();
    setRolErrorMsg('');
    setSavingRol(true);

    if (!rolNombre.trim()) {
      setRolErrorMsg('El nombre del rol no puede estar vacío.');
      setSavingRol(false);
      return;
    }

    try {
      const res = await fetch(`/api/roles?id=${editingRol.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: rolNombre.trim(), permisos: rolPermisos }),
      });
      const json = await res.json();

      if (json.error) {
        setRolErrorMsg(json.error);
      } else {
        setIsRolModalOpen(false);
        loadData();
      }
    } catch {
      setRolErrorMsg('Error de red al guardar el rol.');
    } finally {
      setSavingRol(false);
    }
  };

  const previewRol = roles.find((r) => String(r.id) === String(rolId));

  return (
    <>
      <ModulePanel loading={loading} loadingMessage="Cargando accesos..." className="config-admin-panel__surface usuarios-hub">
        {/* Hero: resumen operativo */}
        <header className="usuarios-hero">
          <div className="usuarios-hero__primary">
            <p className="usuarios-hero__eyebrow">Control de acceso</p>
            <div className="usuarios-hero__stat">
              <span className="usuarios-hero__value">{stats.activos}</span>
              <span className="usuarios-hero__label">personas con acceso activo</span>
            </div>
          </div>
          <div className="usuarios-hero__secondary">
            <div className="usuarios-hero__mini">
              <span className="usuarios-hero__mini-value">{stats.roles}</span>
              <span className="usuarios-hero__mini-label">roles</span>
            </div>
            <div className="usuarios-hero__mini">
              <span className="usuarios-hero__mini-value">{stats.inactivos}</span>
              <span className="usuarios-hero__mini-label">inactivos</span>
            </div>
            <div className={`usuarios-hero__mini ${stats.bloqueados > 0 ? 'usuarios-hero__mini--alert' : ''}`}>
              <span className="usuarios-hero__mini-value">{stats.bloqueados}</span>
              <span className="usuarios-hero__mini-label">bloqueados</span>
            </div>
          </div>
        </header>

        {/* Alertas de atención */}
        {attentionUsers.length > 0 ? (
          <section className="usuarios-attention" aria-label="Cuentas que requieren revisión">
            <div className="usuarios-attention__head">
              <AlertTriangle size={16} />
              <span>Requiere revisión ({attentionUsers.length})</span>
            </div>
            <div className="usuarios-attention__list">
              {attentionUsers.slice(0, 5).map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="usuarios-attention__item"
                  onClick={() => {
                    applyAttentionFilter(user);
                    openEditModal(user);
                  }}
                >
                  <span className="usuarios-attention__name">{user.nombre}</span>
                  <SecurityBadge user={user} />
                </button>
              ))}
              {attentionUsers.length > 5 && (
                <span className="usuarios-attention__more">+{attentionUsers.length - 5} más</span>
              )}
            </div>
          </section>
        ) : (
          <p className="usuarios-attention usuarios-attention--ok">
            Todas las cuentas activas están en orden.
          </p>
        )}

        {/* Navegación de sección */}
        <nav className="usuarios-nav" aria-label="Secciones de accesos">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`usuarios-nav__tab ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
              {section.id === 'personal' && attentionUsers.length > 0 && (
                <span className="usuarios-nav__badge">{attentionUsers.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Sección: Personal */}
        {activeSection === 'personal' && (
          <section className="usuarios-section" aria-labelledby="usuarios-personal-heading">
            <div className="usuarios-section__head">
              <div>
                <h3 id="usuarios-personal-heading" className="usuarios-section__title">
                  Personal
                </h3>
                <p className="usuarios-section__desc">
                  {filteredUsers.length} de {usuarios.length} cuentas
                  {rolFilter !== 'all' && selectedRol ? ` · ${selectedRol.nombre}` : ''}
                </p>
              </div>
              <button onClick={openNewModal} className="btn btn-primary" disabled={roles.length === 0}>
                <Plus size={18} />
                <span>Nuevo usuario</span>
              </button>
            </div>

            <div className="usuarios-toolbar">
              <div className="usuarios-hub__search">
                <Search size={16} />
                <input
                  type="search"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Buscar por nombre o usuario..."
                  className="input-field"
                />
              </div>
              <div className="usuarios-toolbar__filters">
                <div className="usuarios-hub__filters">
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`usuarios-filter-chip ${statusFilter === f.id ? 'active' : ''}`}
                      onClick={() => setStatusFilter(f.id)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <select
                  value={rolFilter}
                  onChange={(e) => setRolFilter(e.target.value)}
                  className="input-field usuarios-hub__rol-select"
                  aria-label="Filtrar por rol"
                >
                  <option value="all">Todos los roles</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="usuarios-list">
              {filteredUsers.length === 0 ? (
                <div className="usuarios-empty">
                  <Users size={32} />
                  <p>No hay usuarios que coincidan con los filtros.</p>
                  <button type="button" className="btn btn-secondary" onClick={openNewModal}>
                    Crear usuario
                  </button>
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelf = currentUserId === user.id;
                  return (
                    <article key={user.id} className={`usuarios-card ${!user.activo ? 'usuarios-card--inactive' : ''}`}>
                      <div className="usuarios-card__avatar" aria-hidden="true">
                        {getInitials(user.nombre)}
                      </div>

                      <div className="usuarios-card__identity">
                        <h4 className="usuarios-card__name">
                          {user.nombre}
                          {isSelf && <span className="usuarios-card__you">Tú</span>}
                        </h4>
                        <span className="usuarios-card__username">@{user.username}</span>
                      </div>

                      <div className="usuarios-card__details">
                        <span className="usuarios-card__rol-pill">{user.rol?.nombre}</span>
                        <div className="usuarios-card__login">
                          <span className="usuarios-card__login-label">Último ingreso</span>
                          <time className="usuarios-card__login-value" dateTime={user.ultimoLogin || undefined}>
                            {formatLastLogin(user.ultimoLogin)}
                          </time>
                        </div>
                        {(user.intentosFallidos || 0) > 0 && user.activo && (
                          <span className="usuarios-card__attempts">
                            {user.intentosFallidos === 1
                              ? '1 intento fallido'
                              : `${user.intentosFallidos} intentos fallidos`}
                          </span>
                        )}
                      </div>

                      <div className="usuarios-card__aside">
                        <SecurityBadge user={user} />
                        <div className="usuarios-card__actions">
                          <button
                            onClick={() => openEditModal(user)}
                            className="usuarios-card__action-btn"
                            title="Editar usuario"
                            aria-label={`Editar ${user.nombre}`}
                          >
                            <Edit2 size={15} />
                          </button>
                          {user.activo && !isSelf && (
                            <button
                              onClick={() => requestDeactivate(user)}
                              className="usuarios-card__action-btn usuarios-card__action-btn--danger"
                              title="Desactivar acceso"
                              aria-label={`Desactivar acceso de ${user.nombre}`}
                            >
                              <UserX size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* Sección: Roles */}
        {activeSection === 'roles' && (
          <section className="usuarios-section usuarios-section--roles" aria-labelledby="usuarios-roles-heading">
            <div className="usuarios-section__head">
              <div>
                <h3 id="usuarios-roles-heading" className="usuarios-section__title">
                  Llavero de permisos
                </h3>
                <p className="usuarios-section__desc">
                  Cada rol abre módulos distintos del sistema.
                </p>
              </div>
            </div>

            <div className="usuarios-roles-layout">
              <div className="usuarios-roles-picker" role="tablist" aria-label="Seleccionar rol">
                {roles.map((rol) => {
                  const count = getRolUserCount(rol, usuarios);
                  return (
                    <button
                      key={rol.id}
                      type="button"
                      role="tab"
                      aria-selected={selectedRol?.id === rol.id}
                      className={`usuarios-keyring__tab ${selectedRol?.id === rol.id ? 'active' : ''}`}
                      onClick={() => setSelectedRolId(rol.id)}
                    >
                      <span className="usuarios-keyring__tab-name">{rol.nombre}</span>
                      <span className="usuarios-keyring__tab-count">
                        {count} usuario{count !== 1 ? 's' : ''} · {countActivePermissions(rol.permisos)} accesos
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedRol && (
                <div className="usuarios-keyring usuarios-keyring--panel" role="tabpanel">
                  <div className="usuarios-keyring__head">
                    <Shield size={18} />
                    <h4>{selectedRol.nombre}</h4>
                  </div>
                  <PermissionKeyringGroups permisos={selectedRol.permisos} />
                  <button
                    type="button"
                    className="btn btn-secondary usuarios-keyring__edit"
                    onClick={() => openRolModal(selectedRol)}
                  >
                    <KeyRound size={16} />
                    Editar permisos
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </ModulePanel>

      {/* Modal usuario */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={userModalTitle}>
        <form onSubmit={handleUserSubmit} className="form-modal-layout">
          {errorMsg && <div className="error-banner">{errorMsg}</div>}

          <div className="form-group">
            <label className="label-field">Nombre</label>
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
            <label className="label-field">Usuario de acceso</label>
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
            <label className="label-field">
              Contraseña {editingId && '(dejar en blanco para mantener)'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label className="label-field">Rol</label>
            <select value={rolId} onChange={(e) => setRolId(e.target.value)} className="input-field">
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
            {previewRol && (
              <div className="usuarios-rol-preview">
                <p className="usuarios-rol-preview__title">Este rol puede acceder a:</p>
                <div className="usuarios-rol-preview__chips">
                  {getActivePermissionLabels(previewRol.permisos).slice(0, 8).map((label) => (
                    <span key={label} className="usuarios-keyring__chip">
                      {label}
                    </span>
                  ))}
                  {countActivePermissions(previewRol.permisos) > 8 && (
                    <span className="usuarios-keyring__chip">
                      +{countActivePermissions(previewRol.permisos) - 8} más
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {editingId && (
            <div className="form-group row-checkbox">
              <input
                type="checkbox"
                id="user-activo"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                disabled={currentUserId === editingId && !activo}
              />
              <label htmlFor="user-activo">Acceso activo</label>
            </div>
          )}

          <div className="form-buttons">
            <button type="button" onClick={() => setIsUserModalOpen(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar usuario
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal rol / permisos */}
      <Modal
        isOpen={isRolModalOpen}
        onClose={() => setIsRolModalOpen(false)}
        title={`Permisos: ${editingRol?.nombre || ''}`}
        size="lg"
      >
        <form onSubmit={handleRolSubmit} className="form-modal-layout">
          {rolErrorMsg && <div className="error-banner">{rolErrorMsg}</div>}

          <div className="form-group">
            <label className="label-field">Nombre del rol</label>
            <input
              type="text"
              required
              value={rolNombre}
              onChange={(e) => setRolNombre(e.target.value)}
              className="input-field"
            />
          </div>

          <PermissionMatrix permisos={rolPermisos} onChange={handleRolPermChange} />

          <div className="form-buttons">
            <button type="button" onClick={() => setIsRolModalOpen(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingRol}>
              {savingRol ? 'Guardando...' : 'Guardar permisos'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmar desactivación */}
      <Modal
        isOpen={Boolean(confirmDeactivate)}
        onClose={() => {
          setConfirmDeactivate(null);
          setActionError('');
        }}
        title="Desactivar acceso"
      >
        <div className="usuarios-confirm">
          <AlertTriangle size={32} className="usuarios-confirm__icon" />
          <p>
            ¿Desactivar el acceso de <strong>{confirmDeactivate?.nombre}</strong> (@{confirmDeactivate?.username})?
          </p>
          <p className="usuarios-confirm__hint">
            El usuario no podrá iniciar sesión. Puedes reactivarlo editando su cuenta.
          </p>
          {actionError && <div className="error-banner">{actionError}</div>}
          <div className="form-buttons">
            <button
              type="button"
              onClick={() => {
                setConfirmDeactivate(null);
                setActionError('');
              }}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button type="button" onClick={handleDeactivate} className="btn btn-danger">
              Desactivar acceso
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
