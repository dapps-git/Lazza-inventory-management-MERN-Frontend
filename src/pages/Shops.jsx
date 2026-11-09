import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, MapPin, Eye, Phone, ShoppingCart } from 'lucide-react';
import { api, qs } from '../lib/api';
import { useApi, useDebounced } from '../lib/useApi';
import { money } from '../lib/format';
import { PageHeader, Card, Loading, Empty, ErrorBox, useToast } from '../components/ui';
import ShopForm, { EMPTY_SHOP } from '../components/ShopForm';

export default function Shops() {
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const debounced = useDebounced(search);
  const { data: shops, loading, error, reload } = useApi(`/shops${qs({ search: debounced, city })}`);
  const cities = useApi('/shops/cities');
  const [form, setForm] = useState(null);

  const remove = async (s) => {
    if (!window.confirm(`Delete shop "${s.name}"? Its sales and payment history will be kept.`)) return;
    try {
      const r = await api.del(`/shops/${s._id}`);
      toast(r.message);
      reload();
      cities.reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const totalOutstanding = (shops || []).reduce((t, s) => t + s.outstandingBalance, 0);

  return (
    <>
      <PageHeader
        title="Shops & Accounts"
        subtitle={shops ? `${shops.length} shops · ${money(totalOutstanding)} total outstanding` : ''}
        actions={
          <button className="btn-primary w-full sm:w-auto" onClick={() => setForm(EMPTY_SHOP)}>
            <Plus size={16} /> Add Shop
          </button>
        }
      />
      <Card>
        <div className="flex flex-col gap-2.5 border-b border-gray-100 p-3.5 sm:p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-gray-400 sm:top-2.5" />
            <input className="input pl-9" placeholder="Search by shop, owner, phone or address…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input sm:w-48" value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">All cities</option>
            {cities.data?.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {error && <div className="p-4"><ErrorBox text={error} /></div>}
        {loading && !shops ? (
          <Loading />
        ) : shops?.length ? (
          <>
            {/* Mobile Card List */}
            <div className="divide-y divide-gray-100 sm:hidden">
              {shops.map((s) => (
                <div
                  key={s._id}
                  onClick={() => navigate(`/shops/${s._id}`)}
                  className="p-3.5 space-y-2.5 hover:bg-gray-50/60 active:bg-gray-100/60 cursor-pointer transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{s.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                        {s.ownerName && <span>{s.ownerName}</span>}
                        {s.ownerName && s.city && <span>·</span>}
                        {s.city && <span className="rounded bg-gray-100 px-1.5 py-0.2 text-gray-600">{s.city}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Outstanding</div>
                      <div className={`font-bold text-sm ${s.outstandingBalance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {money(s.outstandingBalance)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                    <div>
                      <span>Sales: </span>
                      <b className="text-gray-800">{money(s.summary?.totalSales || 0)}</b>
                    </div>
                    <div>
                      <span>Received: </span>
                      <b className="text-green-700">{money(s.summary?.totalReceived || 0)}</b>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {s.phone && (
                        <a
                          href={`tel:${s.phone}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 active:scale-95"
                          title="Call"
                        >
                          <Phone size={13} className="text-green-600" /> Call
                        </a>
                      )}
                      {s.location?.lat != null && (
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={`https://www.google.com/maps?q=${s.location.lat},${s.location.lng}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 active:scale-95"
                          title="Maps"
                        >
                          <MapPin size={13} className="text-primary-700" /> Map
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/sales/new?shop=${s._id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-primary-800 active:scale-95"
                        title="Add New Sale (Supply products into shop)"
                      >
                        <Plus size={13} strokeWidth={2.5} /> Sale
                      </Link>
                      <Link
                        to={`/shops/${s._id}`}
                        className="rounded-lg border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100 active:scale-95"
                        title="View Ledger"
                      >
                        Account
                      </Link>
                      <button
                        title="Edit"
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 active:scale-95"
                        onClick={() => setForm(s)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        title="Delete"
                        className="rounded-lg border border-gray-200 p-1.5 text-red-500 hover:bg-red-50 active:scale-95"
                        onClick={() => remove(s)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Shop</th><th>City</th><th>Phone</th><th className="text-right">Total Sales</th>
                    <th className="text-right">Received</th><th className="text-right">Outstanding</th><th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shops.map((s) => (
                    <tr key={s._id} className="cursor-pointer" onClick={() => navigate(`/shops/${s._id}`)}>
                      <td>
                        <div className="font-medium text-gray-900">{s.name}</div>
                        <div className="text-xs text-gray-400">{s.ownerName}</div>
                      </td>
                      <td>{s.city}</td>
                      <td>{s.phone}</td>
                      <td className="text-right">{money(s.summary.totalSales)}</td>
                      <td className="text-right text-green-700">{money(s.summary.totalReceived)}</td>
                      <td className={`text-right font-semibold ${s.outstandingBalance > 0 ? 'text-red-600' : 'text-gray-500'}`}>{money(s.outstandingBalance)}</td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-1.5">
                          <Link
                            to={`/sales/new?shop=${s._id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition"
                            title="Add New Sale (Supply products)"
                          >
                            <Plus size={14} /> New Sale
                          </Link>
                          {s.location?.lat != null && (
                            <a title="Open in maps" target="_blank" rel="noreferrer" className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                              href={`https://www.google.com/maps?q=${s.location.lat},${s.location.lng}`}>
                              <MapPin size={16} />
                            </a>
                          )}
                          <Link title="Account" to={`/shops/${s._id}`} className="rounded p-1.5 text-primary-700 hover:bg-primary-50"><Eye size={16} /></Link>
                          <button title="Edit" className="rounded p-1.5 text-gray-500 hover:bg-gray-100" onClick={() => setForm(s)}><Pencil size={16} /></button>
                          <button title="Delete" className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => remove(s)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <Empty text={search || city ? 'No shops match.' : 'No shops yet. Add your first shop.'} />
        )}
      </Card>
      {form && (
        <ShopForm initial={form} onClose={() => setForm(null)} onSaved={() => { setForm(null); reload(); cities.reload(); }} />
      )}
    </>
  );
}
