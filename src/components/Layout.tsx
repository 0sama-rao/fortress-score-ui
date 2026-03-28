import { Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <Sidebar />

      <div style={{ marginLeft: '240px' }} className="flex flex-col min-h-screen">
        {/* Top header */}
        <header
          className="h-14 flex items-center justify-end px-6 shrink-0"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium leading-none" style={{ color: 'var(--color-text)' }}>
                {user?.name}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {user?.email}
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs cursor-pointer px-3 py-1.5 rounded-md transition-colors"
              style={{ color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-danger)';
                e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-secondary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
