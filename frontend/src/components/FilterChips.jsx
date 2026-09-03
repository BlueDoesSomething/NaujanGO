import React from 'react';

const FilterChips = ({ chips = [], onClearAll, className = '', chipClassName = '', clearClassName = '' }) => {
  const active = chips.filter(Boolean);
  if (active.length === 0) return null;

  return (
    <div className={className}>
      {active.map((chip) => (
        <span key={chip.key} className={chipClassName}>
          <span>{chip.label}</span>
          <button type="button" onClick={chip.onRemove} aria-label={`Remove ${chip.label}`}>
            x
          </button>
        </span>
      ))}
      {!!onClearAll && (
        <button type="button" className={clearClassName} onClick={onClearAll}>
          Clear All Filters
        </button>
      )}
    </div>
  );
};

export default FilterChips;
