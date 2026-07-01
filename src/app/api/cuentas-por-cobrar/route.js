import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { getPaymentMethodsFromDb, getMethodById } from '@/lib/paymentMethods';
import { requirePermission } from '@/lib/permissions.server';

export async function GET(request) {
  try {
    const auth = await requirePermission('creditos');
    if (auth.response) return auth.response;
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('clienteId');

    const where = {};
    if (clienteId) {
      where.clienteId = parseInt(clienteId);
    }

    const cuentas = await prisma.cuentaPorCobrar.findMany({
      where,
      include: {
        cliente: true,
        venta: true,
        abonos: {
          include: {
            usuario: { select: { nombre: true } }
          },
          orderBy: { fecha: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(cuentas);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requirePermission('creditos');
    if (auth.response) return auth.response;
    const session = auth.session;

    const body = await request.json();
    const { cuentaId, monto, metodoPago } = body;

    if (!cuentaId || !monto || !metodoPago) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const paymentMethods = await getPaymentMethodsFromDb(prisma);
    const method = getMethodById(metodoPago, paymentMethods);
    if (!method || !method.activo || !method.permiteAbono || method.esCredito || method.esMixto) {
      return NextResponse.json({ error: 'Método de pago no válido para abonos' }, { status: 400 });
    }

    const usuarioId = parseInt(session.user.id);
    const montoAbono = parseFloat(monto);

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Obtener la cuenta
      const cuenta = await tx.cuentaPorCobrar.findUnique({
        where: { id: parseInt(cuentaId) },
        include: { cliente: true }
      });

      if (!cuenta) {
        throw new Error('Cuenta por cobrar no encontrada');
      }

      if (cuenta.estado === 'pagada') {
        throw new Error('Esta cuenta ya está totalmente pagada');
      }

      if (montoAbono > parseFloat(cuenta.saldoPendiente)) {
        throw new Error(`El abono supera el saldo pendiente. Pendiente: $${parseFloat(cuenta.saldoPendiente).toFixed(2)}`);
      }

      // 2. Calcular nuevo saldo de la cuenta
      const nuevoSaldoCuenta = parseFloat(cuenta.saldoPendiente) - montoAbono;
      const nuevoEstado = nuevoSaldoCuenta <= 0 ? 'pagada' : 'pendiente';

      const cuentaActualizada = await tx.cuentaPorCobrar.update({
        where: { id: cuenta.id },
        data: {
          saldoPendiente: nuevoSaldoCuenta,
          estado: nuevoEstado
        }
      });

      // 3. Actualizar saldo del cliente
      const nuevoSaldoCliente = Math.max(0, parseFloat(cuenta.cliente.saldoPendiente) - montoAbono);
      await tx.cliente.update({
        where: { id: cuenta.clienteId },
        data: {
          saldoPendiente: nuevoSaldoCliente
        }
      });

      // 4. Crear el abono
      const abono = await tx.abono.create({
        data: {
          cuentaId: cuenta.id,
          monto: montoAbono,
          metodoPago,
          usuarioId,
          fecha: new Date()
        }
      });

      return { cuentaActualizada, abono };
    });

    await logAudit({
      accion: 'REGISTRAR_ABONO',
      tablaAfectada: 'abonos',
      registroId: resultado.abono.id,
      datosNuevos: resultado
    });

    return NextResponse.json(resultado);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
