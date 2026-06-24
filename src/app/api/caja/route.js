import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!session?.user?.rol?.permisos?.caja) {
      return NextResponse.json({ error: 'No autorizado (Falta permiso de caja)' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = session.user.id;
    const checkOpen = searchParams.get('checkOpen') === 'true';

    if (checkOpen) {
      // Buscar el turno actualmente abierto para este usuario
      const turnoAbierto = await prisma.cajaTurno.findFirst({
        where: {
          usuarioId: parseInt(userId),
          estado: 'abierta'
        }
      });
      return NextResponse.json(turnoAbierto || { error: 'No hay caja abierta para este usuario' });
    }

    // Listar todos los turnos con info del usuario
    const turnos = await prisma.cajaTurno.findMany({
      include: {
        usuario: { select: { nombre: true } }
      },
      orderBy: { fechaApertura: 'desc' }
    });

    return NextResponse.json(turnos);
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
    if (!session?.user?.rol?.permisos?.caja) {
      return NextResponse.json({ error: 'No autorizado (Falta permiso de caja)' }, { status: 403 });
    }

    const body = await request.json();
    const { montoApertura, observaciones } = body;

    if (montoApertura === undefined) {
      return NextResponse.json({ error: 'Monto de apertura es requerido' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // Verificar si ya hay una caja abierta para este usuario
    const cajaExistente = await prisma.cajaTurno.findFirst({
      where: {
        usuarioId: userId,
        estado: 'abierta'
      }
    });

    if (cajaExistente) {
      return NextResponse.json({ error: 'Ya tienes un turno de caja abierto' }, { status: 400 });
    }

    const nuevaCaja = await prisma.cajaTurno.create({
      data: {
        usuarioId: userId,
        fechaApertura: new Date(),
        montoApertura: parseFloat(montoApertura),
        estado: 'abierta',
        observaciones
      }
    });

    await logAudit({
      accion: 'APERTURA_CAJA',
      tablaAfectada: 'caja_turnos',
      registroId: nuevaCaja.id,
      datosNuevos: nuevaCaja
    });

    return NextResponse.json(nuevaCaja);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!session?.user?.rol?.permisos?.caja) {
      return NextResponse.json({ error: 'No autorizado (Falta permiso de caja)' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action'); // "close" o "withdraw"

    if (!id) {
      return NextResponse.json({ error: 'El ID del turno es obligatorio' }, { status: 400 });
    }

    const anterior = await prisma.cajaTurno.findUnique({
      where: { id: parseInt(id) }
    });

    if (!anterior) {
      return NextResponse.json({ error: 'Turno de caja no encontrado' }, { status: 404 });
    }

    if (anterior.estado === 'cerrada') {
      return NextResponse.json({ error: 'Esta caja ya está cerrada' }, { status: 400 });
    }

    const body = await request.json();

    if (action === 'withdraw') {
      // Registrar un retiro de efectivo
      const { montoRetiro, motivo } = body;
      if (!montoRetiro) {
        return NextResponse.json({ error: 'Monto de retiro es obligatorio' }, { status: 400 });
      }

      const totalRetiros = parseFloat(anterior.retiros) + parseFloat(montoRetiro);
      const obsActualizadas = `${anterior.observaciones || ''}\n[RETIRO $${parseFloat(montoRetiro).toFixed(2)} - Motivo: ${motivo || 'No especificado'}]`;

      const actualizado = await prisma.cajaTurno.update({
        where: { id: parseInt(id) },
        data: {
          retiros: totalRetiros,
          observaciones: obsActualizadas
        }
      });

      await logAudit({
        accion: 'RETIRO_CAJA',
        tablaAfectada: 'caja_turnos',
        registroId: actualizado.id,
        datosAnteriores: anterior,
        datosNuevos: actualizado
      });

      return NextResponse.json(actualizado);
    } else if (action === 'close') {
      // Cerrar caja
      const { montoCierreReal, observacionesCierre } = body;
      if (montoCierreReal === undefined) {
        return NextResponse.json({ error: 'Monto de cierre real es requerido' }, { status: 400 });
      }

      // Calcular cierre esperado: apertura + ventas en efectivo - retiros
      const ventasCaja = await prisma.venta.findMany({
        where: {
          cajaTurnoId: parseInt(id),
          estado: 'completada'
        }
      });

      // Sumar el dinero de ventas que entraron como efectivo
      // Para método de pago "efectivo", el total entero va al flujo de caja.
      // Para método de pago "mixto", sumamos montoEfectivo.
      let totalVentasEfectivo = 0;
      for (const v of ventasCaja) {
        if (v.metodoPago === 'efectivo') {
          totalVentasEfectivo += parseFloat(v.total);
        } else if (v.metodoPago === 'mixto') {
          totalVentasEfectivo += parseFloat(v.montoEfectivo);
        }
      }

      const montoApert = parseFloat(anterior.montoApertura);
      const retirosCaja = parseFloat(anterior.retiros);
      const montoCierreEsperado = montoApert + totalVentasEfectivo - retirosCaja;
      const dif = parseFloat(montoCierreReal) - montoCierreEsperado;

      const actualizado = await prisma.cajaTurno.update({
        where: { id: parseInt(id) },
        data: {
          fechaCierre: new Date(),
          montoCierreEsperado,
          montoCierreReal: parseFloat(montoCierreReal),
          diferencia: dif,
          estado: 'cerrada',
          observaciones: `${anterior.observaciones || ''}\n[CIERRE: ${observacionesCierre || 'Sin observaciones'}]`
        }
      });

      await logAudit({
        accion: 'CIERRE_CAJA',
        tablaAfectada: 'caja_turnos',
        registroId: actualizado.id,
        datosAnteriores: anterior,
        datosNuevos: actualizado
      });

      return NextResponse.json(actualizado);
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
