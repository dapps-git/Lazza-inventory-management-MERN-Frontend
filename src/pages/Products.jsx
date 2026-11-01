import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, PackagePlus, Tags } from 'lucide-react';
import { api, qs } from '../lib/api';
import { useApi, useDebounced } from '../lib/useApi';
import { money, number } from '../lib/format';
import { PageHeader, Card, Modal, Loading, Empty, ErrorBox, Field, useToast } from '../components/ui';

const EMPTY = { name: '', brand: 'Lazza', category: '', price: '', quantity: '', discountedPrice: '', description: '' };

export default function Products() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const debounced = useDebounced(search);
  const { data: products, loading, error, reload } = useApi(`/products${qs({ search: debounced, category })}`);
  const cats = useApi('/categories');

  const [form, setForm] = useState(null); // product being added/edited
  const [stockFor, setStockFor] = useState(null);
  const [showCats, setShowCats] = useState(false);

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? Past sales will still show it.`)) return;
    try {
      await api.del(`/products/${p._id}`);
      toast('Product deleted');
      reload();
      cats.reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Products & Stock"
        subtitle="Ice cream varieties, prices and available stock"
        actions={
          <>
            <button className="btn-secondary" onClick={() => setShowCats(true)}>
              <Tags size={16} /> Categories
            </button>
            <button className="btn-primary" onClick={() => setForm(EMPTY)}>
              <Plus size={16} /> Add Product
            </button>
          </>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input className="input pl-9" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input sm:w-56" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {cats.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        {error && <div className="p-4"><ErrorBox text={error} /></div>}
        {loading && !products ? (
          <Loading />
        ) : products?.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th className="text-right">Price</th>
                  <th className="text-right">Disc. Price</th><th className="text-right">Stock</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="max-w-xs truncate text-xs text-gray-400">{p.brand}{p.description ? ` · ${p.description}` : ''}</div>
                    </td>
                    <td>{p.category?.name}</td>
                    <td className="text-right">{money(p.price)}</td>
                    <td className="text-right">{p.discountedPrice != null ? money(p.discountedPrice) : '—'}</td>
                    <td className={`text-right font-semibold ${p.quantity === 0 ? 'text-red-600' : p.quantity < 20 ? 'text-amber-600' : ''}`}>
                      {number(p.quantity)}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button title="Manage stock" className="rounded p-1.5 text-primary-700 hover:bg-primary-50" onClick={() => setStockFor(p)}>
                          <PackagePlus size={16} />
                        </button>
                        <button title="Edit" className="rounded p-1.5 text-gray-500 hover:bg-gray-100" onClick={() => setForm({ ...p, category: p.category?._id || '', discountedPrice: p.discountedPrice ?? '' })}>
                          <Pencil size={16} />
                        </button>
                        <button title="Delete" className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => remove(p)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text={search || category ? 'No products match.' : 'No products yet. Add your first product.'} />
        )}
      </Card>

      {form && (
        <ProductForm
          initial={form}
          categories={cats.data || []}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); reload(); cats.reload(); }}
        />
      )}
      {stockFor && <StockForm product={stockFor} onClose={() => setStockFor(null)} onSaved={() => { setStockFor(null); reload(); }} />}
      {showCats && <Categories categories={cats} onClose={() => setShowCats(false)} onChanged={reload} />}
    </>
  );
}

function ProductForm({ initial, categories, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(initial._id);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = {
        name: f.name, brand: f.brand, category: f.category, price: f.price,
        discountedPrice: f.discountedPrice, description: f.description,
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
          <input className="input" value={f.name} onChange={set('name')} required autoFocus />
        </Field>
        <Field label="Brand"><input className="input" value={f.brand} onChange={set('brand')} /></Field>
        <Field label="Category *">
          <select className="input" value={f.category} onChange={set('category')} required>
            <option value="">Select…</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Price (₹) *"><input className="input" type="number" min="0" step="0.01" value={f.price} onChange={set('price')} required /></Field>
        <Field label="Discounted Price (₹)"><input className="input" type="number" min="0" step="0.01" value={f.discountedPrice} onChange={set('discountedPrice')} placeholder="Optional" /></Field>
        {isEdit ? (
          <div className="sm:col-span-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Current stock: <b>{number(initial.quantity)}</b>. Use the stock button in the list to add or adjust stock.
          </div>
        ) : (
          <Field label="Opening Stock (units)"><input className="input" type="number" min="0" step="1" value={f.quantity} onChange={set('quantity')} placeholder="0" /></Field>
        )}
        <Field label="Description" className="sm:col-span-2">
          <textarea className="input" rows={2} value={f.description} onChange={set('description')} />
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

function Categories({ categories, onClose, onChanged }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const run = async (fn, msg) => {
    setError('');
    try {
      await fn();
      toast(msg);
      categories.reload();
      onChanged();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };

  return (
    <Modal open title="Product Categories" onClose={onClose}>
      <ErrorBox text={error} />
      <form
        className="mb-4 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run(() => api.post('/categories', { name }), 'Category added')) setName('');
        }}
      >
        <input className="input" placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} required />
        <button className="btn-primary shrink-0"><Plus size={16} /> Add</button>
      </form>
      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
        {categories.data?.map((c) => (
          <li key={c._id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
            {editing?._id === c._id ? (
              <form
                className="flex flex-1 gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await run(() => api.put(`/categories/${c._id}`, { name: editing.name }), 'Category renamed')) setEditing(null);
                }}
              >
                <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
                <button className="btn-primary">Save</button>
                <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              </form>
            ) : (
              <>
                <span>{c.name} <span className="text-xs text-gray-400">({c.productCount} products)</span></span>
                <span className="flex gap-1">
                  <button className="rounded p-1.5 text-gray-500 hover:bg-gray-100" onClick={() => setEditing({ _id: c._id, name: c.name })}><Pencil size={14} /></button>
                  <button
                    className="rounded p-1.5 text-red-500 hover:bg-red-50"
                    onClick={() => window.confirm(`Delete category "${c.name}"?`) && run(() => api.del(`/categories/${c._id}`), 'Category deleted')}
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
