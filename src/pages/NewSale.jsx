import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Store,
  Calendar,
  Search,
  Check,
  ChevronRight,
  IceCreamCone,
  ShoppingBag,
  Sparkles,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../lib/useApi';
import { money, number, round2, isoDay, requestId, statusClass } from '../lib/format';
import { PageHeader, Card, Modal, Loading, ErrorBox, Field, useToast } from '../components/ui';

export default function NewSale() {
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const shops = useApi('/shops');
  const products = useApi('/products');

  const [shopId, setShopId] = useState(params.get('shop') || '');
  const [day, setDay] = useState(isoDay());
  const [lines, setLines] = useState([]); // { product, qty, sellPrice }
  const [paid, setPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reqId] = useState(requestId);

  // Search & Modal Dialog States for clean option choosing
  const [showShopModal, setShowShopModal] = useState(false);
  const [shopQuery, setShopQuery] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [productQuery, setProductQuery] = useState('');

  useEffect(() => {
    const s = params.get('shop');
    if (s) setShopId(s);
  }, [params]);

  const shop = shops.data?.find((s) => s._id === shopId);
  const productById = useMemo(() => Object.fromEntries((products.data || []).map((p) => [p._id, p])), [products.data]);
  const available = (products.data || []).filter((p) => !lines.some((l) => l.product === p._id));

  const filteredShops = useMemo(() => {
    const q = shopQuery.toLowerCase().trim();
    if (!q) return shops.data || [];
    return (shops.data || []).filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q))
    );
  }, [shops.data, shopQuery]);

  const filteredAvailableProducts = useMemo(() => {
    const q = productQuery.toLowerCase().trim();
    if (!q) return available;
    return available.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [available, productQuery]);

  const addLine = (id) => {
    const p = productById[id];
    if (!p) return;
    const unitPrice = p.price || 0;
    const defaultSell = p.discountedPrice != null ? p.discountedPrice : unitPrice;
    const defaultDiscount = round2(Math.max(0, unitPrice - defaultSell));
    setLines((ls) => [
      ...ls,
      {
        product: id,
        qty: '1',
        sellPrice: String(defaultSell),
        discount: defaultDiscount > 0 ? String(defaultDiscount) : '',
      },
    ]);
  };

  const updateQty = (i, val) => {
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, qty: val } : l)));
  };

  const updateDiscount = (i, val) => {
    const p = productById[lines[i].product];
    const unitPrice = p?.price || 0;
    if (val === '') {
      setLines((ls) =>
        ls.map((l, j) => (j === i ? { ...l, discount: '', sellPrice: String(unitPrice) } : l))
      );
      return;
    }
    const dVal = Number(val);
    const validD = isNaN(dVal) ? 0 : Math.max(0, dVal);
    const newSell = round2(Math.max(0, unitPrice - validD));
    setLines((ls) =>
      ls.map((l, j) => (j === i ? { ...l, discount: val, sellPrice: String(newSell) } : l))
    );
  };

  const updateSellPrice = (i, val) => {
    const p = productById[lines[i].product];
    const unitPrice = p?.price || 0;
    if (val === '') {
      setLines((ls) =>
        ls.map((l, j) => (j === i ? { ...l, sellPrice: '', discount: '' } : l))
      );
      return;
    }
    const sVal = Number(val);
    const validS = isNaN(sVal) ? unitPrice : Math.max(0, sVal);
    const newDiscount = round2(Math.max(0, unitPrice - validS));
    setLines((ls) =>
      ls.map((l, j) =>
        j === i
          ? {
              ...l,
              sellPrice: val,
              discount: newDiscount > 0 ? String(newDiscount) : '',
            }
          : l
      )
    );
  };

  const removeLine = (i) => setLines((ls) => ls.filter((_, j) => j !== i));

  // Calculations
  const rows = lines.map((l) => {
    const p = productById[l.product];
    const qty = Number(l.qty) || 0;
    const unitPrice = p?.price || 0;
    const sell = l.sellPrice === '' ? unitPrice : Number(l.sellPrice);
    const discount =
      l.discount !== '' && l.discount !== undefined
        ? Number(l.discount)
        : round2(Math.max(0, unitPrice - sell));
    let problem = '';
    if (!Number.isInteger(qty) || qty < 1) problem = 'Enter quantity';
    else if (p && qty > p.quantity) problem = `Only ${p.quantity} in stock`;
    else if (!Number.isFinite(sell) || sell < 0) problem = `Price cannot be negative`;
    else if (discount < 0) problem = `Discount cannot be negative`;
    return {
      ...l,
      p,
      qty,
      unitPrice,
      sell: isNaN(sell) ? unitPrice : sell,
      discount: isNaN(discount) ? 0 : Math.max(0, discount),
      lineTotal: round2((isNaN(sell) ? unitPrice : sell) * qty),
      problem,
    };
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
      <div className="mb-3 flex items-center justify-between">
        <Link
          to="/sales"
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 active:scale-95 transition"
        >
          <ArrowLeft size={14} /> Back to Sales
        </Link>
      </div>

      <PageHeader
        title="New Sale"
        subtitle="Create an invoice and supply products to a shop"
      />

      <ErrorBox text={error || shops.error || products.error} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {/* STEP 1: SHOP & DATE */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-[11px] font-bold text-white">
                  1
                </span>
                <span className="font-bold text-gray-900 text-sm">Customer Shop & Date</span>
              </div>
            }
            bodyClass="p-4 sm:p-5 space-y-4"
          >
            <div>
              <label className="label mb-1.5">Destination Shop *</label>
              {shop ? (
                <div className="flex items-center justify-between rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50/70 via-primary-50/40 to-white p-3.5 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white shadow-xs">
                      <Store size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{shop.name}</h4>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                        <span className="font-medium text-gray-600">{shop.city}</span>
                        {shop.phone && <span>· {shop.phone}</span>}
                        <span>·</span>
                        <span className={`font-semibold ${shop.outstandingBalance > 0 ? 'text-red-600' : 'text-green-700'}`}>
                          {shop.outstandingBalance > 0 ? `${money(shop.outstandingBalance)} Outstanding` : 'Zero Balance'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShopQuery('');
                      setShowShopModal(true);
                    }}
                    className="shrink-0 rounded-lg border border-primary-300 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50 active:scale-95 transition shadow-2xs"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShopQuery('');
                    setShowShopModal(true);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/20 p-3.5 text-left transition hover:border-primary-500 hover:bg-primary-50/50 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-800">
                      <Store size={20} />
                    </div>
                    <div>
                      <span className="text-xs text-primary-700 font-semibold block">Choose Customer</span>
                      <span className="text-sm font-bold text-gray-800">Select a Shop to Supply…</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-primary-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
                    Select <ChevronRight size={14} />
                  </span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-100">
              <Field label="Invoice Date">
                <input
                  type="date"
                  className="input font-medium"
                  value={day}
                  max={isoDay()}
                  onChange={(e) => setDay(e.target.value)}
                />
              </Field>
            </div>
          </Card>

          {/* STEP 2: PRODUCTS */}
          <Card
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-[11px] font-bold text-white">
                    2
                  </span>
                  <span className="font-bold text-gray-900 text-sm">Products & Quantities</span>
                </div>
                <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-700 border border-primary-200">
                  {rows.length} {rows.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            }
          >
            {/* Clean, high-converting product chooser bar */}
            <div className="p-3.5 sm:p-4 border-b border-gray-100 bg-gray-50/60 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setProductQuery('');
                  setShowProductModal(true);
                }}
                className="btn-primary w-full sm:w-auto text-sm py-2 px-4 shadow-sm inline-flex items-center justify-center gap-2"
              >
                <Plus size={17} strokeWidth={2.5} /> Browse & Add Products
              </button>
              <span className="text-xs text-gray-500 text-center sm:text-right font-medium">
                {available.length} varieties ready in stock
              </span>
            </div>

            {rows.length ? (
              <>
                {/* Mobile Item Cards */}
                <div className="divide-y divide-gray-100 sm:hidden">
                  {rows.map((r, i) => (
                    <div key={r.product} className="p-3.5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-gray-900 text-sm leading-tight">{r.p?.name}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span>MRP: <b className="text-gray-800">{money(r.unitPrice)}</b></span>
                            <span>·</span>
                            <span className={r.p?.quantity < 10 ? 'text-amber-600 font-semibold' : 'text-gray-500'}>
                              Stock: {number(r.p?.quantity)}
                            </span>
                          </div>
                          {r.problem && <p className="mt-1 text-xs font-semibold text-red-600">{r.problem}</p>}
                        </div>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 active:scale-90 transition shrink-0"
                          onClick={() => removeLine(i)}
                          title="Remove item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* 3-column input grid: QTY | DISCOUNT (₹) | SALE RATE (₹) */}
                      <div className="grid grid-cols-3 gap-2 bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Qty</label>
                          <div className="flex items-center">
                            <button
                              type="button"
                              className="flex h-9 w-7 shrink-0 items-center justify-center rounded-l-lg border border-r-0 border-gray-300 bg-white font-bold text-gray-700 active:bg-gray-100"
                              onClick={() => {
                                const current = Number(lines[i].qty) || 1;
                                if (current > 1) updateQty(i, String(current - 1));
                              }}
                            >
                              −
                            </button>
                            <input
                              className="h-9 w-full min-w-0 border-y border-gray-300 bg-white text-center text-xs font-bold text-gray-900 outline-none px-0.5"
                              type="number"
                              min="1"
                              step="1"
                              value={lines[i].qty}
                              onChange={(e) => updateQty(i, e.target.value)}
                            />
                            <button
                              type="button"
                              className="flex h-9 w-7 shrink-0 items-center justify-center rounded-r-lg border border-l-0 border-gray-300 bg-white font-bold text-gray-700 active:bg-gray-100"
                              onClick={() => {
                                const current = Number(lines[i].qty) || 0;
                                updateQty(i, String(current + 1));
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-semibold text-gray-500">Discount</label>
                            {r.discount > 0 && r.unitPrice > 0 && (
                              <span className="text-[10px] font-bold text-amber-700">
                                {Math.round((r.discount / r.unitPrice) * 100)}%
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <span className="absolute left-2 top-2 text-xs font-semibold text-gray-400">₹</span>
                            <input
                              className="input h-9 pl-5 pr-1 text-xs font-bold text-amber-900 bg-amber-50/40 border-amber-200 focus:border-amber-500"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              value={lines[i].discount ?? ''}
                              onChange={(e) => updateDiscount(i, e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Sale Rate</label>
                          <div className="relative">
                            <span className="absolute left-2 top-2 text-xs font-semibold text-gray-400">₹</span>
                            <input
                              className="input h-9 pl-5 pr-1 text-xs font-bold text-gray-900"
                              type="number"
                              min="0"
                              step="0.01"
                              value={lines[i].sellPrice}
                              onChange={(e) => updateSellPrice(i, e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-0.5 text-xs">
                        <span className="text-gray-500 font-medium">
                          {r.qty} × {money(r.sell)} {r.discount > 0 && <span className="text-amber-700 font-semibold">(Saved {money(r.discount * r.qty)})</span>}
                        </span>
                        <span className="font-bold text-sm text-gray-900">
                          Total: {money(r.lineTotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="text-right">Unit Rate</th>
                        <th className="text-center w-28">Qty</th>
                        <th className="w-32">Discount (₹)</th>
                        <th className="w-32">Sale Rate (₹)</th>
                        <th className="text-right">Total</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={r.product} className="align-middle">
                          <td>
                            <div className="font-bold text-gray-900">{r.p?.name}</div>
                            <div className="text-xs text-gray-400">In stock: {number(r.p?.quantity)}</div>
                            {r.problem && <div className="text-xs text-red-600 font-medium">{r.problem}</div>}
                          </td>
                          <td className="text-right font-medium text-gray-600">{money(r.unitPrice)}</td>
                          <td>
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                className="h-8 w-7 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 font-bold text-gray-600 hover:bg-gray-100"
                                onClick={() => {
                                  const current = Number(lines[i].qty) || 1;
                                  if (current > 1) updateQty(i, String(current - 1));
                                }}
                              >
                                −
                              </button>
                              <input
                                className="h-8 w-14 border-y border-gray-300 bg-white text-center text-xs font-bold text-gray-900 outline-none"
                                type="number"
                                min="1"
                                step="1"
                                value={lines[i].qty}
                                onChange={(e) => updateQty(i, e.target.value)}
                              />
                              <button
                                type="button"
                                className="h-8 w-7 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 font-bold text-gray-600 hover:bg-gray-100"
                                onClick={() => {
                                  const current = Number(lines[i].qty) || 0;
                                  updateQty(i, String(current + 1));
                                }}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="relative">
                              <span className="absolute left-2 top-1.5 text-xs font-semibold text-gray-400">₹</span>
                              <input
                                className="input h-8 pl-5 text-xs font-bold text-amber-900 bg-amber-50/40 border-amber-200"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0"
                                value={lines[i].discount ?? ''}
                                onChange={(e) => updateDiscount(i, e.target.value)}
                              />
                            </div>
                            {r.discount > 0 && r.unitPrice > 0 && (
                              <div className="text-[10px] text-amber-700 font-semibold mt-0.5 text-right">
                                {Math.round((r.discount / r.unitPrice) * 100)}% off
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="relative">
                              <span className="absolute left-2 top-1.5 text-xs font-semibold text-gray-400">₹</span>
                              <input
                                className="input h-8 pl-5 text-xs font-bold text-gray-900"
                                type="number"
                                min="0"
                                step="0.01"
                                value={lines[i].sellPrice}
                                onChange={(e) => updateSellPrice(i, e.target.value)}
                              />
                            </div>
                          </td>
                          <td className="text-right font-bold text-gray-900">{money(r.lineTotal)}</td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="rounded p-1.5 text-red-500 hover:bg-red-50 active:scale-90 transition"
                              onClick={() => removeLine(i)}
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-8 text-center space-y-2">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                  <ShoppingBag size={24} />
                </div>
                <p className="text-sm font-semibold text-gray-700">No products added yet</p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Click the button above to choose ice cream varieties and add them to this sale.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* STEP 3: PAYMENT & SUMMARY */}
        <div>
          <Card
            title={
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-[11px] font-bold text-white">
                  3
                </span>
                <span className="font-bold text-gray-900 text-sm">Payment & Bill Total</span>
              </div>
            }
            bodyClass="space-y-4 p-4 sm:p-5"
            className="xl:sticky xl:top-6"
          >
            <div className="rounded-xl bg-gray-50/80 p-3.5 border border-gray-100 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Sub Total</span><span className="font-semibold text-gray-800">{money(subTotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="text-amber-700 font-semibold">− {money(totalDiscount)}</span></div>
              <div className="flex justify-between border-t border-gray-200/80 pt-2 text-sm sm:text-base font-bold text-gray-900">
                <span>Grand Total</span>
                <span className="text-primary-800 text-lg">{money(total)}</span>
              </div>
            </div>

            <Field label="Paid Now (₹)">
              <input
                className="input text-base font-bold text-gray-900"
                type="number"
                min="0"
                step="0.01"
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
                placeholder="0"
              />
              {paidProblem && <span className="text-xs text-red-600 mt-1 block font-medium">{paidProblem}</span>}
            </Field>

            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary flex-1 py-1.5 text-xs font-semibold"
                onClick={() => setPaid(String(total))}
              >
                Full Paid ({money(total)})
              </button>
              <button
                type="button"
                className="btn-secondary flex-1 py-1.5 text-xs font-semibold"
                onClick={() => setPaid('0')}
              >
                Full Credit
              </button>
            </div>

            <div className="rounded-xl bg-primary-50/60 p-3.5 border border-primary-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Remaining Credit</span>
                <span className="font-bold text-red-600 text-sm">{money(Math.max(0, credit))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Payment Status</span>
                <span>{status && <span className={`badge ${statusClass(status)}`}>{status}</span>}</span>
              </div>
              {shop && (
                <div className="flex justify-between border-t border-primary-200/60 pt-2 font-medium">
                  <span className="text-gray-600">Shop Total Outstanding After</span>
                  <span className="font-bold text-gray-900 text-xs">
                    {money(shop.outstandingBalance + Math.max(0, credit))}
                  </span>
                </div>
              )}
            </div>

            <Field label="Invoice Notes">
              <textarea
                className="input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes or delivery remarks"
              />
            </Field>

            <button
              className="btn-primary w-full py-3 text-sm font-bold shadow-md active:scale-[0.98] transition"
              disabled={!canSave}
              onClick={save}
            >
              {busy ? 'Saving Invoice…' : 'Save & Generate Invoice'}
            </button>
          </Card>
        </div>
      </div>

      {/* SEARCHABLE SHOP SELECTION MODAL */}
      {showShopModal && (
        <Modal open title="Choose Destination Shop" onClose={() => setShowShopModal(false)}>
          <div className="space-y-3">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                className="input pl-10 text-sm"
                placeholder="Search shops by name, city or phone…"
                value={shopQuery}
                onChange={(e) => setShopQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-2xs">
              {filteredShops.map((s) => (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => {
                    setShopId(s._id);
                    setShowShopModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-3.5 text-left transition hover:bg-gray-50 active:bg-gray-100 ${
                    s._id === shopId ? 'bg-primary-50/70' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm truncate">{s.name}</span>
                      {s._id === shopId && (
                        <span className="rounded-full bg-primary-700 p-0.5 text-white">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                      <span className="font-medium text-gray-600">{s.city}</span>
                      {s.ownerName && <span>· {s.ownerName}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-bold block ${s.outstandingBalance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {money(s.outstandingBalance)}
                    </span>
                    <span className="text-[10px] text-gray-400">Outstanding</span>
                  </div>
                </button>
              ))}
              {!filteredShops.length && (
                <div className="p-8 text-center text-sm text-gray-400">
                  No shops match "{shopQuery}".
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* SEARCHABLE PRODUCT PICKER MODAL */}
      {showProductModal && (
        <Modal
          open
          wide
          title="Add Products to Sale"
          onClose={() => setShowProductModal(false)}
        >
          <div className="space-y-3">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                className="input pl-10 text-sm"
                placeholder="Search products by name…"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-2xs">
              {filteredAvailableProducts.map((p) => {
                const isOutOfStock = p.quantity === 0;
                return (
                  <div
                    key={p._id}
                    className="flex items-center justify-between p-3.5 hover:bg-gray-50/80 transition"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{p.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span className="font-semibold text-gray-800">
                          Rate: {money(p.discountedPrice != null ? p.discountedPrice : p.price)}
                        </span>
                        {p.discountedPrice != null && (
                          <span className="text-gray-400 line-through">
                            {money(p.price)}
                          </span>
                        )}
                        <span>·</span>
                        <span className={isOutOfStock ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                          {isOutOfStock ? 'Out of stock' : `${number(p.quantity)} in stock`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => addLine(p._id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <Plus size={14} strokeWidth={2.5} /> Add
                    </button>
                  </div>
                );
              })}

              {!filteredAvailableProducts.length && (
                <div className="p-8 text-center text-sm text-gray-400">
                  {available.length === 0
                    ? 'All available products have already been added to the invoice.'
                    : `No products match "${productQuery}".`}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-gray-500 font-medium">
                {lines.length} {lines.length === 1 ? 'item' : 'items'} in current invoice
              </span>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="btn-primary py-1.5 px-4 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
