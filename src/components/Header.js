'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

export default function Header({ title }) {
  const { data: session } = useSession();
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [cajaLoading, setCajaLoading] = useState(true);

  useEffect(() => {
    async function checkCaja() {
      try {
        const res = await fetch('/api/caja?checkOpen=true');
        const json = await res.json();
        if (json && !json.error) {
          setCajaAbierta(true);
        } else {
          setCajaAbierta(false);
        }
      } catch (e) {
        console.error('Error checking caja status:', e);
      } finally {
        setCajaLoading(false);
      }
    }
    checkCaja();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días! ☀️';
    if (hour < 18) return '¡Buenas tardes! 🌤️';
    return '¡Buenas noches! 🌙';
  };

  return (
    <header className="dashboard-header glass-panel">
      <div className="header-left">
        <h1>{title}</h1>
      </div>
      <div className="header-right">
        <div className="header-pill">
          <div className="header-info-item greeting-item">
            <span className="greeting-text">{getGreeting()} ¡Que tengas un excelente día!</span>
          </div>
          <div className="divider"></div>
          <div className="header-info-item">
            <span className={`status-dot ${cajaAbierta ? 'dot-open' : 'dot-closed'}`}></span>
            <span>{cajaLoading ? 'Cargando...' : cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}</span>
          </div>
        </div>

        <div className="header-user-profile">
          <div className="avatar-circle">
            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-details">
            <span className="user-name">{session?.user?.name || 'Usuario'}</span>
            <span className="role-badge">{session?.user?.rol?.nombre || 'Rol'}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-radius: 12px;
          margin-bottom: 8px;
          box-shadow: var(--shadow-sm);
        }

        .header-left h1 {
          font-size: 24px;
          color: var(--text-primary);
          font-weight: 700;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(212, 168, 83, 0.05);
          border: 1px solid rgba(212, 168, 83, 0.12);
          padding: 8px 16px;
          border-radius: 9999px;
          box-shadow: var(--shadow-sm);
        }

        .divider {
          width: 1px;
          height: 14px;
          background: rgba(212, 168, 83, 0.2);
        }

        .header-info-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13.5px;
          color: var(--text-secondary);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .dot-open {
          background-color: var(--success-green);
          box-shadow: 0 0 8px var(--success-green);
          animation: pulse-green 2s infinite;
        }

        .dot-closed {
          background-color: var(--error-red);
          box-shadow: 0 0 8px var(--error-red);
          animation: pulse-red 2s infinite;
        }

        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        .header-user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .avatar-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-gold), #b38630);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 15px;
          box-shadow: 0 2px 8px rgba(212, 168, 83, 0.25);
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .user-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .role-badge {
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--accent-gold);
          background: rgba(212, 168, 83, 0.1);
          border: 1px solid rgba(212, 168, 83, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
          width: fit-content;
          line-height: 1;
        }
      `}</style>
    </header>
  );
}
