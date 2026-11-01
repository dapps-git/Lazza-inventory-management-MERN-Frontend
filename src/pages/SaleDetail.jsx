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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link to="/sales" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-700"><ArrowLeft size={14} /> Sales</Link>
        <div className="flex gap-2">
          {s.shop && s.shop.outstandingBalance > 0 && (
            <Link to={`/payments?shop=${s.shop._id}`} className="btn-secondary"><Wallet size={16} /> Collect Payment</Link>
          )}
          <button className="btn-primary" onClick={() => window.print()}><Printer size={16} /> Print</button>
        </div>
      </div>

      <div className="card mx-auto max-w-3xl p-6 sm:p-8 print:border-0 print:shadow-none">
        <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row">
          <div>
            <p className="text-lg font-bold text-primary-800">Lazza Ice Cream Distributor</p>
            <p className="text-xs text-gray-500">Sales Invoice</p>
          </div>
          <div className="sm:text-right">
            <p className="text-lg font-semibold">{s.invoiceNumber}</p>
            <p className="text-sm text-gray-500">{dateTime(s.date)}</p>
            <span className={`badge mt-1 ${statusClass(s.paymentStatus)}`}>{s.paymentStatus}</span>
          </div>
        </div>

        <div className="py-5 text-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">Supplied to</p>
          <p className="font-semibold">
            {s.shop ? <Link to={`/shops/${s.shop._id}`} className="hover:text-primary-700">{s.shopName}</Link> : s.shopName}
          </p>
          {s.shop && (
            <p className="text-gray-500">
              {[s.shop.ownerName, s.shop.phone, s.shop.address, s.shop.city].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        <div className="table-wrap">
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

        <div className="mt-5 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Sub total</span><span>{money(s.subTotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Discount</span><span>− {money(s.totalDiscount)}</span></div>
          <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold"><span>Total Amount</span><span>{money(s.totalAmount)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Paid Amount</span><span className="text-green-700">{money(s.paidAmount)}</span></div>
          <div className="flex justify-between font-semibold"><span>Remaining Credit</span><span className="text-red-600">{money(s.creditAmount)}</span></div>
        </div>
        {s.notes && <p className="mt-5 border-t border-gray-100 pt-3 text-sm text-gray-500">Notes: {s.notes}</p>}
      </div>
    </>
  );
}
