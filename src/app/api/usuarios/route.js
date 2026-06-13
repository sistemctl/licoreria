import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/audit';

export async function GET(request) {
  try {
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
    const body = await request.json();
    const { nombre, email, password, rolId } = body;

    if (!nombre || !email || !password || !rolId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json({ error: 'El correo electrónico ya está registrado' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const nuevo = await prisma.usuario.create({
      data: {
        nombre,
        email,
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario es requerido' }, { status: 400 });
    }

    const body = await request.json();
    const { nombre, email, password, rolId, activo } = body;

    const anterior = await prisma.usuario.findUnique({
      where: { id: parseInt(id) }
    });

    if (!anterior) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (email && email !== anterior.email) {
      const existe = await prisma.usuario.findUnique({ where: { email } });
      if (existe) {
        return NextResponse.json({ error: 'El correo electrónico ya está registrado' }, { status: 400 });
      }
    }

    const updateData = {
      nombre: nombre !== undefined ? nombre : anterior.nombre,
      email: email !== undefined ? email : anterior.email,
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
      datosAnteriores: { nombre: anterior.nombre, email: anterior.email, rolId: anterior.rolId, activo: anterior.activo },
      datosNuevos: cleanUser
    });

    return NextResponse.json(cleanUser);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
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
      datosAnteriores: { nombre: anterior.nombre, email: anterior.email, rolId: anterior.rolId, activo: anterior.activo },
      datosNuevos: cleanUser
    });

    return NextResponse.json(cleanUser);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
