import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../api';
import OwnerDialog from './OwnerDialog';
import Pagination from './Pagination';
import BusinessDocumentLink from './BusinessDocumentLink';
import Icons from './Icons';
import { CredentialBadge } from './CredentialBadges';
import { CREDENTIAL_TYPES, filterCredentialProfiles } from '../utils/businessCredentials';
import './AdminCredentialReview.css';

export default function AdminCredentialReview() {
  const [profiles, setProfiles] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [filters, setFilters] = useState({ search: '', type: 'all', state: 'all', review: 'all' }), [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null), [reason, setReason] = useState(''), [dialogError, setDialogError] = useState(''), [busy, setBusy] = useState(false);
  const sequence = useRef(0), writing = useRef(false);
  const load = useCallback(async () => {
    const request = ++sequence.current; setLoading(true); setError('');
    try {
      const { data } = await api.get('/admin/business-profiles');
      if (data?.success !== true || !Array.isArray(data.data) || data.data.some(profile => !Array.isArray(profile.credentials) || profile.credentials.length !== 4 || CREDENTIAL_TYPES.some(type => !profile.credentials.some(item => item?.key === type.key && typeof item.status === 'string' && typeof item.flagged === 'boolean' && Number.isSafeInteger(item.flag_version) && item.flag_version >= 0)))) throw new Error('Invalid credential response');
      if (request === sequence.current) setProfiles(data.data);
    } catch (error) { if (request === sequence.current) setError(error.response?.data?.error || 'Could not load credential records. Previously loaded information may be stale. Refresh before acting.'); }
    finally { if (request === sequence.current) setLoading(false); }
  }, []);
  useEffect(() => { load(); return () => { sequence.current += 1; }; }, [load]);
  const filtered = useMemo(() => filterCredentialProfiles(profiles, filters), [profiles, filters]);
  useEffect(() => { setPage(current => Math.min(current, Math.max(1, Math.ceil(filtered.length / 10)))); }, [filtered.length]);
  const setFilter = (key, value) => { setFilters(current => ({ ...current, [key]: value })); setPage(1); };
  const open = value => { setReason(''); setDialogError(''); setDialog(value); };
  const save = async () => {
    if (writing.current || !dialog) return;
    if ((dialog.kind === 'flag' || dialog.status === 'rejected') && reason.trim().length < 3) { setDialogError('Enter a reason of at least 3 characters.'); return; }
    writing.current = true; setBusy(true); setDialogError('');
    try {
      const response = dialog.kind === 'flag'
        ? await api.put(`/admin/business-profiles/${dialog.profile.id}/credentials/${dialog.credential.key}/flag`, { flagged: !dialog.credential.flagged, expected_version: dialog.credential.flag_version, reason: reason.trim() })
        : await api.put(`/admin/business-profiles/${dialog.profile.id}/verification`, { verification_status: dialog.status, rejection_reason: reason.trim() });
      if (response.data?.success !== true) throw new Error('Update not confirmed');
      setDialog(null); setNotice(dialog.kind === 'flag' ? 'Follow-up decision saved. Booking status, payments and dashboard authorization were not changed.' : 'Profile review saved. Refreshing credential statuses…');
      await load();
    } catch (error) { setDialogError(error.response?.data?.error || 'Could not save. Your reason is retained; please retry.'); }
    finally { writing.current = false; setBusy(false); }
  };
  const disabled = loading || Boolean(error) || busy;
  const hasFilters = Boolean(filters.search || filters.type !== 'all' || filters.state !== 'all' || filters.review !== 'all');
  const clearFilters = () => { setFilters({ search: '', type: 'all', state: 'all', review: 'all' }); setPage(1); };
  const visibleProfiles = filtered.slice((page - 1) * 10, page * 10);
  return <section className="credential-admin" aria-label="Business verification and credentials">
    <header className="credential-page-header">
      <div><p className="credential-eyebrow">Establishment credentials</p><h1 className="gov-page-title">Business Verification</h1><p className="credential-page-description">Review documents, check expiry dates, and manage follow-up in one place.</p></div>
      <button type="button" className="credential-button" disabled={loading || busy} onClick={load}>Refresh credentials</button>
    </header>
    <div className="credential-filter-panel">
      <div className="credential-panel-heading"><div><h2>Find an establishment</h2><p>Match a condition to a specific document type.</p></div>{hasFilters && <button type="button" className="credential-button credential-clear-button" onClick={clearFilters}>Clear filters</button>}</div>
      <div className="credential-filters">
        <label>Search establishments or owners<input type="search" placeholder="Business name, owner, or email" value={filters.search} onChange={event => setFilter('search', event.target.value)} /></label>
        <label>Credential type<select className="gov-select" value={filters.type} onChange={event => setFilter('type', event.target.value)}><option value="all">All four types</option>{CREDENTIAL_TYPES.map(type => <option key={type.key} value={type.key}>{type.label}</option>)}</select></label>
        <label>Credential condition<select className="gov-select" value={filters.state} onChange={event => setFilter('state', event.target.value)}><option value="all">All conditions</option><option value="expired">Expired</option><option value="expiring_soon">Expiring within 30 days</option><option value="flagged">Flagged for follow-up</option><option value="unknown">Expiry unknown</option><option value="missing">Not submitted</option><option value="incomplete">Incomplete</option><option value="current">Reviewed and current</option></select></label>
        <label>Profile review<select className="gov-select" value={filters.review} onChange={event => setFilter('review', event.target.value)}><option value="all">All review states</option><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select></label>
      </div>
      <details className="credential-help"><summary>About expiry and profile verification</summary><p>Expiry uses Philippine dates, including the printed expiry day. “Expiring soon” means within 30 days. Missing dates are unknown, not current.</p><p>Business registration does not replace the LGU Business/Mayor’s Permit. PhilGEPS is optional procurement information, not a substitute for DOT accreditation. Credential flags do not suspend bookings or revoke a government permit.</p></details>
    </div>
    {notice && <p className="credential-admin-status" role="status">{notice}</p>}
    {error && <p className="credential-error" role="alert">{error}</p>}
    <div className="credential-results-heading" aria-live="polite"><h2>Establishment profiles</h2><p>{loading ? 'Loading credential records…' : error ? 'Refresh to verify the latest records' : `${filtered.length} matching ${filtered.length === 1 ? 'profile' : 'profiles'}`}</p></div>
    <div className="credential-profile-list" aria-busy={loading}>
      {visibleProfiles.map(profile => <article className="credential-profile-card" data-profile-id={profile.id} key={profile.id} aria-labelledby={`credential-profile-${profile.id}`}>
        <header className="credential-profile-header">
          <div className="credential-establishment"><div className="credential-establishment-icon" aria-hidden="true"><Icons.Hotel size={24} /></div><div className="credential-establishment-details">
            <p className="credential-eyebrow">Business profile #{profile.id}</p><h2 id={`credential-profile-${profile.id}`}>{profile.business_name || 'Unnamed business'}</h2>
            <p className="credential-owner-name">{[profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username || 'Owner name not recorded'}</p>
            {profile.email && <p>{profile.email}</p>}{profile.business_address && <p className="credential-address">{profile.business_address}</p>}
          </div></div>
          <div className="credential-profile-review"><div className="credential-profile-review-heading"><h3>Profile review</h3><strong className="credential-profile-state" data-state={profile.verification_status}>{profile.verification_status}</strong></div>
            <p>Review approval is separate from each document’s validity.</p>
            {profile.rejection_reason && <p className="credential-rejection-reason">{profile.rejection_reason}</p>}
            <div className="credential-profile-actions"><button type="button" className="credential-button" data-tone="primary" disabled={disabled || profile.verification_status === 'verified'} onClick={() => open({ kind: 'review', profile, status: 'verified' })}>Verify profile</button><button type="button" className="credential-button" data-tone="danger" disabled={disabled || profile.verification_status === 'rejected'} onClick={() => open({ kind: 'review', profile, status: 'rejected' })}>Reject profile</button></div>
          </div>
        </header>
        <div className="credential-record-grid" aria-label="Credential documents">
          {CREDENTIAL_TYPES.map(type => {
            const credential = profile.credentials.find(item => item.key === type.key);
            return <section className="credential-document credential-cell" key={type.key} data-document-type={type.key} aria-labelledby={`credential-document-${profile.id}-${type.key}`}>
              <h3 id={`credential-document-${profile.id}-${type.key}`}>{type.key === 'registration' ? 'Business registration' : type.label}</h3>
              <CredentialBadge credential={credential} showLabel={false} showExpiry={false} />
              <dl className="credential-document-meta">
                {type.key === 'registration' && <div><dt>Issuing authority</dt><dd>{profile.registration_authority || 'Not recorded'}</dd></div>}
                <div><dt>Document number</dt><dd>{profile[`${type.prefix}_no`] || 'Not recorded'}</dd></div>
                <div><dt>Expiry date</dt><dd>{credential.expiry || 'Not recorded'}</dd></div>
              </dl>
              {credential.flagged && <p className="credential-followup">{credential.flag_reason}</p>}
              <div className="credential-document-actions"><div className="credential-document-link">
                {profile[`${type.prefix}_file`] ? <BusinessDocumentLink url={profile[`${type.prefix}_file`]}><Icons.Document size={16} />View private document</BusinessDocumentLink> : <p>No document uploaded</p>}
              </div><button type="button" className="credential-button credential-flag-button" disabled={disabled} onClick={() => open({ kind: 'flag', profile, credential })}>{credential.flagged ? 'Resolve flag' : 'Flag for follow-up'}</button></div>
            </section>;
          })}
        </div>
        <footer className="credential-profile-footer"><details className="credential-procurement"><summary>Optional PhilGEPS registration</summary><dl className="credential-document-meta"><div><dt>Registration number</dt><dd>{profile.philgeps_no || 'Not submitted'}</dd></div><div><dt>Expiry date</dt><dd>{profile.philgeps_expiry || 'Not recorded'}</dd></div></dl>{profile.philgeps_file && <BusinessDocumentLink url={profile.philgeps_file}>View private PhilGEPS file</BusinessDocumentLink>}</details><p>Follow-up flags do not change booking or payment status.</p></footer>
      </article>)}
      {!filtered.length && !loading && !error && <div className="credential-empty-state"><Icons.Document size={32} /><h3>{hasFilters ? 'No matching establishments' : 'No business profiles yet'}</h3><p>{hasFilters ? 'Try a different document condition or clear your filters.' : 'Submitted establishment profiles will appear here for review.'}</p>{hasFilters && <button type="button" className="credential-button" onClick={clearFilters}>Clear filters</button>}</div>}
    </div>
    <div className="credential-pagination"><Pagination page={page} totalPages={Math.ceil(filtered.length / 10)} onPageChange={setPage} totalItems={filtered.length} pageSize={10} label="profiles" /></div>
    {dialog && <OwnerDialog className="credential-admin-dialog" title={dialog.kind === 'flag' ? `${dialog.credential.flagged ? 'Resolve flag' : 'Flag for follow-up'} · ${dialog.credential.label}` : dialog.status === 'verified' ? 'Verify business profile?' : 'Reject business profile?'} busy={busy} onClose={() => setDialog(null)} actions={<><button type="button" className="credential-button" disabled={busy} onClick={() => setDialog(null)}>Keep unchanged</button><button type="button" className="credential-button" data-tone="primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save decision'}</button></>}>
      <p><strong>{dialog.profile.business_name}</strong></p>
      {dialog.kind === 'flag' ? <p>This records an administrative follow-up, not an amendment to the expiry date or an automatic booking suspension. Clearing a flag does not renew an expired permit.</p> : <p>Review the original documents first. Verification changes the existing profile authorization state, but does not make missing, expired or flagged credentials current. The existing access policy remains separate from regulatory compliance.</p>}
      {dialog.status === 'verified' && <ul>{dialog.profile.credentials.filter(item => item.status !== 'current').map(item => <li key={item.key}>{item.label}: {item.status.replaceAll('_', ' ')}</li>)}</ul>}
      {(dialog.kind === 'flag' || dialog.status === 'rejected') && <label className="credential-dialog-label">{dialog.kind === 'flag' ? 'Follow-up / resolution reason (required)' : 'Rejection reason (required)'}<textarea rows={4} maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} /></label>}
      {dialogError && <p className="credential-error" role="alert">{dialogError}</p>}
    </OwnerDialog>}
  </section>;
}
