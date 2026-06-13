import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const devolucion = await prisma.devolucion.findUnique({
        where: { id: parseInt(id) },
        include: {
          venta: true,
          usuario: { select: { nombre: true } },
          detalles: {
            include: {
              producto: true
            }
          }
        }
      });
      return NextResponse.json(devolucion);
    }

    const devoluciones = await prisma.devolucion.findMany({
      include: {
        venta: true,
        usuario: { select: { nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    });

    return NextResponse.json(devoluciones);
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

    const body = await request.json();
    const {
      ventaId,
      motivo,
      detalles // Array de { productoId: int, cantidad: int, razon: string }
    } = body;

    if (!ventaId || !detalles || detalles.length === 0 || !motivo) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const usuarioId = parseInt(session.user.id);

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Obtener la venta y sus detalles para validar cantidades
      const venta = await tx.venta.findUnique({
        where: { id: parseInt(ventaId) },
        include: { detalles: true }
      });

      if (!venta) {
        throw new Error('Venta no encontrada');
      }

      if (venta.estado === 'anulada') {
        throw new Error('No se puede procesar devoluciones sobre una venta anulada');
      }

      // Validar que cada cantidad devuelta no sea mayor a la vendida
      let totalReembolsado = 0;
      for (const det of detalles) {
        const lineaVenta = venta.detalles.find(d => d.productoId === parseInt(det.productoId));
        if (!lineaVenta) {
          throw new Error('El producto no pertenece a esta venta.');
        }

        // Consultar devoluciones previas para este producto de esta venta
        const devolucionesPrevias = await tx.devolucionDetalle.aggregate({
          where: {
            devolucion: { ventaId: venta.id },
            productoId: parseInt(det.productoId)
          },
          _sum: { cantidad: true }
        });

        const cantYaDevuelta = devolucionesPrevias._sum.cantidad || 0;
        const cantDisponible = lineaVenta.cantidad - cantYaDevuelta;

        if (parseInt(det.cantidad) > cantDisponible) {
          throw new Error(`La cantidad a devolver (${det.cantidad}) supera el stock disponible para devolución (${cantDisponible}) del producto id ${det.productoId}`);
        }

        // Calcular reembolso para esta línea (proporcional al subtotal neto de la línea)
        const precioUnit = parseFloat(lineaVenta.precioUnitario);
        const descLinea = parseFloat(lineaVenta.descuentoLinea);
        const netoUnit = precioUnit - descLinea;
        totalReembolsado += netoUnit * parseInt(det.cantidad);
      }

      // 2. Crear Devolucion
      const dev = await tx.devolucion.create({
        data: {
          ventaId: venta.id,
          usuarioId,
          fecha: new Date(),
          motivo,
          totalReembolsado
        }
      });

      // 3. Crear DevolucionDetalles y reponer stock
      for (const det of detalles) {
        await tx.devolucionDetalle.create({
          data: {
            devolucionId: dev.id,
            productoId: parseInt(det.productoId),
            cantidad: parseInt(det.cantidad),
            razon: det.razon || null
          }
        });

        // Reponer stock
        const prod = await tx.producto.findUnique({
          where: { id: parseInt(det.productoId) },
          include: { comboComoCombo: true }
        });

        if (prod) {
          if (prod.esCombo) {
            // Reponer stock de ingredientes del combo
            for (const combDet of prod.comboComoCombo) {
              await tx.producto.update({
                where: { id: combDet.productoId },
                data: {
                  stock: { increment: combDet.cantidad * parseInt(det.cantidad) }
                }
              });
            }
          } else {
            // Reponer stock estándar
            await tx.producto.update({
              where: { id: prod.id },
              data: {
                stock: { increment: parseInt(det.cantidad) }
              }
            });
          }
        }
      }

      return dev;
    });

    const devCompleta = await prisma.devolucion.findUnique({
      where: { id: resultado.id },
      include: {
        detalles: {
          include: { producto: true }
        }
      }
    });

    await logAudit({
      accion: 'DEVOLUCION',
      tablaAfectada: 'devoluciones',
      registroId: devCompleta.id,
      datosNuevos: devCompleta
    });

    return NextResponse.json(devCompleta);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
