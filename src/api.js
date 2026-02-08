// Use VITE_API_URL to send requests to a different domain (e.g. https://your-backend.com).
// If unset, requests go to same origin + /api (relies on dev proxy or same-host backend).
const API_BASE = import.meta.env.VITE_API_URL ?? '';
const API_PATH = '/api';
const API = API_BASE ? `${API_BASE.replace(/\/$/, '')}${API_PATH}` : API_PATH;

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || res.statusText);
  return data;
}

export const api = {
  locations: {
    search: (query) => request(`/locations/search?query=${encodeURIComponent(query)}`),
  },
  search: (body) => request('/search', { method: 'POST', body: JSON.stringify(body) }),
  roomsAndRates: (body) => request('/roomsandrates', { method: 'POST', body: JSON.stringify(body) }),
  priceCheck: (body) => request('/price-check', { method: 'POST', body: JSON.stringify(body) }),
  guestRules: (body) => request('/guest-rules', { method: 'POST', body: JSON.stringify(body) }),
  book: (body) => request('/book', { method: 'POST', body: JSON.stringify(body) }),
  getBookings: (body = { page: 1, pageSize: 10 }) =>
    request('/getbookings', { method: 'POST', body: JSON.stringify(body) }),
  getBookingDetails: (bookingCode) =>
    request(`/booking-details/${encodeURIComponent(bookingCode)}`),
};
