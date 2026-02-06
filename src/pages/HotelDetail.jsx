import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function HotelDetail() {
  const { hotelId } = useParams();
  const [searchParams] = useSearchParams();
  const traceId = searchParams.get('traceId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);

  useEffect(() => {
    if (!traceId || !hotelId) {
      setError('Missing search context. Please search again.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.roomsAndRates({ traceId, hotelId });
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [traceId, hotelId]);

  // API can return results as array: results[0] = { data: [hotel], itinerary, traceId }; hotel has roomRate: [{ rooms, rates, recommendations, standardizedRooms }]
  const firstResult = Array.isArray(data?.results) && data.results.length > 0 ? data.results[0] : data?.results;
  const hotelData = firstResult?.data?.[0] ?? (Array.isArray(firstResult?.data) ? firstResult.data[0] : null);
  const roomRateBlocks = hotelData?.roomRate ?? (Array.isArray(hotelData?.roomRate) ? hotelData.roomRate : []);

  // Build options, roomsMap, standardizedRoomsMap from new format (roomRate array with rates)
  // One option per rate so all bookable rates are shown (recommendations only reference a subset)
  const builtFromRoomRate = (() => {
    if (!Array.isArray(roomRateBlocks) || roomRateBlocks.length === 0) return null;
    const roomsMap = {};
    const standardizedRoomsMap = {};
    const options = {};
    roomRateBlocks.forEach((block) => {
      const rooms = block?.rooms ?? {};
      const rates = block?.rates ?? {};
      const recommendations = block?.recommendations ?? {};
      const standardizedRooms = block?.standardizedRooms ?? {};
      Object.assign(roomsMap, rooms);
      Object.assign(standardizedRoomsMap, standardizedRooms);
      // One option per rate so user sees all rates (e.g. different prices/board basis)
      Object.keys(rates).forEach((rateId) => {
        const rate = rates[rateId];
        if (rate && rate.occupancies) {
          const recId = Object.keys(recommendations || {}).find(
            (id) => Array.isArray(recommendations[id]?.rates) && recommendations[id].rates.includes(rateId)
          );
          options[rateId] = {
            rate,
            optionId: rateId,
            recommendationId: recId || undefined,
            occupancies: rate.occupancies,
          };
        }
      });
    });
    return { options, roomsMap, standardizedRoomsMap };
  })();

  const rawOptions = builtFromRoomRate
    ? null
    : (() => {
        const direct =
          data?.results?.options ??
          firstResult?.options ??
          data?.options ??
          data?.rateOptions ??
          data?.recommendations ??
          data?.data?.options ??
          null;
        if (direct) return direct;

        const items = data?.items ?? data?.itinerary?.items ?? data?.data?.items ?? [];
        if (Array.isArray(items)) {
          const flat = [];
          items.forEach((item) => {
            const rates =
              item?.rates ?? item?.roomsAndRates ?? item?.roomRates ?? item?.rateOptions ?? (Array.isArray(item) ? item : []);
            if (Array.isArray(rates)) {
              rates.forEach((r) => {
                flat.push({ ...r, _itemCode: item?.code, _item: item });
              });
            }
          });
          if (flat.length) return flat;
        }

        const arr = data?.roomsAndRates ?? data?.roomRates ?? data?.rates ?? null;
        if (Array.isArray(arr) && arr.length > 0) return arr;
        if (Array.isArray(data)) return data;

        if (data && typeof data === 'object') {
          for (const v of Object.values(data)) {
            if (Array.isArray(v) && v.length > 0 && v[0] && typeof v[0] === 'object') {
              const first = v[0];
              if (
                'rateId' in first ||
                'roomId' in first ||
                'amount' in first ||
                'finalRate' in first ||
                'recommendationId' in first
              ) {
                return v;
              }
            }
          }
        }
        return null;
      })();

  const options = builtFromRoomRate
    ? builtFromRoomRate.options
    : (() => {
        if (!rawOptions) return {};
        if (Array.isArray(rawOptions)) {
          const map = {};
          rawOptions.forEach((opt, i) => {
            const id =
              opt?.recommendationId ??
              opt?.optionId ??
              opt?.id ??
              opt?.rateId ??
              opt?.code ??
              String(i);
            map[id] = opt;
          });
          return map;
        }
        return typeof rawOptions === 'object' ? rawOptions : {};
      })();
  const optionIds = Object.keys(options);
  const roomsMap = builtFromRoomRate
    ? builtFromRoomRate.roomsMap
    : (firstResult?.rooms ?? data?.results?.rooms ?? data?.rooms ?? {});
  const standardizedRoomsMap = builtFromRoomRate
    ? builtFromRoomRate.standardizedRoomsMap
    : (firstResult?.standardizedRooms ?? data?.results?.standardizedRooms ?? data?.standardizedRooms ?? {});
  const currentTraceId = firstResult?.traceId ?? data?.results?.traceId ?? data?.traceId ?? traceId;
  const itineraryCode =
    firstResult?.itinerary?.code ?? data?.itineraryCode ?? data?.itinerary?.code ?? data?.itinerary_code ?? data?.code;

  // Get room static content (image, name, facilities, max guests) for an option
  function getRoomContent(option) {
    const rate = option?.rate ?? option;
    const occupancies = rate?.occupancies ?? option?.occupancies ?? [];
    const first = occupancies[0];
    const roomId = first?.roomId ?? first?.room_id;
    const stdRoomId = first?.stdRoomId ?? first?.std_room_id;
    const room = roomId && roomsMap?.[roomId] ? roomsMap[roomId] : null;
    const stdRoom = stdRoomId && standardizedRoomsMap?.[stdRoomId] ? standardizedRoomsMap[stdRoomId] : room;
    const adults = first?.numOfAdults ?? rate?.numOfAdults ?? '2';
    const children = first?.numOfChildren ?? rate?.numOfChildren ?? '0';
    const maxGuests = stdRoom?.maxGuestAllowed ?? stdRoom?.maxGuestAllowed ?? room?.maxGuestAllowed ?? '—';
    const roomName = stdRoom?.name ?? room?.name ?? stdRoom?.type ?? room?.type ?? 'Room';
    const imageUrl =
      stdRoom?.images?.[0]?.links?.[0]?.url ??
      stdRoom?.images?.[0]?.url ??
      room?.images?.[0]?.links?.[0]?.url ??
      room?.images?.[0]?.url ??
      null;
    const facilities = stdRoom?.facilities ?? room?.facilities ?? [];
    const facilityNames = Array.isArray(facilities)
      ? facilities.map((f) => (typeof f === 'string' ? f : f?.name)).filter(Boolean)
      : [];
    return {
      roomName,
      imageUrl,
      adults,
      children,
      maxGuests,
      facilityNames,
    };
  }

  // Group options by room name (must run after roomsMap, standardizedRoomsMap, getRoomContent)
  const roomGroups = (() => {
    const groups = {};
    optionIds.forEach((optionId) => {
      const option = options[optionId];
      const content = getRoomContent(option);
      const name = content?.roomName?.trim() || 'Room';
      if (!groups[name]) groups[name] = [];
      groups[name].push(optionId);
    });
    return groups;
  })();
  const roomGroupNames = Object.keys(roomGroups);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center min-h-[40vh]">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-surface-500">Loading rooms & rates…</p>
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
        <Link to={`/search?${searchParams.toString()}`} className="text-brand-600 hover:underline text-sm">← Back to results</Link>
        <p className="text-surface-500 text-sm mt-1">{checkIn} – {checkOut}</p>
      </div>
      <h2 className="font-display text-xl font-semibold text-surface-800 mb-4">Choose a rate</h2>
      <p className="text-surface-500 text-sm mb-6">Rooms are grouped by type. Select your preferred rate to continue.</p>
      {roomGroupNames.length === 0 ? (
        <div className="card p-8 text-center text-surface-500">No rates available for this hotel.</div>
      ) : (
        <ul className="space-y-8">
          {roomGroupNames.map((roomName) => {
            const rateOptionIds = roomGroups[roomName];
            const firstOptionId = rateOptionIds[0];
            const firstOption = options[firstOptionId];
            const roomContent = getRoomContent(firstOption);
            return (
              <li key={roomName}>
                <div className="card overflow-hidden">
                  {/* Room header: image, name, guests, facilities */}
                  <div className="flex flex-col sm:flex-row border-b border-surface-200">
                    <div className="w-full sm:w-48 h-36 sm:min-h-[160px] flex-shrink-0 bg-surface-200 flex items-center justify-center">
                      {roomContent.imageUrl ? (
                        <img
                          src={roomContent.imageUrl}
                          alt={roomContent.roomName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          className="w-12 h-12 text-surface-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="p-4 flex-1 min-w-0">
                      <h3 className="font-semibold text-surface-800 capitalize">{roomContent.roomName}</h3>
                      <p className="text-sm text-surface-500 mt-1">
                        {roomContent.adults} adult{roomContent.adults !== '1' ? 's' : ''}
                        {roomContent.children !== '0' &&
                          `, ${roomContent.children} child${Number(roomContent.children) === 1 ? '' : 'ren'}`}
                        {' · '}Max {roomContent.maxGuests} guests
                      </p>
                      {roomContent.facilityNames.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {roomContent.facilityNames.slice(0, 5).map((name, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-md bg-surface-100 px-2 py-0.5 text-xs text-surface-600"
                            >
                              {name}
                            </span>
                          ))}
                          {roomContent.facilityNames.length > 5 && (
                            <span className="text-xs text-surface-400">+{roomContent.facilityNames.length - 5} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Rate options for this room */}
                  <div className="divide-y divide-surface-100">
                    {rateOptionIds.map((optionId) => {
                      const option = options[optionId];
                      const rate = option?.rate ?? option;
                      const finalRate =
                        rate?.finalRate ??
                        option?.finalRate ??
                        rate?.amount ??
                        option?.amount ??
                        rate?.price ??
                        option?.price ??
                        rate?.totalAmount ??
                        option?.totalAmount ??
                        rate?.sellingRate ??
                        option?.sellingRate;
                      const boardBasisObj = rate?.boardBasis ?? option?.boardBasis ?? rate?.mealPlan ?? option?.mealPlan;
                      const boardBasis =
                        typeof boardBasisObj === 'string'
                          ? boardBasisObj
                          : boardBasisObj?.description ?? boardBasisObj?.type ?? '';
                      const cancellation = rate?.cancellationPolicies ?? option?.cancellationPolicies ?? rate?.cancellation ?? option?.cancellation;
                      const isSelected = selectedOptionId === optionId;
                      return (
                        <div
                          key={optionId}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedOptionId(optionId)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedOptionId(optionId);
                            }
                          }}
                          className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-surface-50 ${isSelected ? 'bg-brand-50 ring-inset ring-1 ring-brand-500' : ''}`}
                        >
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <span className="font-semibold text-surface-800">
                              {finalRate != null ? `₹${Number(finalRate).toLocaleString()}` : 'Price on request'}
                            </span>
                            {boardBasis && <span className="text-surface-500">{boardBasis}</span>}
                            {(rate?.refundability || cancellation) && (
                              <span className="text-surface-500 text-xs">
                                {rate?.refundability ??
                                  (typeof cancellation === 'string' ? cancellation : cancellation?.[0]?.description) ??
                                  'See policies'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${isSelected ? 'bg-brand-500 border-brand-500' : 'border-surface-300'}`}
                              aria-hidden
                            />
                            <span className="text-sm text-surface-600">Select</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {selectedOptionId && (() => {
        const opt = options[selectedOptionId];
        const rate = opt?.rate ?? opt;
        const occupancies = rate?.occupancies ?? opt?.occupancies ?? rate?.roomAllocations ?? opt?.roomAllocations ?? [];
        const allRoomIds = occupancies.map((o) => o?.roomId ?? o?.room_id).filter(Boolean);
        const roomIds = allRoomIds.length > 0 ? allRoomIds : [occupancies[0]?.roomId ?? opt?.roomId].filter(Boolean);
        const finalRate =
          rate?.finalRate ??
          opt?.finalRate ??
          rate?.amount ??
          opt?.amount ??
          rate?.price ??
          opt?.price;
        const q = new URLSearchParams({
          traceId: currentTraceId,
          optionId: selectedOptionId,
          checkIn: checkIn ?? '',
          checkOut: checkOut ?? '',
        });
        if (roomIds.length) q.set('roomIds', roomIds.join(','));
        if (itineraryCode) q.set('itineraryCode', itineraryCode);
        if (finalRate != null) q.set('finalRate', String(finalRate));
        if (opt?.recommendationId) q.set('recommendationId', opt.recommendationId);
        return (
          <div className="mt-8 flex justify-end">
            <Link to={`/hotel/${hotelId}/guest-details?${q}`} className="btn-primary">
              Continue to guest details
            </Link>
          </div>
        );
      })()}
    </div>
  );
}
