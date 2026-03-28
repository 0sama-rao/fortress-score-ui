import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Settings, Shield } from 'lucide-react';

const navItems = [
  { to: '/',              label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/organizations', label: 'Organizations', icon: Building2 },
  { to: '/settings',      label: 'Settings',      icon: Settings },
];

export default function Sidebar() {
  return (
    <aside
      style={{ width: '240px', minWidth: '240px', backgroundColor: 'var(--color-sidebar)' }}
      className="fixed left-0 top-0 bottom-0 flex flex-col z-30"
    >
      {/* Logo */}
      <div
        className="h-14 flex items-center gap-2.5 px-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-center h-7 w-7 rounded-lg"
          style={{ backgroundColor: 'rgba(59,130,246,0.2)' }}>
          <Shield className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <div className="text-sm font-bold text-white leading-none">Fortress Score</div>
          <div className="text-[10px] mt-0.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Cyber Risk Platform
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.15s',
              textDecoration: 'none',
              backgroundColor: isActive ? 'var(--color-sidebar-active)' : 'transparent',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              if (!el.dataset.active) {
                el.style.backgroundColor = 'var(--color-sidebar-hover)';
                el.style.color = 'rgba(255,255,255,0.85)';
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              if (!el.dataset.active) {
                el.style.backgroundColor = '';
                el.style.color = '';
              }
            }}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom status */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--color-success)' }} />
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            All systems operational
          </span>
        </div>
      </div>
    </aside>
  );
}
