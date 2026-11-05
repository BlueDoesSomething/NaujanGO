import React, { useRef, useState } from 'react';
import api from '../api';
import OwnerDialog from './OwnerDialog';
import TourismArrivalCounts from './TourismArrivalCounts';
import { ARRIVAL_STATUSES } from '../utils/tourismArrivals';

export default function TourismArrivalReportDetails({ details, admin = false, onClose, onReviewed }) {
  const { report, history = [] } = details;
  const [decision, setDecision] = useState('approved'), [note, setNote] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const review = async () => {
    if (inFlight.current) return;
    if (decision === 'returned' && !note.trim()) { setError('Explain what the owner needs to correct.'); return; }
    inFlight.current = true; setBusy(true); setError('');
    try { await api.post(`/admin/tourism-arrival-reports/${report.report_id}/review`, { decision, review_note: note, lock_version: report.lock_version }); await onReviewed(); }
    catch (error) { setError(error.response?.data?.error || 'Could not review this report. Your feedback is retained; please retry.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  return <OwnerDialog className="tourism-reports" title={`${report.property_name} · ${report.arrival_month}`} onClose={onClose} busy={busy} actions={admin && report.status === 'submitted' ? <button type="button" className="gov-btn-primary" disabled={busy} onClick={review}>{busy ? 'Saving review…' : decision === 'approved' ? 'Approve report' : 'Return for correction'}</button> : null}>
    <p><strong>{ARRIVAL_STATUSES[report.status]}</strong> · Submission revision {report.revision}</p>
    {report.status === 'returned' && <p className="tourism-help">{admin ? 'Last submitted counts are shown. In-progress owner corrections are not included until resubmission.' : 'Saved corrections are shown. Previously submitted counts are preserved in the history below.'}</p>}
    <TourismArrivalCounts values={report} readOnly />
    {report.notes && <p><strong>Owner notes:</strong> {report.notes}</p>}
    {report.review_note && <p className="tourism-feedback"><strong>Admin feedback:</strong> {report.review_note}</p>}
    <p className="tourism-help">Only approved owner reports enter the new arrival totals. These counts do not change bookings or payments.</p>
    {admin && report.status === 'submitted' && <fieldset disabled={busy} className="tourism-review-fields">
      <label>Review decision<select value={decision} onChange={event => setDecision(event.target.value)}><option value="approved">Approve</option><option value="returned">Return for correction</option></select></label>
      <label>Feedback {decision === 'returned' ? '(required)' : '(optional)'}<textarea maxLength={4000} rows={3} value={note} onChange={event => setNote(event.target.value)} /></label>
    </fieldset>}
    {error && <p className="tourism-error" role="alert">{error}</p>}
    <h3>Submission history</h3>
    {history.length ? history.map(item => <details key={item.revision} className="tourism-history-entry"><summary>Revision {item.revision} · {ARRIVAL_STATUSES[item.decision]} · {String(item.submitted_at || '').replace('T', ' ').slice(0, 19)}</summary>
      <TourismArrivalCounts values={item} readOnly />{item.notes && <p>{item.notes}</p>}{item.review_note && <p><strong>Feedback:</strong> {item.review_note}</p>}
    </details>) : <p>No submission yet. This report is still a draft.</p>}
  </OwnerDialog>;
}
