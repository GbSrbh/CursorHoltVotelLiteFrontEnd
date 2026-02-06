import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Bookings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getBookings({ page: 1, pageSize: 20 });
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const list = data?.data ?? data?.bookings ?? (Array.isArray(data) ? data : []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center min-h-[40vh]">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-surface-500">Loading bookings…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/" className="btn-secondary">Back to search</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="font-display text-xl font-semibold text-surface-800 mb-4">My Bookings</h2>
      {list.length === 0 ? (
        <div className="card p-8 text-center text-surface-500">
          No bookings yet. <Link to="/" className="text-brand-600 hover:underline">Search hotels</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {list.map((b, i) => (
            <li key={b.bookingId ?? b.id ?? i}>
              <div className="card p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-medium text-surface-800">{b.hotelName ?? b.hotel?.name ?? 'Hotel'}</p>
                    <p className="text-sm text-surface-500 mt-0.5">
                      {b.checkIn ?? b.checkInDate} – {b.checkOut ?? b.checkOutDate}
                    </p>
                    <p className="text-xs text-surface-400 mt-1">
                      Status: {b.status ?? b.bookingStatus ?? '—'}
                      {b.bookingId && ` · Ref: ${b.bookingId}`}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
