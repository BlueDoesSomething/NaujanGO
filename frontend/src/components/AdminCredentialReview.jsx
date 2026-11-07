import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../api';
import OwnerDialog from './OwnerDialog';
import Pagination from './Pagination';
import BusinessDocumentLink from './BusinessDocumentLink';
import { CredentialBadge } from './CredentialBadges';
import { CREDENTIAL_TYPES, filterCredentialProfiles } from '../utils/businessCredentials';

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
  return <section className="credential-admin" aria-label="Business verification and credentials">
    <h1 className="gov-page-title">Business Verification</h1>
    <p>Review four distinct credential types. Expiry uses Philippine dates, including the printed expiry day. “Expiring soon” means within 30 days. Missing dates are unknown, not current.</p>
    <p>Business registration does not replace the LGU Business/Mayor’s Permit. PhilGEPS is optional procurement information, not a substitute for DOT accreditation. Credential flags do not suspend bookings or revoke a government permit.</p>
    <div className="credential-filters">
      <label>Search establishments or owners<input type="search" value={filters.search} onChange={event => setFilter('search', event.target.value)} /></label>
      <label>Credential type<select value={filters.type} onChange={event => setFilter('type', event.target.value)}><option value="all">All four types</option>{CREDENTIAL_TYPES.map(type => <option key={type.key} value={type.key}>{type.label}</option>)}</select></label>
      <label>Credential condition<select value={filters.state} onChange={event => setFilter('state', event.target.value)}><option value="all">All conditions</option><option value="expired">Expired</option><option value="expiring_soon">Expiring within 30 days</option><option value="flagged">Flagged for follow-up</option><option value="unknown">Expiry unknown</option><option value="missing">Not submitted</option><option value="incomplete">Incomplete</option><option value="current">Reviewed and current</option></select></label>
      <label>Profile review<select value={filters.review} onChange={event => setFilter('review', event.target.value)}><option value="all">All review states</option><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select></label>
    </div>
    <button type="button" className="gov-btn-ghost" disabled={loading || busy} onClick={load}>Refresh credentials</button>
    {notice && <p className="credential-admin-status" role="status">{notice}</p>}
    {error && <p className="credential-error" role="alert">{error}</p>}
    {loading && <p role="status">Loading credential records…</p>}
    {!loading && !error && <p>{filtered.length} matching profiles · conditions match the selected credential type, not a different document on the same profile.</p>}
    <div className="gov-table-wrap"><table className="gov-table"><thead><tr><th>Establishment / owner</th>{CREDENTIAL_TYPES.map(type => <th key={type.key}>{type.label}</th>)}<th>Profile review</th></tr></thead>
      <tbody>{filtered.slice((page - 1) * 10, page * 10).map(profile => <tr key={profile.id}>
        <td><strong>{profile.business_name || 'Unnamed business'}</strong><p>{profile.first_name} {profile.last_name}<br />{profile.email}</p><p>{profile.business_address}</p><details><summary>Optional PhilGEPS</summary><p>{profile.philgeps_no || 'Not submitted'}{profile.philgeps_expiry && ` · ${profile.philgeps_expiry}`}</p>{profile.philgeps_file && <BusinessDocumentLink url={profile.philgeps_file}>View private PhilGEPS file</BusinessDocumentLink>}</details></td>
        {CREDENTIAL_TYPES.map(type => {
          const credential = profile.credentials.find(item => item.key === type.key);
          return <td className="credential-cell" key={type.key}>
            <CredentialBadge credential={credential} showLabel={false} />
            <p>{type.key === 'registration' && `${profile.registration_authority || 'Authority not recorded'} · `}{profile[`${type.prefix}_no`] || 'No number recorded'}</p>
            <p>Profile review: {credential.review_status}</p>
            {profile[`${type.prefix}_file`] && <BusinessDocumentLink url={profile[`${type.prefix}_file`]}>View private document</BusinessDocumentLink>}
            {credential.flagged && <p className="credential-followup">{credential.flag_reason}</p>}
            <button type="button" className="gov-btn-ghost" disabled={disabled} onClick={() => open({ kind: 'flag', profile, credential })}>{credential.flagged ? 'Resolve flag' : 'Flag for follow-up'}</button>
          </td>;
        })}
        <td><strong>{profile.verification_status}</strong>{profile.rejection_reason && <p>{profile.rejection_reason}</p>}<p>Profile review is separate from each credential’s current expiry/flag.</p><button type="button" className="gov-btn-primary" disabled={disabled || profile.verification_status === 'verified'} onClick={() => open({ kind: 'review', profile, status: 'verified' })}>Verify profile</button><button type="button" className="gov-btn-ghost" disabled={disabled || profile.verification_status === 'rejected'} onClick={() => open({ kind: 'review', profile, status: 'rejected' })}>Reject profile</button></td>
      </tr>)}{!filtered.length && !loading && !error && <tr><td colSpan={6}>No profiles match these filters.</td></tr>}</tbody></table></div>
    <Pagination page={page} totalPages={Math.ceil(filtered.length / 10)} onPageChange={setPage} totalItems={filtered.length} pageSize={10} label="profiles" />
    {dialog && <OwnerDialog title={dialog.kind === 'flag' ? `${dialog.credential.flagged ? 'Resolve flag' : 'Flag for follow-up'} · ${dialog.credential.label}` : dialog.status === 'verified' ? 'Verify business profile?' : 'Reject business profile?'} busy={busy} onClose={() => setDialog(null)} actions={<><button type="button" className="gov-btn-ghost" disabled={busy} onClick={() => setDialog(null)}>Keep unchanged</button><button type="button" className="gov-btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save decision'}</button></>}>
      <p><strong>{dialog.profile.business_name}</strong></p>
      {dialog.kind === 'flag' ? <p>This records an administrative follow-up, not an amendment to the expiry date or an automatic booking suspension. Clearing a flag does not renew an expired permit.</p> : <p>Review the original documents first. Verification changes the existing profile authorization state, but does not make missing, expired or flagged credentials current. The existing access policy remains separate from regulatory compliance.</p>}
      {dialog.status === 'verified' && <ul>{dialog.profile.credentials.filter(item => item.status !== 'current').map(item => <li key={item.key}>{item.label}: {item.status.replaceAll('_', ' ')}</li>)}</ul>}
      {(dialog.kind === 'flag' || dialog.status === 'rejected') && <label className="credential-dialog-label">{dialog.kind === 'flag' ? 'Follow-up / resolution reason (required)' : 'Rejection reason (required)'}<textarea rows={4} maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} /></label>}
      {dialogError && <p className="credential-error" role="alert">{dialogError}</p>}
    </OwnerDialog>}
  </section>;
}
