import test from 'node:test';
import assert from 'node:assert/strict';
import { CREDENTIAL_TYPES, credentialForm, filterCredentialProfiles } from '../src/utils/businessCredentials.js';

test('business registration and LGU operating permit are distinct; legacy permit fields and optional PhilGEPS survive', () => {
  assert.deepEqual(CREDENTIAL_TYPES.map(type => type.key), ['registration', 'business_permit', 'sanitary_permit', 'dot']);
  const profile = { business_permit_no: 'LEGACY', dot_file: '/uploads/permits/dot.pdf', philgeps_no: 'OPTIONAL', registration_authority: 'SEC' };
  const form = credentialForm(profile);
  assert.equal(form.business_permit_no, 'LEGACY'); assert.equal(form.registration_expiry, ''); assert.equal(form.sanitary_permit_no, ''); assert.equal(form.philgeps_no, 'OPTIONAL');
  assert.equal(profile.sanitary_permit_no, undefined);
});

test('type and expiry/flag filtering always match the same credential, not different documents on the profile', () => {
  const profiles = [{ id: 1, business_name: 'A', verification_status: 'verified', credentials: [{ key: 'business_permit', expiry_status: 'expired', status: 'expired' }, { key: 'sanitary_permit', expiry_status: 'current', status: 'current' }] },
    { id: 2, business_name: 'B', verification_status: 'pending', credentials: [{ key: 'sanitary_permit', expiry_status: 'expired', status: 'expired', flagged: true }] }];
  assert.deepEqual(filterCredentialProfiles(profiles, { type: 'sanitary_permit', state: 'expired' }).map(item => item.id), [2]);
  assert.deepEqual(filterCredentialProfiles(profiles, { type: 'business_permit', state: 'flagged' }), []);
  assert.deepEqual(filterCredentialProfiles(profiles, { review: 'verified', search: ' a ' }).map(item => item.id), [1]);
});
