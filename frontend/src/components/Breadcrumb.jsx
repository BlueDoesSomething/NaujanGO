import React from 'react';
import Icons from './Icons';

const Breadcrumb = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '1rem 0',
      fontSize: '0.95rem',
      color: 'var(--theme-faint, #6b7280)',
      flexWrap: 'wrap'
    }}>
      {items.map((item, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {index > 0 && <Icons.ChevronRight size={18} style={{ color: 'var(--theme-faint, #d1d5db)' }} />}
          {item.active ? (
            <span style={{
              color: 'var(--theme-title-ink, #111827)',
              fontWeight: 600
            }}>
              {item.label}
            </span>
          ) : (
            <a href={item.href || '#'} style={{
              color: '#3b82f6',
              textDecoration: 'none',
              transition: 'color 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.target.style.color = '#1d4ed8'}
            onMouseLeave={(e) => e.target.style.color = '#3b82f6'}>
              {item.label}
            </a>
          )}
        </div>
      ))}
    </div>
  );
};

export default Breadcrumb;
