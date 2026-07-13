import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { filterPublicConfig } from '@/lib/publicConfig';
import { parseServerPort, syncServerPortToEnv } from '@/lib/serverPort';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const configs = await prisma.configuracion.findMany();
    const configMap = {};
    configs.forEach((c) => {
      configMap[c.clave] = c.valor;
    });

    const isAdmin = session?.user?.rol?.permisos?.configuracion;
    if (!session?.user?.id || !isAdmin) {
      return NextResponse.json({
        configs: configs.filter((c) => filterPublicConfig({ [c.clave]: c.valor })[c.clave] !== undefined),
        configMap: filterPublicConfig(configMap),
        publicOnly: true,
      });
    }

    return NextResponse.json({ configs, configMap, publicOnly: false });
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
    if (!session?.user?.rol?.permisos?.configuracion) {
      return NextResponse.json({ error: 'No autorizado (Falta permiso de configuración)' }, { status: 403 });
    }

    const body = await request.json(); // Se espera un objeto { clave1: valor1, clave2: valor2 }

    if (body.puerto_servidor !== undefined) {
      const port = parseServerPort(body.puerto_servidor);
      if (!port) {
        return NextResponse.json(
          { error: 'Puerto inválido. Usa un número entre 1024 y 65535.' },
          { status: 400 }
        );
      }
      body.puerto_servidor = String(port);
    }

    const actualizadas = [];

    await prisma.$transaction(async (tx) => {
      for (const [clave, valor] of Object.entries(body)) {
        const anterior = await tx.configuracion.findUnique({
          where: { clave }
        });

        const act = await tx.configuracion.upsert({
          where: { clave },
          update: { valor: String(valor) },
          create: {
            clave,
            valor: String(valor),
            descripcion: `Configuración de ${clave}`
          }
        });
        actualizadas.push(act);

        await logAudit({
          accion: 'CAMBIO_CONFIGURACION',
          tablaAfectada: 'configuraciones',
          registroId: act.id,
          datosAnteriores: anterior || null,
          datosNuevos: act
        });
      }
    });

    if (body.puerto_servidor !== undefined) {
      syncServerPortToEnv(parseInt(body.puerto_servidor, 10));
    }

    return NextResponse.json(actualizadas);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
