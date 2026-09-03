import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const btnBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '32px',
  height: '32px',
  padding: '0 0.5rem',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  background: '#fff',
  color: '#374151',
  fontSize: '0.82rem',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  lineHeight: 1,
};

const btnActive = {
  ...btnBase,
  background: 'linear-gradient(135deg,#22c55e,#16a34a)',
  color: '#fff',
  border: '1px solid #16a34a',
  boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
};

const btnDisabled = {
  ...btnBase,
  opacity: 0.4,
  cursor: 'not-allowed',
};

/**
 * Reusable pagination bar.
 *
 * @param {number}   page          Current 1-based page.
 * @param {number}   totalPages    Total number of pages.
 * @param {Function} onPageChange  Called with new page number.
 * @param {number}   totalItems    Total items count (for "Showing X–Y of Z").
 * @param {number}   pageSize      Items per page.
 * @param {string}   [label]       Label shown after the count (default "items").
 */
const Pagination = ({ page, totalPages, onPageChange, totalItems, pageSize, label = 'items' }) => {
  if (!totalPages || totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, totalItems);

  // Build page number window (max 5 numbers centred on current page)
  let start = Math.max(1, page - 2);
  let end   = Math.min(totalPages, start + 4);
  start     = Math.max(1, end - 4);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const { t } = useLanguage();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: '1.25rem',
      flexWrap: 'wrap',
      gap: '0.6rem',
    }}>
      {/* Count */}
      <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>
        Showing {from}–{to} of {totalItems} {label}
      </span>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
        {/* Prev */}
        <button
          style={page === 1 ? btnDisabled : btnBase}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          title={t('button_previous_page')}
        >
          ‹
        </button>

        {/* First + ellipsis */}
        {start > 1 && (
          <>
            <button style={page === 1 ? btnActive : btnBase} onClick={() => onPageChange(1)}>1</button>
            {start > 2 && <span style={{ color: '#9ca3af', fontWeight: 700 }}>…</span>}
          </>
        )}

        {/* Page numbers */}
        {pages.map(n => (
          <button
            key={n}
            style={n === page ? btnActive : btnBase}
            onClick={() => onPageChange(n)}
          >
            {n}
          </button>
        ))}

        {/* Ellipsis + last */}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span style={{ color: '#9ca3af', fontWeight: 700 }}>…</span>}
            <button style={page === totalPages ? btnActive : btnBase} onClick={() => onPageChange(totalPages)}>
              {totalPages}
            </button>
          </>
        )}

        {/* Next */}
        <button
          style={page === totalPages ? btnDisabled : btnBase}
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          title={t('button_next_page')}
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default Pagination;
