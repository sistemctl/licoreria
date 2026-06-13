import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const logs = await prisma.auditoria.findMany({
      include: {
        usuario: { select: { nombre: true, email: true } }
      },
      orderBy: { fecha: 'desc' }
    });

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
