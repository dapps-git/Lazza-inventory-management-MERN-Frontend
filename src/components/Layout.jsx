import { useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  IceCreamCone,
  Store,
  ShoppingCart,
  Wallet,
  FileBarChart,
  LogOut,
  Menu,
  X,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Purchase & Stock', icon: IceCreamCone },
  { to: '/shops', label: 'Shops & Accounts', icon: Store },
  { to: '/sales', label: 'Sales History', icon: ShoppingCart },
  { to: '/payments', label: 'Payment Collection', icon: Wallet },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const sidebar = (
    <div className="flex h-full flex-col bg-primary-900 text-primary-100">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white shadow-inner">
          <IceCreamCone size={22} />
        </div>
        <div>
          <p className="text-base font-bold text-white tracking-tight">Lazza Distributor</p>
          <p className="text-xs text-primary-200/70 font-medium">Stock & Accounts CRM</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition active:scale-[0.98] ${
                isActive
                  ? 'bg-white text-primary-900 shadow-sm'
                  : 'text-primary-100/90 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={19} className="shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 bg-primary-950/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white font-semibold text-sm">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-primary-200/60">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-xs font-medium text-primary-100 transition hover:bg-white/20 hover:text-white active:scale-95"
        >
          <LogOut size={14} /> Log out
        </button>
        <p className="mt-2.5 text-center text-[10px] text-primary-200/50">
          Powered by{' '}
          <a
            href="https://www.crevionads.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-200/80 hover:text-white hover:underline transition font-semibold"
          >
            Crevion Ads
          </a>
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block print:hidden shadow-lg">
        {sidebar}
      </aside>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col shadow-2xl transition-transform">
            {sidebar}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3.5 top-4 rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white active:scale-90"
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:pl-60 print:pl-0 flex flex-col min-h-screen">
        {/* Mobile Sticky Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200/80 bg-white/95 px-4 py-2.5 backdrop-blur lg:hidden print:hidden shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 active:scale-95 transition"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-700 text-white">
                <IceCreamCone size={16} />
              </div>
              <span className="font-bold text-base text-gray-900 tracking-tight">Lazza</span>
            </div>
          </div>
          <Link
            to="/sales/new"
            className="inline-flex items-center gap-1 rounded-lg bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-800 active:scale-95 transition"
          >
            <Plus size={14} /> New Sale
          </Link>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-3.5 sm:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="mt-auto border-t border-gray-200/80 bg-white py-3 px-4 text-center text-xs text-gray-500 pb-20 lg:pb-3 print:hidden">
          <p>
            Powered by{' '}
            <a
              href="https://www.crevionads.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-700 hover:text-primary-800 hover:underline transition"
            >
              Crevion Ads
            </a>
          </p>
        </footer>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-gray-200 bg-white/95 backdrop-blur px-2 py-1.5 lg:hidden print:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 text-[11px] font-medium transition active:scale-95 ${
                isActive ? 'text-primary-700 font-semibold' : 'text-gray-500 hover:text-gray-800'
              }`
            }
          >
            <LayoutDashboard size={20} />
            <span className="mt-0.5">Home</span>
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 text-[11px] font-medium transition active:scale-95 ${
                isActive ? 'text-primary-700 font-semibold' : 'text-gray-500 hover:text-gray-800'
              }`
            }
          >
            <IceCreamCone size={20} />
            <span className="mt-0.5">Stock</span>
          </NavLink>

          {/* Prominent Center Action */}
          <Link
            to="/sales/new"
            className="flex flex-col items-center justify-center -mt-5 transition transform active:scale-90"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-700 text-white shadow-lg ring-4 ring-white hover:bg-primary-800">
              <Plus size={24} strokeWidth={2.5} />
            </div>
            <span className="mt-1 text-[10px] font-bold text-primary-800">New Sale</span>
          </Link>

          <NavLink
            to="/shops"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 text-[11px] font-medium transition active:scale-95 ${
                isActive ? 'text-primary-700 font-semibold' : 'text-gray-500 hover:text-gray-800'
              }`
            }
          >
            <Store size={20} />
            <span className="mt-0.5">Shops</span>
          </NavLink>

          <button
            onClick={() => setOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-3 text-[11px] font-medium transition active:scale-95 ${
              open || ['/payments', '/reports', '/sales'].includes(location.pathname)
                ? 'text-primary-700 font-semibold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Menu size={20} />
            <span className="mt-0.5">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
