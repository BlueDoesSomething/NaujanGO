import React, { useEffect, useRef, useState } from 'react';
import api from '../api';
import { previousReportingMonth } from '../utils/tourismArrivals';
import './TourismArrivalReports.css';

export default function TourismArrivalReminder({ admin = false, onOpen }) {
  const [data, setData] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const request = useRef(0), month = previousReportingMonth();
  const load = async () => {
    const sequence = ++request.current; setLoading(true); setError('');
    const base = admin ? '/admin' : '/owner';
    try {
      const [coverage, pending] = await Promise.all([api.get(`${base}/tourism-arrival-reports/coverage`, { params: { arrival_month: month } }), admin ? api.get(`${base}/tourism-arrival-reports`, { params: { status: 'submitted' } }) : Promise.resolve(null)]);
      if (!Array.isArray(coverage.data?.properties) || admin && !Number.isFinite(Number(pending?.data?.total))) throw new Error('Invalid coverage response');
      if (sequence === request.current) setData({ properties: coverage.data.properties, pending: pending ? Number(pending.data.total) : null });
    } catch (error) { if (sequence === request.current) setError(error.response?.data?.error || 'Could not load monthly reporting status.'); }
    finally { if (sequence === request.current) setLoading(false); }
  };
  useEffect(() => { load(); return () => { request.current += 1; }; }, [admin, month]);
  const missing = data?.properties.filter(property => ['not_submitted', 'draft', 'returned'].includes(property.status)) || [];
  return <section className="gov-glass-panel tourism-reminder" aria-label="Monthly tourism reporting">
    <h2>Monthly tourism reporting</h2>
    {loading ? <p>Checking reporting status…</p> : error ? <p role="alert" className="tourism-error">{error} <button type="button" onClick={load}>Retry reporting status</button></p> : <>
      {admin && <p><strong>{data.pending}</strong> submitted report(s) awaiting review across all months.</p>}
      <p><strong>{month}:</strong> {missing.length} listed property report(s) not yet submitted or needing correction.</p>
      {!admin && missing.length > 0 && <p>{missing.map(property => property.property_name).join(', ')}</p>}
      <p className="tourism-help">Missing reports are not counted as zero arrivals. Only approved owner reports enter the new totals.</p>
    </>}
    <button type="button" className="gov-btn-ghost" onClick={onOpen}>{admin ? 'Review tourism arrivals' : 'Open Tourism Arrivals'}</button>
  </section>;
}
