import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  HiOutlineMapPin,
  HiOutlineXMark,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';

import { HiOutlineSearch } from 'react-icons/hi';

// Fix Leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Helper: move map view when position changes ─────────────────────────────
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 16);
  }, [center, map]);
  return null;
};

// ── Helper: handle click on map ─────────────────────────────────────────────
const ClickHandler = ({ onMapClick }) => {
  useMapEvents({ click: onMapClick });
  return null;
};

// ── Nominatim debounced search ───────────────────────────────────────────────
const useNominatim = () => {
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const timerRef                = useRef(null);

  const search = useCallback((query) => {
    clearTimeout(timerRef.current);
    if (!query || query.length < 3) { setResults([]); return; }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`;
        const res  = await fetch(url, { headers: { 'Accept-Language': 'id,en' } });
        const data = await res.json();
        setResults(data);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const reverse = useCallback(async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
      const res  = await fetch(url, { headers: { 'Accept-Language': 'id,en' } });
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  return { results, loading, search, reverse, setResults };
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// Props:
//   value    = { latitude, longitude, formattedAddress, city, country, zip }
//   onChange = (locationObj) => void
//   error    = string | null
// ════════════════════════════════════════════════════════════════════════════

const LocationPicker = ({ value = {}, onChange, error }) => {
  const [query,       setQuery]       = useState(value.formattedAddress || '');
  const [showResults, setShowResults] = useState(false);
  const [markerPos,   setMarkerPos]   = useState(
    value.latitude && value.longitude
      ? [value.latitude, value.longitude]
      : null
  );
  const [confirmed, setConfirmed]     = useState(!!value.latitude);
  const inputRef                       = useRef(null);
  const wrapperRef                     = useRef(null);
  const { results, loading, search, reverse, setResults } = useNominatim();

  // ✅ SYNC dengan value prop dari luar (misalnya saat edit employee)
  useEffect(() => {
    if (value.latitude && value.longitude && value.formattedAddress) {
      // Jika ada data dari props, update internal state
      setMarkerPos([value.latitude, value.longitude]);
      setQuery(value.formattedAddress);
      setConfirmed(true);
    } else if (!value.latitude && !value.longitude && !value.formattedAddress) {
      // Jika kosong, reset
      setMarkerPos(null);
      setQuery('');
      setConfirmed(false);
    }
  }, [value.latitude, value.longitude, value.formattedAddress]);

  // ── When user types in search box ────────────────────────────────────────
  const handleQueryChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setConfirmed(false);
    search(v);
    setShowResults(true);
  };

  // ── User picks an autocomplete result ────────────────────────────────────
  const handleSelectResult = (place) => {
    const lat  = parseFloat(place.lat);
    const lng  = parseFloat(place.lon);
    const addr = place.display_name;
    const a    = place.address || {};

    setMarkerPos([lat, lng]);
    setQuery(addr);
    setConfirmed(true);
    setShowResults(false);
    setResults([]);

    onChange?.({
      latitude:         lat,
      longitude:        lng,
      formattedAddress: addr,
      city:             a.city || a.town || a.village || a.county || '',
      country:          a.country || '',
      zip:              a.postcode || '',
    });
  };

  // ── User clicks on map ───────────────────────────────────────────────────
  const handleMapClick = useCallback(async (e) => {
    const { lat, lng } = e.latlng;
    setMarkerPos([lat, lng]);
    setConfirmed(false);

    const place = await reverse(lat, lng);
    if (place) {
      const addr = place.display_name;
      const a    = place.address || {};
      setQuery(addr);
      setConfirmed(true);
      onChange?.({
        latitude:         lat,
        longitude:        lng,
        formattedAddress: addr,
        city:             a.city || a.town || a.village || a.county || '',
        country:          a.country || '',
        zip:              a.postcode || '',
      });
    }
  }, [reverse, onChange]);

  // ── Clear selection ──────────────────────────────────────────────────────
  const handleClear = () => {
    setQuery('');
    setMarkerPos(null);
    setConfirmed(false);
    setResults([]);
    onChange?.({ latitude: null, longitude: null, formattedAddress: '', city: '', country: '', zip: '' });
    inputRef.current?.focus();
  };

  const defaultCenter = markerPos || [-6.9175, 107.6191]; // Bandung fallback

  return (
    <div className="space-y-2">
      {/* ── Search Input ── */}
      <div ref={wrapperRef} className="relative">
        <div
          className={`flex items-center border rounded-lg overflow-hidden transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent ${
            error ? 'border-red-400' : 'border-gray-300'
          }`}
        >
          {/* Icon */}
          <div className="px-3 bg-gray-50 py-2.5 border-r border-gray-300 flex-shrink-0">
            <HiOutlineMapPin className={`w-5 h-5 ${confirmed ? 'text-indigo-500' : 'text-gray-400'}`} />
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Search location... (e.g., Jl. Sudirman, Jakarta)"
            className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white"
          />

          {/* Right actions */}
          <div className="flex items-center pr-2 gap-1">
            {loading && (
              <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {confirmed && !loading && (
              <HiOutlineCheckCircle className="w-4 h-4 text-green-500" />
            )}
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <HiOutlineXMark className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Autocomplete Dropdown ── */}
        {showResults && results.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
            {results.map((place) => (
              <button
                key={place.place_id}
                type="button"
                onClick={() => handleSelectResult(place)}
                className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-start gap-3 border-b border-gray-100 last:border-0"
              >
                <HiOutlineMapPin className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 line-clamp-2 leading-snug">
                    {place.display_name}
                  </p>
                  {place.type && (
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{place.type}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 flex items-center gap-1">
        <HiOutlineSearch className="w-3 h-3" />
        Ketik untuk cari, atau klik langsung di peta untuk pilih lokasi
      </p>

      {/* ── Map Preview ── */}
      <div
        className={`rounded-xl overflow-hidden border-2 transition-colors ${
          confirmed ? 'border-indigo-200' : 'border-gray-200'
        }`}
        style={{ height: 280 }}
      >
        <MapContainer
          center={defaultCenter}
          zoom={markerPos ? 16 : 12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ClickHandler onMapClick={handleMapClick} />
          {markerPos && (
            <>
              <MapController center={markerPos} />
              <Marker position={markerPos} />
            </>
          )}
        </MapContainer>
      </div>

      {/* ── Koordinat info ── */}
      {markerPos && (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          <HiOutlineMapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span>
            Lat: <strong className="text-gray-700">{markerPos[0].toFixed(6)}</strong>
            {' · '}
            Lng: <strong className="text-gray-700">{markerPos[1].toFixed(6)}</strong>
          </span>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default LocationPicker;
