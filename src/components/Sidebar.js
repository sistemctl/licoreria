'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Tag, 
  Box, 
  Percent, 
  History, 
  Truck, 
  Building2, 
  Users, 
  CreditCard, 
  Undo, 
  Calculator, 
  BarChart3, 
  ShieldAlert, 
  User, 
  Settings,
  LogOut
} from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Inicio', path: '/dashboard', icon: Home, permKey: 'inicio' },
  { label: 'POS (Punto de Venta)', path: '/dashboard/pos', icon: ShoppingCart, permKey: 'pos' },
  { label: 'Inventario', path: '/dashboard/inventario', icon: Package, permKey: 'inventario' },
  { label: 'Categorías', path: '/dashboard/categorias', icon: Tag, permKey: 'categorias' },
  { label: 'Combos', path: '/dashboard/combos', icon: Box, permKey: 'combos' },
  { label: 'Descuentos', path: '/dashboard/descuentos', icon: Percent, permKey: 'descuentos' },
  { label: 'Ventas', path: '/dashboard/ventas', icon: History, permKey: 'ventas' },
  { label: 'Compras', path: '/dashboard/compras', icon: Truck, permKey: 'compras' },
  { label: 'Proveedores', path: '/dashboard/proveedores', icon: Building2, permKey: 'proveedores' },
  { label: 'Clientes', path: '/dashboard/clientes', icon: Users, permKey: 'clientes' },
  { label: 'Cuentas por Cobrar', path: '/dashboard/cuentas-por-cobrar', icon: CreditCard, permKey: 'creditos' },
  { label: 'Devoluciones', path: '/dashboard/devoluciones', icon: Undo, permKey: 'devoluciones' },
  { label: 'Caja', path: '/dashboard/caja', icon: Calculator, permKey: 'caja' },
  { label: 'Reportes', path: '/dashboard/reportes', icon: BarChart3, permKey: 'reportes' },
  { label: 'Auditoría', path: '/dashboard/auditoria', icon: ShieldAlert, permKey: 'auditoria' },
  { label: 'Usuarios', path: '/dashboard/usuarios', icon: User, permKey: 'usuarios' },
  { label: 'Configuración', path: '/dashboard/configuracion', icon: Settings, permKey: 'configuracion' },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const permisos = session?.user?.rol?.permisos || {};

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <h2>Mi Licorería</h2>
      </div>

      <div className="sidebar-user-info">
        <p className="user-name">{session?.user?.name}</p>
        <span className="badge badge-warning">{session?.user?.rol?.nombre}</span>
      </div>

      <nav className="sidebar-menu">
        {MENU_ITEMS.map((item) => {
          // Si el usuario no tiene permiso, no renderizar el item
          if (!permisos[item.permKey]) return null;

          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`menu-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button onClick={() => signOut({ callbackUrl: '/login' })} className="menu-link logout-btn">
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </nav>

      <style jsx>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: var(--glass-blur);
          border-right: 1px solid var(--panel-border);
          display: flex;
          flex-direction: column;
          z-index: 100;
        }

        .sidebar-brand {
          padding: 24px;
          border-bottom: 1px solid rgba(212, 168, 83, 0.1);
          text-align: center;
        }

        .sidebar-brand h2 {
          color: var(--accent-gold);
          font-size: 20px;
          letter-spacing: 1px;
        }

        .sidebar-user-info {
          padding: 16px 24px;
          border-bottom: 1px solid rgba(212, 168, 83, 0.05);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .user-name {
          font-weight: 600;
          font-size: 14px;
        }

        .sidebar-menu {
          flex-grow: 1;
          padding: 20px 12px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* Ocultar scrollbar pero mantener funcionalidad */
        .sidebar-menu::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-menu::-webkit-scrollbar-thumb {
          background: rgba(212, 168, 83, 0.1);
        }

        :global(.menu-link) {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-radius: 8px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }

        :global(.menu-link:hover) {
          color: var(--text-primary);
          background: rgba(212, 168, 83, 0.05);
        }

        :global(.menu-link.active) {
          color: #fff;
          background: var(--accent-gold);
          font-weight: 600;
        }

        :global(.logout-btn) {
          margin-top: auto;
          color: var(--error-red);
        }

        :global(.logout-btn:hover) {
          background: rgba(239, 68, 68, 0.08);
          color: var(--error-red);
        }
      `}</style>
    </div>
  );
}
