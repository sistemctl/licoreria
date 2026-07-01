import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  hasFullAdminAccess,
  normalizePermissions,
} from '@/lib/permissions';

async function requireUsuariosPermission() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  }
  if (!session?.user?.rol?.permisos?.usuarios) {
    return { error: NextResponse.json({ error: 'No autorizado (Falta permiso de usuarios)' }, { status: 403 }) };
  }
  return { session };
}

async function wouldLeaveWithoutAdmin(newPermisos, roleId) {
  const roleIdInt = parseInt(roleId);
  const anterior = await prisma.rol.findUnique({ where: { id: roleIdInt } });
  if (!anterior) return false;

  const oldPerms = normalizePermissions(anterior.permisos);
  const newPerms = normalizePermissions(newPermisos);

  // Solo aplica si este rol tenía acceso admin y se lo estamos quitando
  if (!hasFullAdminAccess(oldPerms) || hasFullAdminAccess(newPerms)) {
    return false;
  }

  const users = await prisma.usuario.findMany({
    where: { activo: true },
    include: { rol: true },
  });

  const adminsAfter = users.filter((u) => {
    const perms = u.rolId === roleIdInt ? newPerms : normalizePermissions(u.rol?.permisos);
    return hasFullAdminAccess(perms);
  }).length;

  return adminsAfter < 1;
}

export async function GET() {
  try {
    const auth = await requireUsuariosPermission();
    if (auth.error) return auth.error;

    const roles = await prisma.rol.findMany({
      include: {
        _count: { select: { usuarios: true } },
      },
      orderBy: { nombre: 'asc' },
    });

    const rolesWithNormalized = roles.map((rol) => ({
      ...rol,
      permisos: normalizePermissions(rol.permisos),
    }));

    return NextResponse.json({ roles: rolesWithNormalized });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireUsuariosPermission();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de rol es requerido' }, { status: 400 });
    }

    const body = await request.json();
    const { nombre, permisos } = body;

    const anterior = await prisma.rol.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { usuarios: true } } },
    });

    if (!anterior) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    if (nombre !== undefined && !String(nombre).trim()) {
      return NextResponse.json({ error: 'El nombre del rol no puede estar vacío' }, { status: 400 });
    }

    const normalizedPerms = permisos !== undefined ? normalizePermissions(permisos) : normalizePermissions(anterior.permisos);

    if (permisos !== undefined) {
      const leavingWithoutAdmin = await wouldLeaveWithoutAdmin(normalizedPerms, id);
      if (leavingWithoutAdmin) {
        return NextResponse.json(
          {
            error:
              'No puedes quitar Usuarios y Configuración de este rol: quedaría el sistema sin ningún administrador activo.',
          },
          { status: 400 }
        );
      }
    }

    if (nombre !== undefined && nombre.trim() !== anterior.nombre) {
      const existe = await prisma.rol.findFirst({
        where: { nombre: nombre.trim(), id: { not: parseInt(id) } },
      });
      if (existe) {
        return NextResponse.json({ error: 'Ya existe un rol con ese nombre' }, { status: 400 });
      }
    }

    const actualizado = await prisma.rol.update({
      where: { id: parseInt(id) },
      data: {
        ...(nombre !== undefined ? { nombre: nombre.trim() } : {}),
        ...(permisos !== undefined ? { permisos: normalizedPerms } : {}),
      },
      include: { _count: { select: { usuarios: true } } },
    });

    await logAudit({
      accion: 'EDITAR_ROL',
      tablaAfectada: 'roles',
      registroId: actualizado.id,
      datosAnteriores: {
        nombre: anterior.nombre,
        permisos: normalizePermissions(anterior.permisos),
      },
      datosNuevos: {
        nombre: actualizado.nombre,
        permisos: normalizePermissions(actualizado.permisos),
      },
    });

    return NextResponse.json({
      ...actualizado,
      permisos: normalizePermissions(actualizado.permisos),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
}
