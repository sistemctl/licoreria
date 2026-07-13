import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const DEFAULT_PORT = 3000;

function loadEnvFile() {
  const envPath = path.join(root, '.env');
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    // .env opcional si las variables ya están en el entorno
  }
}

function parsePort(value) {
  const port = parseInt(String(value), 10);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) return null;
  return port;
}

async function readPortFromDatabase() {
  if (!process.env.DATABASE_URL) return null;

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const row = await prisma.configuracion.findUnique({ where: { clave: 'puerto_servidor' } });
    return parsePort(row?.valor);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

export async function resolveServerPort() {
  loadEnvFile();

  const fromEnv = parsePort(process.env.PORT);
  if (fromEnv) return fromEnv;

  try {
    const fromDb = await readPortFromDatabase();
    if (fromDb) return fromDb;
  } catch (err) {
    console.warn('[puerto] No se pudo leer desde la BD:', err.message);
  }

  return DEFAULT_PORT;
}
