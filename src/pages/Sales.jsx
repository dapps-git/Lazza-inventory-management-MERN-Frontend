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
        title="Sales"
        subtitle="Complete sales and distribution history"
        actions={<Link to="/sales/new" className="btn-primary"><Plus size={16} /> New Sale</Link>}
      />
      <Card>
        <div className="grid grid-cols-1 gap-3 border-b border-gray-100 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
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
            <input type="date" className="input" value={f.from} onChange={set('from')} title="From" />
            <input type="date" className="input" value={f.to} onChange={set('to')} title="To" />
          </div>
        </div>
        {error && <div className="p-4"><ErrorBox text={error} /></div>}
        {loading && !data ? (
          <Loading />
        ) : data?.length ? (
          <div className="table-wrap">
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
                    <td className="text-right">{money(s.totalAmount)}</td>
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
        ) : (
          <Empty text="No sales found." />
        )}
      </Card>
    </>
  );
}
