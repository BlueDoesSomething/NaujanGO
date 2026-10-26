import React from 'react';

// Keep complete identifiers visible/copyable instead of clipping long gateway
// references. All values render as ordinary escaped React text, not HTML.
const ReferenceDetails = ({ entries = [] }) => (
  <div style={{ minWidth: 160, maxWidth: 280, display: 'grid', gap: '0.3rem', fontSize: '0.82rem', lineHeight: 1.5, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
    {entries.length ? entries.map(entry => (
      <div key={entry.label}>
        <span style={{ color: '#6b7280' }}>{entry.label}: </span>
        <span title={entry.value || undefined} style={{ fontWeight: 600 }}>{entry.value || '—'}</span>
      </div>
    )) : <span style={{ color: '#9ca3af' }}>—</span>}
  </div>
);

export default ReferenceDetails;
