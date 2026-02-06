import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

const TITLES = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr'];

export default function BookingForm() {
  const { hotelId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const traceId = searchParams.get('traceId');
  const optionId = searchParams.get('optionId');
  const roomId = searchParams.get('roomId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  const [guestRules, setGuestRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [specialRequests, setSpecialRequests] = useState('');
  const [guest, setGuest] = useState({
    title: 'Mr',
    firstName: '',
    lastName: '',
    email: '',
    isdCode: '+91',
    contactNumber: '',
    panNumber: '',
    isLeadGuest: true,
  });

  useEffect(() => {
    if (!traceId || !optionId || !hotelId) {
      setError('Missing booking context.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.guestRules({ traceId, optionId, hotelId });
        if (!cancelled) setGuestRules(res);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [traceId, optionId, hotelId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roomId) {
      setError('Room not selected. Please go back and choose a rate.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        optionId,
        traceId,
        hotelId,
        specialRequests: specialRequests.trim() || null,
        roomDetails: [
          {
            roomId,
            guests: [
              {
                title: guest.title,
                firstName: guest.firstName.trim(),
                lastName: guest.lastName.trim(),
                email: guest.email.trim(),
                isdCode: guest.isdCode,
                contactNumber: guest.contactNumber.trim(),
                panNumber: guestRules?.IsPANMandatory ? (guest.panNumber?.trim() || undefined) : undefined,
                isLeadGuest: true,
              },
            ],
          },
        ],
      };
      const res = await api.book(body);
      navigate('/booking/confirmation', { state: { booking: res, checkIn, checkOut } });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 flex flex-col items-center min-h-[40vh]">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-surface-500">Loading…</p>
      </div>
    );
  }

  if (error && !guestRules) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/" className="btn-secondary">Back to search</Link>
      </div>
    );
  }

  const needPan = guestRules?.IsPANMandatory === true;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to={`/hotel/${hotelId}?${searchParams.toString()}`} className="text-brand-600 hover:underline text-sm">← Back to rates</Link>
        <p className="text-surface-500 text-sm mt-1">Guest details · {checkIn} – {checkOut}</p>
      </div>
      <h2 className="font-display text-xl font-semibold text-surface-800 mb-4">Lead guest</h2>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Title</label>
            <select
              className="input"
              value={guest.title}
              onChange={(e) => setGuest((g) => ({ ...g, title: e.target.value }))}
            >
              {TITLES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">First name *</label>
            <input
              className="input"
              value={guest.firstName}
              onChange={(e) => setGuest((g) => ({ ...g, firstName: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Last name *</label>
            <input
              className="input"
              value={guest.lastName}
              onChange={(e) => setGuest((g) => ({ ...g, lastName: e.target.value }))}
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Email *</label>
          <input
            type="email"
            className="input"
            value={guest.email}
            onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))}
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">ISD</label>
            <input
              className="input"
              value={guest.isdCode}
              onChange={(e) => setGuest((g) => ({ ...g, isdCode: e.target.value }))}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-surface-700 mb-1">Phone *</label>
            <input
              className="input"
              value={guest.contactNumber}
              onChange={(e) => setGuest((g) => ({ ...g, contactNumber: e.target.value }))}
              required
            />
          </div>
        </div>
        {needPan && (
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">PAN *</label>
            <input
              className="input"
              placeholder="ABCDE1234F"
              value={guest.panNumber}
              onChange={(e) => setGuest((g) => ({ ...g, panNumber: e.target.value }))}
              required={needPan}
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Special requests (optional)</label>
          <textarea
            className="input min-h-[80px]"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="e.g. Late checkout, high floor"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
          {submitting ? 'Booking…' : 'Confirm booking'}
        </button>
      </form>
    </div>
  );
}
