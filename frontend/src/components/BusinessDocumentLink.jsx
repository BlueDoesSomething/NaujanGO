import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api, { getApiBaseUrl } from '../api';
import { businessDocumentError, businessDocumentLocation, documentPreviewType } from '../utils/businessDocuments';

export default function BusinessDocumentLink({ url, children = 'View document', style }) {
  const [open, setOpen] = useState(false);
  const [document, setDocument] = useState(null);
  const [error, setError] = useState('');
  const dialogRef = useRef(null);
  const location = businessDocumentLocation(url, getApiBaseUrl());
  const requestUrl = location && !location.external ? location.url : null;
  useEffect(() => {
    if (!open || !requestUrl) return;
    let active = true, objectUrl;
    const controller = new AbortController();
    setDocument(null); setError('');
    api.get(requestUrl, { responseType: 'blob', signal: controller.signal }).then(response => {
      if (!active) return;
      const type = documentPreviewType(response.data.type);
      if (!type) { setError('The server did not return a supported image or PDF document.'); return; }
      objectUrl = URL.createObjectURL(response.data);
      setDocument({ url: objectUrl, type });
    }).catch(async failure => {
      if (!active) return;
      const message = await businessDocumentError(failure);
      if (active) setError(message);
    });
    return () => { active = false; controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [open, requestUrl]);
  useEffect(() => {
    if (!open) return;
    const previousFocus = window.document.activeElement;
    const previousOverflow = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('button')?.focus();
    const keyboard = event => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const controls = [...dialogRef.current.querySelectorAll('button, a[href], iframe')];
      const first = controls[0], last = controls.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (!dialogRef.current.contains(window.document.activeElement)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && window.document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && window.document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', keyboard);
    return () => {
      window.removeEventListener('keydown', keyboard);
      window.document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);
  if (!location) return <span style={{ ...style, color: '#b91c1c' }}>Invalid document link — please re-upload</span>;
  if (location.external) return <a href={location.url} target="_blank" rel="noopener noreferrer" style={style}>{children}</a>;
  return <>
    <button type="button" onClick={() => { setDocument(null); setError(''); setOpen(true); }} style={{ background: 'none', border: 0, padding: 0, color: '#1B5E20', textDecoration: 'underline', cursor: 'pointer', textAlign: 'left', font: 'inherit', ...style }}>{children}</button>
    {open && createPortal(<div style={{ position: 'fixed', inset: 0, zIndex: 11000, background: 'rgba(2, 6, 23, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-label="Verification document" style={{ background: 'white', borderRadius: 12, padding: 20, width: 'min(95vw, 1000px)', maxHeight: '92vh', overflowY: 'auto', color: '#1f2937' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Verification document</h2>
          <button type="button" className="gov-btn-ghost" onClick={() => setOpen(false)}>Close</button>
        </div>
        {error ? <p role="alert" style={{ color: '#b91c1c' }}>{error}</p> : !document ? <p role="status">Loading document…</p> : <>
          <a href={document.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginBottom: 12 }}>Open full-size document</a>
          {document.type === 'image' ? <img src={document.url} alt="Submitted business verification document" style={{ display: 'block', maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', margin: 'auto' }} />
            : <iframe src={document.url} title="Submitted business verification PDF" style={{ display: 'block', width: '100%', height: '70vh', border: '1px solid #d1d5db' }} />}
        </>}
      </section>
    </div>, window.document.body)}
  </>;
}
