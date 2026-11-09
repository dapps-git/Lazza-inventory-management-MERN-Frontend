import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { qs } from '../lib/api';
import { useApi, useDebounced } from '../lib/useApi';
import { money, date, statusClass } from '../lib/format';
import { PageHeader, Card, Loading, Empty, ErrorBox } from '../components/ui';

export default function Sales() {
  const navigate = useNavigate();
  const [f, setF] = useState({ search: '', shop: '', status: '', from: '', to: '' });
  const search = useDebounced(f.search);
  const { data, loading, error } = useApi(`/sales${qs({ ...f, search })}`);
  const shops = useApi('/shops');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const totals = (data || []).reduce(
    (t, s) => ({ total: t.total + s.totalAmount, paid: t.paid + s.paidAmount, credit: t.credit + s.creditAmount }),
    { total: 0, paid: 0, credit: 0 }
  );

  return (
    <>
      <PageHeader
        title="Sales History"
        subtitle="Complete sales and distribution history"
        actions={
          <Link to="/sales/new" className="btn-primary w-full sm:w-auto">
            <Plus size={16} /> New Sale
          </Link>
        }
      />
      <Card>
        <div className="grid grid-cols-1 gap-2.5 border-b border-gray-100 p-3.5 sm:p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search size={16} className="absolute left-3 top-3 text-gray-400 sm:top-2.5" />
            <input className="input pl-9" placeholder="Invoice, shop or product…" value={f.search} onChange={set('search')} />
          </div>
          <select className="input" value={f.shop} onChange={set('shop')}>
            <option value="">All shops</option>
            {shops.data?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <select className="input" value={f.status} onChange={set('status')}>
            <option value="">All statuses</option>
            <option>Paid</option><option>Partial</option><option>Credit</option>
          </select>
          <div className="flex items-center gap-2">
            <input type="date" className="input" value={f.from} onChange={set('from')} title="From date" />
            <span className="text-gray-400 text-xs">to</span>
            <input type="date" className="input" value={f.to} onChange={set('to')} title="To date" />
          </div>
        </div>
        {error && <div className="p-4"><ErrorBox text={error} /></div>}
        {loading && !data ? (
          <Loading />
        ) : data?.length ? (
          <>
            {/* Mobile Summary bar */}
            <div className="grid grid-cols-3 gap-2 bg-primary-50/70 p-3 text-xs sm:hidden border-b border-gray-100">
              <div>
                <span className="text-gray-500 block">Total ({data.length})</span>
                <b className="text-gray-900 text-xs">{money(totals.total)}</b>
              </div>
              <div>
                <span className="text-gray-500 block">Paid</span>
                <b className="text-green-700 text-xs">{money(totals.paid)}</b>
              </div>
              <div>
                <span className="text-gray-500 block">Credit</span>
                <b className="text-red-600 text-xs">{money(totals.credit)}</b>
              </div>
            </div>

            {/* Mobile Sales Cards */}
            <div className="divide-y divide-gray-100 sm:hidden">
              {data.map((s) => (
                <div
                  key={s._id}
                  onClick={() => navigate(`/sales/${s._id}`)}
                  className="p-3.5 space-y-2 hover:bg-gray-50/60 active:bg-gray-100/60 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary-700 text-sm">{s.invoiceNumber}</span>
                    <span className={`badge ${statusClass(s.paymentStatus)}`}>{s.paymentStatus}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-900">{s.shopName}</span>
                    <span className="text-gray-400">{date(s.date)}</span>
                  </div>

                  <p className="text-xs text-gray-500 truncate">
                    {s.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-xs border-t border-gray-50 font-medium">
                    <div>Total: <b className="text-gray-900">{money(s.totalAmount)}</b></div>
                    <div>Paid: <b className="text-green-700">{money(s.paidAmount)}</b></div>
                    <div>Credit: <b className={s.creditAmount > 0 ? 'text-red-600' : 'text-gray-500'}>{money(s.creditAmount)}</b></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Invoice</th><th>Date</th><th>Shop</th><th>Products</th><th className="text-right">Total</th><th className="text-right">Paid</th><th className="text-right">Credit</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data.map((s) => (
                    <tr key={s._id} className="cursor-pointer" onClick={() => navigate(`/sales/${s._id}`)}>
                      <td className="font-medium text-primary-700">{s.invoiceNumber}</td>
                      <td>{date(s.date)}</td>
                      <td>{s.shopName}</td>
                      <td className="max-w-xs truncate text-gray-500">{s.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}</td>
                      <td className="text-right font-medium">{money(s.totalAmount)}</td>
                      <td className="text-right text-green-700">{money(s.paidAmount)}</td>
                      <td className="text-right text-red-600">{money(s.creditAmount)}</td>
                      <td><span className={`badge ${statusClass(s.paymentStatus)}`}>{s.paymentStatus}</span></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-primary-50 font-semibold">
                    <td colSpan={4} className="px-4 py-3">{data.length} sales</td>
                    <td className="px-4 py-3 text-right">{money(totals.total)}</td>
                    <td className="px-4 py-3 text-right text-green-700">{money(totals.paid)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{money(totals.credit)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        ) : (
          <Empty text="No sales found." />
        )}
      </Card>
    </>
  );
}
