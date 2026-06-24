'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useConfig } from '@/components/ConfigProvider';
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

const MENU_SECTIONS = [
  {
    title: 'Operaciones',
    items: [
      { label: 'Inicio', path: '/dashboard', icon: Home, permKey: 'inicio' },
      { label: 'POS (Punto de Venta)', path: '/dashboard/pos', icon: ShoppingCart, permKey: 'pos' },
      { label: 'Ventas', path: '/dashboard/ventas', icon: History, permKey: 'ventas' },
      { label: 'Devoluciones', path: '/dashboard/devoluciones', icon: Undo, permKey: 'devoluciones' },
      { label: 'Caja', path: '/dashboard/caja', icon: Calculator, permKey: 'caja' },
    ]
  },
  {
    title: 'Inventario',
    items: [
      { label: 'Productos', path: '/dashboard/inventario', icon: Package, permKey: 'inventario' },
      { label: 'Categorías', path: '/dashboard/categorias', icon: Tag, permKey: 'categorias' },
      { label: 'Combos', path: '/dashboard/combos', icon: Box, permKey: 'combos' },
      { label: 'Descuentos', path: '/dashboard/descuentos', icon: Percent, permKey: 'descuentos' },
    ]
  },
  {
    title: 'Clientes y Proveedores',
    items: [
      { label: 'Clientes', path: '/dashboard/clientes', icon: Users, permKey: 'clientes' },
      { label: 'Cuentas por Cobrar', path: '/dashboard/cuentas-por-cobrar', icon: CreditCard, permKey: 'creditos' },
      { label: 'Proveedores', path: '/dashboard/proveedores', icon: Building2, permKey: 'proveedores' },
      { label: 'Compras', path: '/dashboard/compras', icon: Truck, permKey: 'compras' },
    ]
  },
  {
    title: 'Administración',
    items: [
      { label: 'Reportes', path: '/dashboard/reportes', icon: BarChart3, permKey: 'reportes' },
      { label: 'Auditoría', path: '/dashboard/auditoria', icon: ShieldAlert, permKey: 'auditoria' },
      { label: 'Usuarios', path: '/dashboard/usuarios', icon: User, permKey: 'usuarios' },
      { label: 'Configuración', path: '/dashboard/configuracion', icon: Settings, permKey: 'configuracion' },
    ]
  }
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { configs } = useConfig();

  const permisos = session?.user?.rol?.permisos || {};

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        {configs.logo_url && (
          <img src={configs.logo_url} alt={configs.nombre_negocio} className="sidebar-logo" />
        )}
        <h2>{configs.nombre_negocio}</h2>
      </div>

      <div className="sidebar-user-info">
        <p className="user-name">{session?.user?.name}</p>
        <span className="badge badge-warning">{session?.user?.rol?.nombre}</span>
      </div>

      <nav className="sidebar-menu">
        {MENU_SECTIONS.map((section) => {
          const allowedItems = section.items.filter(item => permisos[item.permKey]);
          if (allowedItems.length === 0) return null;

          return (
            <div key={section.title} className="menu-section">
              <span className="section-title">{section.title}</span>
              <div className="section-items">
                {allowedItems.map((item) => {
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
              </div>
            </div>
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
          padding: 24px 16px;
          border-bottom: 1px solid rgba(212, 168, 83, 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .sidebar-brand h2 {
          color: #8b0000; /* Cohesive with Evaluna brand crimson */
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin: 0;
          text-align: center;
        }

        .sidebar-logo {
          max-height: 64px;
          max-width: 80%;
          object-fit: contain;
          border-radius: 8px;
          transition: transform 0.2s ease;
        }

        .sidebar-logo:hover {
          transform: scale(1.05);
        }

        .sidebar-user-info {
          padding: 18px 24px;
          border-bottom: 1px solid rgba(212, 168, 83, 0.05);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-align: center;
          background: rgba(212, 168, 83, 0.015);
        }

        .user-name {
          font-weight: 700;
          font-size: 14px;
          color: var(--text-primary);
        }

        .sidebar-menu {
          flex-grow: 1;
          padding: 20px 12px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .menu-section {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .section-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
          opacity: 0.65;
          padding: 4px 12px;
          margin-bottom: 4px;
        }

        .section-items {
          display: flex;
          flex-direction: column;
          gap: 2px;
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

        :global(.menu-link:active) {
          transform: scale(0.96);
        }

        :global(.menu-link.active) {
          color: var(--accent-gold);
          background: rgba(212, 168, 83, 0.12);
          font-weight: 600;
          position: relative;
          border-radius: 0 8px 8px 0;
        }

        :global(.menu-link.active::before) {
          content: '';
          position: absolute;
          left: 0;
          top: 10%;
          height: 80%;
          width: 3px;
          background: var(--accent-gold);
          border-radius: 0 4px 4px 0;
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
