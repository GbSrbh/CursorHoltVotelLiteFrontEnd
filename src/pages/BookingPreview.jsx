import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../api';

export default function BookingPreview() {
  const { hotelId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [priceCheck, setPriceCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const traceId = state?.traceId;
  const optionId = state?.optionId;
  const roomIds = Array.isArray(state?.roomIds) ? state.roomIds : (state?.roomIds ? [state.roomIds] : []);
  const guests = Array.isArray(state?.guests) ? state.guests : (state?.guests ? [state.guests] : []);
  const checkIn = state?.checkIn;
  const checkOut = state?.checkOut;
  const specialRequests = state?.specialRequests ?? null;
  const finalRateFromRooms = state?.finalRate != null ? Number(state.finalRate) : null;

  // Always call price-check (VoltLite: POST /api/v1/check-price/) so latest price is shown before booking
  useEffect(() => {
    if (!state?.traceId || !state?.optionId || !state?.hotelId) {
      setLoading(false);
      setError('Missing booking data. Please start from guest details.');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const body = {
          traceId: state.traceId,
          optionId: state.optionId,
          hotelId: state.hotelId,
        };
        if (state.recommendationId) body.recommendationId = state.recommendationId;
        const res = await api.priceCheck(body);
        if (!cancelled) setPriceCheck(res);
      } catch (e) {
        if (!cancelled) {
          if (finalRateFromRooms != null) {
            setPriceCheck({ finalRate: finalRateFromRooms });
            setError(null);
          } else {
            setError(e.message);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [state?.traceId, state?.optionId, state?.hotelId, state?.recommendationId, finalRateFromRooms]);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const roomDetails = roomIds.map((roomId, i) => ({
        roomId,
        guests: [(guests[i] ?? guests[0])].map((g) => ({
          type: g?.type ?? 'Adult',
          title: g?.title,
          firstName: g?.firstName,
          lastName: g?.lastName,
          email: g?.email,
          isdCode: g?.isdCode,
          contactNumber: g?.contactNumber,
          panNumber: g?.panNumber,
          isLeadGuest: g?.isLeadGuest ?? true,
        })),
      }));
      const body = {
        traceId,
        optionId,
        hotelId,
        specialRequests,
        roomDetails,
      };
      if (state?.recommendationId) body.recommendationId = state.recommendationId;
      const res = await api.book(body);
      navigate('/booking/confirmation', { state: { booking: res, checkIn, checkOut } });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const finalRate =
    priceCheck?.finalRate ??
    priceCheck?.rate?.finalRate ??
    priceCheck?.results?.rate?.finalRate ??
    priceCheck?.amount ??
    priceCheck?.price ??
    finalRateFromRooms;
  const priceChanged =
    priceCheck?.priceChangeData != null || priceCheck?.priceChanged === true;

  if (!state?.traceId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-surface-500 mb-4">Session expired. Please select a rate and enter guest details again.</p>
        <Link to="/" className="btn-secondary">Back to search</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 flex flex-col items-center min-h-[40vh]">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-surface-500">Checking price…</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to={`/hotel/${hotelId}/guest-details?traceId=${traceId}&optionId=${optionId}&checkIn=${checkIn}&checkOut=${checkOut}&roomIds=${roomIds.join(',')}`} className="text-brand-600 hover:underline text-sm">
          ← Back to guest details
        </Link>
        <p className="text-surface-500 text-sm mt-1">Confirm your booking</p>
      </div>
      <h2 className="font-display text-xl font-semibold text-surface-800 mb-4">Booking preview</h2>

      <div className="card p-6 space-y-4 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-surface-500">Check-in</span>
          <span className="text-surface-800">{checkIn}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-surface-500">Check-out</span>
          <span className="text-surface-800">{checkOut}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-surface-500">Rooms</span>
          <span className="text-surface-800">{roomIds.length} room(s)</span>
        </div>
        <div className="border-t border-surface-200 pt-4 flex justify-between items-center">
          <span className="font-medium text-surface-800">Total price</span>
          <span className="font-semibold text-surface-800">
            {finalRate != null ? `₹${Number(finalRate).toLocaleString()}` : '—'}
          </span>
        </div>
        {priceChanged && (
          <p className="text-amber-700 text-sm">
            Price has been updated. The amount above is the current price.
          </p>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <button
        type="button"
        onClick={handleConfirm}
        className="btn-primary w-full py-3"
        disabled={submitting}
      >
        {submitting ? 'Booking…' : 'Confirm booking'}
      </button>
    </div>
  );
}
