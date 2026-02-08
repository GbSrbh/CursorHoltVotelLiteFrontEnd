import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api';

export default function BookingConfirmation() {
  const { state } = useLocation();
  const booking = state?.booking;
  const checkInFromState = state?.checkIn;
  const checkOutFromState = state?.checkOut;

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsError, setDetailsError] = useState(null);

  // Booking code from book API response (support multiple response shapes from Volt/book API)
  const bookingCode =
    booking?.bookingCode ??
    booking?.bookingId ??
    booking?.reference ??
    booking?.confirmationNumber ??
    booking?.id ??
    booking?.result?.bookingCode ??
    booking?.result?.bookingId ??
    booking?.result?.reference ??
    booking?.data?.bookingCode ??
    booking?.data?.bookingId ??
    booking?.data?.reference ??
    booking?.data?.id ??
    booking?.results?.bookingCode ??
    booking?.results?.bookingId ??
    booking?.results?.[0]?.bookingCode ??
    booking?.results?.[0]?.bookingId ??
    booking?.results?.[0]?.reference;

  useEffect(() => {
    if (!booking || !bookingCode) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setDetailsError(null);
      try {
        const res = await api.getBookingDetails(bookingCode);
        if (!cancelled) {
          const normalized = res?.data ?? res?.results ?? res;
          setDetails(normalized && typeof normalized === 'object' ? normalized : res);
        }
      } catch (e) {
        if (!cancelled) setDetailsError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [booking, bookingCode]);

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-surface-500 mb-4">No booking data. You may have arrived here directly.</p>
        <Link to="/" className="btn-primary">Search hotels</Link>
      </div>
    );
  }

  const ref = bookingCode ?? '—';
  // Prefer fetched booking details for all display; fall back to state.booking
  const hotelName =
    details?.hotel?.name ??
    details?.hotelName ??
    booking.hotelName ??
    booking.hotel?.name ??
    'Your hotel';
  const checkIn = details?.checkIn ?? details?.searchRequest?.checkIn ?? checkInFromState;
  const checkOut = details?.checkOut ?? details?.searchRequest?.checkOut ?? checkOutFromState;
  const totalAmount =
    details?.totalAmount ??
    details?.rate?.finalRate ??
    details?.amount ??
    details?.finalRate ??
    booking.totalAmount ??
    booking.finalRate;
  const status = details?.status ?? details?.bookingStatus ?? 'Confirmed';
  const roomDetails = details?.roomDetails ?? details?.rooms ?? details?.roomDetailsList ?? [];
  const guests =
    details?.guests ??
    details?.guestDetails ??
    (Array.isArray(details?.roomDetails) ? details.roomDetails.flatMap((r) => r.guests ?? []) : []) ??
    [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex w-14 h-14 rounded-full bg-brand-100 text-brand-600 items-center justify-center text-2xl mb-4">
          ✓
        </div>
        <h2 className="font-display text-2xl font-semibold text-surface-800 mb-2">Booking confirmed</h2>
        <p className="text-surface-500">
          Your stay at <strong>{hotelName}</strong> is confirmed.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-surface-500">Fetching booking details…</p>
        </div>
      ) : (
        <>
          <div className="card p-6 mb-6">
            <h3 className="font-semibold text-surface-800 mb-4">Booking details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-surface-500">Reference</dt>
                <dd className="font-mono font-medium text-surface-800">{ref}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-surface-500">Status</dt>
                <dd className="text-surface-800 capitalize">{String(status)}</dd>
              </div>
              {checkIn && checkOut && (
                <div className="flex justify-between">
                  <dt className="text-surface-500">Dates</dt>
                  <dd className="text-surface-800">{checkIn} – {checkOut}</dd>
                </div>
              )}
              {totalAmount != null && (
                <div className="flex justify-between">
                  <dt className="text-surface-500">Total amount</dt>
                  <dd className="font-medium text-surface-800">
                    {typeof totalAmount === 'number' ? `₹${Number(totalAmount).toLocaleString()}` : totalAmount}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {Array.isArray(roomDetails) && roomDetails.length > 0 && (
            <div className="card p-6 mb-6">
              <h3 className="font-semibold text-surface-800 mb-4">Rooms</h3>
              <ul className="space-y-3">
                {roomDetails.map((room, i) => (
                  <li key={i} className="text-sm text-surface-700">
                    {room.roomName ?? room.roomType ?? room.name ?? `Room ${i + 1}`}
                    {room.rate != null && (
                      <span className="text-surface-500 ml-2">
                        {typeof room.rate === 'number' ? `₹${Number(room.rate).toLocaleString()}` : room.rate}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(guests) && guests.length > 0 && (
            <div className="card p-6 mb-6">
              <h3 className="font-semibold text-surface-800 mb-4">Guest details</h3>
              <ul className="space-y-3 text-sm">
                {guests.map((g, i) => (
                  <li key={i} className="text-surface-700">
                    {[g.title, g.firstName, g.lastName].filter(Boolean).join(' ')}
                    {g.email && <span className="block text-surface-500">{g.email}</span>}
                    {g.contactNumber && <span className="block text-surface-500">{g.isdCode ?? ''}{g.contactNumber}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {detailsError && (
            <p className="text-amber-700 text-sm mb-6">
              Could not load full details: {detailsError}. Reference above is still valid.
            </p>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-3 justify-center mt-8">
        <Link to="/bookings" className="btn-secondary">View my bookings</Link>
        <Link to="/" className="btn-primary">Search again</Link>
      </div>
    </div>
  );
}
