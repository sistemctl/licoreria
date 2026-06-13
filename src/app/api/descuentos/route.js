import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const where = {};
    if (activeOnly) {
      where.activo = true;
    }

    const descuentos = await prisma.descuento.findMany({
      where,
      include: {
        descuentoProductos: {
          include: {
            producto: true
          }
        }
      },
      orderBy: { fechaInicio: 'desc' }
    });

    return NextResponse.json(descuentos);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      nombre,
      tipo,
      valor,
      cantidadRequerida,
      cantidadCobrada,
      fechaInicio,
      fechaFin,
      productoIds // Array de IDs de productos aplicables
    } = body;

    if (!nombre || !tipo || valor === undefined || !fechaInicio || !fechaFin) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const nuevoDescuento = await prisma.$transaction(async (tx) => {
      // 1. Crear el descuento
      const desc = await tx.descuento.create({
        data: {
          nombre,
          tipo,
          valor: parseFloat(valor),
          cantidadRequerida: cantidadRequerida ? parseInt(cantidadRequerida) : null,
          cantidadCobrada: cantidadCobrada ? parseInt(cantidadCobrada) : null,
          fechaInicio: new Date(fechaInicio),
          fechaFin: new Date(fechaFin),
          activo: true
        }
      });

      // 2. Asociar productos
      if (productoIds && productoIds.length > 0) {
        for (const pId of productoIds) {
          await tx.descuentoProducto.create({
            data: {
              descuentoId: desc.id,
              productoId: parseInt(pId)
            }
          });
        }
      }

      return desc;
    });

    const completo = await prisma.descuento.findUnique({
      where: { id: nuevoDescuento.id },
      include: {
        descuentoProductos: {
          include: { producto: true }
        }
      }
    });

    await logAudit({
      accion: 'CREAR_DESCUENTO',
      tablaAfectada: 'descuentos',
      registroId: completo.id,
      datosNuevos: completo
    });

    return NextResponse.json(completo);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'El ID es requerido' }, { status: 400 });
    }

    const body = await request.json();
    const {
      nombre,
      tipo,
      valor,
      cantidadRequerida,
      cantidadCobrada,
      fechaInicio,
      fechaFin,
      activo,
      productoIds
    } = body;

    const anterior = await prisma.descuento.findUnique({
      where: { id: parseInt(id) },
      include: { descuentoProductos: true }
    });

    if (!anterior) {
      return NextResponse.json({ error: 'Descuento no encontrado' }, { status: 404 });
    }

    const actualizado = await prisma.$transaction(async (tx) => {
      // 1. Actualizar el descuento
      const desc = await tx.descuento.update({
        where: { id: parseInt(id) },
        data: {
          nombre: nombre !== undefined ? nombre : anterior.nombre,
          tipo: tipo !== undefined ? tipo : anterior.tipo,
          valor: valor !== undefined ? parseFloat(valor) : parseFloat(anterior.valor),
          cantidadRequerida: cantidadRequerida !== undefined ? (cantidadRequerida ? parseInt(cantidadRequerida) : null) : anterior.cantidadRequerida,
          cantidadCobrada: cantidadCobrada !== undefined ? (cantidadCobrada ? parseInt(cantidadCobrada) : null) : anterior.cantidadCobrada,
          fechaInicio: fechaInicio !== undefined ? new Date(fechaInicio) : anterior.fechaInicio,
          fechaFin: fechaFin !== undefined ? new Date(fechaFin) : anterior.fechaFin,
          activo: activo !== undefined ? !!activo : anterior.activo
        }
      });

      // 2. Si se pasaron nuevos productoIds, reemplazar relaciones
      if (productoIds !== undefined) {
        await tx.descuentoProducto.deleteMany({
          where: { descuentoId: parseInt(id) }
        });

        if (productoIds.length > 0) {
          for (const pId of productoIds) {
            await tx.descuentoProducto.create({
              data: {
                descuentoId: desc.id,
                productoId: parseInt(pId)
              }
            });
          }
        }
      }

      return desc;
    });

    const completo = await prisma.descuento.findUnique({
      where: { id: actualizado.id },
      include: {
        descuentoProductos: {
          include: { producto: true }
        }
      }
    });

    await logAudit({
      accion: 'EDITAR_DESCUENTO',
      tablaAfectada: 'descuentos',
      registroId: completo.id,
      datosAnteriores: anterior,
      datosNuevos: completo
    });

    return NextResponse.json(completo);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'El ID es requerido' }, { status: 400 });
    }

    const anterior = await prisma.descuento.findUnique({
      where: { id: parseInt(id) }
    });

    if (!anterior) {
      return NextResponse.json({ error: 'Descuento no encontrado' }, { status: 404 });
    }

    const desactivado = await prisma.descuento.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    await logAudit({
      accion: 'DESACTIVAR_DESCUENTO',
      tablaAfectada: 'descuentos',
      registroId: desactivado.id,
      datosAnteriores: anterior,
      datosNuevos: desactivado
    });

    return NextResponse.json(desactivado);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
