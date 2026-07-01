import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions.server';

export async function GET(request) {
  try {
    const auth = await requirePermission('auditoria');
    if (auth.response) return auth.response;

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
