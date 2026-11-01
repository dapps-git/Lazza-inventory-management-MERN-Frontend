import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarCheck, CalendarDays, CalendarRange, AlertTriangle } from 'lucide-react';
import { api, qs } from '../lib/api';
import { useApi } from '../lib/useApi';
import { money, date, isoDay, round2, requestId } from '../lib/format';
import { PageHeader, Card, StatCard, Loading, Empty, ErrorBox, Field, useToast } from '../components/ui';

const METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Other'];

export default function Payments() {
  const [params] = useSearchParams();
  const summary = useApi('/payments/summary');
  const [filters, setFilters] = useState({ shop: '', method: '', from: '', to: '' });
  const list = useApi(`/payments${qs(filters)}`);
  const shops = useApi('/shops');
  const setF = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  const refresh = () => {
    summary.reload();
    list.reload();
    shops.reload();
  };

  const sm = summary.data;
  const listTotal = (list.data || []).reduce((t, p) => t + p.amount, 0);

  return (
    <>
      <PageHeader title="Payment Collection" subtitle="Collect outstanding amounts from shops" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's Collections" value={sm ? money(sm.today.total) : '…'} hint={sm && `${sm.today.count} payments`} icon={CalendarCheck} tone="green" />
        <StatCard label="This Week" value={sm ? money(sm.week.total) : '…'} hint={sm && `${sm.week.count} payments`} icon={CalendarDays} tone="blue" />
        <StatCard label="This Month" value={sm ? money(sm.month.total) : '…'} hint={sm && `${sm.month.count} payments`} icon={CalendarRange} />
        <StatCard label="Pending Outstanding" value={sm ? money(sm.pendingTotal) : '…'} hint={sm && `${sm.pending.length} shops`} icon={AlertTriangle} tone="red" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <CollectForm shops={shops.data} initialShop={params.get('shop') || ''} onSaved={refresh} />

        <Card title="Pending Outstanding Amounts" className="xl:col-span-2">
          {sm?.pending.length ? (
            <div className="table-wrap max-h-96 overflow-y-auto">
              <table className="data-table">
                <thead><tr><th>Shop</th><th>City</th><th>Phone</th><th className="text-right">Outstanding</th></tr></thead>
                <tbody>
                  {sm.pending.map((s) => (
                    <tr key={s._id}>
                      <td><Link to={`/shops/${s._id}`} className="text-primary-700 hover:underline">{s.name}</Link></td>
                      <td>{s.city}</td>
                      <td>{s.phone}</td>
                      <td className="text-right font-semibold text-red-600">{money(s.outstandingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : summary.loading ? <Loading /> : <Empty text="No pending balances." />}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Shop-wise Collections (this month)">
          {sm?.shopWise.length ? (
            <div className="table-wrap max-h-[28rem] overflow-y-auto">
              <table className="data-table">
                <thead><tr><th>Shop</th><th className="text-right">Payments</th><th className="text-right">Collected</th></tr></thead>
                <tbody>
                  {sm.shopWise.map((s) => (
                    <tr key={s._id}><td>{s.shopName}</td><td className="text-right">{s.count}</td><td className="text-right font-medium text-green-700">{money(s.total)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty text="No collections this month." />}
        </Card>

        <Card title="Payment History" className="xl:col-span-2">
          <div className="grid grid-cols-1 gap-2 border-b border-gray-100 p-4 sm:grid-cols-4">
            <select className="input" value={filters.shop} onChange={setF('shop')}>
              <option value="">All shops</option>
              {shops.data?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <select className="input" value={filters.method} onChange={setF('method')}>
              <option value="">All methods</option>
              {METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
            <input type="date" className="input" value={filters.from} onChange={setF('from')} title="From" />
            <input type="date" className="input" value={filters.to} onChange={setF('to')} title="To" />
          </div>
          {list.error && <div className="p-4"><ErrorBox text={list.error} /></div>}
          {list.loading && !list.data ? (
            <Loading />
          ) : list.data?.length ? (
            <div className="table-wrap max-h-[28rem] overflow-y-auto">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Shop</th><th className="text-right">Amount</th><th>Method</th><th>Reference</th><th className="text-right">Balance After</th><th>Notes</th></tr></thead>
                <tbody>
                  {list.data.map((p) => (
                    <tr key={p._id}>
                      <td>{date(p.date)}</td>
                      <td>{p.shopName}</td>
                      <td className="text-right font-medium text-green-700">{money(p.amount)}</td>
                      <td>{p.method}</td>
                      <td>{p.referenceNumber || '—'}</td>
                      <td className="text-right">{money(p.remainingBalance)}</td>
                      <td className="max-w-[12rem] truncate text-gray-500">{p.notes}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-primary-50 font-semibold">
                    <td colSpan={2} className="px-4 py-3">{list.data.length} payments</td>
                    <td className="px-4 py-3 text-right text-green-700">{money(listTotal)}</td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : <Empty text="No payments found." />}
        </Card>
      </div>
    </>
  );
}

function CollectForm({ shops, initialShop, onSaved }) {
  const toast = useToast();
  const blank = { shop: initialShop, amount: '', method: 'Cash', referenceNumber: '', notes: '', date: isoDay() };
  const [f, setF] = useState(blank);
  const [reqId, setReqId] = useState(requestId);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const shop = shops?.find((s) => s._id === f.shop);
  const outstanding = shop?.outstandingBalance || 0;
  const amount = f.amount === '' ? 0 : round2(f.amount);
  const remaining = round2(outstanding - amount);
  const problem = amount < 0 ? 'Amount cannot be negative' : amount > outstanding ? 'More than the outstanding balance' : '';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/payments', { ...f, amount, clientRequestId: reqId });
      toast(res.duplicate ? 'This payment was already saved' : `${money(res.payment.amount)} collected from ${res.payment.shopName}`);
      setF({ ...blank, shop: f.shop });
      setReqId(requestId());
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Collect Payment" bodyClass="p-4">
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox text={error} />
        <Field label="Shop *">
          <select className="input" value={f.shop} onChange={set('shop')} required>
            <option value="">Select a shop…</option>
            {shops?.map((s) => <option key={s._id} value={s._id}>{s.name} – {s.city} ({money(s.outstandingBalance)})</option>)}
          </select>
        </Field>
        {shop && (
          <div className="rounded-lg bg-primary-50 px-3 py-2 text-sm">
            Current outstanding: <b className={outstanding > 0 ? 'text-red-600' : 'text-green-700'}>{money(outstanding)}</b>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹) *">
            <input className="input" type="number" min="0.01" step="0.01" value={f.amount} onChange={set('amount')} required />
          </Field>
          <Field label="Date"><input className="input" type="date" max={isoDay()} value={f.date} onChange={set('date')} /></Field>
        </div>
        {shop && outstanding > 0 && (
          <button type="button" className="text-xs text-primary-700 hover:underline" onClick={() => setF({ ...f, amount: String(outstanding) })}>
            Collect full balance ({money(outstanding)})
          </button>
        )}
        {problem && <p className="text-xs text-red-600">{problem}</p>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Payment Method *">
            <select className="input" value={f.method} onChange={set('method')}>
              {METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Reference No."><input className="input" value={f.referenceNumber} onChange={set('referenceNumber')} placeholder="UPI / txn id" /></Field>
        </div>
        <Field label="Notes"><textarea className="input" rows={2} value={f.notes} onChange={set('notes')} /></Field>
        {shop && (
          <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <span className="text-gray-500">Remaining balance</span>
            <b>{money(Math.max(0, remaining))}</b>
          </div>
        )}
        <button className="btn-primary w-full" disabled={busy || !shop || amount <= 0 || Boolean(problem)}>
          {busy ? 'Saving…' : 'Save Payment'}
        </button>
      </form>
    </Card>
  );
}
