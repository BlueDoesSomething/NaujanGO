import React, { useEffect, useRef, useState } from 'react';
import api from '../api';
import './ArchiveRecordModal.css';

const fields = ['booking_id', 'payment_id', 'hotel_id', 'itinerary_id', 'id', 'name', 'hotel_name', 'customer_name',
  'booking_reference', 'receipt_number', 'status', 'payment_status', 'method', 'transaction_reference',
  'total_amount', 'amount', 'currency', 'check_in', 'check_out', 'created_at', 'archived_at'];

const ArchiveRecordModal = ({ record, type, onClose, allowDeletion = false, onDeleted }) => {
  const [review, setReview] = useState(null);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef(null);
  const busyRef = useRef(busy);
  const closeRef = useRef(onClose);
  busyRef.current = busy;
  closeRef.current = onClose;
  const financial = ['booking', 'payment'].includes(type);
  const id = record.booking_id && type === 'booking' ? record.booking_id
    : type === 'payment' ? record.payment_id : type === 'hotel' ? record.hotel_id : type === 'itinerary' ? record.itinerary_id : record.id;

  useEffect(() => {
    let active = true;
    if (allowDeletion && !financial) {
      api.get(`/admin/archive/${type}/${id}/deletion-review`).then(response => {
        if (active) setReview(response.data);
      }).catch(failure => { if (active) setError(failure.response?.data?.error || 'Deletion eligibility could not be verified.'); });
    }
    return () => { active = false; };
  }, [type, id, allowDeletion, financial]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    dialogRef.current?.querySelector('button')?.focus();
    const keyboard = event => {
      if (event.key === 'Escape' && !busyRef.current) closeRef.current();
      if (event.key !== 'Tab') return;
      const controls = [...dialogRef.current.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]')]
        .filter(node => node.getClientRects().length);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (!dialogRef.current.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', keyboard);
    return () => {
      window.removeEventListener('keydown', keyboard);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  const permanentlyDelete = async () => {
    setBusy(true);
    setError('');
    try {
      await api.delete(`/admin/archive/${type}/${id}`, { data: { confirmation, reason } });
      await onDeleted?.();
      onClose();
    } catch (failure) {
      setError(failure.response?.data?.error || 'Deletion failed. The record was retained.');
      if (failure.response?.status === 409) setReview(current => ({ ...current, can_delete: false, blockers: failure.response.data.details || [failure.response.data.error] }));
    } finally { setBusy(false); }
  };

  return (
    <div className="archive-record-overlay" onClick={() => { if (!busy) onClose(); }}>
      <section ref={dialogRef} className="archive-record-dialog" role="dialog" aria-modal="true" aria-labelledby="archive-record-title" onClick={event => event.stopPropagation()}>
        <div className="archive-record-heading">
          <h2 id="archive-record-title">{Number(record.archived) === 1 ? 'Archived ' : ''}{type} #{id}</h2>
          <button type="button" className="gov-btn gov-btn-ghost" onClick={onClose} disabled={busy} aria-label="Close archived record">Close</button>
        </div>
        <dl className="archive-record-fields">
          {fields.filter(field => record[field] != null).map(field => (
            <React.Fragment key={field}><dt>{field.replaceAll('_', ' ')}</dt><dd>{String(record[field])}</dd></React.Fragment>
          ))}
        </dl>
        {financial && <p>Financial records are retained. You can restore this record, but cannot permanently delete it. Archiving only changes visibility in your dashboard.</p>}
        {error && <p role="alert">{error}</p>}
        {allowDeletion && !financial && (
          <div className="archive-record-deletion">
            <h3>Permanent deletion safety check</h3>
            {!review && !error && <p>Checking for linked records…</p>}
            {review && !review.can_delete && <ul>{review.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}</ul>}
            {review?.can_delete && <>
              <p>This is irreversible. Only delete unused/test content. The server will recheck all dependencies before deleting.</p>
              <label>Deletion reason (10–500 characters)
                <textarea value={reason} onChange={event => setReason(event.target.value)} minLength={10} maxLength={500} disabled={busy} />
              </label>
              <label>Type <strong>{review.confirmation}</strong> to confirm
                <input value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" disabled={busy} />
              </label>
              <button type="button" className="gov-btn gov-btn-danger" disabled={busy || confirmation !== review.confirmation || reason.trim().length < 10} onClick={permanentlyDelete}>
                {busy ? 'Deleting…' : 'Delete permanently'}
              </button>
            </>}
          </div>
        )}
      </section>
    </div>
  );
};

export default ArchiveRecordModal;
