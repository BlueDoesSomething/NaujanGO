import React, { useRef, useState } from 'react';
import api from '../api';
import useBookingPolicy from '../hooks/useBookingPolicy';
import './BookingControls.css';

export default function AdminBookingPolicy() {
  const { policy, loading, error: loadError, refresh } = useBookingPolicy();
  const [mode, setMode] = useState('off'), [reason, setReason] = useState(''), [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const inFlight = useRef(false);
  const save = async () => {
    if (inFlight.current) return;
    if (!reason.trim()) { setError('Provide a reason for this policy change.'); return; }
    if (mode === 'on' && !confirm) { setError('Confirm that the client has authorized online payments.'); return; }
    inFlight.current = true; setBusy(true); setError(''); setNotice('');
    try { await api.put('/admin/booking-policy', { online_payments_enabled: mode === 'on', lock_version: policy.lock_version, reason, confirm_enable: confirm }); await refresh(); setReason(''); setConfirm(false); setNotice('Payment policy saved. Bookings remain available. Existing pay-at-property reservations keep their original payment arrangement.'); }
    catch (error) { setError(error.response?.data?.error || 'Could not save the payment policy. Please retry.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  return <section className="booking-controls gov-glass-panel" aria-label="Platform payment policy"><h2>Platform payment policy</h2>
    {loading ? <p>Checking payment policy…</p> : <p><strong>{policy.online_payments_enabled ? 'Online payments enabled' : 'Online payments OFF — bookings stay available; pay at property'}</strong></p>}
    <p>Only admins can change this switch. Owners cannot override it. Existing financial records, provider callbacks and refunds are preserved.</p>
    <p>Disabling blocks new payment requests. It cannot retract checkout pages already opened at a gateway; review active sessions in the provider dashboard before announcing that online collection has stopped.</p>
    {!loading && !policy.storage_ready && <p role="alert">Apply migrations/055_admin_payment_controls.sql before changing this policy or using pay-at-property bookings and messages.</p>}
    {(loadError || error) && <p role="alert">{loadError || error} <button type="button" onClick={refresh}>Reload policy</button></p>}{notice && <p role="status">{notice}</p>}
    <fieldset disabled={busy || loading || !policy.storage_ready || Boolean(loadError)}><label>Online payments<select value={mode} onChange={event => { setMode(event.target.value); setConfirm(false); }}><option value="off">Disabled — keep bookings; pay at property (default)</option><option value="on">Enable online payment processing</option></select></label>
      {mode === 'on' && <label className="booking-policy-checkbox"><input type="checkbox" checked={confirm} onChange={event => setConfirm(event.target.checked)} />I confirm the client has authorized online payments and gateway configuration has been reviewed.</label>}
      <label>Reason for change<textarea maxLength={1000} rows={2} value={reason} onChange={event => setReason(event.target.value)} /></label>
      <button type="button" className="gov-btn-primary" onClick={save}>{busy ? 'Saving…' : 'Save platform policy'}</button>
    </fieldset>
  </section>;
}
