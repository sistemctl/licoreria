import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/** Requiere sesión activa sin permiso específico. */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  }
  return { session };
}

/** Requiere un permiso específico en la sesión del servidor. */
export async function requirePermission(key) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  }
  if (!session?.user?.rol?.permisos?.[key]) {
    return { response: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) };
  }
  return { session };
}

/** Requiere al menos uno de los permisos indicados. */
export async function requireAnyPermission(keys) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  }
  const permisos = session?.user?.rol?.permisos || {};
  const hasAny = keys.some((k) => permisos[k]);
  if (!hasAny) {
    return { response: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) };
  }
  return { session };
}

/** Verifica que el usuario sea dueño del turno o tenga permiso de configuración. */
export function canManageCajaTurno(session, turnoUsuarioId) {
  const userId = parseInt(session.user.id);
  if (turnoUsuarioId === userId) return true;
  return Boolean(session?.user?.rol?.permisos?.configuracion);
}
