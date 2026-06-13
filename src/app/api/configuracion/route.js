import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function GET(request) {
  try {
    const configs = await prisma.configuracion.findMany();
    // Transformar a objeto clave-valor para fácil consumo
    const configMap = {};
    configs.forEach(c => {
      configMap[c.clave] = c.valor;
    });

    return NextResponse.json({ configs, configMap });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json(); // Se espera un objeto { clave1: valor1, clave2: valor2 }

    const actualizadas = [];

    await prisma.$transaction(async (tx) => {
      for (const [clave, valor] of Object.entries(body)) {
        const anterior = await tx.configuracion.findUnique({
          where: { clave }
        });

        if (anterior) {
          const act = await tx.configuracion.update({
            where: { clave },
            data: { valor: String(valor) }
          });
          actualizadas.push(act);

          await logAudit({
            accion: 'CAMBIO_CONFIGURACION',
            tablaAfectada: 'configuraciones',
            registroId: anterior.id,
            datosAnteriores: anterior,
            datosNuevos: act
          });
        }
      }
    });

    return NextResponse.json(actualizadas);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
