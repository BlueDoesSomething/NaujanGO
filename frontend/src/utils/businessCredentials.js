export const CREDENTIAL_TYPES = [
  { key: 'registration', prefix: 'registration', label: 'Business registration (DTI / SEC / CDA)' },
  { key: 'business_permit', prefix: 'business_permit', label: 'LGU Business / Mayor’s Permit' },
  { key: 'sanitary_permit', prefix: 'sanitary_permit', label: 'Sanitary Permit' },
  { key: 'dot', prefix: 'dot', label: 'DOT Accreditation' }
];
export const CREDENTIAL_STATUS = { current: 'Reviewed · current', expiring_soon: 'Expires within 30 days', expired: 'Expired', expiry_unknown: 'No expiry recorded', pending: 'Awaiting review', rejected: 'Review rejected', flagged: 'Needs follow-up', missing: 'Not submitted', incomplete: 'Incomplete submission' };
export const CREDENTIAL_FORM_FIELDS = ['registration_authority', ...[...CREDENTIAL_TYPES.map(type => type.prefix), 'philgeps'].flatMap(prefix => [`${prefix}_no`, `${prefix}_expiry`, `${prefix}_file`])];
export const credentialForm = (profile = {}) => Object.fromEntries(CREDENTIAL_FORM_FIELDS.map(field => [field, profile[field] || '']));
export const filterCredentialProfiles = (profiles, { search = '', type = 'all', state = 'all', review = 'all' } = {}) => profiles.filter(profile => {
  const text = [profile.business_name, profile.username, profile.email, profile.first_name, profile.last_name].filter(Boolean).join(' ').toLowerCase();
  return text.includes(search.trim().toLowerCase()) && (review === 'all' || profile.verification_status === review) && (profile.credentials || []).some(item =>
    (type === 'all' || item.key === type) && (state === 'all' || (state === 'flagged' ? item.flagged : state === 'unknown' ? item.expiry_status === 'unknown' : ['expired', 'expiring_soon'].includes(state) ? item.expiry_status === state : item.status === state)));
});
