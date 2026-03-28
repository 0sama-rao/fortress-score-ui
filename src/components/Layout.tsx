import { Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main area */}
      <div className="ml-64 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="h-14 bg-surface flex items-center justify-end px-6 shrink-0 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-text">{user?.name}</span>
            <span className="text-sm text-text-secondary">{user?.email}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-danger transition-colors duration-200 cursor-pointer ml-2"
            >
              <LogOut className="h-4 w-4" />
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
