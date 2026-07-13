import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { resolveServerPort } from './_resolve-port.mjs';
import { isPortAvailable } from './_port-available.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nextBin = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');

const port = await resolveServerPort();

if (!(await isPortAvailable(port))) {
  console.error(`\n[licoreria] ERROR: el puerto ${port} ya está en uso.`);
  console.error('Opciones:');
  console.error('  1. Detén el proceso que usa ese puerto (en tu PC, 3000 suele ser Docker).');
  console.error('  2. Cambia el puerto en Configuración → Sistema y reinicia.');
  console.error('  3. En desarrollo usa: npm run dev (elige otro puerto automáticamente).\n');
  process.exit(1);
}

console.log(`[licoreria] Producción en http://localhost:${port}`);

const child = spawn(process.execPath, [nextBin, 'start', '-p', String(port)], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: String(port),
    HOSTNAME: process.env.HOSTNAME || '0.0.0.0',
  },
});

child.on('exit', (code) => process.exit(code ?? 0));
