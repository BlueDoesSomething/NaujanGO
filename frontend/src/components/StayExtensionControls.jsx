import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import { extensionPreview, formatBookingBoundary, stayProgress } from '../utils/stayBooking';
import StayExtensionHistory from './StayExtensionHistory';

const requestKey = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export default function StayExtensionControls({ booking, onSaved }) {
  const [now, setNow] = useState(Date.now());
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState(null);
  const [hours, setHours] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const retryKey = useRef(null);
  const closeButton = useRef(null);
  const dialogRef = useRef(null);
  const busyRef = useRef(saving);
  busyRef.current = saving;
  useEffect(() => {
    if (!booking.stay_duration_hours || booking.status !== 'confirmed') return;
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, [booking.stay_duration_hours, booking.status]);
  const load = async () => {
    setLoading(true); setOptions(null); setError(''); setAgreed(false); setSaved(false); retryKey.current = null;
    try {
      const response = await api.get(`/owner/bookings/${booking.booking_id}/extension-options`);
      setOptions(response.data); setHours(String(response.data.packages?.[0]?.hours || ''));
    } catch (error) { setError(error.response?.data?.error || 'Unable to load extension options.'); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    if (!open) return;
    load();
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; closeButton.current?.focus();
    const keyboard = event => {
      if (event.key === 'Escape' && !busyRef.current) setOpen(false);
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const controls = [...dialogRef.current.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled])')]
        .filter(node => node.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (!dialogRef.current.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', keyboard);
    return () => {
      window.removeEventListener('keydown', keyboard);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);
  const progress = stayProgress(booking, now);
  if (!progress) return null;
  const selected = options?.packages?.find(item => Number(item.hours) === Number(hours));
  const preview = selected ? extensionPreview(options.booking.check_out_at, selected.hours, selected.rate, options.booking.rooms) : null;
  const overduePreview = preview && new Date(`${preview.checkout.replace(' ', 'T')}+08:00`).getTime() <= now;
  const confirm = async () => {
    if (!selected || !preview || !agreed || overduePreview || saving || saved) return;
    setSaving(true); setError('');
    try {
      retryKey.current ||= requestKey();
      await api.post(`/owner/bookings/${booking.booking_id}/extend`, {
        hours: selected.hours, expected_checkout_at: options.booking.check_out_at,
        expected_rate: selected.rate, guest_agreed: true, request_key: retryKey.current
      });
      setSaved(true);
      try { await onSaved?.(); setOpen(false); }
      catch { setError('Extension saved. Reload the dashboard to see the updated booking.'); }
    } catch (error) { setError(error.response?.data?.error || 'Could not confirm the extension. Retrying this approval will not add the amount twice.'); }
    finally { setSaving(false); }
  };
  return <div className="gov-row-extension">
    <small role="status" style={{ color: progress.state === 'overdue' ? '#b91c1c' : progress.state === 'soon' ? '#92400e' : '#64748b' }}>{progress.label}</small>
    {progress.canExtend && <button type="button" className="gov-btn gov-btn-primary" onClick={() => setOpen(true)}>Extend Stay</button>}
    {open && createPortal(<div className="hd-modal-back">
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-label="Approve stay extension" style={{ background: 'white', borderRadius: 14, padding: 24, width: 'min(94vw, 560px)', maxHeight: '90vh', overflowY: 'auto' }}>
        <button ref={closeButton} type="button" className="gov-btn gov-btn-ghost" style={{ float: 'right' }} disabled={saving} onClick={() => setOpen(false)}>Close</button>
        <h2>Extend Stay</h2>
        <p>Booking #{booking.booking_id} · {booking.room_type_name}</p>
        {loading ? <p>Loading configured room packages…</p> : <>
          {options && <>
            <p>Current checkout: <strong>{formatBookingBoundary(options.booking, 'out')}</strong></p>
            <label>Additional package
              <select className="gov-input" disabled={saving || saved} value={hours} onChange={event => {
                setHours(event.target.value); setAgreed(false); retryKey.current = null; setError('');
              }}>
                {!options.packages.length && <option value="">No extension packages configured</option>}
                {options.packages.map(item => <option key={item.hours} value={item.hours}>
                  {item.hours} hours — {options.booking.currency} {Number(item.additional_amount).toFixed(2)} for {options.booking.rooms} room(s)
                </option>)}
              </select>
            </label>
            {preview && <div style={{ padding: '0.8rem', background: '#f0fdf4', margin: '0.8rem 0', borderRadius: 8 }}>
              <p>New checkout: <strong>{preview.checkout.slice(0, 16)} PHT</strong></p>
              <p>Additional charge: <strong>{options.booking.currency} {preview.amount.toFixed(2)}</strong></p>
              <p>New booking total: {options.booking.currency} {(Number(options.booking.total_amount) + preview.amount).toFixed(2)}</p>
              {overduePreview && <p role="alert">This package would still end in the past. Select a longer extension.</p>}
            </div>}
            <p>Starts from the current checkout time. Room availability and the price are rechecked when confirmed. This does not record money as received.</p>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '1rem 0' }}>
              <input type="checkbox" checked={agreed} disabled={saving || saved} onChange={event => setAgreed(event.target.checked)} />
              The guest agreed to this extension and the additional charge.
            </label>
            <StayExtensionHistory booking={options.booking} />
          </>}
          {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
          {!saved && <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button className="gov-btn gov-btn-ghost" type="button" disabled={saving} onClick={load}>Reload Details</button>
            <button className="gov-btn gov-btn-primary" type="button" disabled={saving || !agreed || !preview || overduePreview} onClick={confirm}>{saving ? 'Saving…' : 'Approve Extension'}</button>
          </div>}
        </>}
      </section>
    </div>, document.body)}
  </div>;
}
