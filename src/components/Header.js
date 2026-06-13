'use client';

import { useSession } from 'next-auth/react';
import { Calendar, User } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';

export default function Header({ title }) {
  const { data: session } = useSession();

  return (
    <header className="dashboard-header glass-panel">
      <div className="header-left">
        <h1>{title}</h1>
      </div>
      <div className="header-right">
        <div className="header-info-item">
          <Calendar size={16} />
          <span>{formatDateShort(new Date())}</span>
        </div>
        <div className="header-info-item user-info">
          <User size={16} />
          <span>{session?.user?.name} ({session?.user?.rol?.nombre})</span>
        </div>
      </div>

      <style jsx>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          border-radius: 12px;
          margin-bottom: 8px;
        }

        .header-left h1 {
          font-size: 24px;
          color: var(--text-primary);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .header-info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text-secondary);
        }

        .user-info {
          font-weight: 500;
          color: var(--accent-gold);
        }
      `}</style>
    </header>
  );
}
