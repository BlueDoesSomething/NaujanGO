import test from 'node:test';
import assert from 'node:assert/strict';
import { businessDocumentError, businessDocumentLocation, documentPreviewType } from '../src/utils/businessDocuments.js';
const origin = 'https://naujango.com';

test('relative verification links are resolved to the same-origin authenticated viewer', () => {
  assert.deepEqual(businessDocumentLocation('/uploads/permits/1791456391588-mnxkkd7d.jpg', origin), {
    external: false, url: 'https://naujango.com/uploads/permits/1791456391588-mnxkkd7d.jpg'
  });
  assert.equal(businessDocumentLocation(`${origin}/uploads/permits/doc.pdf`, origin).external, false);
  assert.equal(businessDocumentLocation('https://res.cloudinary.com/example/document.pdf', origin).external, true);
});

test('unsafe links and non-document paths are not used as document fetch targets', () => {
  for (const value of ['', null, 'javascript:alert(1)', 'data:text/html,bad', '/api/admin/users',
    '/uploads/permits/../../secrets.txt', '/uploads/permits/document.svg', 'https://user:pass@example.com/doc.pdf']) {
    assert.equal(businessDocumentLocation(value, origin), null);
  }
});

test('only supported image or PDF responses are embedded, never HTML errors', () => {
  assert.equal(documentPreviewType('image/jpeg'), 'image');
  assert.equal(documentPreviewType('IMAGE/PNG; charset=binary'), 'image');
  assert.equal(documentPreviewType('image/webp'), 'image');
  assert.equal(documentPreviewType('application/pdf'), 'pdf');
  for (const type of ['text/html', 'image/svg+xml', 'application/json', '', null]) assert.equal(documentPreviewType(type), null);
});

test('missing legacy files and expired/unauthorized sessions produce useful messages', async () => {
  assert.match(await businessDocumentError({ response: { status: 410 } }), /owner needs to upload it again/);
  assert.match(await businessDocumentError({ response: { status: 404, data: '<html>Cannot GET</html>' } }), /missing from the server/);
  assert.match(await businessDocumentError({ response: { status: 401 } }), /Sign in again/);
  assert.match(await businessDocumentError({ response: { status: 403 } }), /submitting owner/);
});

test('blob API errors are decoded safely without displaying a raw HTML error page', async () => {
  assert.equal(await businessDocumentError({ response: { status: 503, data: new Blob(['{"error":"Apply migration 051."}']) } }), 'Apply migration 051.');
  assert.match(await businessDocumentError({ response: { status: 500, data: new Blob(['<html>private details</html>']) } }), /Unable to load/);
  assert.match(await businessDocumentError({}), /try again/);
});
