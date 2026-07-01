import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { requirePermission } from '@/lib/permissions.server';
import { decrementProductStock } from '@/lib/saleCalc';

const MOTIVOS_VALIDOS = [
  'rotura',
  'vencimiento',
  'consumo_interno',
  'diferencia_conteo',
  'robo',
  'otro',
];

export async function GET(request) {
  try {
    const auth = await requirePermission('inventario');
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const productoId = searchParams.get('productoId');

    const where = {};
    if (productoId) where.productoId = parseInt(productoId);

    const mermas = await prisma.merma.findMany({
      where,
      include: {
        producto: { include: { categoria: true } },
        usuario: { select: { nombre: true } },
      },
      orderBy: { fecha: 'desc' },
      take: 200,
    });

    return NextResponse.json(mermas);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requirePermission('inventario');
    if (auth.response) return auth.response;
    const session = auth.session;

    const body = await request.json();
    const { productoId, cantidad, motivo, motivoDetalle } = body;

    if (!productoId || !cantidad || !motivo) {
      return NextResponse.json({ error: 'Producto, cantidad y motivo son obligatorios' }, { status: 400 });
    }

    const cant = parseInt(cantidad);
    if (!cant || cant < 1) {
      return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 });
    }

    const motivoNorm = String(motivo).toLowerCase();
    if (!MOTIVOS_VALIDOS.includes(motivoNorm)) {
      return NextResponse.json({ error: 'Motivo de merma no válido' }, { status: 400 });
    }

    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(productoId) },
      include: { comboComoCombo: true },
    });

    if (!producto || !producto.activo) {
      return NextResponse.json({ error: 'Producto no encontrado o inactivo' }, { status: 400 });
    }

    if (producto.esCombo) {
      return NextResponse.json(
        { error: 'Registre mermas sobre los ingredientes del combo, no sobre el combo preparado.' },
        { status: 400 }
      );
    }

    const motivoTexto = motivoDetalle
      ? `${motivoNorm}: ${String(motivoDetalle).slice(0, 180)}`
      : motivoNorm;

    const usuarioId = parseInt(session.user.id);

    const merma = await prisma.$transaction(async (tx) => {
      await decrementProductStock(tx, producto.id, cant);

      return tx.merma.create({
        data: {
          productoId: producto.id,
          cantidad: cant,
          motivo: motivoTexto,
          usuarioId,
        },
        include: {
          producto: { include: { categoria: true } },
          usuario: { select: { nombre: true } },
        },
      });
    });

    await logAudit({
      accion: 'MERMA',
      tablaAfectada: 'mermas',
      registroId: merma.id,
      datosNuevos: merma,
    });

    return NextResponse.json(merma);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
