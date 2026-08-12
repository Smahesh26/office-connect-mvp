import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, FileSignature, ArrowLeftRight, Users, Package,
  BookOpen, BarChart3, Settings, LogOut, ScrollText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/quotes', label: 'Quotes', icon: FileSignature },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/items', label: 'Items', icon: Package },
  { to: '/accounts', label: 'Chart of Accounts', icon: BookOpen },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isEmbedded = localStorage.getItem('embedded') === 'true';

  return (
    <div className={`min-h-screen flex bg-paper ${isEmbedded ? 'bg-transparent' : ''}`}>
      {!isEmbedded && (
        <aside className="w-64 shrink-0 bg-ink-950 text-paper flex flex-col">
          <div className="flex items-center gap-2 px-6 py-6 border-b border-white/10">
            <ScrollText className="w-6 h-6 text-brass" strokeWidth={1.5} />
            <div>
              <p className="font-display text-lg leading-none">AccounTech</p>
              <p className="text-[11px] text-paper/50 tracking-wide mt-0.5">LEDGER &amp; INVOICING</p>
            </div>
          </div>
          <nav className="flex-1 py-4 px-3 space-y-1">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive ? 'bg-white/10 text-brass border-l-2 border-brass -ml-[2px] pl-[14px]' : 'text-paper/70 hover:bg-white/5 hover:text-paper'
                  }`
                }
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="px-3 py-4 border-t border-white/10">
            <div className="px-3 py-2 mb-2">
              <p className="text-sm text-paper">{user?.name}</p>
              <p className="text-xs text-paper/50 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={async () => { await logout(); navigate('/login'); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-paper/70 hover:bg-white/5 hover:text-paper transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.75} /> Sign out
            </button>
          </div>
        </aside>
      )}
      <main className="flex-1 min-w-0">
        <div className={isEmbedded ? "w-full h-full p-4" : "max-w-6xl mx-auto px-6 sm:px-10 py-8"}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
