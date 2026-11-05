import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

// One keyboard/focus/scroll-safe dialog for owner confirmations and details.
export default function OwnerDialog({ title, children, onClose, busy = false, actions, className = '' }) {
  const ref = useRef(null);
  const titleId = useId();
  const close = useRef(onClose), busyRef = useRef(busy);
  close.current = onClose; busyRef.current = busy;
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector('button, input, [tabindex="0"]')?.focus();
    const keyboard = event => {
      if (event.key === 'Escape' && !busyRef.current) { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab') return;
      const nodes = [...ref.current.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], summary, [tabindex="0"]')].filter(node => node.getClientRects().length && !node.matches(':disabled'));
      const first = nodes[0], last = nodes.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (!ref.current.contains(document.activeElement) || (!event.shiftKey && document.activeElement === last)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keyboard); if (previous?.isConnected) previous.focus(); };
  }, []);
  return createPortal(<div className="owner-dialog-back" onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className={`owner-dialog ${className}`} ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header><h2 id={titleId}>{title}</h2><button type="button" className="gov-btn-ghost" onClick={onClose} disabled={busy}>Close</button></header>
      <div className="owner-dialog-content">{children}</div>
      {actions && <footer>{actions}</footer>}
    </section>
  </div>, document.body);
}
