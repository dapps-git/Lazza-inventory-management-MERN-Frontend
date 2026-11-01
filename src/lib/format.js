const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const num = new Intl.NumberFormat('en-IN');

export const money = (v) => inr.format(Number(v) || 0);
export const number = (v) => num.format(Number(v) || 0);
export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const date = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
export const dateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

// "YYYY-MM-DD" in the browser's local time
export const isoDay = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
export const firstOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  return isoDay(d);
};

// Unique id per form submission, used by the server to block duplicate saves
export const requestId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const statusClass = (s) =>
  ({
    Paid: 'bg-green-100 text-green-700',
    Partial: 'bg-amber-100 text-amber-700',
    Credit: 'bg-red-100 text-red-700',
  })[s] || 'bg-gray-100 text-gray-700';
