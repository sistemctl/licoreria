import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { requireAnyPermission, requirePermission } from '@/lib/permissions.server';

export async function GET(request) {
  try {
    const auth = await requireAnyPermission(['combos', 'pos', 'inventario']);
    if (auth.response) return auth.response;
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const where = { esCombo: true };
    if (activeOnly) {
      where.activo = true;
    }

    const combos = await prisma.producto.findMany({
      where,
      include: {
        comboComoCombo: {
          include: {
            producto: true // Los ingredientes individuales
          }
        },
        categoria: true
      },
      orderBy: { nombre: 'asc' }
    });

    return NextResponse.json(combos);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requirePermission('combos');
    if (auth.response) return auth.response;
    const body = await request.json();
    const {
      nombre,
      codigoBarras,
      descripcion,
      categoriaId,
      precioVentaDetal,
      ingredientes // Array de { productoId: int, cantidad: int }
    } = body;

    if (!nombre || !categoriaId || !precioVentaDetal || !ingredientes || ingredientes.length === 0) {
      return NextResponse.json({ error: 'Faltan campos obligatorios para el combo' }, { status: 400 });
    }

    // El precio de compra del combo será la suma de los precios de compra de los ingredientes
    let totalPrecioCompra = 0;
    for (const ing of ingredientes) {
      const prod = await prisma.producto.findUnique({ where: { id: parseInt(ing.productoId) } });
      if (prod) {
        totalPrecioCompra += parseFloat(prod.precioCompra) * parseInt(ing.cantidad);
      }
    }

    // Crear combo usando transacción
    const comboCreado = await prisma.$transaction(async (tx) => {
      // 1. Crear el producto combo
      const comboProd = await tx.producto.create({
        data: {
          nombre,
          codigoBarras: codigoBarras || null,
          descripcion,
          categoriaId: parseInt(categoriaId),
          precioCompra: totalPrecioCompra,
          precioVentaDetal: parseFloat(precioVentaDetal),
          stock: 0,
          stockMinimo: 0,
          esCombo: true,
          activo: true
        }
      });

      // 2. Crear los detalles del combo
      for (const ing of ingredientes) {
        await tx.comboDetalle.create({
          data: {
            comboId: comboProd.id,
            productoId: parseInt(ing.productoId),
            cantidad: parseInt(ing.cantidad)
          }
        });
      }

      return comboProd;
    });

    // Buscar el combo completo creado para responder y auditar
    const comboCompleto = await prisma.producto.findUnique({
      where: { id: comboCreado.id },
      include: {
        comboComoCombo: {
          include: { producto: true }
        }
      }
    });

    await logAudit({
      accion: 'CREAR_COMBO',
      tablaAfectada: 'productos',
      registroId: comboCompleto.id,
      datosNuevos: comboCompleto
    });

    return NextResponse.json(comboCompleto);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requirePermission('combos');
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'El ID del combo es requerido' }, { status: 400 });
    }

    const body = await request.json();
    const {
      nombre,
      codigoBarras,
      descripcion,
      categoriaId,
      precioVentaDetal,
      activo,
      ingredientes // Array de { productoId: int, cantidad: int }
    } = body;

    const anterior = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
      include: { comboComoCombo: true }
    });

    if (!anterior || !anterior.esCombo) {
      return NextResponse.json({ error: 'Combo no encontrado' }, { status: 404 });
    }

    const comboActualizado = await prisma.$transaction(async (tx) => {
      // 1. Recalcular precio de compra si se enviaron ingredientes
      let totalPrecioCompra = parseFloat(anterior.precioCompra);
      if (ingredientes && ingredientes.length > 0) {
        totalPrecioCompra = 0;
        for (const ing of ingredientes) {
          const prod = await tx.producto.findUnique({ where: { id: parseInt(ing.productoId) } });
          if (prod) {
            totalPrecioCompra += parseFloat(prod.precioCompra) * parseInt(ing.cantidad);
          }
        }

        // 2. Eliminar detalles viejos del combo
        await tx.comboDetalle.deleteMany({
          where: { comboId: parseInt(id) }
        });

        // 3. Crear detalles nuevos
        for (const ing of ingredientes) {
          await tx.comboDetalle.create({
            data: {
              comboId: parseInt(id),
              productoId: parseInt(ing.productoId),
              cantidad: parseInt(ing.cantidad)
            }
          });
        }
      }

      // 4. Actualizar el producto combo
      return await tx.producto.update({
        where: { id: parseInt(id) },
        data: {
          nombre: nombre !== undefined ? nombre : anterior.nombre,
          codigoBarras: codigoBarras !== undefined ? (codigoBarras || null) : anterior.codigoBarras,
          descripcion: descripcion !== undefined ? descripcion : anterior.descripcion,
          categoriaId: categoriaId !== undefined ? parseInt(categoriaId) : anterior.categoriaId,
          precioCompra: totalPrecioCompra,
          precioVentaDetal: precioVentaDetal !== undefined ? parseFloat(precioVentaDetal) : parseFloat(anterior.precioVentaDetal),
          activo: activo !== undefined ? !!activo : anterior.activo
        }
      });
    });

    const comboCompleto = await prisma.producto.findUnique({
      where: { id: comboActualizado.id },
      include: {
        comboComoCombo: {
          include: { producto: true }
        }
      }
    });

    await logAudit({
      accion: 'EDITAR_COMBO',
      tablaAfectada: 'productos',
      registroId: comboCompleto.id,
      datosAnteriores: anterior,
      datosNuevos: comboCompleto
    });

    return NextResponse.json(comboCompleto);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requirePermission('combos');
    if (auth.response) return auth.response;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'El ID es obligatorio' }, { status: 400 });
    }

    const anterior = await prisma.producto.findUnique({
      where: { id: parseInt(id) }
    });

    if (!anterior || !anterior.esCombo) {
      return NextResponse.json({ error: 'Combo no encontrado' }, { status: 404 });
    }

    const desactivado = await prisma.producto.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    await logAudit({
      accion: 'DESACTIVAR_COMBO',
      tablaAfectada: 'productos',
      registroId: desactivado.id,
      datosAnteriores: anterior,
      datosNuevos: desactivado
    });

    return NextResponse.json(desactivado);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
