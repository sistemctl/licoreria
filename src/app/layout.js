import { Fraunces, DM_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Mi Licorería - Sistema de Gestión',
  description: 'Punto de Venta y Gestión de Inventario para Licorerías',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${dmSans.variable} ${ibmPlexMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={dmSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
