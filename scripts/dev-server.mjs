import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { resolveServerPort } from './_resolve-port.mjs';
import { findAvailablePort } from './_port-available.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nextBin = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');

const preferred = await resolveServerPort();
const port = await findAvailablePort(preferred);

if (port !== preferred) {
  console.warn(
    `[licoreria] Puerto ${preferred} ocupado (¿Docker u otra app?). Desarrollo en http://localhost:${port}`
  );
} else {
  console.log(`[licoreria] Desarrollo en http://localhost:${port}`);
}

const child = spawn(process.execPath, [nextBin, 'dev', '-p', String(port)], {
  stdio: 'inherit',
  env: { ...process.env, PORT: String(port) },
});

child.on('exit', (code) => process.exit(code ?? 0));
