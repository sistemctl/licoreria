import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!session?.user?.rol?.permisos?.auditoria) {
      return NextResponse.json({ error: 'No autorizado (Falta permiso de auditoría)' }, { status: 403 });
    }

    const logs = await prisma.auditoria.findMany({
      include: {
        usuario: { select: { nombre: true, username: true } }
      },
      orderBy: { fecha: 'desc' }
    });

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
