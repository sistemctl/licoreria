'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useConfig } from '@/components/ConfigProvider';
import { useSidebar } from '@/components/SidebarContext';
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
  Settings,
  LogOut,
  X,
  PackageMinus,
} from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Inicio', path: '/dashboard', icon: Home, permKey: 'inicio' },
  { label: 'Punto de venta', path: '/dashboard/pos', icon: ShoppingCart, permKey: 'pos' },
  { label: 'Ventas', path: '/dashboard/ventas', icon: History, permKey: 'ventas' },
  { label: 'Devoluciones', path: '/dashboard/devoluciones', icon: Undo, permKey: 'devoluciones' },
  { label: 'Caja', path: '/dashboard/caja', icon: Calculator, permKey: 'caja' },
  { label: 'Productos', path: '/dashboard/inventario', icon: Package, permKey: 'inventario' },
  { label: 'Mermas', path: '/dashboard/mermas', icon: PackageMinus, permKey: 'inventario' },
  { label: 'Categorías', path: '/dashboard/categorias', icon: Tag, permKey: 'categorias' },
  { label: 'Combos', path: '/dashboard/combos', icon: Box, permKey: 'combos' },
  { label: 'Descuentos', path: '/dashboard/descuentos', icon: Percent, permKey: 'descuentos' },
  { label: 'Clientes', path: '/dashboard/clientes', icon: Users, permKey: 'clientes' },
  { label: 'Cuentas por cobrar', path: '/dashboard/cuentas-por-cobrar', icon: CreditCard, permKey: 'creditos' },
  { label: 'Proveedores', path: '/dashboard/proveedores', icon: Building2, permKey: 'proveedores' },
  { label: 'Compras', path: '/dashboard/compras', icon: Truck, permKey: 'compras' },
  { label: 'Reportes', path: '/dashboard/reportes', icon: BarChart3, permKey: 'reportes', dividerBefore: true },
  {
    label: 'Configuración',
    path: '/dashboard/configuracion',
    icon: Settings,
    permKey: 'configuracion',
    alsoActiveFor: ['usuarios', 'auditoria'],
  },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { configs } = useConfig();
  const { isOpen, close } = useSidebar();

  const permisos = session?.user?.rol?.permisos || {};

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} aria-label="Navegación principal">
      <div className="sidebar-brand">
        <button type="button" className="sidebar-close-btn" onClick={close} aria-label="Cerrar menú">
          <X size={20} />
        </button>
        {configs.logo_url ? (
          <img src={configs.logo_url} alt="" className="sidebar-logo" />
        ) : (
          <div className="sidebar-logo-fallback" aria-hidden="true">
            {configs.nombre_negocio?.charAt(0) || 'L'}
          </div>
        )}
        <div className="sidebar-brand-text">
          <span className="sidebar-eyebrow">Operación</span>
          <h2>{configs.nombre_negocio}</h2>
        </div>
      </div>

      <nav className="sidebar-menu">
        {MENU_ITEMS.filter((item) => {
          if (item.alsoActiveFor) {
            return item.alsoActiveFor.some((key) => permisos[key]) || permisos[item.permKey];
          }
          return permisos[item.permKey];
        }).map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.path ||
            pathname.startsWith(`${item.path}/`) ||
            (item.path === '/dashboard/configuracion' && pathname.startsWith('/dashboard/configuracion'));

          return (
            <div key={item.path} className={item.dividerBefore ? 'menu-item-wrap menu-item-wrap--divider' : 'menu-item-wrap'}>
              <Link
                href={item.path}
                onClick={close}
                className={`menu-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.25 : 1.75} />
                <span>{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button type="button" onClick={() => signOut({ callbackUrl: '/login' })} className="menu-link logout-btn">
          <LogOut size={18} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
