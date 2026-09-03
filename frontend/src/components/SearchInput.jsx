import React, { useMemo, useState } from 'react';

const SearchInput = ({
  value,
  onChange,
  placeholder,
  ariaLabel,
  onClear,
  suggestions = [],
  onSelectSuggestion,
  isLoading = false,
  showSuggestions = false,
  setShowSuggestions,
  className = '',
  inputClassName = '',
  clearButtonClassName = '',
  dropdownClassName = '',
  itemClassName = '',
  loadingClassName = ''
}) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const visibleSuggestions = useMemo(() => suggestions.slice(0, 8), [suggestions]);

  const handleKeyDown = (e) => {
    if (!showSuggestions || visibleSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, visibleSuggestions.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      onSelectSuggestion?.(visibleSuggestions[focusedIndex]);
      setShowSuggestions?.(false);
      setFocusedIndex(-1);
    }

    if (e.key === 'Escape') {
      setShowSuggestions?.(false);
      setFocusedIndex(-1);
    }
  };

  return (
    <div className={className}>
      <span className="search-input-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.4-3.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>

      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setFocusedIndex(-1);
        }}
        onFocus={() => setShowSuggestions?.(true)}
        onBlur={() => setTimeout(() => setShowSuggestions?.(false), 120)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder || 'Search'}
        className={inputClassName}
      />

      {isLoading && <span className={loadingClassName || 'search-input-loading'} aria-hidden="true" />}

      {!!value && (
        <button
          type="button"
          className={clearButtonClassName}
          onClick={() => {
            onClear?.();
            setShowSuggestions?.(false);
            setFocusedIndex(-1);
          }}
          aria-label="Clear search"
        >
          x
        </button>
      )}

      {showSuggestions && visibleSuggestions.length > 0 && (
        <div className={dropdownClassName} role="listbox" aria-label="Search suggestions">
          {visibleSuggestions.map((item, idx) => (
            <button
              type="button"
              key={item.id || `${item.label}-${idx}`}
              className={`${itemClassName}${idx === focusedIndex ? ' is-focused' : ''}`}
              onMouseDown={() => {
                onSelectSuggestion?.(item);
                setShowSuggestions?.(false);
                setFocusedIndex(-1);
              }}
              role="option"
              aria-selected={idx === focusedIndex}
            >
              <span className="search-suggestion-main">{item.label}</span>
              {item.meta && <span className="search-suggestion-meta">{item.meta}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
