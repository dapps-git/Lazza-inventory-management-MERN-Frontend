import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Products & Stock', icon: IceCreamCone },
  { to: '/shops', label: 'Shops & Accounts', icon: Store },
  { to: '/sales', label: 'Sales', icon: ShoppingCart },
  { to: '/payments', label: 'Payment Collection', icon: Wallet },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col bg-primary-900 text-primary-100">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
          <IceCreamCone size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Lazza Distributor</p>
          <p className="text-xs text-primary-200/70">Stock & Accounts</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                isActive ? 'bg-white text-primary-800 font-medium' : 'hover:bg-white/10 text-primary-100'
              }`
            }
          >
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm text-white">{user?.name}</p>
        <p className="truncate text-xs text-primary-200/70">{user?.email}</p>
        <button onClick={logout} className="mt-3 flex items-center gap-2 text-xs text-primary-200 hover:text-white">
          <LogOut size={14} /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block print:hidden">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64">
            {sidebar}
            <button onClick={() => setOpen(false)} className="absolute right-3 top-5 text-white">
              <X size={20} />
            </button>
          </aside>
        </div>
      )}
      <div className="lg:pl-60 print:pl-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden print:hidden">
          <button onClick={() => setOpen(true)} className="rounded p-1 text-gray-600 hover:bg-gray-100">
            <Menu size={22} />
          </button>
          <span className="font-semibold text-primary-800">Lazza Distributor</span>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
