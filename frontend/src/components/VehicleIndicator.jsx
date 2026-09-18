import React, { useState } from 'react';
import { getVehicleRecommendations } from '../utils/vehicleRecommendation';

const STATUS = {
  best:     { bg: '#dcfce7', border: '#16a34a', text: '#15803d', badge: '#16a34a', label: 'Best' },
  good:     { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', badge: '#3b82f6', label: 'Good' },
  possible: { bg: '#fef9c3', border: '#ca8a04', text: '#92400e', badge: '#ca8a04', label: 'Alt'  },
};

const formatEta = (minutes) => {
  if (minutes == null) return null;
  return minutes < 1 ? '< 1 min' : `${Math.round(minutes)} min`;
};

/**
 * Collapsible, compact vehicle-recommendation panel for the navigation banner.
 *
 * Props:
 *   distanceKm  {number|string} – route distance in km
 *   destination {object}        – { name, type, category, … }
 */
const VehicleIndicator = ({ distanceKm, destination }) => {
  const [open, setOpen] = useState(false);
  const recs = getVehicleRecommendations(distanceKm, destination);
  const bestCount = recs.filter(r => r.status === 'best').length;
  const preview = recs.slice(0, 3).map(r => r.icon).join(' ');

  return (
    <div style={{ width: '100%' }}>
      {/* ── Toggle button ───────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.4rem',
          padding: '0.45rem 0.6rem',
          border: '1px solid #bbf7d0',
          borderRadius: '10px',
          background: open ? 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' : '#f8fafc',
          cursor: 'pointer',
          color: '#065f46',
          fontSize: '0.76rem',
          fontWeight: 700,
          transition: 'all 0.15s',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, overflow: 'hidden' }}>
          <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>🚗</span>
          <span style={{ whiteSpace: 'nowrap' }}>Vehicle Suggestions</span>
          <span style={{ letterSpacing: '0.08em', fontSize: '0.8rem', fontWeight: 600, opacity: 0.85, whiteSpace: 'nowrap' }}>{preview}</span>
          {bestCount > 0 && (
            <span
              style={{
                background: '#16a34a',
                color: '#fff',
                borderRadius: '999px',
                padding: '0 0.4rem',
                fontSize: '0.58rem',
                lineHeight: '1.5',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {bestCount} best
            </span>
          )}
        </span>
        <span style={{ fontSize: '0.6rem', opacity: 0.7, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* ── Expanded panel ──────────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            marginTop: '0.35rem',
            background: 'rgba(240, 253, 244, 0.92)',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '0.55rem 0.6rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            maxHeight: 'min(42vh, 280px)',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.62rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recommended transport to this destination
          </p>

          {recs.map(rec => {
            const s = STATUS[rec.status];
            const eta = formatEta(rec.etaMinutes);
            return (
              <div
                key={rec.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: '9px',
                  padding: '0.4rem 0.55rem',
                }}
              >
                <span style={{ width: '1.6rem', fontSize: '1.05rem', textAlign: 'center', flexShrink: 0 }}>{rec.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.72rem', color: s.text }}>{rec.label}</span>
                    <span
                      style={{
                        background: s.badge,
                        color: '#fff',
                        borderRadius: '4px',
                        padding: '0 5px',
                        fontSize: '0.55rem',
                        fontWeight: 800,
                        letterSpacing: '0.03em',
                      }}
                    >
                      {s.label}
                    </span>
                    {eta && (
                      <span style={{ fontSize: '0.62rem', color: '#374151', fontWeight: 700 }}>≈ {eta}</span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.64rem', color: '#374151', marginTop: '1px', lineHeight: 1.35 }}>
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