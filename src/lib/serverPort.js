import fs from 'fs';
import path from 'path';

export const DEFAULT_SERVER_PORT = 3000;
export const MIN_SERVER_PORT = 1024;
export const MAX_SERVER_PORT = 65535;

/** Valida un puerto TCP de aplicación (1024–65535). */
export function parseServerPort(value) {
  const port = parseInt(String(value), 10);
  if (!Number.isInteger(port) || port < MIN_SERVER_PORT || port > MAX_SERVER_PORT) {
    return null;
  }
  return port;
}

/** Escribe o actualiza PORT= en el archivo .env del proyecto. */
export function syncServerPortToEnv(port) {
  const envPath = path.join(process.cwd(), '.env');
  let content = '';

  try {
    content = fs.readFileSync(envPath, 'utf8');
  } catch {
    content = '';
  }

  const portLine = `PORT=${port}`;
  const lines = content.split(/\r?\n/);
  let found = false;

  const next = lines.map((line) => {
    if (/^\s*PORT\s*=/.test(line)) {
      found = true;
      return portLine;
    }
    return line;
  });

  if (!found) {
    if (next.length && next[next.length - 1] !== '') next.push('');
    next.push(portLine);
  }

  fs.writeFileSync(envPath, next.join('\n'), 'utf8');
}

export async function readServerPortFromDb(prisma) {
  const row = await prisma.configuracion.findUnique({ where: { clave: 'puerto_servidor' } });
  return parseServerPort(row?.valor) ?? DEFAULT_SERVER_PORT;
}
