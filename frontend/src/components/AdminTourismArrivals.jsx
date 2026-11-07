import React, { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../api';
import Pagination from './Pagination';
import TourismArrivalCounts from './TourismArrivalCounts';
import TourismArrivalReportDetails from './TourismArrivalReportDetails';
import { ARRIVAL_CATEGORIES, ARRIVAL_STATUSES, arrivalTotals, arrivalExport, previousReportingMonth, reportingMonth } from '../utils/tourismArrivals';
import { downloadReportCsv, downloadReportPdf } from '../utils/exportFiles';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
export default function AdminTourismArrivals() {
  const [month, setMonth] = useState(previousReportingMonth), [hotelId, setHotelId] = useState(''), [status, setStatus] = useState('submitted'), [page, setPage] = useState(1);
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState(''), [details, setDetails] = useState(null), [exporting, setExporting] = useState(false), [opening, setOpening] = useState(false);
  const sequence = useRef(0), detailSequence = useRef(0), exportInFlight = useRef(false);
  const load = async () => {
    const request = ++sequence.current; setLoading(true); setOpening(false); setError('');
    if (!month) { setData(null); setLoading(false); return; }
    try {
      const [list, summary, coverage] = await Promise.all([
        api.get('/admin/tourism-arrival-reports', { params: { arrival_month: month, hotel_id: hotelId || undefined, status, page } }),
        api.get('/admin/tourism-arrival-reports/summary', { params: { arrival_month: month } }),
        api.get('/admin/tourism-arrival-reports/coverage', { params: { arrival_month: month } })
      ]);
      if (!Array.isArray(list.data?.reports) || !Number.isFinite(Number(list.data.total)) || !summary.data?.totals || !Array.isArray(coverage.data?.properties)) throw new Error('Invalid reporting response');
      if (request === sequence.current) {
        setData({ ...list.data, summary: summary.data, properties: coverage.data.properties });
        const lastPage = Math.max(1, Math.ceil(Number(list.data.total) / 20));
        if (page > lastPage) setPage(lastPage);
      }
    } catch (error) { if (request === sequence.current) setError(error.response?.data?.error || 'Could not load tourism reports. No saved data has been deleted.'); }
    finally { if (request === sequence.current) setLoading(false); }
  };
  useEffect(() => { load(); return () => { sequence.current += 1; detailSequence.current += 1; }; }, [month, hotelId, status, page]);
  const open = async report => {
    const request = ++detailSequence.current; setOpening(true); setError('');
    try { const response = await api.get(`/admin/tourism-arrival-reports/${report.report_id}`); if (request === detailSequence.current) setDetails(response.data); }
    catch (error) { if (request === detailSequence.current) setError(error.response?.data?.error || 'Could not open the report. Please retry.'); }
    finally { if (request === detailSequence.current) setOpening(false); }
  };
  const exportApproved = async format => {
    if (exportInFlight.current || !month) return;
    exportInFlight.current = true; setExporting(true); setError('');
    try {
      const response = await api.get('/admin/tourism-arrival-reports/export', { params: { arrival_month: month, hotel_id: hotelId || undefined } });
      if (!Array.isArray(response.data?.reports)) throw new Error('Invalid export response');
      const report = arrivalExport(response.data.reports, month);
      if (format === 'csv') downloadReportCsv(report); else await downloadReportPdf(report);
    } catch (error) { setError(error.response?.data?.error || 'Could not download this report. Please retry.'); }
    finally { exportInFlight.current = false; setExporting(false); }
  };
  const missing = data?.properties.filter(property => ['not_submitted', 'draft', 'returned'].includes(property.status)) || [];
  const totals = data && Number(data.summary.totals.approved_reports) > 0 ? arrivalTotals(data.summary.totals) : null;
  return <section className="tourism-reports" aria-label="Admin owner tourism submissions">
    <p>Review monthly property submissions. Only approved owner reports appear in these totals; historical/manual monthly records remain separate.</p>
    <div className="tourism-filters">
      <label>Reporting month<input type="month" value={month} max={reportingMonth()} required onChange={event => { setMonth(event.target.value); setPage(1); setHotelId(''); }} /></label>
      <label>Property<select value={hotelId} onChange={event => { setHotelId(event.target.value); setPage(1); }}><option value="">All properties</option>{(data?.properties || []).map(property => <option key={property.hotel_id} value={property.hotel_id}>{property.property_name}</option>)}</select></label>
      <label>Submission status<select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="submitted">Awaiting review</option><option value="approved">Approved</option><option value="returned">Needs correction</option><option value="all">All submitted reports</option></select></label>
      <button type="button" className="gov-btn-ghost" onClick={load} disabled={loading || !month}>Refresh reports</button>
    </div>
    {!month && <p>Select a reporting month to view reports.</p>}
    {notice && <p role="status" className="tourism-notice">{notice}</p>}
    {error && <p role="alert" className="tourism-error">{error} <button type="button" onClick={load} disabled={!month}>Retry reports</button></p>}
    {loading ? <p>Loading tourism reports…</p> : month && !error && data && <>
      <div className="tourism-summary" aria-label="Approved monthly arrivals">
        {[['Approved property reports', Number(data.summary.totals.approved_reports)], ['Total arrivals', totals?.total], ['Resident', totals?.resident], ['Local', totals?.local], ['Foreigner', totals?.foreigner], ['Male', totals?.male], ['Female', totals?.female]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value ?? '—'}</strong></div>)}
      </div>
      {!totals && <p>No approved owner reports for this month yet. This is not a confirmed zero-arrival total.</p>}
      {totals && <TourismArrivalCounts values={data.summary.totals} readOnly />}
      <p className="tourism-help">Summary cards cover all approved properties for {month}. Property/status filters below apply to the submission list; exports include approved reports for the selected month and property, across all pages.</p>
      <div className="tourism-actions"><button type="button" className="gov-btn-ghost" disabled={exporting} onClick={() => exportApproved('csv')}>Approved CSV</button><button type="button" className="gov-btn-ghost" disabled={exporting} onClick={() => exportApproved('pdf')}>Approved PDF</button></div>
      <h3>Owner submissions</h3>
      <div className="tourism-table-wrap"><table className="gov-table"><thead><tr><th>Property</th><th>Month</th><th>Status</th><th>Revision</th><th>Arrivals</th><th>Actions</th></tr></thead><tbody>{data.reports.map(report => <tr key={report.report_id}><td>{report.property_name}</td><td>{report.arrival_month}</td><td><span className="tourism-status" data-status={report.status}>{ARRIVAL_STATUSES[report.status]}</span></td><td>{report.revision}</td><td>{arrivalTotals(report).total ?? '—'}</td><td><div className="gov-row-actions"><button type="button" className="gov-btn gov-btn-ghost" disabled={opening} onClick={() => open(report)}>{report.status === 'submitted' ? 'Review report' : 'View report'}</button></div></td></tr>)}</tbody></table></div>
      {!data.reports.length && <p>No submitted reports match these filters.</p>}
      <Pagination page={page} totalPages={Math.ceil(Number(data.total) / 20)} onPageChange={setPage} totalItems={Number(data.total)} pageSize={20} label="reports" />
      <details className="gov-glass-panel tourism-missing"><summary>Needs reporting / correction · {missing.length} properties</summary>
        <p className="tourism-help">Current active properties with an owner and created before this month ended, plus properties with an existing report. Not a list of zero-arrival properties.</p>
        <ul>{missing.map(property => <li key={property.hotel_id}>{property.property_name} — {ARRIVAL_STATUSES[property.status]}</li>)}</ul>{!missing.length && <p>No outstanding reports among the listed properties.</p>}
      </details>
      {data.summary.by_month?.length > 0 && <section className="gov-glass-panel"><h3>Approved owner arrivals · {month.slice(0, 4)}</h3><div className="tourism-chart"><Bar data={{ labels: data.summary.by_month.map(row => row.arrival_month), datasets: ARRIVAL_CATEGORIES.map((category, index) => ({ label: category.label, data: data.summary.by_month.map(row => arrivalTotals(row)[category.key]), backgroundColor: ['#15803d', '#2563eb', '#b45309'][index] })) }} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }} /></div></section>}
    </>}
    {details && <TourismArrivalReportDetails key={`${details.report.report_id}-${details.report.lock_version}`} details={details} admin onClose={() => setDetails(null)} onReviewed={async () => { setDetails(null); setNotice('Review saved. Only approved reports are included in the new totals.'); await load(); }} />}
  </section>;
}
