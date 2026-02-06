import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationAutocomplete from '../components/LocationAutocomplete';

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
};

export default function Home() {
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [checkIn, setCheckIn] = useState(addDays(today(), 7));
  const [checkOut, setCheckOut] = useState(addDays(today(), 8));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState([]);
  const [error, setError] = useState('');

  const occupancies = [
    { numOfAdults: adults, childAges: childAges.slice(0, 3) },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    setError('');
    if (!location?.id && !location?.referenceId) {
      setError('Please select a location.');
      return;
    }
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
      ...(location?.id && { locationId: String(location.id) }),
      ...(location?.referenceId && { locationId: String(location.referenceId) }),
    });
    if (location?.type === 'Hotel' && location?.id) {
      params.set('hotelIds', location.id);
    }
    navigate(`/search?${params}`);
  };

  return (
    <div className="bg-gradient-to-b from-brand-50 to-surface-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-display text-3xl font-bold text-surface-800 text-center mb-2">
          Where do you want to stay?
        </h1>
        <p className="text-surface-500 text-center mb-10">
          Search by city, hotel or airport. No sign-in required.
        </p>
        <form onSubmit={handleSearch} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Location</label>
            <LocationAutocomplete value={location} onChange={setLocation} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Check-in</label>
              <input
                type="date"
                className="input"
                value={checkIn}
                min={today()}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Check-out</label>
              <input
                type="date"
                className="input"
                value={checkOut}
                min={checkIn || today()}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Adults</label>
              <select
                className="input"
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Children</label>
              <select
                className="input"
                value={children}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setChildren(n);
                  setChildAges(Array(n).fill(0));
                }}
              >
                {[0, 1, 2, 3].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          {children > 0 && (
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Child ages</label>
              <div className="flex flex-wrap gap-2">
                {childAges.map((age, i) => (
                  <select
                    key={i}
                    className="input w-20"
                    value={age}
                    onChange={(e) => {
                      const next = [...childAges];
                      next[i] = Number(e.target.value);
                      setChildAges(next);
                    }}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full py-3">
            Search hotels
          </button>
        </form>
      </div>
    </div>
  );
}
