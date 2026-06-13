import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
}
