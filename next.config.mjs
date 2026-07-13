import os from 'os';

// Detectar dinámicamente todas las IPs locales del servidor
const getLocalIPs = () => {
  const port = process.env.PORT || '3000';
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
        ips.push(`${iface.address}:${port}`);
      }
    }
  }
  return ips;
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'bavaria.co',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'seeklogo.com',
      }
    ],
  },
  allowedDevOrigins: [
    ...getLocalIPs(),
    '*.trycloudflare.com',
    '*.ngrok-free.app',
    '*.ngrok.io',
    '*.loca.lt'
  ]
};

export default nextConfig;
