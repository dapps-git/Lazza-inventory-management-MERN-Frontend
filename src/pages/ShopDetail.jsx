import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Wallet, MapPin, Phone, FileSpreadsheet, FileText, Pencil } from 'lucide-react';
import { qs } from '../lib/api';
import { useApi } from '../lib/useApi';
import { money, number, date, statusClass } from '../lib/format';
import { exportExcel, exportPdf } from '../lib/exporters';
import { Card, StatCard, Loading, Empty, ErrorBox } from '../components/ui';
import ShopForm from '../components/ShopForm';

export default function ShopDetail() {
  const { id } = useParams();
  const shop = useApi(`/shops/${id}`);
  const [tab, setTab] = useState('ledger');
  const [range, setRange] = useState({ from: '', to: '' });
  const [editing, setEditing] = useState(false);

  if (shop.loading && !shop.data) return <Loading />;
  if (shop.error) return <ErrorBox text={shop.error} />;
  const s = shop.data;
  const m = s.summary;

  return (
    <>
      <Link to="/shops" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-700">
        <ArrowLeft size={14} /> All shops
      </Link>

      <div className="card mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">{s.name}</h1>
          <p className="text-sm text-gray-500">{s.ownerName}{s.ownerName && ' · '}{s.city}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {s.phone && <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1 hover:text-primary-700"><Phone size={14} /> {s.phone}</a>}
            {s.location?.lat != null && (
              <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${s.location.lat},${s.location.lng}`} className="inline-flex items-center gap-1 hover:text-primary-700">
                <MapPin size={14} /> View on map
              </a>
            )}
          </div>
          {s.address && <p className="mt-1 text-sm text-gray-500">{s.address}</p>}
          {s.additionalDetails && <p className="mt-1 text-xs text-gray-400">{s.additionalDetails}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => setEditing(true)}><Pencil size={16} /> Edit</button>
          <Link to={`/payments?shop=${s._id}`} className="btn-secondary"><Wallet size={16} /> Collect Payment</Link>
          <Link to={`/sales/new?shop=${s._id}`} className="btn-primary"><Plus size={16} /> New Sale</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Previous Balance" value={money(s.openingBalance)} />
        <StatCard label="Products Supplied" value={`${number(m.itemsSupplied)} units`} hint={`${m.salesCount} invoices`} tone="blue" />
        <StatCard label="Total Sales" value={money(m.totalSales)} tone="green" />
        <StatCard label="Payments Received" value={money(m.totalReceived)} hint={`${money(m.paidAtSale)} at sale + ${money(m.collected)} collected`} tone="blue" />
        <StatCard label="Outstanding" value={money(s.outstandingBalance)} tone={s.outstandingBalance > 0 ? 'red' : 'green'} />
      </div>
      {Math.abs(m.computedOutstanding - s.outstandingBalance) > 0.01 && (
        <div className="mt-4"><ErrorBox text={`Balance check mismatch: records add up to ${money(m.computedOutstanding)}. Please review this account.`} /></div>
      )}

      <div className="mt-6 mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-gray-200/70 p-1">
          {[['ledger', 'Account Statement'], ['sales', 'Sales'], ['payments', 'Payments']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-md px-3 py-1.5 text-sm ${tab === k ? 'bg-white font-medium text-primary-800 shadow-sm' : 'text-gray-600'}`}>{l}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="input w-auto" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
          <span className="text-gray-400">–</span>
          <input type="date" className="input w-auto" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
        </div>
      </div>

      {tab === 'ledger' && <Ledger id={id} range={range} />}
      {tab === 'sales' && <ShopSales id={id} range={range} />}
      {tab === 'payments' && <ShopPayments id={id} range={range} />}

      {editing && <ShopForm initial={s} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); shop.reload(); }} />}
    </>
  );
}

const LEDGER_COLUMNS = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Details' },
  { key: 'debit', label: 'Supplied (Dr)', type: 'money' },
  { key: 'credit', label: 'Received (Cr)', type: 'money' },
  { key: 'runningBalance', label: 'Balance', type: 'money' },
];

