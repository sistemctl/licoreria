import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!session?.user?.rol?.permisos?.usuarios) {
      return NextResponse.json({ error: 'No autorizado (Falta permiso de usuarios)' }, { status: 403 });
    }

    const users = await prisma.usuario.findMany({
      include: {
        rol: true
      },
      orderBy: { nombre: 'asc' }
    });

    // Remueve los hashes de contraseña antes de enviar
    const cleanUsers = users.map(({ passwordHash, ...u }) => u);

    // También retornar roles disponibles para formularios
    const roles = await prisma.rol.findMany();

    return NextResponse.json({ usuarios: cleanUsers, roles });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!session?.user?.rol?.permisos?.usuarios) {
      return NextResponse.json({ error: 'No autorizado (Falta permiso de usuarios)' }, { status: 403 });
    }

    const body = await request.json();
    const { nombre, username, password, rolId } = body;

    if (!nombre || !username || !password || !rolId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const existe = await prisma.usuario.findUnique({ where: { username } });
    if (existe) {
      return NextResponse.json({ error: 'El nombre de usuario ya está registrado' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const nuevo = await prisma.usuario.create({
      data: {
        nombre,
        username,
        passwordHash,
        rolId: parseInt(rolId),
        activo: true
      }
    });

    const { passwordHash: _, ...cleanUser } = nuevo;

    await logAudit({
      accion: 'CREAR_USUARIO',
      tablaAfectada: 'usuarios',
      registroId: cleanUser.id,
      datosNuevos: cleanUser
    });

    return NextResponse.json(cleanUser);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!session?.user?.rol?.permisos?.usuarios) {
      return NextResponse.json({ error: 'No autorizado (Falta permiso de usuarios)' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario es requerido' }, { status: 400 });
    }

    const body = await request.json();
    const { nombre, username, password, rolId, activo } = body;

    const anterior = await prisma.usuario.findUnique({
      where: { id: parseInt(id) }
    });

    if (!anterior) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (username && username !== anterior.username) {
      const existe = await prisma.usuario.findUnique({ where: { username } });
      if (existe) {
        return NextResponse.json({ error: 'El nombre de usuario ya está registrado' }, { status: 400 });
      }
    }

    const updateData = {
      nombre: nombre !== undefined ? nombre : anterior.nombre,
      username: username !== undefined ? username : anterior.username,
      rolId: rolId !== undefined ? parseInt(rolId) : anterior.rolId,
      activo: activo !== undefined ? !!activo : anterior.activo
    };

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    const actualizado = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    const { passwordHash: _, ...cleanUser } = actualizado;

    await logAudit({
      accion: 'EDITAR_USUARIO',
      tablaAfectada: 'usuarios',
      registroId: cleanUser.id,
      datosAnteriores: { nombre: anterior.nombre, username: anterior.username, rolId: anterior.rolId, activo: anterior.activo },
      datosNuevos: cleanUser
    });

    return NextResponse.json(cleanUser);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!session?.user?.rol?.permisos?.usuarios) {
      return NextResponse.json({ error: 'No autorizado (Falta permiso de usuarios)' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario es requerido' }, { status: 400 });
    }

    const anterior = await prisma.usuario.findUnique({
      where: { id: parseInt(id) }
    });

    if (!anterior) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const desactivado = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    const { passwordHash: _, ...cleanUser } = desactivado;

    await logAudit({
      accion: 'DESACTIVAR_USUARIO',
      tablaAfectada: 'usuarios',
      registroId: cleanUser.id,
      datosAnteriores: { nombre: anterior.nombre, username: anterior.username, rolId: anterior.rolId, activo: anterior.activo },
      datosNuevos: cleanUser
    });

    return NextResponse.json(cleanUser);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
