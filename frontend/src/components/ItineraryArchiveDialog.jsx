import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// A styled top-layer dialog stays above the navbar, draggable chat and bottom
// navigation without z-index races. Native modal behavior traps focus/inerts
// the background; opening/cancelling never writes to the itinerary API.
export default function ItineraryArchiveDialog({ name, message, busy, error, onCancel, onConfirm, labels }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const actionsRef = useRef({ busy, onCancel });
  actionsRef.current = { busy, onCancel };
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    const dialog = dialogRef.current;
    const handleCancel = event => {
      event.preventDefault();
      if (!actionsRef.current.busy) actionsRef.current.onCancel();
    };
    dialog.addEventListener('cancel', handleCancel);
    dialog.showModal();
    cancelRef.current?.focus({ preventScroll: true });
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.close();
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <dialog ref={dialogRef} className="itin-archive-dialog" aria-labelledby="itin-archive-title" aria-describedby="itin-archive-description"
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (!busy) onCancel(); }
        if (event.key !== 'Tab') return;
        const controls = [...event.currentTarget.querySelectorAll('button:not([disabled])')];
        const first = controls[0], last = controls.at(-1);
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}
      onClick={event => {
        if (busy || event.target !== dialogRef.current) return;
        const rect = dialogRef.current.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onCancel();
      }}>
      <h2 id="itin-archive-title">{labels.title}</h2>
      <p className="itin-archive-name">{name}</p>
      <p id="itin-archive-description">{message}</p>
      {error && <p className="itin-archive-error" role="alert">{error}</p>}
      <div className="itin-archive-buttons">
        <button ref={cancelRef} type="button" disabled={busy} onClick={onCancel}>{labels.cancel}</button>
        <button type="button" className="itin-archive-confirm" disabled={busy} aria-busy={busy} onClick={onConfirm}>{busy ? labels.busy : labels.confirm}</button>
      </div>
    </dialog>, document.body
  );
}
