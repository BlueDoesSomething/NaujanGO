// Credential tracking is not the legacy dashboard/booking authorization rule.
// A platform review is not a certification issued by the government.
export const CREDENTIAL_TYPES = [
  { key: 'registration', label: 'Business registration (DTI / SEC / CDA)', prefix: 'registration' },
  { key: 'business_permit', label: "LGU Business / Mayor’s Permit", prefix: 'business_permit' },
  { key: 'sanitary_permit', label: 'Sanitary Permit', prefix: 'sanitary_permit' },
  { key: 'dot', label: 'DOT Accreditation', prefix: 'dot' }
];
export const CREDENTIAL_FIELDS = ['registration_authority', ...CREDENTIAL_TYPES.flatMap(({ prefix }) => [`${prefix}_no`, `${prefix}_expiry`, `${prefix}_file`])];
export const credentialError = (message, status = 400) => Object.assign(new Error(message), { status });
const has = value => typeof value === 'string' && Boolean(value.trim());
export const philippineDate = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = type => parts.find(part => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
};
export const credentialDate = value => {
  if (value == null || value === '') return null;
  // mysql2 constructs DATE values in the server's local timezone. Preserve the
  // calendar components rather than moving them through UTC with toISOString.
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) return null;
    value = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && value >= '1000-01-01' ? value : null;
};
export const parseCredentialFlags = value => {
  if (value == null || value === '') return {};
  try {
    const flags = typeof value === 'string' ? JSON.parse(value) : value;
    if (!flags || typeof flags !== 'object' || Array.isArray(flags)) throw new Error();
    for (const [key, item] of Object.entries(flags)) {
      if (!CREDENTIAL_TYPES.some(type => type.key === key) || !item || typeof item.flagged !== 'boolean' || !Number.isSafeInteger(item.version) || item.version < 1) throw new Error();
    }
    return flags;
  } catch { throw credentialError('Credential follow-up records could not be read. Ask the administrator to check the stored data.', 503); }
};
export const validateCredentialInput = (input, previous = {}) => {
  for (const field of [...CREDENTIAL_FIELDS, 'philgeps_no', 'philgeps_expiry']) {
    const value = input[field];
    if (value == null || value === '') continue;
    if (typeof value !== 'string') throw credentialError(`${field} must be text.`);
    if (field.endsWith('_expiry') && !credentialDate(value)) throw credentialError(`${field} must be a real date in YYYY-MM-DD format.`);
    if (field.endsWith('_no') && value.trim().length > 150) throw credentialError('Credential numbers must be at most 150 characters.');
  }
  const merged = { ...previous, ...input };
  if (input.registration_authority && !['DTI', 'SEC', 'CDA'].includes(input.registration_authority)) throw credentialError('Select DTI, SEC or CDA as the business registration authority.');
  if ((has(merged.registration_no) || has(merged.registration_file)) && !['DTI', 'SEC', 'CDA'].includes(merged.registration_authority)) throw credentialError('Select the authority that issued the business registration.');
};
export const profileCredentials = (profile = {}, { today = philippineDate(), publicView = false } = {}) => {
  const flags = parseCredentialFlags(profile.credential_flags);
  const soon = new Date(`${today}T00:00:00Z`); soon.setUTCDate(soon.getUTCDate() + 30);
  const soonDate = soon.toISOString().slice(0, 10);
  return CREDENTIAL_TYPES.map(({ key, label, prefix }) => {
    const number = has(profile[`${prefix}_no`]), document = has(profile[`${prefix}_file`]);
    const expiry = credentialDate(profile[`${prefix}_expiry`]);
    const submitted = number || document || Boolean(profile[`${prefix}_expiry`]);
    const complete = number && document && (key !== 'registration' || ['DTI', 'SEC', 'CDA'].includes(profile.registration_authority));
    const expiryStatus = !submitted ? 'missing' : !expiry ? 'unknown' : expiry < today ? 'expired' : expiry <= soonDate ? 'expiring_soon' : 'current';
    const review = profile.verification_status === 'verified' ? 'verified' : profile.verification_status === 'rejected' ? 'rejected' : 'pending';
    const flag = flags[key];
    const status = !submitted ? 'missing' : expiryStatus === 'expired' ? 'expired' : flag?.flagged ? 'flagged' : !complete ? 'incomplete' : review !== 'verified' ? review : !expiry ? 'expiry_unknown' : expiryStatus;
    const summary = { key, label, status, expiry_status: expiryStatus, expiry, review_status: review, flagged: Boolean(flag?.flagged) };
    if (!publicView) Object.assign(summary, { flag_version: flag?.version || 0, flag_reason: flag?.reason || '', flag_updated_at: flag?.updated_at || null });
    return summary;
  });
};
export const serializeCredentialProfile = profile => profile ? { ...profile,
  ...Object.fromEntries([...CREDENTIAL_TYPES.map(type => `${type.prefix}_expiry`), 'philgeps_expiry'].map(field => [field, credentialDate(profile[field])])),
  credentials: profileCredentials(profile)
} : null;
export const credentialMatches = (credentials, { type = 'all', state = 'all' } = {}) => credentials.some(item =>
  (type === 'all' || item.key === type) && (state === 'all' || (state === 'flagged' ? item.flagged : state === 'unknown' ? item.expiry_status === 'unknown' : ['expired', 'expiring_soon'].includes(state) ? item.expiry_status === state : item.status === state)));
