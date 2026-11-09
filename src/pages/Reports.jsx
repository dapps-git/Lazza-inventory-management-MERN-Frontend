import { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { qs } from '../lib/api';
import { useApi } from '../lib/useApi';
import { money, number, date, isoDay, firstOfMonth } from '../lib/format';
import { exportExcel, exportPdf } from '../lib/exporters';
import { PageHeader, Card, Loading, Empty, ErrorBox } from '../components/ui';

const REPORTS = [
  { id: 'daily', label: 'Daily Sales', type: 'sales', group: 'day', dated: true },
  { id: 'weekly', label: 'Weekly Sales', type: 'sales', group: 'week', dated: true },
  { id: 'monthly', label: 'Monthly Sales', type: 'sales', group: 'month', dated: true },
  { id: 'shop-sales', label: 'Shop-wise Sales', type: 'shop-sales', dated: true },
  { id: 'product-sales', label: 'Product-wise Sales', type: 'product-sales', dated: true },
  { id: 'stock', label: 'Available Stock', type: 'stock', dated: false },
  { id: 'outstanding', label: 'Shop-wise Outstanding Credit', type: 'outstanding', dated: false },
  { id: 'collections', label: 'Payment Collections', type: 'collections', dated: true },
];

const fmt = (col, v) => {
  if (v === '' || v === null || v === undefined) return '—';
  if (col.type === 'money') return money(v);
  if (col.type === 'number') return number(v);
  if (col.type === 'date') return date(v);
  return v;
};

export default function Reports() {
  const [reportId, setReportId] = useState('daily');
  const [range, setRange] = useState({ from: firstOfMonth(), to: isoDay() });
  const r = REPORTS.find((x) => x.id === reportId);
  const params = r.dated ? { ...range, group: r.group } : {};
  const { data, loading, error } = useApi(`/reports/${r.type}${qs(params)}`);

  const subtitle = r.dated
    ? `Period: ${range.from || 'beginning'} to ${range.to || 'today'}`
    : `As on ${new Date().toLocaleDateString('en-IN')}`;
  const exportArgs = data && { title: `${r.label} Report`, subtitle, columns: data.columns, rows: data.rows, totals: data.totals };

  return (
    <>
      <PageHeader title="Reports" subtitle="Filter by date and download as Excel or PDF" />

      {/* Swipeable report category pills on mobile */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5 -mx-3.5 px-3.5 sm:mx-0 sm:px-0 sm:flex-wrap">
        {REPORTS.map((x) => (
          <button
            key={x.id}
            onClick={() => setReportId(x.id)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs sm:text-sm font-medium transition active:scale-95 ${
              x.id === reportId
                ? 'border-primary-700 bg-primary-700 text-white shadow-xs'
                : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <Card
        title={r.label}
        actions={
          <div className="flex gap-1.5">
            <button className="btn-secondary px-2.5 py-1.5 text-xs" disabled={!data?.rows.length} onClick={() => exportExcel(exportArgs)}>
              <FileSpreadsheet size={14} /> <span className="hidden xs:inline">Excel</span>
            </button>
            <button className="btn-secondary px-2.5 py-1.5 text-xs" disabled={!data?.rows.length} onClick={() => exportPdf(exportArgs)}>
              <FileText size={14} /> <span className="hidden xs:inline">PDF</span>
            </button>
          </div>
        }
      >
        {r.dated && (
          <div className="flex flex-col gap-3 border-b border-gray-100 p-3.5 sm:p-4 sm:flex-row sm:items-end">
            <div className="grid grid-cols-2 gap-2 flex-1">
              <label className="block"><span className="label">From</span><input type="date" className="input" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></label>
              <label className="block"><span className="label">To</span><input type="date" className="input" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></label>
            </div>
            <div className="flex gap-1.5">
              <button className="btn-secondary flex-1 sm:flex-none px-2.5 py-1.5 text-xs" onClick={() => setRange({ from: isoDay(), to: isoDay() })}>Today</button>
              <button className="btn-secondary flex-1 sm:flex-none px-2.5 py-1.5 text-xs" onClick={() => setRange({ from: firstOfMonth(), to: isoDay() })}>This month</button>
              <button className="btn-secondary flex-1 sm:flex-none px-2.5 py-1.5 text-xs" onClick={() => setRange({ from: '', to: '' })}>All time</button>
            </div>
          </div>
        )}
        {error && <div className="p-4"><ErrorBox text={error} /></div>}
        {loading && !data ? (
          <Loading />
        ) : data?.rows.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>{data.columns.map((c) => <th key={c.key} className={c.type === 'money' || c.type === 'number' ? 'text-right' : ''}>{c.label}</th>)}</tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i}>
                    {data.columns.map((c) => (
                      <td key={c.key} className={c.type === 'money' || c.type === 'number' ? 'text-right' : ''}>{fmt(c, row[c.key])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-primary-50 font-semibold">
                  {data.columns.map((c, i) => (
                    <td key={c.key} className={`px-4 py-3 ${c.type === 'money' || c.type === 'number' ? 'text-right' : ''}`}>
                      {i === 0 ? 'Total' : data.totals[c.key] !== undefined ? fmt(c, data.totals[c.key]) : ''}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <Empty text="No data for this report and period." />
        )}
      </Card>
    </>
  );
}
