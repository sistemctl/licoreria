import net from 'net';

/**
 * Comprueba si un puerto está libre intentando conectar a localhost.
 * Si algo responde, el puerto está ocupado.
 */
export function isPortAvailable(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });

    const done = (available) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(available);
    };

    socket.setTimeout(800);
    socket.once('connect', () => done(false));
    socket.once('timeout', () => done(true));
    socket.once('error', (err) => {
      if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        done(true);
      } else {
        done(false);
      }
    });
  });
}

/** Busca el primer puerto libre desde `preferred`. */
export async function findAvailablePort(preferred, maxTries = 20) {
  for (let i = 0; i < maxTries; i++) {
    const port = preferred + i;
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No hay puertos libres desde ${preferred}`);
}
