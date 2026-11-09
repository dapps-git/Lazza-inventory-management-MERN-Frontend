import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Wallet } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { money, dateTime, statusClass } from '../lib/format';
import { Loading, ErrorBox } from '../components/ui';

export default function SaleDetail() {
  const { id } = useParams();
  const { data: s, loading, error } = useApi(`/sales/${id}`);
  if (loading && !s) return <Loading />;
  if (error) return <ErrorBox text={error} />;

  return (
    <>
      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Link to="/sales" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary-700">
          <ArrowLeft size={16} /> Back to Sales
        </Link>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {s.shop && s.shop.outstandingBalance > 0 && (
            <Link to={`/payments?shop=${s.shop._id}`} className="btn-secondary flex-1 sm:flex-none">
              <Wallet size={16} /> Collect
            </Link>
          )}
          <button className="btn-primary flex-1 sm:flex-none" onClick={() => window.print()}>
            <Printer size={16} /> Print Invoice
          </button>
        </div>
      </div>

      <div className="card mx-auto max-w-3xl p-4 sm:p-8 print:border-0 print:shadow-none">
        <div className="flex flex-col justify-between gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-start sm:pb-5">
          <div>
            <p className="text-lg font-bold text-primary-800">Lazza Ice Cream Distributor</p>
            <p className="text-xs text-gray-500">Sales Invoice</p>
          </div>
          <div className="sm:text-right">
            <p className="text-lg font-bold text-gray-900">{s.invoiceNumber}</p>
            <p className="text-xs sm:text-sm text-gray-500">{dateTime(s.date)}</p>
            <span className={`badge mt-1.5 ${statusClass(s.paymentStatus)}`}>{s.paymentStatus}</span>
          </div>
        </div>

        <div className="py-4 text-xs sm:text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Supplied to</p>
          <p className="text-sm sm:text-base font-bold text-gray-900 mt-0.5">
            {s.shop ? <Link to={`/shops/${s.shop._id}`} className="hover:text-primary-700">{s.shopName}</Link> : s.shopName}
          </p>
          {s.shop && (
            <p className="text-gray-500 mt-0.5">
              {[s.shop.ownerName, s.shop.phone, s.shop.address, s.shop.city].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Mobile items list */}
        <div className="divide-y divide-gray-100 sm:hidden print:hidden border-y border-gray-200">
          {s.items.map((i, n) => (
            <div key={n} className="py-2.5 flex items-center justify-between text-xs">
              <div className="min-w-0 pr-2">
                <span className="font-semibold text-gray-900 block truncate">{n + 1}. {i.productName}</span>
                <span className="text-gray-400">{i.quantity} × {money(i.unitPrice)}{i.discount ? ` (-${money(i.discount)} off)` : ''}</span>
              </div>
              <span className="font-bold text-gray-900 shrink-0">{money(i.lineTotal)}</span>
            </div>
          ))}
        </div>

        {/* Desktop / Print Table */}
        <div className="hidden sm:block print:block table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Product</th><th className="text-right">Qty</th><th className="text-right">Unit Price</th><th className="text-right">Discount / unit</th><th className="text-right">Amount</th></tr>
            </thead>
            <tbody>
              {s.items.map((i, n) => (
                <tr key={n}>
                  <td>{n + 1}</td>
                  <td>{i.productName}</td>
                  <td className="text-right">{i.quantity}</td>
                  <td className="text-right">{money(i.unitPrice)}</td>
                  <td className="text-right">{i.discount ? money(i.discount) : '—'}</td>
                  <td className="text-right font-medium">{money(i.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 sm:ml-auto sm:max-w-xs space-y-2 text-xs sm:text-sm bg-gray-50/70 p-3 sm:bg-transparent sm:p-0 rounded-xl">
          <div className="flex justify-between"><span className="text-gray-500">Sub total</span><span>{money(s.subTotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Discount</span><span>− {money(s.totalDiscount)}</span></div>
          <div className="flex justify-between border-t border-gray-200 pt-2 text-sm sm:text-base font-bold"><span>Total Amount</span><span>{money(s.totalAmount)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Paid Amount</span><span className="text-green-700 font-medium">{money(s.paidAmount)}</span></div>
          <div className="flex justify-between font-bold"><span>Remaining Credit</span><span className="text-red-600">{money(s.creditAmount)}</span></div>
        </div>
        {s.notes && <p className="mt-4 border-t border-gray-100 pt-3 text-xs sm:text-sm text-gray-500">Notes: {s.notes}</p>}
      </div>
    </>
  );
}
