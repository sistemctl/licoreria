#!/bin/sh
set -e

echo "[licoreria] Esperando PostgreSQL..."
node <<'NODE'
const { Pool } = require('pg');
const url = process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL no está definida');
  process.exit(1);
}

async function wait() {
  const pool = new Pool({ connectionString: url });

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      await pool.end();
      process.exit(0);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  await pool.end();
  console.error('PostgreSQL no respondió a tiempo');
  process.exit(1);
}

wait();
NODE

echo "[licoreria] Aplicando migraciones..."
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "[licoreria] Ejecutando seed inicial..."
  npx prisma db seed
fi

echo "[licoreria] Iniciando servidor..."
exec node scripts/start-server.mjs
