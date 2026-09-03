import React, { useState } from 'react';
import { getVehicleRecommendations } from '../utils/vehicleRecommendation';

const STATUS = {
  best:     { bg: '#dcfce7', border: '#16a34a', text: '#15803d', badge: '#16a34a', label: 'Best' },
  good:     { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', badge: '#3b82f6', label: 'Good' },
  possible: { bg: '#fef9c3', border: '#ca8a04', text: '#92400e', badge: '#ca8a04', label: 'Alt'  },
};

/**
 * Collapsible vehicle-recommendation panel.
 *
 * Props:
 *   distanceKm  {number|string}  – route distance in km
 *   destination {object}         – { name, type, category, … }
 */
const VehicleIndicator = ({ distanceKm, destination }) => {
  const [open, setOpen] = useState(false);
  const recs = getVehicleRecommendations(distanceKm, destination);
  const preview = recs.slice(0, 3).map(r => r.icon).join(' ');

  return (
    <div style={{ width: '100%' }}>
      {/* ── Toggle button ───────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(prev => !prev)}
        style={{
          width: '100%',
          background: open ? '#f0fdf4' : 'transparent',
          border: '1px solid #86efac',
          borderRadius: '8px',
          padding: '0.38rem 0.65rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.4rem',
          color: '#065f46',
          fontSize: '0.78rem',
          fontWeight: 600,
          transition: 'background 0.15s',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.9rem' }}>🚗</span>
          <span>Vehicle Suggestions</span>
          <span style={{ letterSpacing: '0.1em', fontSize: '0.88rem' }}>{preview}</span>
        </span>
        <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* ── Expanded panel ──────────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            marginTop: '0.4rem',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '0.6rem 0.65rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#166534' }}>
            Recommended transport to reach this destination:
          </p>

          {recs.map(rec => {
            const s = STATUS[rec.status];
            return (
              <div
                key={rec.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: '8px',
                  padding: '0.42rem 0.6rem',
                }}
              >
                <span style={{ fontSize: '1.25rem', flexShrink: 0, lineHeight: 1.2 }}>{rec.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: s.text }}>
                      {rec.label}
                    </span>
                    <span
                      style={{
                        background: s.badge,
                        color: 'white',
                        borderRadius: '4px',
                        padding: '1px 6px',
                        fontSize: '0.63rem',
                        fontWeight: 700,
                        letterSpacing: '0.03em',
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.71rem', color: '#374151', marginTop: '1px' }}>
                    {rec.reason}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VehicleIndicator;
