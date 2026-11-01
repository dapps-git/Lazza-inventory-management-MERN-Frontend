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
          <>
            <Link to="/payments" className="btn-secondary">
              <Wallet size={16} /> Collect Payment
            </Link>
            <Link to="/sales/new" className="btn-primary">
              <Plus size={16} /> New Sale
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Products" value={number(c.totalProducts)} icon={IceCreamCone} />
        <StatCard label="Available Stock" value={`${number(c.totalStock)} units`} hint={`Worth ${money(c.stockValue)}`} icon={Boxes} tone="blue" />
        <StatCard label="Total Shops" value={number(c.totalShops)} icon={Store} />
        <StatCard label="Today's Sales" value={money(c.todaySales)} icon={CalendarCheck} tone="green" />
        <StatCard label="Monthly Sales" value={money(c.monthlySales)} icon={CalendarRange} tone="green" />
        <StatCard label="Total Credit Given" value={money(c.totalCredit)} hint="Credit on sales + previous balances" icon={CreditCard} tone="amber" />
        <StatCard label="Total Collected" value={money(c.totalCollected)} hint="Payment collections" icon={Wallet} tone="blue" />
        <StatCard label="Total Outstanding" value={money(c.totalOutstanding)} icon={AlertTriangle} tone="red" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Recent Sales" actions={<Link to="/sales" className="text-xs text-primary-700 hover:underline">View all</Link>}>
          {data.recentSales.length ? (
            <div className="table-wrap">
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
                      <td className="text-right">{money(s.totalAmount)}</td>
                      <td><span className={`badge ${statusClass(s.paymentStatus)}`}>{s.paymentStatus}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty text="No sales yet." />}
        </Card>

        <Card title="Recent Payment Collections" actions={<Link to="/payments" className="text-xs text-primary-700 hover:underline">View all</Link>}>
          {data.recentPayments.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Shop</th><th>Method</th><th className="text-right">Amount</th></tr>
                </thead>
                <tbody>
                  {data.recentPayments.map((p) => (
                    <tr key={p._id}>
                      <td>{date(p.date)}</td>
                      <td>{p.shopName}</td>
                      <td>{p.method}</td>
                      <td className="text-right font-medium text-green-700">{money(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty text="No payments collected yet." />}
        </Card>

        <Card title="Shop-wise Outstanding" actions={<Link to="/shops" className="text-xs text-primary-700 hover:underline">All shops</Link>}>
          {data.shopOutstanding.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Shop</th><th>City</th><th className="text-right">Outstanding</th></tr></thead>
                <tbody>
                  {data.shopOutstanding.map((s) => (
                    <tr key={s._id}>
                      <td><Link to={`/shops/${s._id}`} className="text-primary-700 hover:underline">{s.name}</Link></td>
                      <td>{s.city}</td>
                      <td className="text-right font-medium text-red-600">{money(s.outstandingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty text="No outstanding balances. 🎉" />}
        </Card>

        <Card title="Product-wise Stock" actions={<Link to="/products" className="text-xs text-primary-700 hover:underline">Manage</Link>}>
          {data.productStock.length ? (
            <div className="table-wrap max-h-96 overflow-y-auto">
              <table className="data-table">
                <thead><tr><th>Product</th><th>Category</th><th className="text-right">Stock</th></tr></thead>
                <tbody>
                  {data.productStock.map((p) => (
                    <tr key={p._id}>
                      <td>{p.name}</td>
                      <td className="text-gray-500">{p.category?.name}</td>
                      <td className={`text-right font-medium ${p.quantity === 0 ? 'text-red-600' : p.quantity < LOW_STOCK ? 'text-amber-600' : ''}`}>
                        {number(p.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty text="No products yet." />}
        </Card>
      </div>
    </>
  );
}
