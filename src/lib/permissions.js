/**
 * Catálogo de permisos del sistema — claves alineadas con Sidebar y APIs.
 * Seguro para importar en componentes cliente.
 */

export const ALL_PERMISSION_KEYS = [
  'inicio',
  'pos',
  'inventario',
  'categorias',
  'combos',
  'descuentos',
  'ventas',
  'compras',
  'proveedores',
  'clientes',
  'creditos',
  'devoluciones',
  'caja',
  'reportes',
  'auditoria',
  'usuarios',
  'configuracion',
];

export const PERMISSION_LABELS = {
  inicio: 'Inicio',
  pos: 'Punto de venta',
  inventario: 'Productos',
  categorias: 'Categorías',
  combos: 'Combos',
  descuentos: 'Descuentos',
  ventas: 'Ventas',
  compras: 'Compras',
  proveedores: 'Proveedores',
  clientes: 'Clientes',
  creditos: 'Cuentas por cobrar',
  devoluciones: 'Devoluciones',
  caja: 'Caja',
  reportes: 'Reportes',
  auditoria: 'Auditoría',
  usuarios: 'Usuarios',
  configuracion: 'Configuración',
};

export const SENSITIVE_PERMISSIONS = new Set(['usuarios', 'auditoria', 'configuracion']);

export const PERMISSION_GROUPS = [
  {
    id: 'operacion',
    label: 'Operación diaria',
    description: 'Ventas, caja y atención en mostrador.',
    keys: ['inicio', 'pos', 'caja', 'ventas', 'devoluciones'],
  },
  {
    id: 'inventario',
    label: 'Inventario y catálogo',
    description: 'Productos, categorías, combos y promociones.',
    keys: ['inventario', 'categorias', 'combos', 'descuentos'],
  },
  {
    id: 'compras',
    label: 'Compras y proveedores',
    description: 'Abastecimiento y relación con proveedores.',
    keys: ['compras', 'proveedores'],
  },
  {
    id: 'clientes',
    label: 'Clientes y crédito',
    description: 'Cartera y cuentas por cobrar.',
    keys: ['clientes', 'creditos'],
  },
  {
    id: 'analisis',
    label: 'Análisis',
    description: 'Reportes operativos del negocio.',
    keys: ['reportes'],
  },
  {
    id: 'administracion',
    label: 'Administración',
    description: 'Accesos sensibles del sistema.',
    keys: ['usuarios', 'auditoria', 'configuracion'],
  },
];

/** Permisos mínimos para considerar a alguien administrador del sistema. */
export const ADMIN_PERMISSION_KEYS = ['usuarios', 'configuracion'];

export function normalizePermissions(permisos = {}) {
  const normalized = {};
  for (const key of ALL_PERMISSION_KEYS) {
    normalized[key] = Boolean(permisos[key]);
  }
  return normalized;
}

export function getPermissionLabel(key) {
  return PERMISSION_LABELS[key] || key;
}

export function countActivePermissions(permisos = {}) {
  return ALL_PERMISSION_KEYS.filter((k) => permisos[k]).length;
}

export function getActivePermissionLabels(permisos = {}) {
  return ALL_PERMISSION_KEYS.filter((k) => permisos[k]).map(getPermissionLabel);
}

export function hasFullAdminAccess(permisos = {}) {
  return ADMIN_PERMISSION_KEYS.every((k) => permisos[k]);
}

export function isUserBlocked(user) {
  return Boolean(user?.bloqueadoHasta && new Date(user.bloqueadoHasta) > new Date());
}

export function getUserSecurityState(user) {
  if (!user) return 'unknown';
  if (!user.activo) return 'inactive';
  if (isUserBlocked(user)) return 'blocked';
  if ((user.intentosFallidos || 0) >= 3) return 'risk';
  if (!user.ultimoLogin) return 'never';
  return 'active';
}

export function getUserSecurityLabel(state) {
  const labels = {
    active: 'Activo',
    inactive: 'Inactivo',
    blocked: 'Bloqueado',
    risk: 'Riesgo',
    never: 'Sin ingreso',
    unknown: 'Desconocido',
  };
  return labels[state] || state;
}
