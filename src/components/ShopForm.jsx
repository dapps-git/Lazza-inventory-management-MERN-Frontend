import { useState } from 'react';
import { LocateFixed } from 'lucide-react';
import { api } from '../lib/api';
import { Modal, ErrorBox, Field, useToast } from './ui';

export const EMPTY_SHOP = {
  name: '', ownerName: '', phone: '', city: '', address: '',
  location: { lat: '', lng: '' }, additionalDetails: '', openingBalance: '',
};

export default function ShopForm({ initial, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(initial._id);
  const [f, setF] = useState({
    ...EMPTY_SHOP,
    ...initial,
    location: { lat: initial.location?.lat ?? '', lng: initial.location?.lng ?? '' },
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setLoc = (k) => (e) => setF({ ...f, location: { ...f.location, [k]: e.target.value } });

  const useMyLocation = () => {
    if (!navigator.geolocation) return setError('This browser cannot read GPS location');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setF((x) => ({ ...x, location: { lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) } }));
        setLocating(false);
      },
      (err) => {
        setError(`Could not get location: ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isEdit) await api.put(`/shops/${initial._id}`, f);
      else await api.post('/shops', f);
      toast(isEdit ? 'Shop updated' : 'Shop added');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open wide title={isEdit ? 'Edit Shop' : 'Add Shop'} onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><ErrorBox text={error} /></div>
        <Field label="Shop Name *"><input className="input" value={f.name} onChange={set('name')} required autoFocus /></Field>
        <Field label="Owner Name"><input className="input" value={f.ownerName} onChange={set('ownerName')} /></Field>
        <Field label="Phone Number"><input className="input" type="tel" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="City *"><input className="input" value={f.city} onChange={set('city')} required /></Field>
        <Field label="Address" className="sm:col-span-2"><textarea className="input" rows={2} value={f.address} onChange={set('address')} /></Field>
        <div className="sm:col-span-2">
          <span className="label">GPS Location</span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="input" placeholder="Latitude" value={f.location.lat} onChange={setLoc('lat')} />
            <input className="input" placeholder="Longitude" value={f.location.lng} onChange={setLoc('lng')} />
            <button type="button" className="btn-secondary shrink-0" onClick={useMyLocation} disabled={locating}>
              <LocateFixed size={16} /> {locating ? 'Locating…' : 'Use current location'}
            </button>
          </div>
        </div>
        <Field label="Additional Details" className="sm:col-span-2">
          <textarea className="input" rows={2} value={f.additionalDetails} onChange={set('additionalDetails')} />
        </Field>
        {!isEdit && (
          <Field label="Previous Balance (₹)" className="sm:col-span-2">
            <input className="input" type="number" min="0" step="0.01" value={f.openingBalance} onChange={set('openingBalance')} placeholder="Amount the shop already owes, if any" />
          </Field>
        )}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Shop'}</button>
        </div>
      </form>
    </Modal>
  );
}
