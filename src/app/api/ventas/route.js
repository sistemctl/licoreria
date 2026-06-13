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
      const venta = await prisma.venta.findUnique({
        where: { id: parseInt(id) },
        include: {
          cliente: true,
          usuario: { select: { nombre: true } },
          detalles: {
            include: {
              producto: true
            }
          }
        }
      });
      return NextResponse.json(venta);
    }

    const ventas = await prisma.venta.findMany({
      include: {
        cliente: true,
        usuario: { select: { nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    });

    return NextResponse.json(ventas);
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
      clienteId,
      subtotal,
      descuentoTotal,
      impuesto,
      total,
      metodoPago,
      montoEfectivo = 0,
      montoTarjeta = 0,
      montoTransferencia = 0,
      descuentoId,
      detalles // Array de { productoId: int, cantidad: int, precioUnitario: float, descuentoLinea: float, tipoPrecio: "detal"|"mayor" }
    } = body;

    if (!detalles || detalles.length === 0 || !metodoPago) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const usuarioId = parseInt(session.user.id);

    // 1. Verificar si hay un turno de caja abierto
    const cajaAbierta = await prisma.cajaTurno.findFirst({
      where: {
        usuarioId,
        estado: 'abierta'
      }
    });

    if (!cajaAbierta) {
      return NextResponse.json({ error: 'Debe abrir el turno de caja antes de registrar ventas' }, { status: 400 });
    }

    // 2. Realizar venta completa en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Validar límite de crédito de cliente si aplica
      if (metodoPago === 'credito') {
        if (!clienteId) {
          throw new Error('Debe seleccionar un cliente para ventas a crédito.');
        }

        const clienteObj = await tx.cliente.findUnique({
          where: { id: parseInt(clienteId) }
        });

        if (!clienteObj) {
          throw new Error('Cliente no encontrado');
        }

        const nuevoSaldo = parseFloat(clienteObj.saldoPendiente) + parseFloat(total);
        if (nuevoSaldo > parseFloat(clienteObj.limiteCredito)) {
          throw new Error(`El cliente supera su límite de crédito. Límite: $${parseFloat(clienteObj.limiteCredito).toFixed(2)}, Pendiente actual: $${parseFloat(clienteObj.saldoPendiente).toFixed(2)}, Venta: $${parseFloat(total).toFixed(2)}`);
        }

        // Actualizar saldo pendiente del cliente
        await tx.cliente.update({
          where: { id: clienteObj.id },
          data: {
            saldoPendiente: nuevoSaldo
          }
        });
      }

      // Descontar inventario (validar existencias de productos y combos)
      for (const item of detalles) {
        const prod = await tx.producto.findUnique({
          where: { id: parseInt(item.productoId) },
          include: {
            comboComoCombo: true
          }
        });

        if (!prod || !prod.activo) {
          throw new Error(`El producto "${item.nombre || item.productoId}" no está disponible.`);
        }

        if (prod.esCombo) {
          // Si es un combo, se descuenta de cada ingrediente del combo
          for (const combDet of prod.comboComoCombo) {
            const ingProd = await tx.producto.findUnique({
              where: { id: combDet.productoId }
            });
            const cantRequerida = combDet.cantidad * parseInt(item.cantidad);

            if (!ingProd || ingProd.stock < cantRequerida) {
              throw new Error(`Stock insuficiente para el ingrediente "${ingProd?.nombre || combDet.productoId}" del combo "${prod.nombre}" (Requerido: ${cantRequerida}, Disponible: ${ingProd?.stock || 0})`);
            }

            await tx.producto.update({
              where: { id: combDet.productoId },
              data: {
                stock: { decrement: cantRequerida }
              }
            });
          }
        } else {
          // Producto estándar: validar stock
          if (prod.stock < parseInt(item.cantidad)) {
            throw new Error(`Stock insuficiente para "${prod.nombre}" (Requerido: ${item.cantidad}, Disponible: ${prod.stock})`);
          }

          await tx.producto.update({
            where: { id: prod.id },
            data: {
              stock: { decrement: parseInt(item.cantidad) }
            }
          });
        }
      }

      // Generar correlativo de factura
      const prefijoConf = await tx.configuracion.findUnique({ where: { clave: 'prefijo_factura' } });
      const sigNumConf = await tx.configuracion.findUnique({ where: { clave: 'siguiente_num_factura' } });
      const prefijo = prefijoConf ? prefijoConf.valor : 'FAC-';
      const sigNum = sigNumConf ? parseInt(sigNumConf.valor) : 1;

      const numFactura = `${prefijo}${String(sigNum).padStart(6, '0')}`;

      // Incrementar correlativo
      await tx.configuracion.update({
        where: { clave: 'siguiente_num_factura' },
        data: { valor: String(sigNum + 1) }
      });

      // Crear la Venta
      const v = await tx.venta.create({
        data: {
          numFactura,
          clienteId: clienteId ? parseInt(clienteId) : null,
          usuarioId,
          subtotal: parseFloat(subtotal),
          descuentoTotal: parseFloat(descuentoTotal || 0),
          impuesto: parseFloat(impuesto || 0),
          total: parseFloat(total),
          metodoPago,
          montoEfectivo: parseFloat(montoEfectivo || 0),
          montoTarjeta: parseFloat(montoTarjeta || 0),
          montoTransferencia: parseFloat(montoTransferencia || 0),
          descuentoId: descuentoId ? parseInt(descuentoId) : null,
          cajaTurnoId: cajaAbierta.id,
          estado: 'completada'
        }
      });

      // Crear detalles de la venta
      for (const item of detalles) {
        const subLine = (parseFloat(item.precioUnitario) - parseFloat(item.descuentoLinea || 0)) * parseInt(item.cantidad);
        await tx.ventaDetalle.create({
          data: {
            ventaId: v.id,
            productoId: parseInt(item.productoId),
            cantidad: parseInt(item.cantidad),
            precioUnitario: parseFloat(item.precioUnitario),
            descuentoLinea: parseFloat(item.descuentoLinea || 0),
            subtotal: subLine,
            tipoPrecio: item.tipoPrecio || 'detal'
          }
        });
      }

      // Si es a crédito, crear la Cuenta por Cobrar
      if (metodoPago === 'credito') {
        // Alerta de vencimiento a 15 días por defecto
        const diasAlertaConf = await tx.configuracion.findUnique({ where: { clave: 'dias_alerta_vencimiento' } });
        const dias = diasAlertaConf ? parseInt(diasAlertaConf.valor) : 15;
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() + dias);

        await tx.cuentaPorCobrar.create({
          data: {
            clienteId: parseInt(clienteId),
            ventaId: v.id,
            montoTotal: parseFloat(total),
            saldoPendiente: parseFloat(total),
            fechaLimite,
            estado: 'pendiente'
          }
        });
      }

      return v;
    });

    const ventaCompleta = await prisma.venta.findUnique({
      where: { id: resultado.id },
      include: {
        detalles: {
          include: { producto: true }
        },
        cliente: true
      }
    });

    await logAudit({
      accion: 'VENTA',
      tablaAfectada: 'ventas',
      registroId: ventaCompleta.id,
      datosNuevos: ventaCompleta
    });

    return NextResponse.json(ventaCompleta);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action'); // "anular"

    if (!id || action !== 'anular') {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    const anterior = await prisma.venta.findUnique({
      where: { id: parseInt(id) },
      include: { detalles: true }
    });

    if (!anterior) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    if (anterior.estado === 'anulada') {
      return NextResponse.json({ error: 'La venta ya está anulada' }, { status: 400 });
    }

    // Anular venta y reponer inventario en una transacción
    const ventaAnulada = await prisma.$transaction(async (tx) => {
      // 1. Cambiar estado de venta a "anulada"
      const v = await tx.venta.update({
        where: { id: parseInt(id) },
        data: { estado: 'anulada' }
      });

      // 2. Reponer stock
      for (const det of anterior.detalles) {
        const prod = await tx.producto.findUnique({
          where: { id: det.productoId },
          include: { comboComoCombo: true }
        });

        if (prod) {
          if (prod.esCombo) {
            // Devolver stock de cada ingrediente del combo
            for (const combDet of prod.comboComoCombo) {
              await tx.producto.update({
                where: { id: combDet.productoId },
                data: {
                  stock: { increment: combDet.cantidad * det.cantidad }
                }
              });
            }
          } else {
            // Reponer stock estándar
            await tx.producto.update({
              where: { id: det.productoId },
              data: {
                stock: { increment: det.cantidad }
              }
            });
          }
        }
      }

      // 3. Si era venta a crédito, actualizar saldo del cliente y anular cuenta
      if (anterior.metodoPago === 'credito' && anterior.clienteId) {
        const cxc = await tx.cuentaPorCobrar.findFirst({
          where: { ventaId: parseInt(id) }
        });

        if (cxc) {
          await tx.cuentaPorCobrar.update({
            where: { id: cxc.id },
            data: { estado: 'pagada', saldoPendiente: 0 }
          });

          // Restar saldo pendiente al cliente
          const clienteObj = await tx.cliente.findUnique({
            where: { id: anterior.clienteId }
          });

          if (clienteObj) {
            let nuevoSaldo = parseFloat(clienteObj.saldoPendiente) - parseFloat(anterior.total);
            if (nuevoSaldo < 0) nuevoSaldo = 0;

            await tx.cliente.update({
              where: { id: clienteObj.id },
              data: { saldoPendiente: nuevoSaldo }
            });
          }
        }
      }

      return v;
    });

    await logAudit({
      accion: 'ANULACION',
      tablaAfectada: 'ventas',
      registroId: ventaAnulada.id,
      datosAnteriores: anterior,
      datosNuevos: ventaAnulada
    });

    return NextResponse.json(ventaAnulada);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
