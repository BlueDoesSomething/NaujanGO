import React from 'react';
import BusinessDocumentLink from './BusinessDocumentLink';
import CredentialBadges, { CredentialBadge } from './CredentialBadges';
import { CREDENTIAL_TYPES } from '../utils/businessCredentials';

export default function OwnerCredentialFields({ profile, onChange, editing, uploading, saving, onUpload, credentials }) {
  const set = (field, value) => onChange(current => ({ ...current, [field]: value }));
  return <section className="owner-credentials" aria-label="Business credentials" style={{ gridColumn: '1 / -1' }}>
    <h2>Establishment credentials</h2>
    <p>Business registration is distinct from the LGU Business/Mayor’s Permit. Upload that LGU permit only once. Enter expiry dates exactly as printed; do not invent an expiry for SEC/CDA registration.</p>
    <p>Uploads save immediately and return the profile to review. Save Changes stores the other edited fields; cancelling the form does not undo an upload. JPG, PNG, WEBP or PDF, up to 6 MB each.</p>
    <p>Badges reflect saved records, not unsaved edits. Credential tracking does not automatically cancel reservations or change dashboard access.</p>
    {!credentials && <CredentialBadges credentials={credentials} />}
    {CREDENTIAL_TYPES.map(type => {
      const summary = credentials?.find(item => item.key === type.key);
      return <section className="credential-editor" key={type.key} data-credential-type={type.key}>
        <h3>{type.label}</h3><CredentialBadge credential={summary} showLabel={false} />
        {summary?.flagged && <p className="credential-followup">Admin follow-up: {summary.flag_reason || 'Please contact the administrator.'}</p>}
        <fieldset className="credential-fields" disabled={!editing || Boolean(uploading || saving)}>
          {type.key === 'registration' && <label>Registration authority<select value={profile.registration_authority} onChange={event => set('registration_authority', event.target.value)}><option value="">Choose the issuing authority</option>{['DTI', 'SEC', 'CDA'].map(authority => <option key={authority}>{authority}</option>)}</select></label>}
          <label>{type.key === 'registration' ? 'Registration' : 'Permit / accreditation'} number<input maxLength={150} value={profile[`${type.prefix}_no`] || ''} onChange={event => set(`${type.prefix}_no`, event.target.value)} /></label>
          <label>Expiry date (if stated)<input type="date" value={profile[`${type.prefix}_expiry`] || ''} onChange={event => set(`${type.prefix}_expiry`, event.target.value)} /></label>
          <label>Upload {type.label}<input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; onUpload(`${type.prefix}_file`, file); }} /></label>
        </fieldset>
        {profile[`${type.prefix}_file`] && <BusinessDocumentLink url={profile[`${type.prefix}_file`]}>View private document</BusinessDocumentLink>}
      </section>;
    })}
    <details className="credential-editor"><summary>Optional procurement registration — PhilGEPS</summary><p>PhilGEPS concerns government procurement. It does not replace DOT accreditation, the LGU operating permit, or the sanitary permit.</p><fieldset disabled={!editing || Boolean(uploading || saving)} className="credential-fields"><label>PhilGEPS number<input maxLength={150} value={profile.philgeps_no} onChange={event => set('philgeps_no', event.target.value)} /></label><label>PhilGEPS expiry<input type="date" value={profile.philgeps_expiry} onChange={event => set('philgeps_expiry', event.target.value)} /></label><label>Upload PhilGEPS document<input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={event => { onUpload('philgeps_file', event.target.files?.[0]); event.target.value = ''; }} /></label></fieldset>{profile.philgeps_file && <BusinessDocumentLink url={profile.philgeps_file}>View private PhilGEPS document</BusinessDocumentLink>}</details>
    {uploading && <p role="status">Saving document…</p>}
  </section>;
}
