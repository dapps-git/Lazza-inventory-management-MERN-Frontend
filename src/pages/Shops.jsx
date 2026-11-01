import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, MapPin, Eye } from 'lucide-react';
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
        subtitle={shops ? `${shops.length} shops · ${money(totalOutstanding)} outstanding` : ''}
        actions={<button className="btn-primary" onClick={() => setForm(EMPTY_SHOP)}><Plus size={16} /> Add Shop</button>}
      />
      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
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
          <div className="table-wrap">
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
                      <div className="flex justify-end gap-1">
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
