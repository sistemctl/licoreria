import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { requireAnyPermission, requirePermission } from '@/lib/permissions';

export async function GET(request) {
  try {
    const auth = await requireAnyPermission(['categorias', 'inventario', 'pos', 'combos', 'descuentos', 'compras']);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const where = {};
    if (query) {
      where.nombre = { contains: query, mode: 'insensitive' };
    }
    if (activeOnly) {
      where.activo = true;
    }

    const categorias = await prisma.categoria.findMany({
      where,
      orderBy: { nombre: 'asc' }
    });

    return NextResponse.json(categorias);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requirePermission('categorias');
    if (auth.response) return auth.response;

    const body = await request.json();
    const { nombre, descripcion } = body;

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const nueva = await prisma.categoria.create({
      data: { nombre, descripcion }
    });

    await logAudit({
      accion: 'CREAR_CATEGORIA',
      tablaAfectada: 'categorias',
      registroId: nueva.id,
      datosNuevos: nueva
    });

    return NextResponse.json(nueva);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requirePermission('categorias');
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'El ID es requerido' }, { status: 400 });
    }

    const body = await request.json();
    const { nombre, descripcion, activo } = body;

    const anterior = await prisma.categoria.findUnique({
      where: { id: parseInt(id) }
    });

    if (!anterior) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    const actualizada = await prisma.categoria.update({
      where: { id: parseInt(id) },
      data: { nombre, descripcion, activo }
    });

    await logAudit({
      accion: 'EDITAR_CATEGORIA',
      tablaAfectada: 'categorias',
      registroId: actualizada.id,
      datosAnteriores: anterior,
      datosNuevos: actualizada
    });

    return NextResponse.json(actualizada);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requirePermission('categorias');
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'El ID es requerido' }, { status: 400 });
    }

    const anterior = await prisma.categoria.findUnique({
      where: { id: parseInt(id) }
    });

    if (!anterior) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    // Soft delete (desactivar)
    const desactivada = await prisma.categoria.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    await logAudit({
      accion: 'DESACTIVAR_CATEGORIA',
      tablaAfectada: 'categorias',
      registroId: desactivada.id,
      datosAnteriores: anterior,
      datosNuevos: desactivada
    });

    return NextResponse.json(desactivada);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
