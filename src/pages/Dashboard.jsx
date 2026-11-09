import { Link } from 'react-router-dom';
import {
  IceCreamCone,
  Boxes,
  Store,
  CalendarCheck,
  CalendarRange,
  CreditCard,
  Wallet,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { useApi } from '../lib/useApi';
import { money, number, date, statusClass } from '../lib/format';
import { PageHeader, StatCard, Card, Loading, ErrorBox, Empty } from '../components/ui';

const LOW_STOCK = 20;

export default function Dashboard() {
  const { data, error, loading } = useApi('/dashboard');
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox text={error} />;
  const c = data.cards;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        actions={
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Link to="/payments" className="btn-secondary flex-1 sm:flex-none">
              <Wallet size={16} /> Collect Payment
            </Link>
            <Link to="/sales/new" className="btn-primary flex-1 sm:flex-none">
              <Plus size={16} /> New Sale
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total Products" value={number(c.totalProducts)} icon={IceCreamCone} />
        <StatCard label="Available Stock" value={`${number(c.totalStock)} units`} hint={`Worth ${money(c.stockValue)}`} icon={Boxes} tone="blue" />
        <StatCard label="Total Shops" value={number(c.totalShops)} icon={Store} />
        <StatCard label="Today's Sales" value={money(c.todaySales)} icon={CalendarCheck} tone="green" />
        <StatCard label="Monthly Sales" value={money(c.monthlySales)} icon={CalendarRange} tone="green" />
        <StatCard label="Credit Given" value={money(c.totalCredit)} hint="Sales + opening balances" icon={CreditCard} tone="amber" />
        <StatCard label="Total Collected" value={money(c.totalCollected)} hint="Payment collections" icon={Wallet} tone="blue" />
        <StatCard label="Outstanding" value={money(c.totalOutstanding)} icon={AlertTriangle} tone="red" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card title="Recent Sales" actions={<Link to="/sales" className="text-xs font-semibold text-primary-700 hover:underline">View all</Link>}>
          {data.recentSales.length ? (
            <>
              {/* Mobile list view */}
              <div className="divide-y divide-gray-100 sm:hidden">
                {data.recentSales.map((s) => (
                  <Link
                    key={s._id}
                    to={`/sales/${s._id}`}
                    className="flex items-center justify-between p-3.5 hover:bg-gray-50 active:bg-gray-100 transition"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary-700 text-sm">{s.invoiceNumber}</span>
                        <span className={`badge ${statusClass(s.paymentStatus)}`}>{s.paymentStatus}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs font-medium text-gray-800">{s.shopName}</p>
                      <p className="text-[11px] text-gray-400">{date(s.date)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-gray-900 text-sm">{money(s.totalAmount)}</span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden sm:block table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Invoice</th><th>Shop</th><th className="text-right">Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.recentSales.map((s) => (
                      <tr key={s._id}>
                        <td>
                          <Link to={`/sales/${s._id}`} className="font-medium text-primary-700 hover:underline">{s.invoiceNumber}</Link>
                          <div className="text-xs text-gray-400">{date(s.date)}</div>
                        </td>
                        <td>{s.shopName}</td>
                        <td className="text-right font-medium">{money(s.totalAmount)}</td>
                        <td><span className={`badge ${statusClass(s.paymentStatus)}`}>{s.paymentStatus}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : <Empty text="No sales yet." />}
        </Card>

        <Card title="Recent Payment Collections" actions={<Link to="/payments" className="text-xs font-semibold text-primary-700 hover:underline">View all</Link>}>
          {data.recentPayments.length ? (
            <>
              {/* Mobile list view */}
              <div className="divide-y divide-gray-100 sm:hidden">
                {data.recentPayments.map((p) => (
                  <div key={p._id} className="flex items-center justify-between p-3.5">
                    <div className="min-w-0 pr-2">
                      <p className="truncate text-sm font-semibold text-gray-900">{p.shopName}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                        <span>{date(p.date)}</span>
                        <span>·</span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">{p.method}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-green-700 text-sm">{money(p.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden sm:block table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Date</th><th>Shop</th><th>Method</th><th className="text-right">Amount</th></tr>
                  </thead>
                  <tbody>
                    {data.recentPayments.map((p) => (
                      <tr key={p._id}>
                        <td>{date(p.date)}</td>
                        <td className="font-medium">{p.shopName}</td>
                        <td>{p.method}</td>
                        <td className="text-right font-medium text-green-700">{money(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : <Empty text="No payments collected yet." />}
        </Card>

        <Card title="Shop-wise Outstanding" actions={<Link to="/shops" className="text-xs font-semibold text-primary-700 hover:underline">All shops</Link>}>
          {data.shopOutstanding.length ? (
            <>
              {/* Mobile list view */}
              <div className="divide-y divide-gray-100 sm:hidden">
                {data.shopOutstanding.map((s) => (
                  <Link
                    key={s._id}
                    to={`/shops/${s._id}`}
                    className="flex items-center justify-between p-3.5 hover:bg-gray-50 active:bg-gray-100 transition"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate text-sm font-semibold text-primary-700">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.city}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-red-600 text-sm">{money(s.outstandingBalance)}</span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden sm:block table-wrap">
                <table className="data-table">
                  <thead><tr><th>Shop</th><th>City</th><th className="text-right">Outstanding</th></tr></thead>
                  <tbody>
                    {data.shopOutstanding.map((s) => (
                      <tr key={s._id}>
                        <td><Link to={`/shops/${s._id}`} className="text-primary-700 font-medium hover:underline">{s.name}</Link></td>
                        <td>{s.city}</td>
                        <td className="text-right font-semibold text-red-600">{money(s.outstandingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : <Empty text="No outstanding balances. 🎉" />}
        </Card>

        <Card title="Purchase & Stock" actions={<Link to="/products" className="text-xs font-semibold text-primary-700 hover:underline">Manage</Link>}>
          {data.productStock.length ? (
            <>
              {/* Mobile list view */}
              <div className="divide-y divide-gray-100 sm:hidden max-h-96 overflow-y-auto">
                {data.productStock.map((p) => (
                  <div key={p._id} className="flex items-center justify-between p-3.5">
                    <div className="min-w-0 pr-2">
                      <p className="truncate text-sm font-semibold text-gray-900">{p.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold ${
                        p.quantity === 0
                          ? 'bg-red-100 text-red-700'
                          : p.quantity < LOW_STOCK
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {number(p.quantity)} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden sm:block table-wrap max-h-96 overflow-y-auto">
                <table className="data-table">
                  <thead><tr><th>Product / Item</th><th className="text-right">Available Stock</th></tr></thead>
                  <tbody>
                    {data.productStock.map((p) => (
                      <tr key={p._id}>
                        <td className="font-medium">{p.name}</td>
                        <td className={`text-right font-semibold ${p.quantity === 0 ? 'text-red-600' : p.quantity < LOW_STOCK ? 'text-amber-600' : ''}`}>
                          {number(p.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : <Empty text="No products yet." />}
        </Card>
      </div>
    </>
  );
}
