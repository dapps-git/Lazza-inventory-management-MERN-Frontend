import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../lib/useApi';
import { money, number, round2, isoDay, requestId, statusClass } from '../lib/format';
import { PageHeader, Card, Loading, ErrorBox, Field, useToast } from '../components/ui';

export default function NewSale() {
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const shops = useApi('/shops');
  const products = useApi('/products');

  const [shopId, setShopId] = useState(params.get('shop') || '');
  const [day, setDay] = useState(isoDay());
  const [pick, setPick] = useState('');
  const [lines, setLines] = useState([]); // { product, qty, sellPrice }
  const [paid, setPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // One id per form: if the save is clicked twice or retried, the server returns the same sale
  const [reqId] = useState(requestId);

  const shop = shops.data?.find((s) => s._id === shopId);
  const productById = useMemo(() => Object.fromEntries((products.data || []).map((p) => [p._id, p])), [products.data]);
  const available = (products.data || []).filter((p) => !lines.some((l) => l.product === p._id));

  const addLine = (id) => {
    const p = productById[id];
    if (!p) return;
    setLines((ls) => [...ls, { product: id, qty: '1', sellPrice: String(p.discountedPrice ?? p.price) }]);
    setPick('');
  };
  const update = (i, k, v) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  const removeLine = (i) => setLines((ls) => ls.filter((_, j) => j !== i));

  // Calculations
  const rows = lines.map((l) => {
    const p = productById[l.product];
    const qty = Number(l.qty) || 0;
    const unitPrice = p?.price || 0;
    const sell = l.sellPrice === '' ? unitPrice : Number(l.sellPrice);
    const discount = round2(unitPrice - sell);
    let problem = '';
    if (!Number.isInteger(qty) || qty < 1) problem = 'Enter quantity';
    else if (p && qty > p.quantity) problem = `Only ${p.quantity} in stock`;
    else if (!Number.isFinite(sell) || sell < 0 || sell > unitPrice) problem = `Price must be ₹0 – ₹${unitPrice}`;
    return { ...l, p, qty, unitPrice, sell, discount, lineTotal: round2(sell * qty), problem };
  });
  const subTotal = round2(rows.reduce((t, r) => t + r.unitPrice * r.qty, 0));
  const totalDiscount = round2(rows.reduce((t, r) => t + Math.max(0, r.discount) * r.qty, 0));
  const total = round2(rows.reduce((t, r) => t + r.lineTotal, 0));
  const paidNum = paid === '' ? 0 : round2(paid);
  const credit = round2(total - paidNum);
  const status = total > 0 ? (credit <= 0 ? 'Paid' : paidNum <= 0 ? 'Credit' : 'Partial') : '';
  const paidProblem = paidNum < 0 ? 'Cannot be negative' : paidNum > total ? 'More than the bill total' : '';
  const canSave = shopId && rows.length && !rows.some((r) => r.problem) && !paidProblem && !busy;

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/sales', {
        shop: shopId,
        date: day,
        items: rows.map((r) => ({ product: r.product, quantity: r.qty, discount: Math.max(0, r.discount) })),
        paidAmount: paidNum,
        notes,
        clientRequestId: reqId,
      });
      toast(res.duplicate ? 'This sale was already saved' : `Sale ${res.sale.invoiceNumber} saved`);
      navigate(`/sales/${res.sale._id}`, { replace: true });
    } catch (e) {
      setError(e.message);
      products.reload(); // stock may have changed
    } finally {
      setBusy(false);
    }
  };

  if ((shops.loading && !shops.data) || (products.loading && !products.data)) return <Loading />;

  return (
    <>
      <Link to="/sales" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-700"><ArrowLeft size={14} /> Sales</Link>
      <PageHeader title="New Sale" subtitle="Supply products to a shop" />
      <ErrorBox text={error || shops.error || products.error} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="1. Shop & date" bodyClass="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
            <Field label="Shop *" className="sm:col-span-2">
              <select className="input" value={shopId} onChange={(e) => setShopId(e.target.value)}>
                <option value="">Select a shop…</option>
                {shops.data?.map((s) => <option key={s._id} value={s._id}>{s.name} – {s.city}</option>)}
              </select>
            </Field>
            <Field label="Date">
              <input type="date" className="input" value={day} max={isoDay()} onChange={(e) => setDay(e.target.value)} />
            </Field>
            {shop && (
              <div className="rounded-lg bg-primary-50 px-3 py-2 text-sm sm:col-span-3">
                Current outstanding for <b>{shop.name}</b>: <b className={shop.outstandingBalance > 0 ? 'text-red-600' : 'text-green-700'}>{money(shop.outstandingBalance)}</b>
              </div>
            )}
          </Card>

          <Card title="2. Products">
            <div className="flex flex-col gap-2 border-b border-gray-100 p-4 sm:flex-row">
              <select className="input" value={pick} onChange={(e) => setPick(e.target.value)}>
                <option value="">Choose a product to add…</option>
                {available.map((p) => (
                  <option key={p._id} value={p._id} disabled={p.quantity === 0}>
                    {p.name} ({p.category?.name}) – {money(p.price)} – stock {p.quantity}
                  </option>
                ))}
              </select>
              <button className="btn-primary shrink-0" disabled={!pick} onClick={() => addLine(pick)}><Plus size={16} /> Add</button>
            </div>
            {rows.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Product</th><th className="text-right">Unit Price</th><th>Qty</th><th>Selling Price</th><th className="text-right">Discount</th><th className="text-right">Total</th><th></th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.product} className="align-top">
                        <td>
                          <div className="font-medium">{r.p?.name}</div>
                          <div className="text-xs text-gray-400">In stock: {number(r.p?.quantity)}</div>
                          {r.problem && <div className="text-xs text-red-600">{r.problem}</div>}
                        </td>
                        <td className="text-right">{money(r.unitPrice)}</td>
                        <td><input className="input w-20" type="number" min="1" step="1" value={lines[i].qty} onChange={(e) => update(i, 'qty', e.target.value)} /></td>
                        <td><input className="input w-24" type="number" min="0" step="0.01" value={lines[i].sellPrice} onChange={(e) => update(i, 'sellPrice', e.target.value)} /></td>
                        <td className="text-right text-amber-700">{r.discount > 0 ? money(r.discount * r.qty) : '—'}</td>
                        <td className="text-right font-medium">{money(r.lineTotal)}</td>
                        <td><button className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => removeLine(i)}><Trash2 size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-6 text-center text-sm text-gray-400">No products added yet.</p>
            )}
          </Card>
        </div>

        <div>
          <Card title="3. Payment" bodyClass="space-y-4 p-4" className="xl:sticky xl:top-6">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Sub total</dt><dd>{money(subTotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Discount</dt><dd className="text-amber-700">− {money(totalDiscount)}</dd></div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-semibold"><dt>Total Amount</dt><dd>{money(total)}</dd></div>
            </dl>
            <Field label="Paid Amount (₹)">
              <input className="input" type="number" min="0" step="0.01" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0" />
              {paidProblem && <span className="text-xs text-red-600">{paidProblem}</span>}
            </Field>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary flex-1 px-2 text-xs" onClick={() => setPaid(String(total))}>Full payment</button>
              <button type="button" className="btn-secondary flex-1 px-2 text-xs" onClick={() => setPaid('0')}>Full credit</button>
            </div>
            <dl className="space-y-2 rounded-lg bg-gray-50 p-3 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Remaining credit</dt><dd className="font-semibold text-red-600">{money(Math.max(0, credit))}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Payment status</dt><dd>{status && <span className={`badge ${statusClass(status)}`}>{status}</span>}</dd></div>
              {shop && (
                <div className="flex justify-between border-t border-gray-200 pt-2"><dt className="text-gray-500">Shop outstanding after</dt><dd className="font-semibold">{money(shop.outstandingBalance + Math.max(0, credit))}</dd></div>
              )}
            </dl>
            <Field label="Notes"><textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
            <button className="btn-primary w-full py-2.5" disabled={!canSave} onClick={save}>{busy ? 'Saving…' : 'Save Sale'}</button>
          </Card>
        </div>
      </div>
    </>
  );
}
