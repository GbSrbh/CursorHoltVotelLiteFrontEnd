import { useState, useRef, useEffect } from 'react';
import { api } from '../api';

const DEBOUNCE_MS = 300;

export default function LocationAutocomplete({ value, onChange, placeholder = 'City, hotel or airport' }) {
  const [query, setQuery] = useState(() => value?.name ?? value?.locationName ?? value?.displayName ?? value?.title ?? '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const wrapper = useRef(null);
  const skipNextSearchRef = useRef(false);

  useEffect(() => {
    const display = value?.name ?? value?.locationName ?? value?.displayName ?? value?.title ?? '';
    if (display) setQuery(display);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapper.current && !wrapper.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalize API response: extract array from various possible shapes
  function getLocationList(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    const keys = ['data', 'locations', 'results', 'suggestions', 'items'];
    for (const key of keys) {
      const val = data[key];
      if (Array.isArray(val)) return val;
      if (val && typeof val === 'object' && Array.isArray(val.data)) return val.data;
      if (val && typeof val === 'object' && Array.isArray(val.locations)) return val.locations;
    }
    const first = Object.values(data)[0];
    return Array.isArray(first) ? first : [];
  }

  // Normalize each item so we have id, name, type (Volt may use different keys)
  function normalizeItem(item) {
    if (!item || typeof item !== 'object') return null;
    return {
      id: item.id ?? item.locationId ?? item.referenceId ?? item.code,
      name: item.name ?? item.locationName ?? item.displayName ?? item.title ?? item.label ?? item.text ?? String(item.id ?? item.locationId ?? ''),
      type: item.type ?? item.locationType ?? item.category ?? '',
      referenceId: item.referenceId ?? item.id ?? item.locationId,
      ...item,
    };
  }

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (skipNextSearchRef.current) {
        skipNextSearchRef.current = false;
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await api.locations.search(query);
        const raw = getLocationList(data);
        const list = raw.map(normalizeItem).filter(Boolean);
        setSuggestions(list);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  const select = (item) => {
    skipNextSearchRef.current = true;
    setQuery(item.name ?? '');
    onChange?.(item);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapper} className="relative">
      <input
        type="text"
        className="input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!e.target.value) onChange?.(null);
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-surface-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((item, i) => (
            <li key={item.id ?? i}>
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 hover:bg-surface-50 flex flex-col"
                onClick={() => select(item)}
              >
                <span className="font-medium text-surface-800">{item.name}</span>
                {item.type && (
                  <span className="text-xs text-surface-400 capitalize">{item.type}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
