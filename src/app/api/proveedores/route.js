import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const where = {};
    if (query) {
      where.OR = [
        { nombre: { contains: query, mode: 'insensitive' } },
        { rifNit: { contains: query, mode: 'insensitive' } },
        { contacto: { contains: query, mode: 'insensitive' } }
      ];
    }
    if (activeOnly) {
      where.activo = true;
    }

    const proveedores = await prisma.proveedor.findMany({
      where,
      orderBy: { nombre: 'asc' }
    });

    return NextResponse.json(proveedores);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      nombre,
      telefono,
      email,
      rifNit,
      direccion,
      contacto
    } = body;

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const nuevo = await prisma.proveedor.create({
      data: {
        nombre,
        telefono,
        email,
        rifNit: rifNit || null,
        direccion,
        contacto,
        activo: true
      }
    });

    await logAudit({
      accion: 'CREAR_PROVEEDOR',
      tablaAfectada: 'proveedores',
      registroId: nuevo.id,
      datosNuevos: nuevo
    });

    return NextResponse.json(nuevo);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'El ID es obligatorio' }, { status: 400 });
    }

    const body = await request.json();
    const {
      nombre,
      telefono,
      email,
      rifNit,
      direccion,
      contacto,
      activo
    } = body;

    const anterior = await prisma.proveedor.findUnique({
      where: { id: parseInt(id) }
    });

    if (!anterior) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    const actualizado = await prisma.proveedor.update({
      where: { id: parseInt(id) },
      data: {
        nombre: nombre !== undefined ? nombre : anterior.nombre,
        telefono: telefono !== undefined ? telefono : anterior.telefono,
        email: email !== undefined ? email : anterior.email,
        rifNit: rifNit !== undefined ? (rifNit || null) : anterior.rifNit,
        direccion: direccion !== undefined ? direccion : anterior.direccion,
        contacto: contacto !== undefined ? contacto : anterior.contacto,
        activo: activo !== undefined ? !!activo : anterior.activo
      }
    });

    await logAudit({
      accion: 'EDITAR_PROVEEDOR',
      tablaAfectada: 'proveedores',
      registroId: actualizado.id,
      datosAnteriores: anterior,
      datosNuevos: actualizado
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'El ID es obligatorio' }, { status: 400 });
    }

    const anterior = await prisma.proveedor.findUnique({
      where: { id: parseInt(id) }
    });

    if (!anterior) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    const desactivado = await prisma.proveedor.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    await logAudit({
      accion: 'DESACTIVAR_PROVEEDOR',
      tablaAfectada: 'proveedores',
      registroId: desactivado.id,
      datosAnteriores: anterior,
      datosNuevos: desactivado
    });

    return NextResponse.json(desactivado);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
