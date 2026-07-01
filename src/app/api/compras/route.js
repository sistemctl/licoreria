import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { requirePermission } from '@/lib/permissions.server';

export async function GET(request) {
  try {
    const auth = await requirePermission('compras');
    if (auth.response) return auth.response;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const compra = await prisma.compra.findUnique({
        where: { id: parseInt(id) },
        include: {
          proveedor: true,
          usuario: { select: { nombre: true } },
          detalles: {
            include: {
              producto: true,
              lotes: true
            }
          }
        }
      });
      return NextResponse.json(compra);
    }

    const compras = await prisma.compra.findMany({
      include: {
        proveedor: true,
        usuario: { select: { nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    });

    return NextResponse.json(compras);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requirePermission('compras');
    if (auth.response) return auth.response;
    const session = auth.session;

    const body = await request.json();
    const {
      proveedorId,
      numFacturaProveedor,
      observaciones,
      detalles // Array de { productoId: int, cantidad: int, precioUnitario: float, numeroLote: string, fechaVencimiento: DateString }
    } = body;

    if (!proveedorId || !detalles || detalles.length === 0) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Calcular el total
    let totalCompra = 0;
    detalles.forEach(d => {
      totalCompra += parseFloat(d.precioUnitario) * parseInt(d.cantidad);
    });

    const compra = await prisma.$transaction(async (tx) => {
      // 1. Crear Compra
      const c = await tx.compra.create({
        data: {
          proveedorId: parseInt(proveedorId),
          usuarioId: parseInt(session.user.id),
          numFacturaProveedor,
          total: totalCompra,
          observaciones
        }
      });

      // 2. Procesar cada detalle
      for (const det of detalles) {
        const subtotal = parseFloat(det.precioUnitario) * parseInt(det.cantidad);
        
        // Crear CompraDetalle
        const cd = await tx.compraDetalle.create({
          data: {
            compraId: c.id,
            productoId: parseInt(det.productoId),
            cantidad: parseInt(det.cantidad),
            precioUnitario: parseFloat(det.precioUnitario),
            subtotal
          }
        });

        // Incrementar stock en Producto y actualizar precioCompra
        await tx.producto.update({
          where: { id: parseInt(det.productoId) },
          data: {
            stock: { increment: parseInt(det.cantidad) },
            precioCompra: parseFloat(det.precioUnitario)
          }
        });

        // Crear Lote si se especificó información del mismo
        if (det.numeroLote || det.fechaVencimiento) {
          await tx.lote.create({
            data: {
              productoId: parseInt(det.productoId),
              numeroLote: det.numeroLote || null,
              fechaVencimiento: det.fechaVencimiento ? new Date(det.fechaVencimiento) : null,
              cantidad: parseInt(det.cantidad),
              compraDetalleId: cd.id
            }
          });
        }
      }

      return c;
    });

    // Buscar la compra completa para responder y auditar
    const compraCompleta = await prisma.compra.findUnique({
      where: { id: compra.id },
      include: {
        detalles: {
          include: { producto: true }
        }
      }
    });

    await logAudit({
      accion: 'REGISTRAR_COMPRA',
      tablaAfectada: 'compras',
      registroId: compraCompleta.id,
      datosNuevos: compraCompleta
    });

    return NextResponse.json(compraCompleta);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
