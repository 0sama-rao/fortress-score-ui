import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Settings, Shield } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/organizations', label: 'Organizations', icon: Building2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside
      style={{ width: '256px', minWidth: '256px' }}
      className="fixed left-0 top-0 bottom-0 bg-sidebar flex flex-col z-30"
    >
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-5">
        <Shield className="h-5 w-5 text-white" />
        <h1 className="text-lg font-bold text-white tracking-tight">
          Fortress Score
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-1 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-white/70 hover:bg-sidebar-hover hover:text-white'
              }`
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
