import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import api from '../api';
import OwnerDialog from './OwnerDialog';
import { formatBookingBoundary } from '../utils/stayBooking';
import { externalPaymentNotice, externalPaymentArrangement, isExternalPaymentBooking, isManualDirectWalletBooking } from '../utils/bookingPaymentPolicy';
import './BookingControls.css';

const fmtWhen = value => {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const senderLabel = item => {
  const automated = item.sender_role === 'guest' && String(item.message || '').startsWith('Automated request:');
  if (automated) return 'Guest (automated request)';
  if (item.sender_role === 'guest') return 'Guest';
  if (item.sender_role === 'admin') return 'Administration';
  return 'Property';
};

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
  const wallet = isManualDirectWalletBooking(booking) ? (externalPaymentArrangement(booking) === 'maya' ? 'Maya' : 'GCash') : null;
  const viewingAs = admin ? 'admin' : owner ? 'owner' : 'guest';
  const askDraft = wallet ? `Hello, I chose ${wallet} for booking #${booking.booking_id}. Could you send your ${wallet} QR code or number, recipient name, and the amount I should pay?` : '';

  return <OwnerDialog className="booking-controls booking-conversation-dialog" title={`Booking #${booking.booking_id} · ${booking.hotel_name}`} busy={busy} onClose={() => message ? setDiscard(true) : onClose()} actions={<button type="button" className="gov-btn-primary" onClick={send} disabled={busy || loading || !data || !message.trim()}>{busy ? 'Sending…' : 'Send message'}</button>}>
    <div className="booking-conversation-summary">
      <p><strong>Status:</strong> <span className={`booking-conversation-chip is-${String(current.status || '').toLowerCase()}`}>{current.status || '—'}</span></p>
      <p><strong>Stay:</strong> {formatBookingBoundary(current)} — {formatBookingBoundary(current, 'out')}</p>
      <p><strong>Chat with:</strong> {owner || admin ? 'Guest' : 'Property'} · messages do not confirm bookings or verify payments.</p>
    </div>

    {isExternalPaymentBooking(booking) && <p className="booking-conversation-notice"><strong>{wallet ? `${wallet} · direct to owner` : 'Pay at property'}</strong><br />{externalPaymentNotice(booking)}</p>}

    {wallet && <div className="booking-conversation-guide">
      {owner || admin ? (
        <>
          <p><strong>The guest chose {wallet} (direct to owner).</strong> Send the details the guest needs, then confirm them in this chat:</p>
          <ul>
            <li>Your {wallet} QR code or number</li>
            <li>Account/recipient name</li>
            <li>Exact amount to pay</li>
          </ul>
          <p className="booking-conversation-muted">This conversation does not verify a transfer. Confirm the booking only through the normal reservation process.</p>
        </>
      ) : (
        <>
          <p><strong>Pay the owner directly with {wallet}.</strong> Ask the property for payment details, then confirm before sending money:</p>
          <ul>
            <li>Get the {wallet} QR code or number and recipient name</li>
            <li>Confirm the exact amount</li>
            <li>NaujanGO does not collect or verify this transfer</li>
          </ul>
          <button type="button" className="gov-btn-ghost" disabled={busy || loading || !data || Boolean(message)} onClick={() => setMessage(askDraft)}>Ask for {wallet} QR / number</button>
        </>
      )}
    </div>}

    <div className="booking-conversation-tools"><button className="gov-btn-ghost" type="button" onClick={() => load()} disabled={loading || busy}>Refresh conversation</button>{data?.has_more && <button className="gov-btn-ghost" type="button" onClick={() => load(data.oldest_id)} disabled={loading || busy}>Load earlier messages</button>}</div>
    {loading && <p>Loading conversation…</p>}
    {notice && <p role="status">{notice}</p>}
    {error && <p role="alert">{error} <button type="button" disabled={busy || loading} onClick={() => load()}>Retry conversation</button></p>}

    {data && <div aria-label="Booking conversation" className="booking-conversation-thread">{data.messages.length ? data.messages.map(item => {
      const automated = item.sender_role === 'guest' && String(item.message || '').startsWith('Automated request:');
      const mine = (viewingAs === 'guest' && item.sender_role === 'guest') || (viewingAs !== 'guest' && item.sender_role !== 'guest');
      return <article key={item.message_id} className={`booking-conversation-message${mine ? ' is-mine' : ''}${automated ? ' is-automated' : ''}`}>
        <div className="booking-conversation-message-meta">
          <strong>{senderLabel(item)}</strong>
          {fmtWhen(item.created_at) && <span className="booking-conversation-muted">{fmtWhen(item.created_at)}</span>}
        </div>
        <p>{item.message}</p>
      </article>;
    }) : <p className="booking-conversation-empty">No messages yet. {owner || admin ? 'Send a clear message to the guest about this booking.' : 'Message the property if you need check-in details or payment instructions.'}</p>}</div>}

    <fieldset disabled={busy} className="booking-conversation-compose">
      <label><span className="booking-conversation-compose-label">Message {owner || admin ? 'guest' : 'property'}</span><textarea rows={4} maxLength={4000} value={message} onChange={event => setMessage(event.target.value)} placeholder={owner || admin ? 'Write a clear reply for the guest…' : wallet ? `Ask for ${wallet} details or share a question about your stay…` : 'Write a message to the property…'} /></label>
      <p className="booking-conversation-muted">Never send PINs, OTPs, card details, banking passwords, or identity-document photos. {wallet ? `Confirm the ${wallet} recipient and amount directly with the property before transferring.` : 'Use this chat for booking-related questions only.'}</p>
    </fieldset>
  </OwnerDialog>;
}
