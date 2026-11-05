import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import api from '../api';
import OwnerDialog from './OwnerDialog';
import TourismArrivalCounts from './TourismArrivalCounts';
import TourismArrivalReportDetails from './TourismArrivalReportDetails';
import Pagination from './Pagination';
import { ARRIVAL_STATUSES, arrivalFormFromReport, arrivalTotals, emptyArrivalForm, reportingMonth, validateArrivalForm } from '../utils/tourismArrivals';

export default function OwnerTourismArrivals({ hotels, draftStore, onDirtyChange, onBusyChange, confirmLeave }) {
  const initial = useRef(draftStore.current).current;
  const [form, setForm] = useState(initial?.form || null), [baseline, setBaseline] = useState(initial?.baseline || '');
  const [reports, setReports] = useState([]), [total, setTotal] = useState(0), [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true), [loadError, setLoadError] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [errors, setErrors] = useState({}), [busy, setBusy] = useState(false), [preview, setPreview] = useState(null), [agreed, setAgreed] = useState(false), [details, setDetails] = useState(null);
  const inFlight = useRef(false), request = useRef(0);
  const dirty = Boolean(form && JSON.stringify(form) !== baseline);
  useLayoutEffect(() => { draftStore.current = form ? { form, baseline } : null; onDirtyChange(dirty); onBusyChange(busy); }, [form, baseline, dirty, busy, draftStore, onDirtyChange, onBusyChange]);
  useLayoutEffect(() => () => { onDirtyChange(false); onBusyChange(false); }, [onDirtyChange, onBusyChange]);
  const load = async () => {
    const sequence = ++request.current; setLoading(true); setLoadError('');
    try {
      const response = await api.get('/owner/tourism-arrival-reports', { params: { page } });
      if (!Array.isArray(response.data?.reports) || !Number.isFinite(Number(response.data.total))) throw new Error('Invalid report response');
      if (sequence === request.current) { setReports(response.data.reports); setTotal(Number(response.data.total)); }
    } catch (error) { if (sequence === request.current) setLoadError(error.response?.data?.error || 'Could not load your reports. Saved reports have not been deleted.'); }
    finally { if (sequence === request.current) setLoading(false); }
  };
  useEffect(() => { load(); return () => { request.current += 1; }; }, [page]);
  const edit = next => { setForm(next); setBaseline(JSON.stringify(next)); setErrors({}); setError(''); };
  const open = (report, viewOnly = false) => confirmLeave(async () => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try { const response = await api.get(`/owner/tourism-arrival-reports/${report.report_id}`); if (!viewOnly && ['draft', 'returned'].includes(response.data.report.status)) edit(arrivalFormFromReport(response.data.report)); else { setForm(null); setDetails(response.data); } }
    catch (error) { setError(error.response?.data?.error || 'Could not open this report. Please retry.'); }
    finally { inFlight.current = false; setBusy(false); }
  });
  const save = async forSubmission => {
    if (inFlight.current) return;
    const validation = validateArrivalForm(form, forSubmission); setErrors(validation); setError('');
    if (Object.keys(validation).length) return;
    inFlight.current = true; setBusy(true);
    try {
      const response = form.report_id ? await api.put(`/owner/tourism-arrival-reports/${form.report_id}`, form) : await api.post('/owner/tourism-arrival-reports', form);
      const saved = arrivalFormFromReport(response.data.report);
      edit(saved); setNotice('Draft saved. It is not included in admin arrival totals yet.'); await load();
      if (forSubmission) { setAgreed(false); setPreview(saved); }
    } catch (error) { setError(error.response?.data?.error || 'Could not save your report. Your edits are still here; please retry.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const submit = async () => {
    if (inFlight.current || !agreed) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      await api.post(`/owner/tourism-arrival-reports/${preview.report_id}/submit`, { lock_version: preview.lock_version });
      setPreview(null); setForm(null); setNotice('Report submitted to Admin for review. It will enter totals only after approval.'); await load();
    } catch (error) { setError(error.response?.data?.error || 'Could not submit this report. Check its status before retrying; your saved draft is retained.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  return <section className="tourism-reports" aria-label="Owner tourism arrivals">
    <h1 className="gov-page-title">Tourism Arrivals</h1>
    <p>Submit one monthly guest-arrival report per property. Count people who actually arrived, including reportable walk-ins—not rooms, future reservations, cancellations or no-shows.</p>
    {notice && <p role="status" className="tourism-notice">{notice}</p>}
    {error && !preview && <p role="alert" className="tourism-error">{error}</p>}
    <button type="button" className="gov-btn-primary" disabled={!hotels.length || busy} onClick={() => confirmLeave(() => edit(emptyArrivalForm(hotels[0]?.hotel_id)))}>New monthly report</button>
    {!hotels.length && <p>Create your property before reporting arrivals.</p>}
    {form && <section className="gov-glass-panel tourism-editor">
      <h2>{form.status === 'returned' ? 'Correct monthly report' : 'Monthly report draft'}</h2>
      {form.review_note && <p className="tourism-feedback"><strong>Admin feedback:</strong> {form.review_note}</p>}
      <fieldset disabled={busy} className="tourism-fields">
        <div className="tourism-filters"><label>Property<select value={form.hotel_id} disabled={Boolean(form.report_id)} onChange={event => setForm({ ...form, hotel_id: event.target.value })}>{hotels.map(hotel => <option key={hotel.hotel_id} value={hotel.hotel_id}>{hotel.name}</option>)}</select>{errors.hotel_id && <small className="tourism-field-error">{errors.hotel_id}</small>}</label>
          <label>Reporting month<input type="month" max={reportingMonth()} value={form.arrival_month} disabled={Boolean(form.report_id)} onChange={event => setForm({ ...form, arrival_month: event.target.value })} />{errors.arrival_month && <small className="tourism-field-error">{errors.arrival_month}</small>}</label></div>
        <TourismArrivalCounts values={form} errors={errors} onChange={(field, value) => setForm({ ...form, [field]: value })} />
        <p className="tourism-help">Enter 0 for a genuine zero count. Blank counts mean not yet recorded, not zero. Choose exactly one visitor category for each guest.</p>
        <label>Notes (optional)<textarea maxLength={4000} rows={3} value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} /></label>
        <div className="tourism-actions"><button type="button" className="gov-btn-ghost" onClick={() => confirmLeave(() => setForm(null))}>Close editor</button><button type="button" className="gov-btn-ghost" onClick={() => save(false)}>Save Draft</button><button type="button" className="gov-btn-primary" onClick={() => save(true)}>Preview &amp; Submit</button></div>
      </fieldset>
    </section>}
    <h2>Report history</h2>
    {loadError && <p role="alert" className="tourism-error">{loadError} <button type="button" onClick={load}>Retry reports</button></p>}
    {loading ? <p>Loading reports…</p> : !loadError && <>
      <div className="tourism-table-wrap"><table className="gov-table"><thead><tr><th>Month</th><th>Property</th><th>Status</th><th>Arrivals</th><th>Actions</th></tr></thead><tbody>{reports.map(report => <tr key={report.report_id}>
        <td>{report.arrival_month}</td><td>{report.property_name}</td><td><span className="tourism-status" data-status={report.status}>{ARRIVAL_STATUSES[report.status]}</span></td><td>{arrivalTotals(report).total ?? 'Incomplete draft'}</td><td><button type="button" className="gov-btn-ghost" disabled={busy} onClick={() => open(report)}>{['draft', 'returned'].includes(report.status) ? 'Edit report' : 'View report'}</button>{report.status === 'returned' && <button type="button" className="gov-btn-ghost" disabled={busy} onClick={() => open(report, true)}>View history</button>}</td>
      </tr>)}</tbody></table></div>
      {!reports.length && <p>No reports have been saved yet. A missing report is not a zero-arrival report.</p>}
      <Pagination page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} totalItems={total} pageSize={20} label="reports" />
    </>}
    {details && <TourismArrivalReportDetails details={details} onClose={() => setDetails(null)} />}
    {preview && <OwnerDialog className="tourism-reports" title={`Review arrivals · ${preview.arrival_month}`} busy={busy} onClose={() => setPreview(null)} actions={<><button type="button" className="gov-btn-ghost" disabled={busy} onClick={() => setPreview(null)}>Keep editing</button><button type="button" className="gov-btn-primary" disabled={busy || !agreed} onClick={submit}>{busy ? 'Submitting…' : 'Submit to Admin'}</button></>}>
      <p><strong>{preview.property_name}</strong></p><TourismArrivalCounts values={preview} readOnly />
      {arrivalTotals(preview).total === 0 && <p>This is a zero-arrival report, not a missing report.</p>}
      <label className="tourism-confirm"><input type="checkbox" checked={agreed} onChange={event => setAgreed(event.target.checked)} disabled={busy} />I confirm these counts represent actual guest arrivals for this property and month.</label>
      <p>After submission, only Admin can return this report for correction.</p>{error && <p role="alert" className="tourism-error">{error}</p>}
    </OwnerDialog>}
  </section>;
}
