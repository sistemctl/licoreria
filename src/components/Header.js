'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { useConfig } from '@/components/ConfigProvider';
import { useSidebar } from '@/components/SidebarContext';
import StatusPill from '@/components/ui/StatusPill';

export default function Header({ title }) {
  const { data: session } = useSession();
  const { configs } = useConfig();
  const { toggle } = useSidebar();
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [cajaLoading, setCajaLoading] = useState(true);

  useEffect(() => {
    async function checkCaja() {
      try {
        const res = await fetch('/api/caja?checkOpen=true');
        const json = await res.json();
        setCajaAbierta(json && !json.error);
      } catch (e) {
        console.error('Error checking caja status:', e);
      } finally {
        setCajaLoading(false);
      }
    }
    checkCaja();
  }, []);

  const ticketId = `TURNO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

  return (
    <header className="operation-bar" role="banner">
      <div className="operation-bar__left">
        <button type="button" className="mobile-menu-btn" onClick={toggle} aria-label="Abrir menú">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="operation-bar__title">{title}</h1>
          <span className="operation-bar__ticket">{configs.nombre_negocio} · {ticketId}</span>
        </div>
      </div>

      <div className="operation-bar__right">
        <StatusPill
          status={cajaLoading ? 'closed' : cajaAbierta ? 'open' : 'closed'}
          label={cajaLoading ? 'Verificando caja...' : cajaAbierta ? 'Caja abierta' : 'Caja cerrada'}
        />

        <div className="operation-bar__user">
          <div className="operation-bar__avatar" aria-hidden="true">
            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="operation-bar__meta">
            <span className="operation-bar__name">{session?.user?.name || 'Usuario'}</span>
            <span className="operation-bar__role">{session?.user?.rol?.nombre || 'Rol'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
