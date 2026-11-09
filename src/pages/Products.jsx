import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, PackagePlus } from 'lucide-react';
import { api, qs } from '../lib/api';
import { useApi, useDebounced } from '../lib/useApi';
import { money, number, round2 } from '../lib/format';
import { PageHeader, Card, Modal, Loading, Empty, ErrorBox, Field, useToast } from '../components/ui';

const EMPTY = { name: '', price: '', discountPercent: '', quantity: '', description: '' };

const getInitialForm = (p) => {
  let discountPercent = p.discountPercent ?? '';
  if (discountPercent === '' && p.discountedPrice != null && p.price > 0 && p.discountedPrice < p.price) {
    discountPercent = Math.round(((p.price - p.discountedPrice) / p.price) * 100 * 10) / 10;
  }
  return { ...p, discountPercent };
};

export default function Products() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const { data: products, loading, error, reload } = useApi(`/products${qs({ search: debounced })}`);

  const [form, setForm] = useState(null); // product being added/edited
  const [stockFor, setStockFor] = useState(null);

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? Past sales will still show it.`)) return;
    try {
      await api.del(`/products/${p._id}`);
      toast('Product deleted');
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Purchase & Stock"
        subtitle="Ice cream varieties, purchase & sale rates and available stock"
        actions={
          <button className="btn-primary w-full sm:w-auto" onClick={() => setForm(EMPTY)}>
            <Plus size={16} /> Add Product
          </button>
        }
      />

      <Card>
        <div className="border-b border-gray-100 p-3.5 sm:p-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-gray-400 sm:top-2.5" />
            <input className="input pl-9" placeholder="Search by product name or description…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        {error && <div className="p-4"><ErrorBox text={error} /></div>}
        {loading && !products ? (
          <Loading />
        ) : products?.length ? (
          <>
            {/* Mobile Cards List */}
            <div className="divide-y divide-gray-100 sm:hidden">
              {products.map((p) => {
                const discPct = p.discountPercent != null
                  ? p.discountPercent
                  : p.discountedPrice != null && p.price > 0 && p.discountedPrice < p.price
                  ? Math.round(((p.price - p.discountedPrice) / p.price) * 100)
                  : null;

                return (
                  <div key={p._id} className="p-3.5 space-y-2.5 hover:bg-gray-50/60 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 text-sm">{p.name}</div>
                        {p.description && (
                          <div className="text-xs text-gray-400 truncate">{p.description}</div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Sale Rate</div>
                        <div className="font-bold text-gray-900 text-sm">
                          {p.discountedPrice != null ? money(p.discountedPrice) : money(p.price)}
                        </div>
                        {discPct != null && (
                          <div className="text-xs text-amber-700 font-medium">
                            <span className="line-through text-gray-400 mr-1">{money(p.price)}</span>
                            <span>{discPct}% off</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                        p.quantity === 0
                          ? 'bg-red-100 text-red-700'
                          : p.quantity < 20
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        Stock: {number(p.quantity)} units
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          title="Manage stock"
                          className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100 active:scale-95"
                          onClick={() => setStockFor(p)}
                        >
                          <PackagePlus size={14} /> Stock
                        </button>
                        <button
                          title="Edit"
                          className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 active:scale-95"
                          onClick={() => setForm(getInitialForm(p))}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          title="Delete"
                          className="rounded-lg border border-gray-200 p-1.5 text-red-500 hover:bg-red-50 active:scale-95"
                          onClick={() => remove(p)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-right">Purchase / Sale Rate</th>
                    <th className="text-right">Discount (%)</th>
                    <th className="text-right">Stock</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const discPct = p.discountPercent != null
                      ? p.discountPercent
                      : p.discountedPrice != null && p.price > 0 && p.discountedPrice < p.price
                      ? Math.round(((p.price - p.discountedPrice) / p.price) * 100)
                      : null;

                    return (
                      <tr key={p._id}>
                        <td>
                          <div className="font-medium text-gray-900">{p.name}</div>
                          {p.description && <div className="max-w-xs truncate text-xs text-gray-400">{p.description}</div>}
                        </td>
                        <td className="text-right font-medium">{money(p.price)}</td>
                        <td className="text-right">
                          {discPct != null ? (
                            <div>
                              <span className="font-semibold text-amber-700">{discPct}%</span>
                              {p.discountedPrice != null && (
                                <div className="text-[11px] text-gray-400">({money(p.discountedPrice)})</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className={`text-right font-semibold ${p.quantity === 0 ? 'text-red-600' : p.quantity < 20 ? 'text-amber-600' : ''}`}>
                          {number(p.quantity)}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <button title="Manage stock" className="rounded p-1.5 text-primary-700 hover:bg-primary-50" onClick={() => setStockFor(p)}>
                              <PackagePlus size={16} />
                            </button>
                            <button title="Edit" className="rounded p-1.5 text-gray-500 hover:bg-gray-100" onClick={() => setForm(getInitialForm(p))}>
                              <Pencil size={16} />
                            </button>
                            <button title="Delete" className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => remove(p)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <Empty text={search ? 'No products match.' : 'No products yet. Add your first product.'} />
        )}
      </Card>

      {form && (
        <ProductForm
          initial={form}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); reload(); }}
        />
      )}
      {stockFor && <StockForm product={stockFor} onClose={() => setStockFor(null)} onSaved={() => { setStockFor(null); reload(); }} />}
    </>
  );
}

function ProductForm({ initial, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(initial._id);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const priceNum = Number(f.price) || 0;
  const pctNum = f.discountPercent === '' ? 0 : Number(f.discountPercent) || 0;
  const computedDiscounted = pctNum > 0 ? round2(priceNum * (1 - pctNum / 100)) : null;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = {
        name: f.name,
        price: f.price,
        discountPercent: f.discountPercent === '' ? null : Number(f.discountPercent),
        description: f.description,
      };
      if (isEdit) await api.put(`/products/${initial._id}`, body);
      else await api.post('/products', { ...body, quantity: f.quantity || 0 });
      toast(isEdit ? 'Product updated' : 'Product added');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open title={isEdit ? 'Edit Product' : 'Add Product'} onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><ErrorBox text={error} /></div>
        <Field label="Product Name *" className="sm:col-span-2">
          <input className="input" value={f.name} onChange={set('name')} required autoFocus placeholder="e.g. Lazza Vanilla Cup 1L" />
        </Field>
        <Field label="Purchase / Sale Rate (₹) *">
          <input className="input" type="number" min="0" step="0.01" value={f.price} onChange={set('price')} required placeholder="0.00" />
        </Field>
        <Field label="Discount (%)">
          <div className="relative">
            <input
              className="input pr-8"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={f.discountPercent}
              onChange={set('discountPercent')}
              placeholder="0"
            />
            <span className="absolute right-3 top-2.5 sm:top-2 text-sm font-semibold text-gray-400">%</span>
          </div>
        </Field>

        {priceNum > 0 && pctNum > 0 && computedDiscounted !== null && (
          <div className="sm:col-span-2 rounded-lg bg-green-50 px-3.5 py-2.5 text-xs text-green-800 font-medium flex items-center justify-between border border-green-200">
            <span>Effective Rate after {pctNum}% off: <b className="text-sm">{money(computedDiscounted)}</b></span>
            <span className="text-green-600">Save {money(round2(priceNum - computedDiscounted))} / unit</span>
          </div>
        )}

        {isEdit ? (
          <div className="sm:col-span-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Current stock: <b>{number(initial.quantity)}</b>. Use the stock button in the list to add or adjust stock.
          </div>
        ) : (
          <Field label="Opening Stock (units)" className="sm:col-span-2">
            <input className="input" type="number" min="0" step="1" value={f.quantity} onChange={set('quantity')} placeholder="0" />
          </Field>
        )}
        <Field label="Description" className="sm:col-span-2">
          <textarea className="input" rows={2} value={f.description} onChange={set('description')} placeholder="Optional description or packing details" />
        </Field>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

function StockForm({ product, onClose, onSaved }) {
  const toast = useToast();
  const [mode, setMode] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const q = Number(quantity) || 0;
  const after = mode === 'add' ? product.quantity + q : mode === 'remove' ? product.quantity - q : q;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.patch(`/products/${product._id}/stock`, { mode, quantity: Number(quantity) });
      toast('Stock updated');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open title={`Manage Stock – ${product.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox text={error} />
        <div className="rounded-lg bg-primary-50 px-4 py-3 text-sm">
          Available now: <b className="text-primary-800">{number(product.quantity)} units</b>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[['add', 'Add stock'], ['remove', 'Remove'], ['set', 'Set exact']].map(([k, l]) => (
            <button type="button" key={k} onClick={() => setMode(k)}
              className={`rounded-lg border px-3 py-2 text-sm ${mode === k ? 'border-primary-700 bg-primary-700 text-white' : 'border-gray-300 bg-white'}`}>
              {l}
            </button>
          ))}
        </div>
        <Field label="Quantity (units)">
          <input className="input" type="number" min="0" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required autoFocus />
        </Field>
        <p className={`text-sm ${after < 0 ? 'text-red-600' : 'text-gray-600'}`}>Stock after update: <b>{number(after)}</b></p>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy || after < 0 || quantity === ''}>{busy ? 'Saving…' : 'Update Stock'}</button>
        </div>
      </form>
    </Modal>
  );
}
