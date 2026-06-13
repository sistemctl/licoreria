import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'Mi Licorería - Sistema de Gestión',
  description: 'Punto de Venta y Gestión de Inventario para Licorerías',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
