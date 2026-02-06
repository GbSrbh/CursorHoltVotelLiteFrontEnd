import { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';

const TITLES = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr'];

const emptyGuest = () => ({
  title: 'Mr',
  firstName: '',
  lastName: '',
  email: '',
  isdCode: '+91',
  contactNumber: '',
  panNumber: '',
  isLeadGuest: true,
});

export default function GuestDetails() {
  const { hotelId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const traceId = searchParams.get('traceId');
  const optionId = searchParams.get('optionId');
  const recommendationId = searchParams.get('recommendationId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const finalRateParam = searchParams.get('finalRate');
  const finalRate = finalRateParam != null && finalRateParam !== '' ? Number(finalRateParam) : null;
  const roomIdsParam = searchParams.get('roomIds');
  const singleRoomId = searchParams.get('roomId');
  const roomIds =
    roomIdsParam ? roomIdsParam.split(',').filter(Boolean) : singleRoomId ? [singleRoomId] : [];

  const [guests, setGuests] = useState(() =>
    roomIds.length > 0 ? roomIds.map(() => emptyGuest()) : [emptyGuest()]
  );
  const [specialRequests, setSpecialRequests] = useState('');
  const [error, setError] = useState('');

  const handleGuestChange = (roomIndex, field, value) => {
    setGuests((prev) => {
      const next = [...prev];
      next[roomIndex] = { ...next[roomIndex], [field]: value };
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!traceId || !optionId || !hotelId) {
      setError('Missing booking context.');
      return;
    }
    if (roomIds.length === 0) {
      setError('No room selected. Please go back and choose a rate.');
      return;
    }
    const valid = guests.every(
      (g) => g.firstName?.trim() && g.lastName?.trim() && g.email?.trim() && g.contactNumber?.trim()
    );
    if (!valid) {
      setError('Please fill all required guest fields.');
      return;
    }
    setError('');
    navigate(`/hotel/${hotelId}/preview`, {
      state: {
        traceId,
        optionId,
        recommendationId: recommendationId || undefined,
        hotelId,
        roomIds,
        guests: guests.map((g) => ({
          type: 'Adult',
          title: g.title,
          firstName: g.firstName.trim(),
          lastName: g.lastName.trim(),
          email: g.email.trim(),
          isdCode: g.isdCode,
          contactNumber: g.contactNumber.trim(),
          panNumber: g.panNumber?.trim() || undefined,
          isLeadGuest: true,
        })),
        checkIn,
        checkOut,
        specialRequests: specialRequests.trim() || null,
        finalRate,
      },
    });
  };

  if (!traceId || !optionId || !hotelId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600 mb-4">Missing booking context. Please select a rate from the hotel page.</p>
        <Link to="/" className="btn-secondary">Back to search</Link>
      </div>
    );
  }

  if (roomIds.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-surface-600 mb-4">No room selected. Please go back and choose a rate.</p>
        <Link to={`/hotel/${hotelId}`} className="btn-secondary">Back to rates</Link>
      </div>
    );
  }

  const displayRoomIds = roomIds;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to={`/hotel/${hotelId}?${searchParams.toString()}`} className="text-brand-600 hover:underline text-sm">
          ← Back to rates
        </Link>
        <p className="text-surface-500 text-sm mt-1">
          Guest details · {checkIn} – {checkOut}
        </p>
      </div>
      <h2 className="font-display text-xl font-semibold text-surface-800 mb-4">Guest details</h2>
      <p className="text-sm text-surface-500 mb-4">
        Enter lead guest details for each room. At least one lead guest per room is required.
      </p>
      <form onSubmit={handleSubmit} className="space-y-8">
        {displayRoomIds.map((roomId, roomIndex) => (
          <div key={roomId ?? roomIndex} className="card p-6 space-y-4">
            <h3 className="font-medium text-surface-800">
              Room {roomIndex + 1} – Lead guest
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Title</label>
                <select
                  className="input"
                  value={guests[roomIndex]?.title ?? 'Mr'}
                  onChange={(e) => handleGuestChange(roomIndex, 'title', e.target.value)}
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
                  value={guests[roomIndex]?.firstName ?? ''}
                  onChange={(e) => handleGuestChange(roomIndex, 'firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Last name *</label>
                <input
                  className="input"
                  value={guests[roomIndex]?.lastName ?? ''}
                  onChange={(e) => handleGuestChange(roomIndex, 'lastName', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Email *</label>
              <input
                type="email"
                className="input"
                value={guests[roomIndex]?.email ?? ''}
                onChange={(e) => handleGuestChange(roomIndex, 'email', e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">ISD</label>
                <input
                  className="input"
                  value={guests[roomIndex]?.isdCode ?? '+91'}
                  onChange={(e) => handleGuestChange(roomIndex, 'isdCode', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-surface-700 mb-1">Phone *</label>
                <input
                  className="input"
                  value={guests[roomIndex]?.contactNumber ?? ''}
                  onChange={(e) => handleGuestChange(roomIndex, 'contactNumber', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">PAN (optional)</label>
              <input
                className="input"
                placeholder="ABCDE1234F"
                value={guests[roomIndex]?.panNumber ?? ''}
                onChange={(e) => handleGuestChange(roomIndex, 'panNumber', e.target.value)}
              />
            </div>
          </div>
        ))}
        <div className="card p-6">
          <label className="block text-sm font-medium text-surface-700 mb-1">Special requests (optional)</label>
          <textarea
            className="input min-h-[80px]"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="e.g. Late checkout, high floor"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="btn-primary w-full py-3">
          Continue to preview
        </button>
      </form>
    </div>
  );
}
