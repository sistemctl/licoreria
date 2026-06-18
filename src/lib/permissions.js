import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export function forbiddenResponse(message = 'No tiene permisos para realizar esta accion') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function unauthorizedResponse(message = 'No autorizado') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function requirePermission(permission) {
  return requireAnyPermission([permission]);
}

export async function requireAnyPermission(permissions) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { response: unauthorizedResponse() };
  }

  const user = await prisma.usuario.findUnique({
    where: { id: parseInt(session.user.id) },
    include: { rol: true }
  });

  if (!user || !user.activo) {
    return { response: unauthorizedResponse('Usuario no autorizado o inactivo') };
  }

  const rolePermissions = user.rol?.permisos || {};
  const allowed = permissions.some((perm) => rolePermissions[perm] === true);

  if (!allowed) {
    return { response: forbiddenResponse() };
  }

  return {
    session,
    user,
    permissions: rolePermissions
  };
}
