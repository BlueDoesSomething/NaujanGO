import express from 'express';
import path from 'node:path';
import { authenticateToken, requireOwnerOrAdmin } from '../middleware/auth.js';
import { readBusinessDocument, respondDocumentError } from '../services/businessDocuments.js';

export const createBusinessDocumentRouter = ({ legacyDir } = {}) => {
  const router = express.Router();
  router.use((req, res, next) => { res.set('Cache-Control', 'private, no-store'); next(); });
  router.use(authenticateToken, requireOwnerOrAdmin);
  router.get('/:filename', async (req, res) => {
    try {
      const document = await readBusinessDocument(req.user, req.params.filename, legacyDir);
      res.set({
        'Content-Type': document.format.mime,
        'Content-Disposition': `inline; filename="verification-document.${document.format.extension}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cross-Origin-Resource-Policy': 'same-origin'
      });
      res.send(document.buffer);
    } catch (error) { return respondDocumentError(res, error); }
  });
  // Never fall through to public express.static, including malformed paths.
  router.use((req, res) => res.status(404).json({ error: 'Document not found.', code: 'DOCUMENT_NOT_FOUND' }));
  return router;
};

// express.static normalizes encoded paths and dot segments. Block alternate
// spellings of the private directory from bypassing the authenticated router.
export const protectPrivateUploadPaths = (req, res, next) => {
  try {
    const normalized = path.posix.normalize(decodeURIComponent(req.path).replaceAll('\\', '/')).toLowerCase();
    if (normalized === '/permits' || normalized.startsWith('/permits/')) {
      return res.status(404).set('Cache-Control', 'private, no-store').json({ error: 'Open verification documents from the owner or admin dashboard.' });
    }
    return next();
  } catch { return res.status(400).json({ error: 'Invalid upload path.' }); }
};

export default createBusinessDocumentRouter();
