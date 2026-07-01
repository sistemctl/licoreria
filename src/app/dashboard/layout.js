'use client';

import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';

export default function DashboardLayout({ children }) {
  const { isOpen, close } = useSidebar();

  return (
    <div className="dashboard-container page-enter">
      <div
        className={`sidebar-overlay ${isOpen ? 'is-visible' : ''}`}
        onClick={close}
        onKeyDown={(e) => e.key === 'Escape' && close()}
        role="button"
        tabIndex={-1}
        aria-hidden={!isOpen}
      />
      <Sidebar />
      <main className="dashboard-content">
        <div className="dashboard-route">{children}</div>
      </main>
    </div>
  );
}
