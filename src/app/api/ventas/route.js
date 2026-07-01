import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import {
  getPaymentMethodsFromDb,
  getMethodById,
  buildLegacyAmounts,
  sumMontosPago,
  parseMontosPago,
  computeCajaCashFromVenta,
} from '@/lib/paymentMethods';
import { requireAnyPermission, requirePermission } from '@/lib/permissions.server';
import {
  calculateSaleTotals,
  decrementSaleStock,
  incrementSaleStock,
} from '@/lib/saleCalc';

export async function GET(request) {
  try {
    const auth = await requireAnyPermission(['ventas', 'pos', 'reportes']);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const venta = await prisma.venta.findUnique({
        where: { id: parseInt(id) },
        include: {
          cliente: true,
          usuario: { select: { nombre: true } },
          detalles: { include: { producto: true } },
        },
      });
      return NextResponse.json(venta);
    }

    const ventas = await prisma.venta.findMany({
      include: {
        cliente: true,
        usuario: { select: { nombre: true } },
      },
      orderBy: { fecha: 'desc' },
    });

    return NextResponse.json(ventas);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requirePermission('pos');
    if (auth.response) return auth.response;
    const session = auth.session;

    const body = await request.json();
    const {
      clienteId,
      descuentoManual = 0,
      metodoPago,
      montoEfectivo = 0,
      montoTarjeta = 0,
      montoTransferencia = 0,
      montosPago = null,
      descuentoId,
      detalles,
    } = body;

    if (!detalles || detalles.length === 0 || !metodoPago) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const paymentMethods = await getPaymentMethodsFromDb(prisma);
    const method = getMethodById(metodoPago, paymentMethods);

    if (!method || !method.activo) {
      return NextResponse.json({ error: 'Método de pago no válido o inactivo' }, { status: 400 });
    }

    const usuarioId = parseInt(session.user.id);

    const cajaAbierta = await prisma.cajaTurno.findFirst({
      where: { usuarioId, estado: 'abierta' },
    });

    if (!cajaAbierta) {
      return NextResponse.json({ error: 'Debe abrir el turno de caja antes de registrar ventas' }, { status: 400 });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const calculated = await calculateSaleTotals(
        tx,
        detalles,
        descuentoManual,
        descuentoId || null
      );

      const saleTotal = calculated.total;
      const parsedMontos = parseMontosPago(montosPago);

      if (method.esMixto) {
        const sumaMixta = sumMontosPago(parsedMontos);
        if (Math.abs(sumaMixta - saleTotal) > 0.01) {
          throw new Error(
            `Los montos del pago mixto ($${sumaMixta.toFixed(2)}) no coinciden con el total ($${saleTotal.toFixed(2)})`
          );
        }
      }

      if (method.esCredito) {
        if (!clienteId) {
          throw new Error('Debe seleccionar un cliente para ventas a crédito.');
        }
        const clienteObj = await tx.cliente.findUnique({ where: { id: parseInt(clienteId) } });
        if (!clienteObj) throw new Error('Cliente no encontrado');

        const nuevoSaldo = parseFloat(clienteObj.saldoPendiente) + saleTotal;
        if (nuevoSaldo > parseFloat(clienteObj.limiteCredito)) {
          throw new Error(
            `El cliente supera su límite de crédito. Límite: $${parseFloat(clienteObj.limiteCredito).toFixed(2)}, Pendiente: $${parseFloat(clienteObj.saldoPendiente).toFixed(2)}, Venta: $${saleTotal.toFixed(2)}`
          );
        }
        await tx.cliente.update({
          where: { id: clienteObj.id },
          data: { saldoPendiente: nuevoSaldo },
        });
      }

      await decrementSaleStock(tx, calculated.lineas);

      const { prefijoFactura, siguienteNumFactura } = calculated.config;
      const numFactura = `${prefijoFactura}${String(siguienteNumFactura).padStart(6, '0')}`;

      await tx.configuracion.update({
        where: { clave: 'siguiente_num_factura' },
        data: { valor: String(siguienteNumFactura + 1) },
      });

      const legacyAmounts = buildLegacyAmounts(metodoPago, saleTotal, parsedMontos, paymentMethods);
      const finalMontosPago =
        method.esMixto || Object.keys(parsedMontos).length > 0
          ? parsedMontos
          : { [metodoPago]: saleTotal };

      const v = await tx.venta.create({
        data: {
          numFactura,
          clienteId: clienteId ? parseInt(clienteId) : null,
          usuarioId,
          subtotal: calculated.subtotal,
          descuentoTotal: calculated.descuentoTotal,
          impuesto: calculated.impuesto,
          total: saleTotal,
          metodoPago,
          montoEfectivo: legacyAmounts.montoEfectivo,
          montoTarjeta: legacyAmounts.montoTarjeta,
          montoTransferencia: legacyAmounts.montoTransferencia,
          montosPago: finalMontosPago,
          descuentoId: calculated.descuentoId,
          cajaTurnoId: cajaAbierta.id,
          estado: 'completada',
        },
      });

      for (const linea of calculated.lineas) {
        await tx.ventaDetalle.create({
          data: {
            ventaId: v.id,
            productoId: linea.productoId,
            cantidad: linea.cantidad,
            precioUnitario: linea.precioUnitario,
            descuentoLinea: linea.descuentoLinea,
            subtotal: linea.subtotal,
            tipoPrecio: linea.tipoPrecio,
          },
        });
      }

      if (method.esCredito) {
        const diasAlertaConf = await tx.configuracion.findUnique({
          where: { clave: 'dias_alerta_vencimiento' },
        });
        const dias = diasAlertaConf ? parseInt(diasAlertaConf.valor) : 15;
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() + dias);

        await tx.cuentaPorCobrar.create({
          data: {
            clienteId: parseInt(clienteId),
            ventaId: v.id,
            montoTotal: saleTotal,
            saldoPendiente: saleTotal,
            fechaLimite,
            estado: 'pendiente',
          },
        });
      }

      return v;
    });

    const ventaCompleta = await prisma.venta.findUnique({
      where: { id: resultado.id },
      include: {
        detalles: { include: { producto: true } },
        cliente: true,
        descuento: true,
      },
    });

    await logAudit({
      accion: 'VENTA',
      tablaAfectada: 'ventas',
      registroId: ventaCompleta.id,
      datosNuevos: ventaCompleta,
    });

    return NextResponse.json(ventaCompleta);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requirePermission('ventas');
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (!id || action !== 'anular') {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    const paymentMethods = await getPaymentMethodsFromDb(prisma);

    const anterior = await prisma.venta.findUnique({
      where: { id: parseInt(id) },
      include: {
        detalles: true,
        cajaTurno: true,
      },
    });

    if (!anterior) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    if (anterior.estado === 'anulada') {
      return NextResponse.json({ error: 'La venta ya está anulada' }, { status: 400 });
    }

    const productIds = [...new Set(anterior.detalles.map((d) => d.productoId))];
    const productos = await prisma.producto.findMany({
      where: { id: { in: productIds } },
      include: { comboComoCombo: true },
    });
    const productosById = Object.fromEntries(productos.map((p) => [p.id, p]));

    const method = getMethodById(anterior.metodoPago, paymentMethods);

    const ventaAnulada = await prisma.$transaction(async (tx) => {
      const v = await tx.venta.update({
        where: { id: parseInt(id) },
        data: { estado: 'anulada' },
      });

      await incrementSaleStock(tx, anterior.detalles, productosById);

      if (method?.esCredito && anterior.clienteId) {
        const cxc = await tx.cuentaPorCobrar.findFirst({ where: { ventaId: parseInt(id) } });
        if (cxc) {
          await tx.cuentaPorCobrar.update({
            where: { id: cxc.id },
            data: { estado: 'pagada', saldoPendiente: 0 },
          });
          const clienteObj = await tx.cliente.findUnique({ where: { id: anterior.clienteId } });
          if (clienteObj) {
            let nuevoSaldo = parseFloat(clienteObj.saldoPendiente) - parseFloat(anterior.total);
            if (nuevoSaldo < 0) nuevoSaldo = 0;
            await tx.cliente.update({
              where: { id: clienteObj.id },
              data: { saldoPendiente: nuevoSaldo },
            });
          }
        }
      }

      if (anterior.cajaTurnoId && anterior.cajaTurno?.estado === 'abierta') {
        const cashBack = computeCajaCashFromVenta(anterior, paymentMethods);
        if (cashBack > 0) {
          const turno = await tx.cajaTurno.findUnique({ where: { id: anterior.cajaTurnoId } });
          if (turno) {
            await tx.cajaTurno.update({
              where: { id: turno.id },
              data: {
                retiros: parseFloat(turno.retiros) + cashBack,
                observaciones: `${turno.observaciones || ''}\n[ANULACIÓN VENTA #${anterior.numFactura}: -$${cashBack.toFixed(2)}]`,
              },
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
      datosNuevos: ventaAnulada,
    });

    return NextResponse.json(ventaAnulada);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
