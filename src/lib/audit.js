import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Creates an audit log entry in the database.
 */
export async function logAudit({ accion, tablaAfectada, registroId, datosAnteriores, datosNuevos, usuarioId: usuarioIdOverride }) {
  try {
    const session = await getServerSession(authOptions);
    const usuarioId = usuarioIdOverride
      ? parseInt(usuarioIdOverride)
      : session?.user?.id
        ? parseInt(session.user.id)
        : null;

    if (!usuarioId) {
      console.warn('Auditoría omitida (sin sesión):', accion, tablaAfectada);
      return;
    }

    await prisma.auditoria.create({
      data: {
        usuarioId,
        accion,
        tablaAfectada,
        registroId,
        datosAnteriores: datosAnteriores ? JSON.parse(JSON.stringify(datosAnteriores)) : null,
        datosNuevos: datosNuevos ? JSON.parse(JSON.stringify(datosNuevos)) : null,
        ipAddress: '127.0.0.1',
      }
    });
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
}
