import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { requireAnyPermission, requirePermission } from '@/lib/permissions.server';

export async function GET(request) {
  try {
    const auth = await requireAnyPermission(['clientes', 'pos', 'creditos']);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const where = {};
    if (query) {
      where.OR = [
        { nombre: { contains: query, mode: 'insensitive' } },
        { cedulaRif: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
      ];
    }
    if (activeOnly) {
      where.activo = true;
    }

    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: { nombre: 'asc' }
    });

    return NextResponse.json(clientes);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requirePermission('clientes');
    if (auth.response) return auth.response;

    const body = await request.json();
    const {
      nombre,
      telefono,
      cedulaRif,
      direccion,
      email,
      tipo,
      limiteCredito
    } = body;

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    // Verificar si ya existe la cédula/RIF
    if (cedulaRif) {
      const duplicado = await prisma.cliente.findUnique({
        where: { cedulaRif }
      });
      if (duplicado) {
        return NextResponse.json({ error: 'La cédula/RIF ya está registrada' }, { status: 400 });
      }
    }

    const nuevo = await prisma.cliente.create({
      data: {
        nombre,
        telefono,
        cedulaRif: cedulaRif || null,
        direccion,
        email,
        tipo: tipo || 'particular',
        limiteCredito: limiteCredito ? parseFloat(limiteCredito) : 0,
        saldoPendiente: 0,
        activo: true
      }
    });

    await logAudit({
      accion: 'CREAR_CLIENTE',
      tablaAfectada: 'clientes',
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
    const auth = await requirePermission('clientes');
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'El ID es obligatorio' }, { status: 400 });
    }

    const body = await request.json();
    const {
      nombre,
      telefono,
      cedulaRif,
      direccion,
      email,
      tipo,
      limiteCredito,
      activo
    } = body;

    const anterior = await prisma.cliente.findUnique({
      where: { id: parseInt(id) }
    });

    if (!anterior) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Si cambió cédulaRif, verificar que no duplique
    if (cedulaRif && cedulaRif !== anterior.cedulaRif) {
      const duplicado = await prisma.cliente.findUnique({
        where: { cedulaRif }
      });
      if (duplicado) {
        return NextResponse.json({ error: 'La cédula/RIF ya está registrada por otro cliente' }, { status: 400 });
      }
    }

    const actualizado = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: {
        nombre: nombre !== undefined ? nombre : anterior.nombre,
        telefono: telefono !== undefined ? telefono : anterior.telefono,
        cedulaRif: cedulaRif !== undefined ? (cedulaRif || null) : anterior.cedulaRif,
        direccion: direccion !== undefined ? direccion : anterior.direccion,
        email: email !== undefined ? email : anterior.email,
        tipo: tipo !== undefined ? tipo : anterior.tipo,
        limiteCredito: limiteCredito !== undefined ? parseFloat(limiteCredito) : parseFloat(anterior.limiteCredito),
        activo: activo !== undefined ? !!activo : anterior.activo
      }
    });

    await logAudit({
      accion: 'EDITAR_CLIENTE',
      tablaAfectada: 'clientes',
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
    const auth = await requirePermission('clientes');
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'El ID es obligatorio' }, { status: 400 });
    }

    const anterior = await prisma.cliente.findUnique({
      where: { id: parseInt(id) }
    });

    if (!anterior) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const desactivado = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    await logAudit({
      accion: 'DESACTIVAR_CLIENTE',
      tablaAfectada: 'clientes',
      registroId: desactivado.id,
      datosAnteriores: anterior,
      datosNuevos: desactivado
    });

    return NextResponse.json(desactivado);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
