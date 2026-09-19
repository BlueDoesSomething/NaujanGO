import React, { useState } from 'react';
import { getVehicleRecommendations } from '../utils/vehicleRecommendation';

const STATUS = {
  best:     { tintBg: '#dcfce7', chipBg: '#16a34a', border: '#bbf7d0', text: '#15803d', badgeBg: '#16a34a', label: 'Best' },
  good:     { tintBg: '#dbeafe', chipBg: '#3b82f6', border: '#bfdbfe', text: '#1d4ed8', badgeBg: '#3b82f6', label: 'Good' },
  possible: { tintBg: '#fef9c3', chipBg: '#ca8a04', border: '#fde68a', text: '#92400e', badgeBg: '#ca8a04', label: 'Alt'  },
};

const VehicleIcon = ({ id, size = 18, color = 'currentColor' }) => {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  if (id === 'walk') {
    return (<svg {...common}><circle cx="13" cy="4.5" r="1.6" /><path d="M13 7l-2 5 2 3v5" /><path d="M11 12l-3 1-1.5 4" /><path d="M13 9l3 2 2 4" /></svg>);
  }
  if (id === 'bike') {
    return (<svg {...common}><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M6 17l4-7h4l4 7" /><path d="M9 10h4" /></svg>);
  }
  if (id === 'motorcycle') {
    return (<svg {...common}><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M6 17l4-7h5l3 7" /><path d="M9 10l-1-2h3" /></svg>);
  }
  if (id === 'boat') {
    return (<svg {...common}><path d="M4 15h16l-2 4H6z" /><path d="M12 3v10" /><path d="M8 13h8" /></svg>);
  }
  // tricycle, car, 4x4 → road vehicle
  return (<svg {...common}><path d="M4 17h16" /><path d="M6 17v-4l2-4h8l2 4v4" /><path d="M7 17a1.4 1.4 0 102.8 0M14.2 17a1.4 1.4 0 102.8 0" /><path d="M5.5 13h13" /></svg>);
};

const ChevronIcon = ({ open }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

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
  const preview = recs.slice(0, 3);

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
          gap: '0.5rem',
          padding: '0.5rem 0.6rem',
          border: `1px solid ${open ? '#a7f3d0' : '#e2e8f0'}`,
          borderRadius: '12px',
          background: open ? 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' : '#ffffff',
          boxShadow: open ? '0 4px 12px rgba(22, 163, 74, 0.12)' : 'none',
          cursor: 'pointer',
          color: '#065f46',
          fontSize: '0.78rem',
          fontWeight: 800,
          transition: 'all 0.15s',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, overflow: 'hidden' }}>
          <span style={{ width: '30px', height: '30px', flexShrink: 0, borderRadius: '9px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff', boxShadow: '0 3px 8px rgba(22, 163, 74, 0.35)' }}>
            <VehicleIcon id="car" size={17} />
          </span>
          <span style={{ minWidth: 0, textAlign: 'left' }}>
            <span style={{ display: 'block', whiteSpace: 'nowrap' }}>Vehicle Suggestions</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, fontSize: '0.66rem', color: '#64748b', whiteSpace: 'nowrap' }}>
              {recs.length} {recs.length === 1 ? 'option' : 'options'}
              {preview.map(rec => (
                <span key={rec.id} style={{ display: 'inline-flex', alignItems: 'center' }}><VehicleIcon id={rec.id} size={13} color="#94a3b8" /></span>
              ))}
              {bestCount > 0 && (
                <span style={{ background: '#16a34a', color: '#fff', borderRadius: '999px', padding: '0 0.4rem', fontSize: '0.58rem', lineHeight: '1.6', fontWeight: 800 }}>
                  {bestCount} best
                </span>
              )}
            </span>
          </span>
        </span>
        <span style={{ width: '22px', height: '22px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px', background: open ? '#dcfce7' : '#f1f5f9', color: open ? '#16a34a' : '#64748b', transition: 'background 0.15s, color 0.15s' }}>
          <ChevronIcon open={open} />
        </span>
      </button>

      {/* ── Expanded panel ──────────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            marginTop: '0.4rem',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '0.6rem 0.55rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            maxHeight: 'min(42vh, 280px)',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
          }}
        >
          <p style={{ margin: '0 0 0.15rem', padding: '0 0.15rem', fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Recommended transport
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
                  background: s.tintBg,
                  border: `1px solid ${s.border}`,
                  borderRadius: '10px',
                  padding: '0.45rem 0.55rem',
                }}
              >
                <span style={{ width: '30px', height: '30px', flexShrink: 0, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: s.chipBg, color: '#fff', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)' }}>
                  <VehicleIcon id={rec.id} size={16} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.74rem', color: s.text }}>{rec.label}</span>
                    <span style={{ background: s.badgeBg, color: '#fff', borderRadius: '4px', padding: '0 5px', fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                      {s.label}
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '0.64rem', color: '#475569', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {rec.reason}
                  </p>
                </div>
                {eta && (
                  <span style={{ flexShrink: 0, background: '#ffffff', border: `1px solid ${s.border}`, color: s.text, borderRadius: '999px', padding: '0.15rem 0.5rem', fontSize: '0.62rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    ≈ {eta}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VehicleIndicator;