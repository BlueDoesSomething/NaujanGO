import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import api from '../api';
import OwnerDialog from './OwnerDialog';
import { formatBookingBoundary } from '../utils/stayBooking';
import { externalPaymentNotice, externalPaymentArrangement, isExternalPaymentBooking, isManualDirectWalletBooking } from '../utils/bookingPaymentPolicy';
import './BookingControls.css';

export default function BookingConversation({ booking, owner = false, admin = false, onClose, onDirtyChange, onBusyChange }) {
  const base = `${admin ? '/admin/bookings' : owner ? '/owner/bookings' : '/bookings/hotels'}/${booking.booking_id}/messages`;
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [discard, setDiscard] = useState(false);
  const sequence = useRef(0), inFlight = useRef(false), retry = useRef(null);
  const load = async (before = null) => {
    const request = ++sequence.current; setLoading(true); setError('');
    try {
      const response = await api.get(base, { params: before ? { before } : {} });
      if (!response.data?.booking || !Array.isArray(response.data.messages)) throw new Error('Invalid booking conversation');
      if (request === sequence.current) setData(previous => before && previous ? { ...response.data, messages: [...new Map([...response.data.messages, ...previous.messages].map(item => [item.message_id, item])).values()].sort((a, b) => a.message_id - b.message_id) } : response.data);
    } catch (error) { if (request === sequence.current) setError(error.response?.data?.error || 'Could not load the conversation. Please retry.'); }
    finally { if (request === sequence.current) setLoading(false); }
  };
  useEffect(() => { load(); return () => { sequence.current += 1; }; }, [base]);
  useLayoutEffect(() => { onDirtyChange?.(Boolean(message)); onBusyChange?.(busy); }, [message, busy, onDirtyChange, onBusyChange]);
  useLayoutEffect(() => () => { onDirtyChange?.(false); onBusyChange?.(false); }, [onDirtyChange, onBusyChange]);
  useEffect(() => { const warn = event => { if (message || busy) { event.preventDefault(); event.returnValue = ''; } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [message, busy]);
  const send = async () => {
    if (inFlight.current || !message.trim()) return;
    const text = message.trim();
    if (retry.current?.message !== text) retry.current = { message: text, key: crypto.randomUUID() };
    inFlight.current = true; setBusy(true); setError(''); setNotice('');
    try {
      await api.post(base, { message: text, client_key: retry.current.key });
      setMessage(''); retry.current = null; setNotice('Message sent. Booking and payment status were not changed.'); await load();
    } catch (error) { setError(error.response?.data?.error || 'Could not send your message. Your text is retained; please retry.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  if (discard) return <OwnerDialog title="Discard unsent message?" className="booking-controls" onClose={() => setDiscard(false)} actions={<><button type="button" onClick={() => setDiscard(false)}>Keep editing message</button><button type="button" onClick={onClose}>Discard message</button></>}><p>Your unsent message will not be sent or saved.</p></OwnerDialog>;
  const current = data?.booking || booking;
  return <OwnerDialog className="booking-controls" title={`Booking #${booking.booking_id} · ${booking.hotel_name}`} busy={busy} onClose={() => message ? setDiscard(true) : onClose()} actions={<button type="button" className="gov-btn-primary" onClick={send} disabled={busy || loading || !data || !message.trim()}>{busy ? 'Sending…' : 'Send message'}</button>}>
    <p><strong>Booking status:</strong> {current.status} · {formatBookingBoundary(current)} — {formatBookingBoundary(current, 'out')}</p>
    <p>This is a direct conversation with {owner || admin ? 'the guest' : 'the property'}, linked to this booking. Messages do not confirm bookings or verify payments.</p>
    {isExternalPaymentBooking(booking) && <p className="booking-conversation-notice">{externalPaymentNotice(booking)}</p>}
    {isManualDirectWalletBooking(booking) && (owner || admin
      ? <p>The guest chose {externalPaymentArrangement(booking) === 'maya' ? 'Maya' : 'GCash'}. Reply with the property’s {externalPaymentArrangement(booking) === 'maya' ? 'Maya' : 'GCash'} number or QR details and confirm the recipient name and amount. This conversation does not verify a transfer.</p>
      : <button type="button" className="gov-btn-ghost" disabled={busy || loading || !data || Boolean(message)} onClick={() => setMessage(`Hello, I chose ${externalPaymentArrangement(booking) === 'maya' ? 'Maya' : 'GCash'} for booking #${booking.booking_id}. Could you send your ${externalPaymentArrangement(booking) === 'maya' ? 'Maya' : 'GCash'} QR code or number, recipient name, and the amount I should pay?`)}>Ask for {externalPaymentArrangement(booking) === 'maya' ? 'Maya' : 'GCash'} QR / number</button>)}
    <div className="booking-conversation-tools"><button className="gov-btn-ghost" type="button" onClick={() => load()} disabled={loading || busy}>Refresh conversation</button>{data?.has_more && <button className="gov-btn-ghost" type="button" onClick={() => load(data.oldest_id)} disabled={loading || busy}>Load earlier messages</button>}</div>
    {loading && <p>Loading conversation…</p>}
    {notice && <p role="status">{notice}</p>}
    {error && <p role="alert">{error} <button type="button" disabled={busy || loading} onClick={() => load()}>Retry conversation</button></p>}
    {data && <div aria-label="Booking conversation">{data.messages.length ? data.messages.map(item => {
      const automated = item.sender_role === 'guest' && item.message.startsWith('Automated request:');
      return <article key={item.message_id} className="booking-conversation-message"><strong>{automated ? 'Guest (automated request)' : item.sender_role === 'guest' ? 'Guest' : item.sender_role === 'admin' ? 'Administration' : 'Property'}</strong><p>{item.message}</p></article>;
    }) : <p>No messages yet.</p>}</div>}
    <fieldset disabled={busy}><label>Message<textarea rows={3} maxLength={4000} value={message} onChange={event => setMessage(event.target.value)} /></label><p>Never send PINs, OTPs, card details, banking passwords, or identity-document photos. Confirm any GCash recipient and amount directly with the property before transferring.</p></fieldset>
  </OwnerDialog>;
}