function Ledger({ id, range }) {
  const { data, loading, error } = useApi(`/shops/${id}/ledger${qs(range)}`);
  if (loading && !data) return <Card><Loading /></Card>;
  if (error) return <ErrorBox text={error} />;

  const period = range.from || range.to ? `${range.from || 'start'} to ${range.to || 'today'}` : 'All time';
  const exportData = {
    title: `Account Statement - ${data.shop.name}`,
    subtitle: `${data.shop.city} · ${period} · Opening ${money(data.broughtForward)} · Closing ${money(data.closingBalance)}`,
    columns: LEDGER_COLUMNS,
    rows: [{ date: range.from || '', type: '', description: 'Balance brought forward', debit: '', credit: '', runningBalance: data.broughtForward }, ...data.entries],
    totals: { debit: data.totals.debit, credit: data.totals.credit, runningBalance: data.closingBalance },
  };

  return (
    <Card
      title={`Account Statement · ${period}`}
      actions={
        <div className="flex gap-2">
          <button className="btn-secondary px-2.5 py-1.5 text-xs" onClick={() => exportExcel(exportData)}><FileSpreadsheet size={14} /> Excel</button>
          <button className="btn-secondary px-2.5 py-1.5 text-xs" onClick={() => exportPdf(exportData)}><FileText size={14} /> PDF</button>
        </div>
      }
    >
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Date</th><th>Type</th><th>Details</th><th className="text-right">Supplied (Dr)</th><th className="text-right">Received (Cr)</th><th className="text-right">Balance</th></tr>
          </thead>
          <tbody>
            <tr className="bg-gray-50">
              <td colSpan={5} className="font-medium text-gray-600">Balance brought forward</td>
              <td className="text-right font-medium">{money(data.broughtForward)}</td>
            </tr>
            {data.entries.map((e) => (
              <tr key={e._id}>
                <td>{date(e.date)}</td>
                <td><span className={`badge ${e.type === 'Payment' ? 'bg-green-100 text-green-700' : e.type === 'Sale' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'}`}>{e.type}</span></td>
                <td className="max-w-md whitespace-normal">
                  {e.sale ? <Link to={`/sales/${e.sale._id}`} className="text-primary-700 hover:underline">{e.description}</Link> : e.description}
                </td>
                <td className="text-right">{e.debit ? money(e.debit) : ''}</td>
                <td className="text-right text-green-700">{e.credit ? money(e.credit) : ''}</td>
                <td className="text-right font-medium">{money(e.runningBalance)}</td>
              </tr>
            ))}
            {!data.entries.length && <tr><td colSpan={6} className="text-center text-gray-400">No transactions in this period.</td></tr>}
          </tbody>
          <tfoot>
            <tr className="bg-primary-50 font-semibold">
              <td colSpan={3} className="px-4 py-3">Closing balance</td>
              <td className="px-4 py-3 text-right">{money(data.totals.debit)}</td>
              <td className="px-4 py-3 text-right text-green-700">{money(data.totals.credit)}</td>
              <td className="px-4 py-3 text-right text-primary-800">{money(data.closingBalance)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

function ShopSales({ id, range }) {
  const { data, loading, error } = useApi(`/shops/${id}/sales${qs(range)}`);
  if (loading && !data) return <Card><Loading /></Card>;
  if (error) return <ErrorBox text={error} />;
  return (
    <Card>
      {data.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Invoice</th><th>Date</th><th className="text-right">Items</th><th className="text-right">Total</th><th className="text-right">Paid</th><th className="text-right">Credit</th><th>Status</th></tr></thead>
            <tbody>
              {data.map((s) => (
                <tr key={s._id}>
                  <td><Link to={`/sales/${s._id}`} className="font-medium text-primary-700 hover:underline">{s.invoiceNumber}</Link></td>
                  <td>{date(s.date)}</td>
                  <td className="text-right">{s.items.reduce((t, i) => t + i.quantity, 0)}</td>
                  <td className="text-right">{money(s.totalAmount)}</td>
                  <td className="text-right text-green-700">{money(s.paidAmount)}</td>
                  <td className="text-right text-red-600">{money(s.creditAmount)}</td>
                  <td><span className={`badge ${statusClass(s.paymentStatus)}`}>{s.paymentStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty text="No sales in this period." />}
    </Card>
  );
}

function ShopPayments({ id, range }) {
  const { data, loading, error } = useApi(`/shops/${id}/payments${qs(range)}`);
  if (loading && !data) return <Card><Loading /></Card>;
  if (error) return <ErrorBox text={error} />;
  return (
    <Card>
      {data.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th className="text-right">Amount</th><th>Method</th><th>Reference</th><th className="text-right">Balance After</th><th>Notes</th></tr></thead>
            <tbody>
              {data.map((p) => (
                <tr key={p._id}>
                  <td>{date(p.date)}</td>
                  <td className="text-right font-medium text-green-700">{money(p.amount)}</td>
                  <td>{p.method}</td>
                  <td>{p.referenceNumber || '—'}</td>
                  <td className="text-right">{money(p.remainingBalance)}</td>
                  <td className="max-w-xs truncate text-gray-500">{p.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty text="No payments in this period." />}
    </Card>
  );
}
