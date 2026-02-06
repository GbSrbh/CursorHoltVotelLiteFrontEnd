import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const adults = searchParams.get('adults') || '2';
  const locationId = searchParams.get('locationId');
  const hotelIds = searchParams.get('hotelIds');

  useEffect(() => {
    if (!locationId && !hotelIds) {
      setLoading(false);
      setError('Missing location. Please search from the home page.');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const body = {
          checkIn,
          checkOut,
          nationality: 'IN',
          currency: 'INR',
          culture: 'en-US',
          occupancies: [{ numOfAdults: Number(adults) || 2, childAges: [] }],
          filterBy: {
            ratings: null,
            freeBreakfast: false,
            isRefundable: false,
            subLocationIds: null,
            facilities: null,
            type: null,
            tags: null,
            reviewRatings: null,
          },
          page: 1,
          traceId: null,
        };
        if (hotelIds) body.hotelIds = [hotelIds];
        else body.locationId = locationId;
        const res = await api.search(body);
        if (!cancelled) {
          setData(res);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [checkIn, checkOut, adults, locationId, hotelIds]);

  // Support both response shapes:
  // - results as object: { data: [...hotels], traceId, currentPage, totalCount, ... }
  // - results as array: [ { data: [...hotels], traceId } ]
  const resultsPayload = data?.results;
  const isResultsObject =
    resultsPayload != null && !Array.isArray(resultsPayload) && typeof resultsPayload === 'object';
  const firstPage = Array.isArray(resultsPayload) && resultsPayload.length > 0 ? resultsPayload[0] : null;

  const rawList = isResultsObject
    ? resultsPayload?.data
    : firstPage?.data ?? resultsPayload?.data ?? resultsPayload?.hotels ?? resultsPayload?.items ?? resultsPayload?.searchResults ?? data?.data ?? data?.hotels ?? (Array.isArray(data) ? data : []);
  const list = Array.isArray(rawList) ? rawList : [];
  const traceId =
    (isResultsObject ? resultsPayload?.traceId : null) ?? firstPage?.traceId ?? data?.traceId ?? data?.searchTraceId;

  // Normalize each hotel: id, hotelName, availability.rate.finalRate (no image; often null in API)
  const results = list
    .map((h) => ({
      id: h?.id ?? h?.hotelId ?? h?.code,
      hotelName: h?.hotelName ?? h?.name ?? h?.title ?? '',
      availability: {
        rate: {
          finalRate:
            h?.availability?.rate?.finalRate ??
            h?.rate?.finalRate ??
            h?.finalRate ??
            h?.price ??
            h?.minRate,
        },
      },
    }))
    .filter((h) => h.id != null && h.id !== '');

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[40vh]">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-surface-500">Searching hotels…</p>
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
      <div className="mb-6">
        <Link to="/" className="text-brand-600 hover:underline text-sm">← Back to search</Link>
        <p className="text-surface-500 text-sm mt-1">
          {checkIn} – {checkOut} · {adults} adult(s)
        </p>
      </div>
      <h2 className="font-display text-xl font-semibold text-surface-800 mb-4">
        {results.length > 0 ? `${results.length} hotel(s) found` : 'No hotels found'}
      </h2>
      {results.length === 0 ? (
        <div className="card p-8 text-center text-surface-500">
          Try different dates or location. <Link to="/" className="text-brand-600 hover:underline">Search again</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {results.map((hotel) => (
            <li key={hotel.id}>
              <Link
                to={`/hotel/${hotel.id}?traceId=${traceId ?? ''}&checkIn=${checkIn}&checkOut=${checkOut}`}
                className="card flex items-center justify-between gap-4 p-4 hover:border-brand-300 transition-colors block"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-surface-800 truncate">{hotel.hotelName ?? hotel.name}</h3>
                  <p className="text-sm text-surface-500 mt-0.5">
                    {hotel.availability?.rate?.finalRate != null
                      ? `From ₹${Number(hotel.availability.rate.finalRate).toLocaleString()}`
                      : 'View rates'}
                  </p>
                </div>
                <span className="text-brand-600 text-sm font-medium flex-shrink-0">View rooms →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
