import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from '../../context/LocationContext';
import { SEARCH_INDEX } from '../../utils/stateCoordinates';

export default function LocationSearch({ className = '' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const { selectedState, selectState, selectDistrict, clearSelection } = useLocation();

  const STATES_LIST = SEARCH_INDEX.filter(item => item.type === 'State' || item.type === 'UT')
    .sort((a, b) => a.label.localeCompare(b.label));

  useEffect(() => {
    if (!query.trim() || !selectedState) { setResults([]); return; }
    
    const fetchResults = async () => {
      try {
        const q = query.toLowerCase();
        
        // 1. Static index check
        const matched = SEARCH_INDEX.filter(item =>
          item.state === selectedState &&
          item.district &&
          item.district.toLowerCase().includes(q)
        ).slice(0, 3);

        // 2. Query Nominatim scoped to selected state
        if (query.length >= 3) {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&state=${encodeURIComponent(selectedState)}&countrycodes=in&format=json&limit=5`);
          if (res.ok) {
            const data = await res.json();
            const dynamicResults = data.map(d => {
              const parts = d.display_name.split(',');
              const mainLabel = parts[0].trim();
              return {
                label: mainLabel,
                type: 'District',
                lat: parseFloat(d.lat),
                lon: parseFloat(d.lon),
                state: selectedState,
                district: mainLabel,
              };
            });
            
            const combined = [...matched, ...dynamicResults];
            const unique = Array.from(new Map(combined.map(item => [item.label, item])).values());
            setResults(unique.slice(0, 5));
            setOpen(unique.length > 0);
            return;
          }
        }

        setResults(matched);
        setOpen(matched.length > 0);
      } catch (e) {
        console.warn('Search error', e);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, selectedState]);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleStateChange = (e) => {
    const val = e.target.value;
    if (!val) {
      clearSelection();
      setQuery('');
      return;
    }
    const s = SEARCH_INDEX.find(item => item.label === val);
    if (s) {
      selectState(s.state, { lat: s.lat, lon: s.lon });
    }
    setQuery('');
  };

  const handleDistrictSelect = (item) => {
    const coords = { lat: item.lat, lon: item.lon };
    selectDistrict(item.district, coords);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative flex flex-col sm:flex-row gap-2 ${className}`}>
      {/* Box 1: State Select */}
      <div className="flex items-center bg-white/95 border border-slate-200 rounded-xl shadow-sm focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100 transition-all">
        <span className="material-symbols-outlined text-[18px] text-slate-400 pl-3">map</span>
        <select
          value={selectedState || ''}
          onChange={handleStateChange}
          className="flex-1 bg-transparent text-[13px] font-medium text-slate-800 outline-none px-2 py-2 cursor-pointer appearance-none min-w-[120px]"
        >
          <option value="">All India</option>
          {STATES_LIST.map(s => (
            <option key={s.label} value={s.label}>{s.label}</option>
          ))}
        </select>
        <span className="material-symbols-outlined text-[16px] text-slate-400 pr-2 pointer-events-none">expand_more</span>
      </div>

      {/* Box 2: District Search (Autocomplete) */}
      <div className={`relative flex items-center bg-white/95 border border-slate-200 rounded-xl px-3 py-2 shadow-sm transition-all flex-1 ${!selectedState ? 'opacity-50 bg-slate-50' : 'focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100'}`}>
        <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={!selectedState}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={selectedState ? `Search district in ${selectedState}...` : 'Select a state first...'}
          className="flex-1 w-full bg-transparent text-[13px] font-medium text-slate-800 placeholder:text-slate-400 outline-none pl-2 disabled:cursor-not-allowed"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} className="text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {/* District Autocomplete Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 sm:left-auto right-0 sm:w-[250px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-[600]">
          {results.map((item, i) => (
            <button
              key={`${item.label}-${i}`}
              onClick={() => handleDistrictSelect(item)}
              className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
            >
              <span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-slate-800 truncate">{item.label}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
