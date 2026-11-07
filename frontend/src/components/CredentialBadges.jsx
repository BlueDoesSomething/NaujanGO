import React from 'react';
import { CREDENTIAL_STATUS } from '../utils/businessCredentials';
import './BusinessCredentials.css';

export function CredentialBadge({ credential, showLabel = true, compact = false, showExpiry = true }) {
  if (!credential) return <span className="credential-badge">Status unavailable</span>;
  const text = compact ? ({ current: 'Current', expiring_soon: 'Expiring soon', expiry_unknown: 'Expiry unknown', pending: 'Pending review', missing: 'Not submitted' }[credential.status] || CREDENTIAL_STATUS[credential.status]) : CREDENTIAL_STATUS[credential.status];
  const label = compact ? { registration: 'Registration', business_permit: 'LGU Permit', sanitary_permit: 'Sanitary', dot: 'DOT' }[credential.key] : credential.label;
  return <span className={`credential-badge credential-badge--${credential.status}`} title={`${credential.label}: ${CREDENTIAL_STATUS[credential.status] || 'Status unavailable'}${credential.expiry ? ` · ${credential.expiry}` : ''}`} data-credential={credential.key} data-status={credential.status}>
    {showLabel && <strong>{label}: </strong>}{text || 'Status unavailable'}{!compact && showExpiry && credential.expiry && ` · ${credential.expiry}`}{credential.flagged && credential.status !== 'flagged' && ' · Needs follow-up'}
  </span>;
}

export default function CredentialBadges({ credentials, compact = false }) {
  if (!Array.isArray(credentials)) return <p className="credential-unavailable">Credential information unavailable.</p>;
  return <div className={`credential-badges${compact ? ' credential-badges--compact' : ''}`} aria-label="Establishment credential statuses">{credentials.map(item => <CredentialBadge key={item.key} credential={item} compact={compact} />)}{!compact && <small>Platform-reviewed documents and recorded dates; not a government compliance guarantee.</small>}</div>;
}
