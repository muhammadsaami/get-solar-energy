import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MdSearch, MdClose } from 'react-icons/md';

export default function AdvancedSearch({ onSearch }) {
  const [query, setQuery] = useState('');
  const [recentSearches] = useState([]);
  const [showRecent, setShowRecent] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(val);
    }, 300);
  }, [onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  }, [onSearch]);

  const handleFocus = useCallback(() => {
    if (recentSearches.length > 0) setShowRecent(true);
  }, [recentSearches]);

  const handleBlur = useCallback(() => {
    setTimeout(() => setShowRecent(false), 200);
  }, []);

  const handleRecentClick = useCallback((term) => {
    setQuery(term);
    onSearch(term);
    setShowRecent(false);
  }, [onSearch]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', minWidth: '240px' }}>
      <div className="form-input-group" style={{ margin: 0 }}>
        <span style={{ color: 'var(--text-muted)', display: 'flex' }}><MdSearch size={18} /></span>
        <input
          ref={inputRef}
          type="text"
          className="form-input"
          placeholder="Search projects, customers, engineers..."
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-label="Search projects"
          role="combobox"
          aria-expanded={showRecent}
          aria-controls="search-results-list"
          aria-autocomplete="list"
          aria-activedescendant={undefined}
          style={{ border: 'none', background: 'transparent', padding: '8px 0', flex: 1, outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}
        />
        {query && (
          <button onClick={handleClear} className="btn-ghost" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }} aria-label="Clear search">
            <MdClose size={16} />
          </button>
        )}
      </div>
      {showRecent && recentSearches.length > 0 && (
        <div className="dropdown-menu" style={{ width: '100%' }}>
          <div className="dropdown-header">Recent Searches</div>
          {recentSearches.map((term, i) => (
            <button key={i} className="dropdown-item" onClick={() => handleRecentClick(term)}>
              <MdSearch size={14} /> {term}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
